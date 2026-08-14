/**
 * German letter and message templates generated from real contract data.
 * Pure functions — no I/O — so they are trivially testable.
 */
const SRV_DE = {
  electricity: 'Strom', gas: 'Gas', internet: 'Internet / DSL', mobile: 'Mobilfunk',
  kfz: 'Kfz-Versicherung', health: 'Krankenversicherung', liability: 'Haftpflichtversicherung',
  home: 'Hausratversicherung', legal: 'Rechtsschutzversicherung', other: 'Vertrag'
};
const de = (d) => d ? String(d).slice(0, 10).split('-').reverse().join('.') : '[Datum]';

function letter(head, provider, subject, body, signer) {
  return head + '\n\n' + (provider || '[Anbieter]') + '\n\n' + de(new Date().toISOString()) +
    '\n\n' + subject + '\n\n' + body + '\n\nMit freundlichen Grüßen\n\n' + signer;
}

/**
 * @param kind    one of the KINDS below
 * @param cu      customer row
 * @param c       contract row (may be null)
 * @param opts    { missing: [service...] }
 */
function build(kind, cu, c, opts) {
  const o = opts || {};
  const name = [cu.first_name, cu.last_name].filter(Boolean).join(' ');
  const head = name + '\n' + (cu.street || '') + '\n' +
    [cu.postal_code, cu.city].filter(Boolean).join(' ');
  const srv = c ? (SRV_DE[c.service_type] || 'Vertrag') : '[Dienstleistung]';
  const nr = (c && c.contract_number) || '[Vertragsnummer]';
  const prov = (c && c.provider_name) || '[Anbieter]';
  const end = de(c && c.end_date);
  const deadline = de(c && c.cancel_deadline);
  const signed = de(c && c.signed_date);
  const optOut = 'Antworten Sie STOP, um keine weiteren Nachrichten zu erhalten.';

  switch (kind) {
    case 'kuendigung':
      return { channel: 'letter',
        subject: 'Kündigung des Vertrags Nr. ' + nr,
        body: letter(head, prov, 'Kündigung des Vertrags Nr. ' + nr,
'Sehr geehrte Damen und Herren,\n\nhiermit kündige ich den oben genannten Vertrag über ' + srv +
' fristgerecht zum ' + end + '.\n\nSollte eine Kündigung zu diesem Termin nicht möglich sein, kündige ich ' +
'hilfsweise zum nächstmöglichen Zeitpunkt.\n\nBitte bestätigen Sie mir den Eingang dieser Kündigung sowie ' +
'das genaue Vertragsende schriftlich.', name) };

    case 'widerruf':
      return { channel: 'letter',
        subject: 'Widerruf des Vertrags Nr. ' + nr,
        body: letter(head, prov, 'Widerruf des Vertrags Nr. ' + nr,
'Sehr geehrte Damen und Herren,\n\nhiermit widerrufe ich den am ' + signed + ' abgeschlossenen Vertrag über ' +
srv + ' innerhalb der gesetzlichen Widerrufsfrist von 14 Tagen.\n\nBitte bestätigen Sie mir den Widerruf ' +
'schriftlich und stellen Sie sicher, dass keine Belieferung und keine Abbuchung erfolgt.', name) };

    case 'sonderkuendigung':
      return { channel: 'letter',
        subject: 'Sonderkündigung wegen Preiserhöhung — Vertrag Nr. ' + nr,
        body: letter(head, prov, 'Sonderkündigung wegen Preiserhöhung — Vertrag Nr. ' + nr,
'Sehr geehrte Damen und Herren,\n\nSie haben mir eine Preisanpassung für meinen Vertrag über ' + srv +
' mitgeteilt.\n\nHiermit mache ich von meinem Sonderkündigungsrecht Gebrauch und kündige den Vertrag zum ' +
'Wirksamwerden der Preiserhöhung.\n\nBitte bestätigen Sie mir die Kündigung und das Vertragsende ' +
'schriftlich.', name) };

    case 'umzug':
      return { channel: 'letter',
        subject: 'Umzug — Vertrag Nr. ' + nr,
        body: letter(head, prov, 'Umzug — Vertrag Nr. ' + nr,
'Sehr geehrte Damen und Herren,\n\nhiermit teile ich Ihnen mit, dass ich zum ' + de(cu.moved_at) +
' umziehe.\n\nNeue Anschrift:\n' + (cu.street || '') + '\n' +
[cu.postal_code, cu.city].filter(Boolean).join(' ') +
'\n\nBitte teilen Sie mir mit, wie mit dem bestehenden Vertrag über ' + srv +
' zu verfahren ist, und übersenden Sie mir die Schlussabrechnung.', name) };

    case 'verlaengerung':
      return { channel: 'message',
        subject: 'Ihr ' + srv + '-Vertrag endet am ' + end,
        body: 'Hallo ' + (cu.first_name || '') + ',\n\nIhr ' + srv + '-Vertrag bei ' + prov +
' endet am ' + end + '. Die Kündigungsfrist läuft noch bis ' + deadline +
'.\n\nIch habe mir mehrere Angebote für Sie angesehen und kann Ihnen bessere Konditionen anbieten. ' +
'Den Wechsel und die Kündigung übernehme ich vollständig für Sie — Sie müssen nichts weiter tun.\n\n' +
'Sollen wir kurz telefonieren?\n\n' + optOut };

    case 'crossselling': {
      const miss = (o.missing || []).slice(0, 2).map(s => SRV_DE[s] || s).join(' und ') || 'weitere Bereiche';
      return { channel: 'message',
        subject: 'Ein Angebot für Sie: ' + miss,
        body: 'Hallo ' + (cu.first_name || '') + ',\n\nSie sind bereits über mich bei ' + srv +
' versorgt. Für ' + miss + ' kann ich Ihnen ebenfalls Angebote einholen — meist günstiger als ein ' +
'Direktabschluss, und Sie haben alles an einer Stelle.\n\nDarf ich Ihnen unverbindlich etwas ' +
'zusammenstellen?\n\n' + optOut };
    }

    case 'unterlagen':
      return { channel: 'message',
        subject: 'Noch fehlende Unterlagen',
        body: 'Hallo ' + (cu.first_name || '') + ',\n\nfür die Bearbeitung Ihres Vertrags über ' + srv +
' fehlen mir noch folgende Angaben:\n\n- Zählernummer\n- Aktuelle Jahresabrechnung\n- IBAN für das ' +
'SEPA-Mandat\n\nSie können mir die Unterlagen einfach als Foto zurücksenden.\n\nVielen Dank!' };

    default:
      return null;
  }
}

const KINDS = ['kuendigung', 'widerruf', 'sonderkuendigung', 'umzug',
               'verlaengerung', 'crossselling', 'unterlagen'];

/** Maps free text in German or Arabic to a template. */
function match(q) {
  const s = String(q || '').toLowerCase();
  if (/sonder|preiserh|رفع|استثنائ/.test(s)) return 'sonderkuendigung';
  if (/k[üu]ndig|إنهاء|الغاء|إلغاء|cancel/.test(s)) return 'kuendigung';
  if (/widerruf|رجوع|تراجع/.test(s)) return 'widerruf';
  if (/umzug|انتقال|عنوان/.test(s)) return 'umzug';
  if (/verl[äa]ng|تجديد|renew/.test(s)) return 'verlaengerung';
  if (/cross|angebot|عرض|إضاف|اضاف/.test(s)) return 'crossselling';
  if (/unterlag|dokument|مستند|أوراق|وثائق/.test(s)) return 'unterlagen';
  return null;
}

module.exports = { build, match, KINDS, SRV_DE };
