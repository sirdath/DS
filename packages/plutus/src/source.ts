/**
 * The accounting-data seam. The engine never knows whether records come from a CSV
 * import, Xero, QuickBooks or Elorus — it talks to this interface. The MVP adapters
 * live app-side; the package ships the interface + an in-memory stub for the demo
 * and tests. (A production source also exposes change-detection — webhook for
 * Xero/QBO, poll for the rest — to drive stop-on-payment; that lives in the app.)
 */

import type { Customer, Invoice, Payment } from "./types";

export interface AccountingSource {
  readonly kind: string;
  listCustomers(): Promise<Customer[]>;
  listInvoices(): Promise<Invoice[]>;
  listPayments(): Promise<Payment[]>;
  /** Record that we chased this debtor (note in the source where supported). */
  markContacted?(invoiceId: string, note?: string): Promise<void>;
}

export interface SourceData {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
}

/** In-memory source — drives the demo and tests with zero external systems. */
export class InMemorySource implements AccountingSource {
  readonly kind = "memory";
  constructor(private readonly data: SourceData) {}
  async listCustomers(): Promise<Customer[]> {
    return this.data.customers;
  }
  async listInvoices(): Promise<Invoice[]> {
    return this.data.invoices;
  }
  async listPayments(): Promise<Payment[]> {
    return this.data.payments;
  }
}
