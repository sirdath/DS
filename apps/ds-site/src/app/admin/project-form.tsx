/**
 * project-form.tsx
 * Shared server-rendered form for creating and editing projects.
 * Uses uncontrolled inputs with defaultValue — no 'use client' needed.
 * Field sections live in dedicated subcomponent files to stay < 200 lines each.
 */
import type { Project } from './types'
import { CoreFields } from './project-form-core-fields'
import { MoneyFields } from './project-form-money-fields'
import { DateFields, LinkFields } from './project-form-date-link-fields'
import { OutreachFields } from './project-form-outreach-fields'
import { ContactFields, NotesFields } from './project-form-contact-fields'

interface Props {
  action: (fd: FormData) => void | Promise<void>
  project?: Project
  submitLabel: string
}

export function ProjectForm({ action, project, submitLabel }: Props) {
  return (
    <form action={action} className="admin-form">
      <CoreFields project={project} />
      <MoneyFields project={project} />
      <DateFields project={project} />
      <LinkFields project={project} />
      <OutreachFields project={project} />
      <ContactFields project={project} />
      <NotesFields project={project} />

      <div className="admin-form__actions">
        <button type="submit" className="admin-form__submit">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
