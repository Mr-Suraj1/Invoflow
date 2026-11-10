import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { agentRuns, agentActions } from '@/db/schema';
import { AgentRunInputSchema } from '@/lib/schemas';
import { AgentServiceError, startAgentRun } from '@/lib/agent/client';
import { executeRunActions } from '@/lib/agent/executor';
import { eq } from 'drizzle-orm';

// POST /api/agent/runs: start a workflow in the agent service and persist its proposals.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = AgentRunInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const started = Date.now();
  let result;
  try {
    result = await startAgentRun(parsed.data);
  } catch (err) {
    console.error('Agent service call failed:', err instanceof AgentServiceError ? err.message : err);
    return NextResponse.json({ error: 'Agent service unavailable' }, { status: 502 });
  }
  const latencyMs = Date.now() - started;

  await db.insert(agentRuns).values({
    id: result.run_id,
    userId,
    threadId: result.thread_id,
    workflowType: parsed.data.workflowType,
    status: result.status,
    rawInput: parsed.data.rawInput as object,
    extractedData: (result.extracted ?? null) as object | null,
    confidenceScore: result.confidence ?? null,
    tokenUsage: 0, // filled in once the service reports token usage
    latencyMs,
    errorMessage: result.error ?? null,
  });

  if (result.proposals.length > 0) {
    await db.insert(agentActions).values(
      result.proposals.map((p) => ({
        id: p.action_id,
        runId: result.run_id,
        userId,
        toolName: p.tool_name,
        argsJson: p.args_json as object,
        diffJson: (p.diff_json ?? null) as object | null,
        riskLevel: p.risk_level,
        riskReasons: p.risk_reasons,
        status: p.status,
      })),
    );
  }

  // Low-risk runs finish here, so their actions can execute now. Gated runs wait for approval.
  let runStatus = result.status;
  let executionFailures: string[] = [];
  if (result.status === 'completed') {
    executionFailures = await executeRunActions(userId, result.run_id, ['auto_executed']);
    if (executionFailures.length > 0) {
      runStatus = 'failed';
      await db
        .update(agentRuns)
        .set({ status: 'failed', errorMessage: executionFailures.join('; '), updatedAt: new Date() })
        .where(eq(agentRuns.id, result.run_id));
    }
  }

  return NextResponse.json(
    {
      runId: result.run_id,
      status: runStatus,
      error: result.error ?? (executionFailures.length ? executionFailures.join('; ') : null),
      proposals: result.proposals,
    },
    { status: 201 },
  );
}
