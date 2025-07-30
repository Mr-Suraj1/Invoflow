import { relations } from "drizzle-orm/relations";
import { user, account, session, clients, invoices, bills, payments, invoiceItems, products } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	clients: many(clients),
	invoices: many(invoices),
	bills: many(bills),
	products: many(products),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const clientsRelations = relations(clients, ({one, many}) => ({
	user: one(user, {
		fields: [clients.userId],
		references: [user.id]
	}),
	invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	user: one(user, {
		fields: [invoices.userId],
		references: [user.id]
	}),
	client: one(clients, {
		fields: [invoices.clientId],
		references: [clients.id]
	}),
	payments: many(payments),
	invoiceItems: many(invoiceItems),
}));

export const billsRelations = relations(bills, ({one}) => ({
	user: one(user, {
		fields: [bills.userId],
		references: [user.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id]
	}),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
}));

export const productsRelations = relations(products, ({one}) => ({
	user: one(user, {
		fields: [products.userId],
		references: [user.id]
	}),
}));