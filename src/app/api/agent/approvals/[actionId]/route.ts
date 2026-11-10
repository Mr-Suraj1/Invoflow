import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { agentActions, agentRuns, approvals } from '@/db/schema';
import { ApprovalDecisionSchema } from '@/lib/schemas';
import { submitAgentDecisions } from '@/lib/agent/client';
import { ExecutionError, executeRunActions, validateToolArgs } from '@/lib/agent/executor';
import { and, eq, inArray } from 'drizzle-orm';

// POST /api/agent/approvals/[actionId]
// Records one human decision. When the last gated action in the run is decided, approved
// actions execute here, in Next.js, from the stored args. This does not depend on the Python
// service's in-memory state, so it works across Vercel cold starts. The service is then told
// to close the paused thread on a best-effort basis.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { actionId } = await params;

  const parsed = ApprovalDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid decision', details: parsed.error.flatten() }, { status: 400 });
  }
  const decision = parsed.data;

  const [action] = await db
    .select()
    .from(agentActions)
    .where(and(eq(agentActions.id, actionId), eq(agentActions.userId, userId)))
    .limit(1);
  if (!action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.status !== 'pending_approval') {
    return NextResponse.json({ error: 'Action has already been decided' }, { status: 409 });
  }

  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, action.runId)).limit(1);
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  // Validate human edits before anything is recorded, so a bad edit changes nothing.
  let finalArgs: unknown = action.argsJson;
  if (decision.decision === 'modified') {
    try {
      finalArgs = validateToolArgs(action.toolName, decision.modifiedArgsJson);
    } catch (err) {
      const message = err instanceof ExecutionError ? err.message : 'Invalid modified args';
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  await db.insert(approvals).values({
    actionId,
    decidedBy: userId,
    decision: decision.decision,
    modifiedArgsJson: (decision.decision === 'modified' ? decision.modifiedArgsJson : null) as object | null,
    reason: decision.reason ?? null,
  });

  await db
    .update(agentActions)
    .set({
      status: decision.decision === 'rejected' ? 'rejected' : 'approved',
      argsJson: finalArgs as object,
    })
    .where(eq(agentActions.id, actionId));

  const stillPending = await db
    .select({ id: agentActions.id })
    .from(agentActions)
    .where(and(eq(agentActions.runId, run.id), eq(agentActions.status, 'pending_approval')));
  if (stillPending.length > 0) {
    return NextResponse.json({ status: 'recorded', pendingRemaining: stillPending.length });
  }

  // Every gated action is decided. Execute what was approved, using the stored args.
  const failures = await executeRunActions(userId, run.id, ['auto_executed', 'approved']);

  const runActions = await db
    .select({ status: agentActions.status })
    .from(agentActions)
    .where(eq(agentActions.runId, run.id));
  const allRejected = runActions.length > 0 && runActions.every((a) => a.status === 'rejected');
  const finalStatus = failures.length > 0 ? 'failed' : allRejected ? 'rejected' : 'completed';

  await db
    .update(agentRuns)
    .set({
      status: finalStatus,
      errorMessage: failures.length > 0 ? failures.join('; ') : null,
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, run.id));

  // Best-effort: close the paused LangGraph thread in the agent service. The database is already
  // correct, so a failure here (for example after a cold start) is logged and ignored.
  try {
    const gated = await db
      .select({ actionId: approvals.actionId, decision: approvals.decision, modifiedArgsJson: approvals.modifiedArgsJson, reason: approvals.reason })
      .from(approvals)
      .innerJoin(agentActions, eq(approvals.actionId, agentActions.id))
      .where(and(eq(agentActions.runId, run.id), inArray(agentActions.riskLevel, ['medium', 'high', 'critical'])));
    const decisions: Record<string, { decision: 'approved' | 'rejected' | 'modified'; modifiedArgsJson?: Record<string, unknown>; reason?: string }> = {};
    for (const row of gated) {
      decisions[row.actionId] = {
        decision: row.decision,
        ...(row.modifiedArgsJson ? { modifiedArgsJson: row.modifiedArgsJson as Record<string, unknown> } : {}),
        ...(row.reason ? { reason: row.reason } : {}),
      };
    }
    if (Object.keys(decisions).length > 0) {
      await submitAgentDecisions(run.threadId, decisions);
    }
  } catch (err) {
    console.warn('Agent service resume skipped:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ status: finalStatus, failures });
}
