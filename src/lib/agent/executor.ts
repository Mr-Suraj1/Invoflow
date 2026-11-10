// Executes approved agent actions against the core business tables.
// Every write is scoped to the owning userId. Each tool's writes run in one db.batch(),
// which Neon executes as a single transaction, so a failure leaves no partial rows.
import { z } from 'zod';
import { db } from '@/db';
import { agentActions, expenses, inventory, items, purchaseBillItems, purchaseBills, suppliers } from '@/db/schema';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

export class ExecutionError extends Error {}

// ---- Argument schemas (mirror services/agent/app/schemas.py) -------------------

const LineItemArgs = z.object({
  name: z.string().min(1).max(200),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().nonnegative(),
  batch_number: z.string().nullish(),
  expiry_date: z.string().nullish(),
}).strict();

export const CreatePurchaseBillArgs = z.object({
  supplier_name: z.string().min(1).max(200),
  invoice_number: z.string().min(1).nullish(),
  bill_date: z.string().nullish(),
  items: z.array(LineItemArgs).min(1),
  total_amount: z.coerce.number().nonnegative(),
}).strict();

export const AdjustInventoryArgs = z.object({
  inventory_id: z.string().min(1),
  quantity_delta: z.coerce.number(),
  reason: z.string().min(1).max(500),
}).strict();

export const CreateSupplierArgs = z.object({
  name: z.string().min(1).max(200),
  contact_person: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
}).strict();

export const TOOL_ARG_SCHEMAS = {
  create_purchase_bill: CreatePurchaseBillArgs,
  adjust_inventory: AdjustInventoryArgs,
  create_supplier: CreateSupplierArgs,
} as const;

export type ToolName = keyof typeof TOOL_ARG_SCHEMAS;

/** Validates args for a tool. Throws ExecutionError with a readable message if they are invalid. */
export function validateToolArgs(toolName: string, args: unknown): unknown {
  const schema = TOOL_ARG_SCHEMAS[toolName as ToolName];
  if (!schema) throw new ExecutionError(`Tool '${toolName}' is not supported`);
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    throw new ExecutionError(`Invalid args for '${toolName}': ${parsed.error.issues[0]?.message ?? 'bad input'}`);
  }
  return parsed.data;
}

export type ExecutionResult = {
  entityId: string;
  diffJson: Record<string, unknown> | null;
};

// Lets the purchase-bill executor run inside db.batch(). The batch type is not exported by drizzle.
type BatchItem = Parameters<typeof db.batch>[0][number];

// Executes one action. Callers should sort create_supplier before create_purchase_bill.
export async function executeAction(
  userId: string,
  action: { toolName: string; argsJson: unknown },
): Promise<ExecutionResult> {
  switch (action.toolName) {
    case 'create_supplier':
      return createSupplier(userId, validateToolArgs('create_supplier', action.argsJson) as z.infer<typeof CreateSupplierArgs>);
    case 'create_purchase_bill':
      return createPurchaseBill(userId, validateToolArgs('create_purchase_bill', action.argsJson) as z.infer<typeof CreatePurchaseBillArgs>);
    case 'adjust_inventory':
      return adjustInventory(userId, validateToolArgs('adjust_inventory', action.argsJson) as z.infer<typeof AdjustInventoryArgs>);
    default:
      throw new ExecutionError(`Tool '${action.toolName}' is not supported`);
  }
}

// Stable order: suppliers first, so a bill approved in the same run can reference them.
const EXECUTION_ORDER: Record<string, number> = { create_supplier: 0, adjust_inventory: 1, create_purchase_bill: 2 };
export function sortForExecution<T extends { toolName: string }>(actions: T[]): T[] {
  return [...actions].sort((a, b) => (EXECUTION_ORDER[a.toolName] ?? 9) - (EXECUTION_ORDER[b.toolName] ?? 9));
}

// ---- create_supplier ------------------------------------------------------------

async function createSupplier(userId: string, args: z.infer<typeof CreateSupplierArgs>): Promise<ExecutionResult> {
  // Reuse an existing supplier with the same name instead of creating a duplicate.
  const [existing] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.userId, userId), sql`lower(${suppliers.name}) = lower(${args.name})`))
    .limit(1);
  if (existing) return { entityId: existing.id, diffJson: { reused: true } };

  const id = crypto.randomUUID();
  await db.insert(suppliers).values({
    id,
    userId,
    name: args.name,
    contactPerson: args.contact_person ?? null,
    email: args.email ?? null,
    phone: args.phone ?? null,
  });
  return { entityId: id, diffJson: null };
}

// ---- create_purchase_bill -------------------------------------------------------

