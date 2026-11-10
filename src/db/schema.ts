import { pgTable, text, timestamp, boolean, integer, decimal, jsonb, real, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
					id: text('id').primaryKey(),
					name: text('name').notNull(),
					email: text('email').notNull().unique(),
					emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
					image: text('image'),
					createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
					updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
					});

export const session = pgTable("session", {
					id: text('id').primaryKey(),
					expiresAt: timestamp('expires_at').notNull(),
					token: text('token').notNull().unique(),
					createdAt: timestamp('created_at').notNull(),
					updatedAt: timestamp('updated_at').notNull(),
					ipAddress: text('ip_address'),
					userAgent: text('user_agent'),
					userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
				});

export const account = pgTable("account", {
					id: text('id').primaryKey(),
					accountId: text('account_id').notNull(),
					providerId: text('provider_id').notNull(),
					userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
					accessToken: text('access_token'),
					refreshToken: text('refresh_token'),
					idToken: text('id_token'),
					accessTokenExpiresAt: timestamp('access_token_expires_at'),
					refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
					scope: text('scope'),
					password: text('password'),
					createdAt: timestamp('created_at').notNull(),
					updatedAt: timestamp('updated_at').notNull()
				});

export const verification = pgTable("verification", {
					id: text('id').primaryKey(),
					identifier: text('identifier').notNull(),
					value: text('value').notNull(),
					expiresAt: timestamp('expires_at').notNull(),
					createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
					updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
				});

