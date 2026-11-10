import { z } from 'zod';

// Client schemas
export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const clientResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Supplier schemas
export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const supplierResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Item schemas (catalog items without stock)
export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().optional(), // Will be auto-generated
  category: z.string().min(1, 'Category is required'),
  unit: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
});

export const itemResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  unit: z.string().nullable(),
  description: z.string().nullable(),
  costPrice: z.string(),
  sellingPrice: z.string(),
  quantity: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Inventory schemas (stock tracking with supplier and dates)
export const inventorySchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  supplierId: z.string().optional().or(z.literal('')),
  batchNumber: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  expiryDate: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const inventoryResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  itemId: z.string(),
  supplierId: z.string().nullable(),
  batchNumber: z.string().nullable(),
  quantity: z.string(),
  availableQuantity: z.string(),
  costPrice: z.string(),
  sellingPrice: z.string(),
  purchaseDate: z.string(),
  expiryDate: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  item: z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    unit: z.string().nullable(),
    costPrice: z.string(),
    sellingPrice: z.string(),
  }),
  supplier: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    contactPerson: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }).nullable(),
});

// Billing schemas (new system)
export const billingItemSchema = z.object({
  inventoryId: z.string().min(1, 'Inventory item is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
});

export const extraChargeSchema = z.object({
  name: z.string().min(1, 'Charge name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

export const billSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  items: z.array(billingItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

export const extendedBillSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  invoiceNumber: z.string().optional(), // Made optional since it will be auto-generated
  billDate: z.string().min(1, 'Bill date is required'),
  items: z.array(billingItemSchema).min(1, 'At least one item is required'),
  taxRate: z.preprocess(
    (val) => val === null || val === undefined || val === '' ? 10 : val,
    z.number().min(0).max(100, 'Tax rate must be between 0 and 100')
  ),
  extraCharges: z.array(extraChargeSchema).default([]),
  notes: z.string().optional(),
  status: z.enum(['due', 'paid']).default('due'),
});

export const billResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientId: z.string(),
  billNumber: z.string(),
  subtotal: z.string(),
  tax: z.string(),
  total: z.string(),
  status: z.enum(['due', 'paid']),
  notes: z.string().nullable(),
  dueDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  client: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
  }),
  items: z.array(z.object({
    id: z.string(),
    inventoryId: z.string(),
    quantity: z.string(),
    sellingPrice: z.string(),
    total: z.string(),
    inventory: z.object({
      id: z.string(),
      item: z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string(),
        unit: z.string().nullable(),
      }),
    }),
  })),
});

// Type exports
export type ClientForm = z.infer<typeof clientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;
export type SupplierForm = z.infer<typeof supplierSchema>;
export type SupplierResponse = z.infer<typeof supplierResponseSchema>;
export type ItemForm = z.infer<typeof itemSchema>;
export type ItemResponse = z.infer<typeof itemResponseSchema>;
export type InventoryForm = z.infer<typeof inventorySchema>;
export type InventoryResponse = z.infer<typeof inventoryResponseSchema>;
export type BillingItemForm = z.infer<typeof billingItemSchema>;
export type ExtraChargeForm = z.infer<typeof extraChargeSchema>;
export type BillForm = z.infer<typeof billSchema>;
export type ExtendedBillForm = z.infer<typeof extendedBillSchema>;
export type BillResponse = z.infer<typeof billResponseSchema>;

// Purchase Bill schemas
export const purchaseBillItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const purchaseBillExtraChargeSchema = z.object({
  name: z.string().min(1, 'Charge name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

export const purchaseBillSchema = z.object({
  supplierId: z.string(),
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  items: z.array(purchaseBillItemSchema).min(1, 'At least one item is required'),
  taxRate: z.preprocess(
    (val) => val === null || val === undefined || val === '' ? 0 : val,
    z.number().min(0).max(100, 'Tax rate must be between 0 and 100')
  ),
  extraCharges: z.array(purchaseBillExtraChargeSchema),
  notes: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['pending', 'received', 'cancelled']),
});

export const purchaseBillResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  supplierId: z.string().nullable(),
  billNumber: z.string(),
  billDate: z.string(),
  subtotal: z.string(),
  taxRate: z.string(),
  tax: z.string(),
  extraChargesTotal: z.string(),
  total: z.string(),
  status: z.enum(['pending', 'received', 'cancelled']),
  notes: z.string().nullable(),
  location: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  supplier: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    contactPerson: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }).nullable(),
  items: z.array(z.object({
    id: z.string(),
    itemId: z.string(),
    quantity: z.string(),
    costPrice: z.string(),
    total: z.string(),
    batchNumber: z.string().nullable(),
    expiryDate: z.string().nullable(),
    item: z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string(),
      unit: z.string().nullable(),
    }),
  })),
  extraCharges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.string(),
  })),
});

