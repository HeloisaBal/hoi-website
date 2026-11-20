/* ------------------------------------------------------------
   Built-in draft of the legal pages (German). Shown until Hoi fills
   in Sanity → Impressum / Datenschutzerklärung, and used as the seed.
   [In eckigen Klammern] = Hoi must fill in or confirm.
   This draft describes what this website actually does; it is not
   legal advice and must be checked before launch.
   ------------------------------------------------------------ */

export type LegalSection = { heading: string; text: string }

export type ImpressumContent = {
  organisation: string
  address: string
  representedBy: string
  /** empty: the address under "Contact & links" */
  email: string
  phone: string
  register: string
  vatId: string
  responsible: string
  sections: LegalSection[]
}

export type PrivacyContent = { updated: string; intro: string; sections: LegalSection[] }

export const defaultImpressum: ImpressumContent = {
  organisation: '[Name und Rechtsform, z. B. hoi startup factory GmbH]',
  address: 'Arberger Hafendamm 1\n28309 Bremen',
  representedBy: '[Geschäftsführung: Vorname Name, Vorname Name]',
  email: '',
  phone: '[Telefonnummer]',
  register: '[Registergericht und Registernummer, z. B. Amtsgericht Bremen, HRB …]',
  vatId: '[USt-IdNr., falls vorhanden]',
  responsible: '[Vorname Name]\nArberger Hafendamm 1\n28309 Bremen',
  sections: [
    {
      heading: 'Haftung für Links',
      text: 'Unsere Website enthält Links zu Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist der jeweilige Anbieter verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir die betreffenden Links umgehend.',
    },
  ],
}

export const defaultPrivacy: PrivacyContent = {
  updated: '2026-11-20',
  intro: 'Wir freuen uns über Ihren Besuch. Hier erklären wir, welche personenbezogenen Daten beim Besuch dieser Website verarbeitet werden, wozu und auf welcher Rechtsgrundlage. Diese Website verwendet keine Cookies zu Analyse- oder Werbezwecken und kein Tracking.',
  sections: [
    {
      heading: 'Hosting und Server-Logfiles',
      text: 'Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser und Betriebssystem. Diese Daten sind nötig, um die Website sicher und stabil auszuliefern, und werden nur kurz gespeichert.\n\nRechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (unser berechtigtes Interesse an einer sicheren und funktionsfähigen Website). Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung. Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework bzw. auf EU-Standardvertragsklauseln. [Bitte prüfen]',
    },
    {
      heading: 'Inhalte und Bilder (Sanity)',
      text: 'Texte und Bilder dieser Website verwalten wir mit Sanity (Sanity AS, Oslo, Norwegen, und Sanity Inc., USA). Bilder werden von cdn.sanity.io geladen; dabei wird Ihre IP-Adresse an Sanity übermittelt, damit die Bilder ausgeliefert werden können.\n\nRechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mit Sanity besteht ein Vertrag zur Auftragsverarbeitung. Für Übermittlungen in die USA gelten das EU-US Data Privacy Framework bzw. EU-Standardvertragsklauseln. [Bitte prüfen]',
    },
    {
      heading: 'Schriftarten',
      text: 'Die Schriftarten dieser Website sind lokal eingebunden. Beim Besuch wird keine Verbindung zu Servern von Google oder anderen Schriftanbietern aufgebaut.',
    },
    {
      heading: 'Speicherung in Ihrem Browser',
      text: 'Wir verwenden keine Cookies. Im lokalen Speicher Ihres Browsers (localStorage) speichern wir nur:\n- Ihren Vornamen und die gewählte Rolle (z. B. Gründer:in), damit wir Sie beim nächsten Besuch begrüßen und passende Inhalte zeigen können. Das geschieht nur, wenn Sie „Remember me“ ankreuzen (Einwilligung nach § 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO).\n- Ihre Einwilligung selbst und, wenn Sie einen Hinweis schließen, dass er geschlossen bleiben soll (unbedingt erforderlich, § 25 Abs. 2 Nr. 2 TDDDG).\n\nDiese Daten verlassen Ihren Browser nicht. Sie können Ihre Einwilligung jederzeit widerrufen: über „Reset personalisation“ am Ende der Startseite oder indem Sie die Websitedaten in Ihrem Browser löschen.',
    },
    {
      heading: 'Chatbot „Ask hoi“',
      text: 'Unser Chatbot beantwortet Fragen zu unseren Angeboten. Wenn Sie ihn nutzen, werden Ihre Nachrichten und, falls Sie eine Rolle gewählt haben, diese Rolle an OpenAI übermittelt, um eine Antwort zu erzeugen [Anbieter bitte prüfen: OpenAI Ireland Ltd., Dublin, Irland, bzw. OpenAI, L.L.C., San Francisco, USA]. Wir speichern die Unterhaltung nicht; sie besteht nur, solange das Browserfenster geöffnet ist. OpenAI verwendet über die API übermittelte Daten nicht zum Training und speichert sie höchstens 30 Tage zur Missbrauchserkennung.\n\nBitte geben Sie im Chat keine sensiblen Daten ein. Die Antworten werden automatisch erzeugt und können fehlerhaft sein.\n\nRechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (unser berechtigtes Interesse, Anfragen schnell zu beantworten). Mit OpenAI besteht ein Vertrag zur Auftragsverarbeitung. Für Übermittlungen in die USA gelten das EU-US Data Privacy Framework bzw. EU-Standardvertragsklauseln.',
    },
    {
      heading: 'Kontakt per E-Mail',
      text: 'Wenn Sie uns per E-Mail schreiben, verarbeiten wir Ihre Angaben, um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn Ihre Anfrage auf einen Vertrag zielt, sonst Art. 6 Abs. 1 lit. f DSGVO. Wir löschen die Daten, wenn sie nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.',
    },
    {
      heading: 'Links zu sozialen Netzwerken',
      text: 'Wir verlinken auf unsere Profile bei Instagram und LinkedIn. Es handelt sich um einfache Links: Erst wenn Sie darauf klicken, werden Daten an den jeweiligen Anbieter übermittelt. Dann gilt dessen Datenschutzerklärung.',
    },
    {
      heading: 'Ihre Rechte',
      text: 'Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Wenden Sie sich dazu an die oben genannte E-Mail-Adresse.\n\nSie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Landesbeauftragten für Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen (https://www.datenschutz.bremen.de).',
    },
    {
      heading: 'Datenschutzbeauftragte:r',
      text: '[Falls benannt: Name und Kontakt der oder des Datenschutzbeauftragten. Sonst diesen Abschnitt löschen.]',
    },
  ],
}