// Mirrors src/app/api/purchase-bills/route.ts: a purchase bill, its line items, one inventory
// batch per line, and one purchase expense. Differences: tax and extra charges are 0 because
// the agent proposes only the total, and the bill is saved as 'pending'.
async function createPurchaseBill(
  userId: string,
  args: z.infer<typeof CreatePurchaseBillArgs>,
): Promise<ExecutionResult> {
  const billNumber = args.invoice_number?.trim();
  if (!billNumber) throw new ExecutionError('Invoice number is required to create a purchase bill');

  // Resolve supplier by name (case-insensitive). If none matches, the bill has no supplier.
  const [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.userId, userId), sql`lower(${suppliers.name}) = lower(${args.supplier_name})`))
    .limit(1);

  // Every line must match a catalog item. We never create catalog items from AI output.
  const wantedNames = [...new Set(args.items.map((i) => i.name.toLowerCase()))];
  const catalog = await db
    .select({ id: items.id, name: items.name, sellingPrice: items.sellingPrice })
    .from(items)
    .where(and(eq(items.userId, userId), inArray(sql`lower(${items.name})`, wantedNames)));
  const byName = new Map<string, (typeof catalog)[number]>();
  for (const item of catalog) byName.set(item.name.toLowerCase(), item);

  const missing = args.items.filter((i) => !byName.has(i.name.toLowerCase())).map((i) => i.name);
  if (missing.length > 0) {
    throw new ExecutionError(`Items not found in your catalog: ${[...new Set(missing)].join(', ')}`);
  }

  const billId = crypto.randomUUID();
  const billDate = args.bill_date ? new Date(args.bill_date) : new Date();
  const lines = args.items.map((i) => {
    const item = byName.get(i.name.toLowerCase())!;
    const qty = i.quantity;
    const cost = i.unit_cost;
    return {
      itemId: item.id,
      quantity: qty.toFixed(2),
      costPrice: cost.toFixed(2),
      total: (qty * cost).toFixed(2),
      batchNumber: i.batch_number ?? null,
      expiryDate: i.expiry_date ? new Date(i.expiry_date) : null,
      sellingPrice: item.sellingPrice,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + Number(l.total), 0);
  const total = args.total_amount;

  const writes: BatchItem[] = [
    db.insert(purchaseBills).values({
      id: billId,
      userId,
      supplierId: supplier?.id ?? null,
      billNumber,
      billDate,
      subtotal: subtotal.toFixed(2),
      taxRate: '0.00',
      tax: '0.00',
      extraChargesTotal: '0.00',
      total: total.toFixed(2),
      status: 'pending',
      notes: 'Created by AI agent',
      location: null,
    }) as unknown as BatchItem,
    db.insert(purchaseBillItems).values(lines.map((l) => ({
      purchaseBillId: billId,
      itemId: l.itemId,
      quantity: l.quantity,
      costPrice: l.costPrice,
      total: l.total,
      batchNumber: l.batchNumber,
      expiryDate: l.expiryDate,
    }))) as unknown as BatchItem,
    db.insert(inventory).values(lines.map((l) => ({
      userId,
      itemId: l.itemId,
      supplierId: supplier?.id ?? null,
      purchaseBillId: billId,
      batchNumber: l.batchNumber,
      quantity: l.quantity,
      availableQuantity: l.quantity,
      costPrice: l.costPrice,
      sellingPrice: l.sellingPrice ?? l.costPrice,
      purchaseDate: billDate,
      expiryDate: l.expiryDate,
      location: null,
      notes: 'Created by AI agent',
    }))) as unknown as BatchItem,
  ];

  let expenseId: string | null = null;
  if (total > 0) {
    expenseId = crypto.randomUUID();
    writes.push(db.insert(expenses).values({
      id: expenseId,
      userId,
      purchaseBillId: billId,
      category: 'purchase',
      description: `Purchase bill ${billNumber}`,
      amount: total.toFixed(2),
      expenseDate: billDate,
      notes: 'Created by AI agent',
    }) as unknown as BatchItem);
  }

  await db.batch(writes as unknown as [BatchItem, ...BatchItem[]]);

  return {
    entityId: billId,
    diffJson: { created: { purchaseBillId: billId, expenseId, lineCount: lines.length, total: total.toFixed(2) } },
  };
}

// ---- adjust_inventory -----------------------------------------------------------

async function adjustInventory(userId: string, args: z.infer<typeof AdjustInventoryArgs>): Promise<ExecutionResult> {
  const [row] = await db
    .select({ id: inventory.id, quantity: inventory.quantity, availableQuantity: inventory.availableQuantity })
    .from(inventory)
    .where(and(eq(inventory.id, args.inventory_id), eq(inventory.userId, userId)))
    .limit(1);
  if (!row) throw new ExecutionError('Inventory batch not found');

  const delta = args.quantity_delta;
  const before = { quantity: Number(row.quantity), availableQuantity: Number(row.availableQuantity) };
  const after = { quantity: before.quantity + delta, availableQuantity: before.availableQuantity + delta };
  if (after.quantity < 0 || after.availableQuantity < 0) {
    throw new ExecutionError(`Adjustment would make stock negative (available ${before.availableQuantity}, delta ${delta})`);
  }

  await db
    .update(inventory)
    .set({
      quantity: after.quantity.toFixed(2),
      availableQuantity: after.availableQuantity.toFixed(2),
      updatedAt: new Date(),
    })
    .where(and(eq(inventory.id, row.id), eq(inventory.userId, userId)));

  return { entityId: row.id, diffJson: { before, after, reason: args.reason } };
}

// ---- run-level execution ---------------------------------------------------------

/**
 * Executes every action in a run that is cleared to run (auto-executed or approved) and has
 * not run yet. Returns one message per failed action. Failed actions are marked 'failed'.
 */
export async function executeRunActions(
  userId: string,
  runId: string,
  statuses: Array<'auto_executed' | 'approved'>,
): Promise<string[]> {
  const pending = await db
    .select()
    .from(agentActions)
    .where(and(
      eq(agentActions.runId, runId),
      eq(agentActions.userId, userId),
      inArray(agentActions.status, statuses),
      isNull(agentActions.executedEntityId),
    ));

  const failures: string[] = [];
  for (const action of sortForExecution(pending)) {
    try {
      const result = await executeAction(userId, action);
      await db
        .update(agentActions)
        .set({ executedEntityId: result.entityId, diffJson: result.diffJson as object | null })
        .where(eq(agentActions.id, action.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      failures.push(`${action.toolName}: ${message}`);
      await db
        .update(agentActions)
        .set({ status: 'failed', diffJson: { error: message } })
        .where(eq(agentActions.id, action.id));
    }
  }
  return failures;
}
