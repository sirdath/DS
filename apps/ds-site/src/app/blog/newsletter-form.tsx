'use client'

import { type FormEvent, useState } from 'react'

const COPY = {
  en: {
    title: 'Get the next article by email',
    sub: 'Practical notes on websites, AI and running a business online. No fluff, unsubscribe any time.',
    placeholder: 'you@company.com…',
    button: 'Subscribe',
    done: 'You are on the list. Thanks — we keep it short and useful.',
    error: 'That did not go through. Check the email and try again.',
    label: 'Email address',
  },
  el: {
    title: 'Το επόμενο άρθρο στο email σας',
    sub: 'Πρακτικές σημειώσεις για websites, AI και online επιχειρήσεις. Χωρίς φλυαρία, διαγραφή όποτε θέλετε.',
    placeholder: 'you@company.com…',
    button: 'Εγγραφή',
    done: 'Είστε στη λίστα. Ευχαριστούμε — τη κρατάμε σύντομη και χρήσιμη.',
    error: 'Κάτι πήγε στραβά. Ελέγξτε το email και δοκιμάστε ξανά.',
    label: 'Διεύθυνση email',
  },
} as const

export function NewsletterForm({ lang }: { lang: 'el' | 'en' }) {
  const t = COPY[lang]
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')
    try {
      const res = await fetch('/api/blog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="blog-nl">
      <h2 className="blog-nl__title">{t.title}</h2>
      <p className="blog-nl__sub">{t.sub}</p>
      {state === 'done' ? (
        <p className="blog-nl__done" role="status">{t.done}</p>
      ) : (
        <form className="blog-nl__form" onSubmit={onSubmit}>
          <input
            className="blog-nl__input"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            placeholder={t.placeholder}
            aria-label={t.label}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="blog-nl__btn" type="submit" disabled={state === 'busy'}>
            {t.button}
          </button>
        </form>
      )}
      <p className="blog-nl__err" role="alert" aria-live="polite">
        {state === 'error' ? t.error : ''}
      </p>
    </div>
  )
}
