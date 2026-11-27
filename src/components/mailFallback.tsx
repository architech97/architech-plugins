import type { ReactNode } from 'react'
import { CONTACT } from '../data/contact'

/** Same sentence as architech-design mail.js. The script swaps it if no mail app opens. */
export const MAIL_NOTE = 'If no mail app opens, copy the address and paste it into any mail program.'

/** Visible address, copy control, and the note. The address link can carry an icon. */
export function MailFallback({ link }: { link?: ReactNode }) {
  return (
    <>
      <p className="mail-fallback">
        {link ?? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>}
        <button type="button" className="copy-email" data-copy-email={CONTACT.email}>Copy email</button>
      </p>
      <p className="mail-note" data-mail-status role="status">{MAIL_NOTE}</p>
    </>
  )
}
