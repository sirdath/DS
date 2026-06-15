/**
 * SupabaseAccountingSource — the production accounting seam (the @ds/plutus engine
 * ships only the interface + an in-memory stub; real adapters live app-side). Reads
 * a single client's receivables from the plutus_* tables through the RLS-scoped
 * server client, so every query is automatically constrained to auth.uid(). Maps
 * rows onto the engine domain types via the pure row-mappers.
 */

import 'server-only'

import type { AccountingSource, Customer, Invoice, Payment } from '@ds/plutus'
import type { SupabaseClient } from '@supabase/supabase-js'
import { rowToCustomer, rowToInvoice, rowToPayment } from './row-mappers'

export class SupabaseAccountingSource implements AccountingSource {
  readonly kind = 'supabase'

  constructor(
    private readonly db: SupabaseClient,
    private readonly userId: string,
  ) {}

  async listCustomers(): Promise<Customer[]> {
    const { data, error } = await this.db.from('plutus_customers').select('*').eq('user_id', this.userId)
    if (error) throw new Error(`plutus_customers read failed: ${error.message}`)
    return (data ?? []).map(rowToCustomer)
  }

  async listInvoices(): Promise<Invoice[]> {
    const { data, error } = await this.db.from('plutus_invoices').select('*').eq('user_id', this.userId)
    if (error) throw new Error(`plutus_invoices read failed: ${error.message}`)
    return (data ?? []).map(rowToInvoice)
  }

  async listPayments(): Promise<Payment[]> {
    const { data, error } = await this.db.from('plutus_payments').select('*').eq('user_id', this.userId)
    if (error) throw new Error(`plutus_payments read failed: ${error.message}`)
    return (data ?? []).map(rowToPayment)
  }
}