// Invoice-related tables
export const clients = pgTable("clients", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	address: text('address'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const suppliers = pgTable("suppliers", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	contactPerson: text('contact_person'),
	email: text('email'),
	phone: text('phone'),
	address: text('address'),
	website: text('website'),
	notes: text('notes'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Items table (catalog without stock)
export const items = pgTable("items", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	sku: text('sku').notNull(),
	category: text('category').notNull(),
	unit: text('unit').default('pcs'),
	description: text('description'),
	costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Inventory table (stock tracking with supplier and dates)
export const inventory = pgTable("inventory", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
	supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
	purchaseBillId: text('purchase_bill_id').references(() => purchaseBills.id, { onDelete: 'set null' }),
	batchNumber: text('batch_number'),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
	availableQuantity: decimal('available_quantity', { precision: 10, scale: 2 }).notNull(),
	costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
	purchaseDate: timestamp('purchase_date').notNull(),
	expiryDate: timestamp('expiry_date'),
	location: text('location'),
	notes: text('notes'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const invoices = pgTable("invoices", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
	invoiceNumber: text('invoice_number').notNull(),
	issueDate: timestamp('issue_date').notNull(),
	dueDate: timestamp('due_date').notNull(),
	status: text('status').notNull().default('draft'), // draft, sent, paid, overdue
	subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
	taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('10.00'),
	taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
	totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const invoiceItems = pgTable("invoice_items", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
	description: text('description').notNull(),
	quantity: integer('quantity').notNull(),
	rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
	total: decimal('total', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

// New billing system
export const bills = pgTable("bills", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
	billNumber: text('bill_number').notNull(),
	invoiceNumber: text('invoice_number').notNull(),
	billDate: timestamp('bill_date').notNull(),
	subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
	taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('10.00'),
	tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
	extraChargesTotal: decimal('extra_charges_total', { precision: 10, scale: 2 }).notNull().default('0'),
	total: decimal('total', { precision: 10, scale: 2 }).notNull(),
	status: text('status').notNull().default('draft'), // draft, sent, paid
	notes: text('notes'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const billItems = pgTable("bill_items", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
	inventoryId: text('inventory_id').notNull().references(() => inventory.id, { onDelete: 'cascade' }),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
	total: decimal('total', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const billExtraCharges = pgTable("bill_extra_charges", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const payments = pgTable("payments", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	paymentDate: timestamp('payment_date').notNull(),
	status: text('status').notNull().default('completed'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
				});

// Purchase Bill system
export const purchaseBills = pgTable("purchase_bills", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
	billNumber: text('bill_number').notNull(),
	billDate: timestamp('bill_date').notNull(),
	subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
	taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
	tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
	extraChargesTotal: decimal('extra_charges_total', { precision: 10, scale: 2 }).notNull().default('0'),
	total: decimal('total', { precision: 10, scale: 2 }).notNull(),
	status: text('status').notNull().default('pending'), // pending, received, cancelled
	notes: text('notes'),
	location: text('location'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const purchaseBillItems = pgTable("purchase_bill_items", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	purchaseBillId: text('purchase_bill_id').notNull().references(() => purchaseBills.id, { onDelete: 'cascade' }),
	itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
	costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
	total: decimal('total', { precision: 10, scale: 2 }).notNull(),
	batchNumber: text('batch_number'),
	expiryDate: timestamp('expiry_date'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const purchaseBillExtraCharges = pgTable("purchase_bill_extra_charges", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	purchaseBillId: text('purchase_bill_id').notNull().references(() => purchaseBills.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Expenses table for tracking purchase-related expenses
export const expenses = pgTable("expenses", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	purchaseBillId: text('purchase_bill_id').references(() => purchaseBills.id, { onDelete: 'set null' }),
	category: text('category').notNull(), // 'purchase', 'shipping', 'tax', 'other'
	description: text('description').notNull(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	expenseDate: timestamp('expense_date').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Business Profile table
export const businessProfiles = pgTable("business_profiles", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
	businessName: text('business_name'),
	phone: text('phone'),
	email: text('email'),
	address: text('address'),
	logo: text('logo'), // Base64 encoded image or URL
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// ---------------------------------------------------------------------------
// FDE Agentic Layer: agent runs, proposed actions, and human approvals
// ---------------------------------------------------------------------------

export type AgentRunStatus = 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'rejected';
export type AgentActionStatus = 'pending_approval' | 'auto_executed' | 'approved' | 'rejected' | 'failed';
export type AgentRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalDecision = 'approved' | 'rejected' | 'modified';

// One row per LangGraph workflow execution (threadId = LangGraph thread for checkpoint resume)
export const agentRuns = pgTable("agent_runs", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	threadId: text('thread_id').notNull(),
	workflowType: text('workflow_type').notNull(), // 'purchase_bill_ingestion' | 'inventory_reconciliation' | 'invoice_draft'
	status: text('status').$type<AgentRunStatus>().notNull().default('running'),
	rawInput: jsonb('raw_input').notNull(), // original text/payload
	extractedData: jsonb('extracted_data'), // Pydantic-validated structured output
	confidenceScore: real('confidence_score'),
	tokenUsage: integer('token_usage').notNull().default(0),
	latencyMs: integer('latency_ms').notNull().default(0),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
}, (table) => [
	index('agent_runs_thread_id_idx').on(table.threadId),
	index('agent_runs_user_id_idx').on(table.userId),
]);

// One row per tool call the agent proposes; high-risk rows wait in the approval queue
export const agentActions = pgTable("agent_actions", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	runId: text('run_id').notNull().references(() => agentRuns.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	toolName: text('tool_name').notNull(), // 'create_purchase_bill' | 'adjust_inventory' | 'create_supplier'
	argsJson: jsonb('args_json').notNull(), // proposed database payload
	diffJson: jsonb('diff_json'), // before vs. after for existing records
	riskLevel: text('risk_level').$type<AgentRiskLevel>().notNull(),
	riskReasons: jsonb('risk_reasons').$type<string[]>().notNull().default([]),
	status: text('status').$type<AgentActionStatus>().notNull().default('pending_approval'),
	executedEntityId: text('executed_entity_id'), // ID of created bill/item once committed
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
}, (table) => [
	index('agent_actions_run_id_idx').on(table.runId),
	index('agent_actions_status_idx').on(table.status),
]);

// Immutable record of each human decision on an agent action
export const approvals = pgTable("approvals", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	actionId: text('action_id').notNull().references(() => agentActions.id, { onDelete: 'cascade' }),
	decidedBy: text('decided_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
	decision: text('decision').$type<ApprovalDecision>().notNull(),
	modifiedArgsJson: jsonb('modified_args_json'), // set when the human edited the AI's fields before approving
	reason: text('reason'),
	decidedAt: timestamp('decided_at').$defaultFn(() => new Date()).notNull()
});
