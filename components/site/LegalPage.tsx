'use client'

import { useContent } from './ContentContext'
import { DEFAULT_THEME } from './data'
import { Footer } from './Footer'
import { Header } from './Header'
import { TextBlocks } from './LinkedText'
import { themeVars } from './shared'

/* ------------------------------------------------------------
   Impressum and Datenschutzerklärung (German). Content from Sanity
   (→ Impressum, → Datenschutzerklärung), or the built-in draft in
   legalDefaults.ts. Deliberately calm: no effects, easy to read.
   ------------------------------------------------------------ */

const LINK = 'legal-link'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/** One line of provider data; "[placeholders]" are shown on purpose, so nothing goes missing unnoticed before launch. */
const Line = ({ label, value }: { label?: string; value: string }) =>
  value ? <p className="whitespace-pre-line">{label && <span className="font-semibold">{label}: </span>}{value}</p> : null

function ProviderDetails({ heading }: { heading: string }) {
  const { impressum: i, settings } = useContent()
  const email = i.email || settings.email
  return (
    <Block title={heading}>
      <Line value={i.organisation} />
      <Line value={i.address} />
      <Line label="Vertreten durch" value={i.representedBy} />
      <p><span className="font-semibold">E-Mail: </span><a className={LINK} href={`mailto:${email}`}>{email}</a></p>
      <Line label="Telefon" value={i.phone} />
    </Block>
  )
}

export function ImpressumPage() {
  const { impressum: i } = useContent()
  return (
    <LegalShell title="Impressum">
      <ProviderDetails heading="Angaben gemäß § 5 DDG" />
      {(i.register || i.vatId) && (
        <Block title="Register und Umsatzsteuer">
          <Line label="Registereintrag" value={i.register} />
          <Line label="Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG" value={i.vatId} />
        </Block>
      )}
      {i.responsible && (
        <Block title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <Line value={i.responsible} />
        </Block>
      )}
      {i.sections.map((s) => (
        <Block key={s.heading} title={s.heading}><TextBlocks text={s.text} linkClass={LINK} className="legal-text" /></Block>
      ))}
    </LegalShell>
  )
}

export function PrivacyPage() {
  const { privacy: p } = useContent()
  const updated = new Date(`${p.updated}T12:00:00Z`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <LegalShell title="Datenschutz­erklärung">
      {p.intro && <TextBlocks text={p.intro} linkClass={LINK} className="legal-text legal-intro" />}
      <ProviderDetails heading="Verantwortlich" />
      {p.sections.map((s) => (
        <Block key={s.heading} title={s.heading}><TextBlocks text={s.text} linkClass={LINK} className="legal-text" /></Block>
      ))}
      <p className="legal-updated">Stand: {updated}</p>
    </LegalShell>
  )
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="themed clean" style={themeVars(DEFAULT_THEME)} lang="de">
      <Header />
      <main className="container-x legal">
        <h1>{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  )
}
