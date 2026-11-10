// Server-only client for the Python agent service (services/agent).
// Never import this from a client component: it reads the shared service token.
import { z } from 'zod';
import { AgentRunInputSchema, ApprovalDecisionSchema, type AgentRunInput, type ApprovalDecisionInput } from '@/lib/schemas';

const ProposalSchema = z.object({
  action_id: z.string(),
  tool_name: z.enum(['create_purchase_bill', 'adjust_inventory', 'create_supplier']),
  args_json: z.record(z.string(), z.unknown()),
  diff_json: z.record(z.string(), z.unknown()).nullable().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  risk_reasons: z.array(z.string()),
  status: z.enum(['pending_approval', 'auto_executed', 'approved', 'rejected', 'failed']),
});

export const AgentServiceResponseSchema = z.object({
  run_id: z.string(),
  thread_id: z.string(),
  status: z.enum(['running', 'awaiting_approval', 'completed', 'failed', 'rejected']),
  extracted: z.record(z.string(), z.unknown()).nullable().optional(),
  confidence: z.number().nullable().optional(),
  proposals: z.array(ProposalSchema),
  error: z.string().nullable().optional(),
});

export type AgentServiceResponse = z.infer<typeof AgentServiceResponseSchema>;
export type AgentProposal = z.infer<typeof ProposalSchema>;

function config() {
  const baseUrl = process.env.AGENT_SERVICE_URL;
  const token = process.env.AGENT_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('AGENT_SERVICE_URL and AGENT_SERVICE_TOKEN must be set');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

async function post(path: string, body: unknown): Promise<AgentServiceResponse> {
  const { baseUrl, token } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Service-Token': token },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AgentServiceError(res.status, detail);
  }
  return AgentServiceResponseSchema.parse(await res.json());
}

export class AgentServiceError extends Error {
  constructor(public status: number, detail: string) {
    super(`Agent service responded ${status}: ${detail.slice(0, 200)}`);
  }
}

export function startAgentRun(input: AgentRunInput): Promise<AgentServiceResponse> {
  const parsed = AgentRunInputSchema.parse(input);
  return post('/v1/runs', parsed);
}

export function submitAgentDecisions(
  threadId: string,
  decisions: Record<string, ApprovalDecisionInput>,
): Promise<AgentServiceResponse> {
  const safe: Record<string, ApprovalDecisionInput> = {};
  for (const [actionId, decision] of Object.entries(decisions)) {
    safe[actionId] = ApprovalDecisionSchema.parse(decision);
  }
  return post(`/v1/runs/${encodeURIComponent(threadId)}/decisions`, { decisions: safe });
}
