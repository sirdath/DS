'use server'

import { revalidatePath } from 'next/cache'
import { createPresentation, setPresentationActive } from '../../lib/presentation-data'
import { resolveWorkspaceSession } from '../../lib/workspace-auth'

async function assertInternal() {
  const session = await resolveWorkspaceSession()
  if (!session || session.role !== 'internal') throw new Error('Not authorised')
}

export async function createDeckAction(input: { title: string; clientName: string; items: string[] }): Promise<{ token: string }> {
  await assertInternal()
  const items = (input.items ?? []).filter((s) => typeof s === 'string' && s).slice(0, 12)
  if (!items.length) throw new Error('Select at least one product')
  const token = await createPresentation({
    title: (input.title ?? '').trim() || 'Untitled deck',
    clientName: (input.clientName ?? '').trim() || null,
    items,
  })
  revalidatePath('/products/presentations')
  return { token }
}

export async function revokeDeckAction(id: string): Promise<void> {
  await assertInternal()
  await setPresentationActive(id, false)
  revalidatePath('/products/presentations')
}

export async function restoreDeckAction(id: string): Promise<void> {
  await assertInternal()
  await setPresentationActive(id, true)
  revalidatePath('/products/presentations')
}
