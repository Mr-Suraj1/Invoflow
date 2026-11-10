import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { agentActions, agentRuns } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

// GET /api/agent/approvals: actions waiting for this user's decision.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: agentActions.id,
      runId: agentActions.runId,
      toolName: agentActions.toolName,
      argsJson: agentActions.argsJson,
      diffJson: agentActions.diffJson,
      riskLevel: agentActions.riskLevel,
      riskReasons: agentActions.riskReasons,
      status: agentActions.status,
      createdAt: agentActions.createdAt,
      workflowType: agentRuns.workflowType,
    })
    .from(agentActions)
    .innerJoin(agentRuns, eq(agentActions.runId, agentRuns.id))
    .where(and(eq(agentActions.userId, session.user.id), eq(agentActions.status, 'pending_approval')))
    .orderBy(desc(agentActions.createdAt))
    .limit(100);

  return NextResponse.json({ items: rows });
}
