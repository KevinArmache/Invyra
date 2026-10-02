import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { BRAND_HEX } from "@/lib/email/layout";

/**
 * Billet d'entrée d'un invité au format PDF (A6, à garder sur son téléphone
 * ou à imprimer), généré par app/invite/[token]/ticket/pdf/route.js.
 *
 * Fond blanc et texte sombre, comme la liste des invités : un QR code se lit
 * mieux sombre sur clair. Polices standard du PDF, accents français compris.
 * Les textes arrivent déjà traduits dans `labels`.
 */

const INK = "#1c1916";
const MUTED = "#6f6862";
const LINE = "#e6e0d6";

const styles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 24,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: INK,
    backgroundColor: "#ffffff",
  },
  band: { height: 3, backgroundColor: BRAND_HEX.gold, marginHorizontal: -24, marginTop: -22, marginBottom: 16 },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logo: { width: 16, height: 16, marginRight: 5 },
  brandName: { fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 2.5, color: BRAND_HEX.goldDeep },
  eyebrow: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 2,
    color: BRAND_HEX.goldDeep,
    textTransform: "uppercase",
  },
  title: { marginTop: 6, textAlign: "center", fontFamily: "Times-Bold", fontSize: 17, lineHeight: 1.2 },
  guest: { marginTop: 4, textAlign: "center", fontFamily: "Times-Italic", fontSize: 11, color: MUTED },
  pass: { marginTop: 4, textAlign: "center", fontSize: 8, color: BRAND_HEX.goldDeep },
  rule: { marginTop: 12, marginBottom: 12, borderTopWidth: 0.75, borderTopColor: LINE, borderStyle: "dashed" },
  qrBox: { alignSelf: "center", padding: 6, borderWidth: 0.75, borderColor: LINE, borderRadius: 6 },
  qr: { width: 132, height: 132 },
  codeLabel: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 6,
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  code: { marginTop: 2, textAlign: "center", fontFamily: "Courier-Bold", fontSize: 11, letterSpacing: 2 },
  details: { marginTop: 12, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 10 },
  detail: { marginBottom: 6 },
  detailLabel: { fontSize: 6, letterSpacing: 1.2, color: MUTED, textTransform: "uppercase" },
  detailValue: { marginTop: 1.5, fontSize: 8.5, lineHeight: 1.35 },
  footer: { marginTop: "auto", textAlign: "center", fontSize: 7, color: MUTED, lineHeight: 1.4 },
});

/**
 * @param {object} props
 * @param {{ title: string, when?: string, location?: string, contactPhone?: string }} props.event
 * @param {{ name: string, pass: string, code: string }} props.guest
 * @param {Buffer} props.qr     PNG du QR code
 * @param {Buffer} [props.logo] logo PNG
 * @param {object} props.labels textes traduits
 * @param {string} props.locale
 */
export default function TicketDocument({ event, guest, qr, logo, labels, locale }) {
  const details = [
    event.when && [labels.when, event.when],
    event.location && [labels.where, event.location],
    event.contactPhone && [labels.contact, event.contactPhone],
  ].filter(Boolean);

  return (
    <Document
      title={`${labels.title} · ${event.title}`}
      author="Invyra"
      creator="Invyra"
      producer="Invyra"
      language={locale}
    >
      <Page size="A6" style={styles.page}>
        <View style={styles.band} />
        <View style={styles.brand}>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas une balise <img>
            <Image style={styles.logo} src={{ data: logo, format: "png" }} />
          ) : null}
          <Text style={styles.brandName}>INVYRA</Text>
        </View>

        <Text style={styles.eyebrow}>{labels.title}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.guest}>{guest.name}</Text>
        <Text style={styles.pass}>{guest.pass}</Text>

        <View style={styles.rule} />

        <View style={styles.qrBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas une balise <img> */}
          <Image style={styles.qr} src={{ data: qr, format: "png" }} />
        </View>
        <Text style={styles.codeLabel}>{labels.codeLabel}</Text>
        <Text style={styles.code}>{guest.code}</Text>

        {details.length > 0 && (
          <View style={styles.details}>
            {details.map(([label, value]) => (
              <View key={label} style={styles.detail}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>{labels.footer}</Text>
      </Page>
    </Document>
  );
}
