// src/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { 
  user, 
  session, 
  account, 
  verification, 
  clients, 
  suppliers,
  items,
  inventory,
  invoices, 
  invoiceItems, 
  bills,
  billItems,
  billExtraCharges,
  payments,
  purchaseBills,
  purchaseBillItems,
  purchaseBillExtraCharges,
  expenses
} from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const db = drizzle(process.env.DATABASE_URL, {
  schema: { 
    user, 
    session, 
    account, 
    verification, 
    clients,
    suppliers,
    items,
    inventory,
    invoices, 
    invoiceItems, 
    bills,
    billItems,
    billExtraCharges,
    payments,
    purchaseBills,
    purchaseBillItems,
    purchaseBillExtraCharges,
    expenses
  }
});

export { db };
export default db;