export type PurchaseBillItemForm = z.infer<typeof purchaseBillItemSchema>;
export type PurchaseBillExtraChargeForm = z.infer<typeof purchaseBillExtraChargeSchema>;
export type PurchaseBillForm = z.infer<typeof purchaseBillSchema>;
export type PurchaseBillResponse = z.infer<typeof purchaseBillResponseSchema>;

// Expense schemas
export const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  notes: z.string().optional(),
  purchaseBillId: z.string().optional(),
});

export const expenseResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  purchaseBillId: z.string().nullable(),
  category: z.string(),
  description: z.string(),
  amount: z.string(),
  expenseDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExpenseForm = z.infer<typeof expenseSchema>;
export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;

// Categories
export const categories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Food & Beverages',
  'Health & Beauty',
  'Automotive',
  'Other'
] as const;

// SI Units
export const units = [
  'pcs', // pieces
  'kg', // kilogram
  'g', // gram
  'mg', // milligram
  'l', // liter
  'ml', // milliliter
  'm', // meter
  'cm', // centimeter
  'mm', // millimeter
  'm²', // square meter
  'm³', // cubic meter
  'box',
  'pack',
  'bottle',
  'bag',
  'roll',
  'sheet',
  'pair',
  'set',
  'dozen'
] as const; 
// ---------------------------------------------------------------------------
// FDE Agentic Layer contracts (mirrored by Pydantic models in the Python agent service)
// ---------------------------------------------------------------------------

export const AGENT_WORKFLOW_TYPES = ['purchase_bill_ingestion', 'inventory_reconciliation', 'invoice_draft'] as const;
export const AGENT_TOOL_NAMES = ['create_purchase_bill', 'adjust_inventory', 'create_supplier'] as const;
export const AGENT_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const AGENT_RUN_STATUSES = ['running', 'awaiting_approval', 'completed', 'failed', 'rejected'] as const;
export const AGENT_ACTION_STATUSES = ['pending_approval', 'auto_executed', 'approved', 'rejected', 'failed'] as const;

// Input sent from Next.js to the agent service to start a workflow
export const AgentRunInputSchema = z.object({
  workflowType: z.enum(AGENT_WORKFLOW_TYPES),
  threadId: z.string().min(1).optional(),
  rawInput: z.union([
    z.string().min(1, 'Input text is required'),
    z.record(z.string(), z.unknown()),
  ]),
});

// A single tool call proposed by the agent, plus the guardrail verdict
export const AgentActionProposalSchema = z.object({
  toolName: z.enum(AGENT_TOOL_NAMES),
  argsJson: z.record(z.string(), z.unknown()),
  diffJson: z.record(z.string(), z.unknown()).nullable().default(null),
  riskLevel: z.enum(AGENT_RISK_LEVELS),
  riskReasons: z.array(z.string()).default([]),
});

// Human decision on a pending action in the approval queue
export const ApprovalDecisionSchema = z
  .object({
    decision: z.enum(['approved', 'rejected', 'modified']),
    modifiedArgsJson: z.record(z.string(), z.unknown()).optional(),
    reason: z.string().max(1000).optional(),
  })
  .refine((d) => d.decision !== 'modified' || !!d.modifiedArgsJson, {
    message: 'modifiedArgsJson is required when decision is "modified"',
    path: ['modifiedArgsJson'],
  });

export type AgentRunInput = z.infer<typeof AgentRunInputSchema>;
export type AgentActionProposal = z.infer<typeof AgentActionProposalSchema>;
export type ApprovalDecisionInput = z.infer<typeof ApprovalDecisionSchema>;
