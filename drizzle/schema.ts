import { pgTable, text, timestamp, unique, boolean, foreignKey, numeric, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const clients = pgTable("clients", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	address: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "clients_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const invoices = pgTable("invoices", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	clientId: text("client_id").notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	issueDate: timestamp("issue_date", { mode: 'string' }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	status: text().default('draft').notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('10.00'),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "invoices_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "invoices_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const bills = pgTable("bills", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	vendor: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	isRecurring: boolean("is_recurring").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "bills_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: text().primaryKey().notNull(),
	invoiceId: text("invoice_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }).notNull(),
	status: text().default('completed').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payments_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
]);

export const invoiceItems = pgTable("invoice_items", {
	id: text().primaryKey().notNull(),
	invoiceId: text("invoice_id").notNull(),
	description: text().notNull(),
	quantity: integer().notNull(),
	rate: numeric({ precision: 10, scale:  2 }).notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_items_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	sku: text(),
	category: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	minStock: integer("min_stock").default(0),
	quantity: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "products_user_id_user_id_fk"
		}).onDelete("cascade"),
]);
