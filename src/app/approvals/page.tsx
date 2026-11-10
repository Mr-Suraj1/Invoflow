"use client";

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PendingAction = {
  id: string;
  runId: string;
  toolName: string;
  argsJson: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReasons: string[];
  workflowType: string;
  createdAt: string;
};

// Low risk: known supplier, invoice number, confidence above 0.85, total under the auto limit.
const SAMPLE_LOW_RISK = JSON.stringify({
  supplier_name: 'Acme Pharma',
  supplier_is_known: true,
  invoice_number: 'INV-1001',
  bill_date: '2026-11-01',
  items: [{ name: 'Paracetamol 500mg', quantity: '10', unit_cost: '12.50' }],
  total_amount: '125.00',
  confidence: 0.95,
}, null, 2);

// High risk: total above the auto-approve limit, so it waits for a human.
const SAMPLE_HIGH_RISK = JSON.stringify({
  supplier_name: 'Acme Pharma',
  supplier_is_known: true,
  invoice_number: 'INV-1002',
  bill_date: '2026-11-02',
  items: [{ name: 'Paracetamol 500mg', quantity: '1', unit_cost: '60000' }],
  total_amount: '60000.00',
  confidence: 0.95,
}, null, 2);

export default function ApprovalsPage() {
  const [items, setItems] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runInput, setRunInput] = useState(SAMPLE_LOW_RISK);
  const [runBusy, setRunBusy] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  async function startRun() {
    setRunBusy(true);
    setRunMessage(null);
    let rawInput: string | Record<string, unknown> = runInput;
    try {
      const parsed = JSON.parse(runInput);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) rawInput = parsed;
    } catch {
      // Not JSON: send as free text.
    }
    try {
      const res = await fetch('/api/agent/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowType: 'purchase_bill_ingestion', rawInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Run failed (${res.status})`);
      setRunMessage(
        data.status === 'awaiting_approval'
          ? 'Run paused: a human must approve the proposed changes below.'
          : data.status === 'completed'
            ? 'Run completed: low-risk changes were applied automatically.'
            : `Run finished with status: ${data.status}${data.error ? ` (${data.error})` : ''}`,
      );
      await load();
    } catch (err) {
      setRunMessage(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunBusy(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/approvals', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load approvals (${res.status})`);
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(actionId: string, decision: 'approved' | 'rejected') {
    setBusyId(actionId);
    setError(null);
    try {
      const res = await fetch(`/api/agent/approvals/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Decision failed (${res.status})`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Approvals</h1>
        <p className="text-sm text-muted-foreground">
          AI-proposed changes that need a human decision before they are applied.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New AI run (purchase bill)</CardTitle>
          <CardDescription>
            Paste a bill as JSON, or as free text. Free text needs the LLM to be configured on the agent service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRunInput(SAMPLE_LOW_RISK)}>
              Load low-risk sample
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRunInput(SAMPLE_HIGH_RISK)}>
              Load high-risk sample
            </Button>
          </div>
          <textarea
            className="h-48 w-full rounded border bg-background p-3 font-mono text-xs"
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={runBusy || !runInput.trim()} onClick={startRun}>
              {runBusy ? 'Running...' : 'Run agent'}
            </Button>
            {runMessage && <span className="text-sm text-muted-foreground">{runMessage}</span>}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing is waiting for approval.</p>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {item.toolName} <span className="text-sm font-normal text-muted-foreground">({item.workflowType})</span>
              </CardTitle>
              <CardDescription>
                Risk: <strong>{item.riskLevel}</strong>
                {item.riskReasons.length > 0 && ` · ${item.riskReasons.join(' · ')}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(item.argsJson, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button size="sm" disabled={busyId === item.id} onClick={() => decide(item.id, 'approved')}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => decide(item.id, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
