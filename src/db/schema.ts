import { pgTable, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";

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
