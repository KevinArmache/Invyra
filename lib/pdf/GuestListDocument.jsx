import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { BRAND_HEX } from "@/lib/email/invitation-email";

/**
 * Liste des invités d'un événement au format PDF (A4, prête à imprimer),
 * générée côté serveur par app/dashboard/events/[id]/guests/pdf/route.js.
 *
 * Fond blanc et texte sombre pour l'impression ; l'or de la marque ne sert
 * qu'aux filets et aux accents. Polices standard du PDF (Helvetica, Times) :
 * aucun fichier à charger, et les accents du français sont couverts.
 *
 * Tous les textes arrivent déjà traduits dans `labels`.
 */

// Pas de césure : textkit ajoute un « - » à chaque coupure de mot, ce qui
// fausserait une adresse email ou un nom. Les lignes se coupent aux espaces.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#1c1916";
const MUTED = "#6f6862";
const LINE = "#e6e0d6";
const ZEBRA = "#faf7f1";

/** Couleurs des statuts, converties depuis les jetons oklch de globals.css. */
const STATUS_COLORS = {
  confirmed: "#55ca86", // --positive
  declined: "#ec565b", // --negative
  maybe: "#70b9e3", // --info
  pending: "#b5aea6",
};

/** Largeur de chaque colonne du tableau. */
const COLUMNS = {
  index: "4%",
  name: "20%",
  email: "22%",
  phone: "13%",
  status: "11%",
  people: "6%",
  arrived: "9%",
  notes: "15%",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: INK,
    backgroundColor: "#ffffff",
  },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandMark: { flexDirection: "row", alignItems: "center" },
  logo: { width: 22, height: 22, marginRight: 6 },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 2.5,
    color: BRAND_HEX.goldDeep,
  },
  docTitle: { fontSize: 7.5, letterSpacing: 1.5, color: MUTED, textTransform: "uppercase" },
  title: { marginTop: 18, fontFamily: "Times-Bold", fontSize: 22, lineHeight: 1.2 },
  meta: { marginTop: 5, fontSize: 9.5, color: MUTED, lineHeight: 1.4 },
  rule: { marginTop: 12, width: 48, height: 1.2, backgroundColor: BRAND_HEX.goldDeep },
  summary: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  stat: {
    width: "14.28%",
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  statBox: {
    flexGrow: 1,
    borderWidth: 0.75,
    borderColor: LINE,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  statValue: { fontFamily: "Times-Bold", fontSize: 16 },
  statLabel: {
    marginTop: 2,
    fontSize: 6.5,
    letterSpacing: 0.8,
    color: MUTED,
    textTransform: "uppercase",
  },
  table: { marginTop: 14 },
  headRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_HEX.goldDeep,
    paddingVertical: 6,
  },
  headCell: {
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 0.8,
    color: MUTED,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingVertical: 6,
  },
  // `fontSize` à côté de `lineHeight` : sans lui, react-pdf calcule
  // l'interligne sur sa taille par défaut (18 pt), pas sur celle héritée.
  cell: { paddingHorizontal: 4, fontSize: 8.5, lineHeight: 1.35 },
  index: { color: MUTED },
  name: { fontFamily: "Helvetica-Bold" },
  seats: { marginTop: 1, fontSize: 7, color: BRAND_HEX.goldDeep },
  people: { textAlign: "center" },
  email: { flexDirection: "row", flexWrap: "wrap", fontSize: 7.5 },
  status: { flexDirection: "row", alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 4 },
  notes: { color: MUTED },
  empty: { marginTop: 18, color: MUTED, textAlign: "center" },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 7,
    color: MUTED,
  },
});

/**
 * Adresse email coupable en deux : si elle ne tient pas sur une ligne, la
 * partie « @domaine » passe à la ligne suivante, sans tiret ajouté.
 */
function Email({ value }) {
  const at = value.indexOf("@");
  if (at <= 0) return <Text>{value}</Text>;
  return (
    <View style={styles.email}>
      <Text>{value.slice(0, at)}</Text>
      <Text>{value.slice(at)}</Text>
    </View>
  );
}

/**
 * @param {object} props
 * @param {{ title: string, dateLabel?: string, time?: string, location?: string, contactPhone?: string }} props.event
 * @param {Array<{ id: string, name: string, email: string, phone?: string, seats: number, people: number, arrived: string, status: "confirmed"|"declined"|"maybe"|"pending", notes?: string }>} props.guests
 *   `people` : personnes attendues (annoncées par un confirmé, sinon ses
 *   places) ; `arrived` : heure et nombre de personnes entrées, ou ""
 * @param {{ total: number, confirmed: number, declined: number, maybe: number, pending: number, expected: number, arrived: number }} props.summary
 * @param {object} props.labels  textes traduits (voir la route)
 * @param {Buffer} [props.logo]  logo PNG
 * @param {string} props.locale
 */
export default function GuestListDocument({
  event,
  guests,
  summary,
  labels,
  logo,
  locale,
}) {
  const meta = [event.dateLabel, event.time, event.location].filter(Boolean);
  const stats = [
    "total",
    "confirmed",
    "declined",
    "maybe",
    "pending",
    "expected",
    "arrived",
  ];

  return (
    <Document
      title={`${labels.title} · ${event.title}`}
      author="Invyra"
      creator="Invyra"
      producer="Invyra"
      language={locale}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            {logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas une balise <img>
              <Image style={styles.logo} src={{ data: logo, format: "png" }} />
            ) : null}
            <Text style={styles.brandName}>INVYRA</Text>
          </View>
          <Text style={styles.docTitle}>{labels.title}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        {meta.length > 0 && <Text style={styles.meta}>{meta.join(" · ")}</Text>}
        {event.contactPhone && (
          <Text style={styles.meta}>
            {labels.contact} {event.contactPhone}
          </Text>
        )}
        <View style={styles.rule} />

        <View style={styles.summary}>
          {stats.map((key) => (
            <View key={key} style={styles.stat}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{summary[key]}</Text>
                <Text style={styles.statLabel}>{labels.summary[key]}</Text>
              </View>
            </View>
          ))}
        </View>

        {guests.length === 0 ? (
          <Text style={styles.empty}>{labels.empty}</Text>
        ) : (
          <View style={styles.table}>
            {/* `fixed` : l'en-tête des colonnes se répète en haut de chaque page. */}
            <View style={styles.headRow} fixed>
              <Text style={[styles.headCell, { width: COLUMNS.index }]}>#</Text>
              <Text style={[styles.headCell, { width: COLUMNS.name }]}>
                {labels.columns.name}
              </Text>
              <Text style={[styles.headCell, { width: COLUMNS.email }]}>
                {labels.columns.email}
              </Text>
              <Text style={[styles.headCell, { width: COLUMNS.phone }]}>
                {labels.columns.phone}
              </Text>
              <Text style={[styles.headCell, { width: COLUMNS.status }]}>
                {labels.columns.status}
              </Text>
              <Text style={[styles.headCell, styles.people, { width: COLUMNS.people }]}>
                {labels.columns.people}
              </Text>
              <Text style={[styles.headCell, { width: COLUMNS.arrived }]}>
                {labels.columns.arrived}
              </Text>
              <Text style={[styles.headCell, { width: COLUMNS.notes }]}>
                {labels.columns.notes}
              </Text>
            </View>

            {guests.map((guest, index) => (
              <View
                key={guest.id}
                style={[styles.row, index % 2 === 1 ? { backgroundColor: ZEBRA } : {}]}
                wrap={false}
              >
                <Text style={[styles.cell, styles.index, { width: COLUMNS.index }]}>
                  {index + 1}
                </Text>
                <View style={[styles.cell, { width: COLUMNS.name }]}>
                  <Text style={styles.name}>{guest.name}</Text>
                  {guest.seats > 1 && (
                    <Text style={styles.seats}>
                      {labels.seats.replace("{count}", String(guest.seats))}
                    </Text>
                  )}
                </View>
                <View style={[styles.cell, { width: COLUMNS.email }]}>
                  {guest.email ? <Email value={guest.email} /> : <Text>-</Text>}
                </View>
                <Text style={[styles.cell, { width: COLUMNS.phone }]}>
                  {guest.phone || "-"}
                </Text>
                <View style={[styles.cell, styles.status, { width: COLUMNS.status }]}>
                  <View
                    style={[styles.dot, { backgroundColor: STATUS_COLORS[guest.status] }]}
                  />
                  <Text>{labels.status[guest.status]}</Text>
                </View>
                <Text style={[styles.cell, styles.people, { width: COLUMNS.people }]}>
                  {guest.people}
                </Text>
                <Text style={[styles.cell, { width: COLUMNS.arrived }]}>
                  {guest.arrived}
                </Text>
                <Text style={[styles.cell, styles.notes, { width: COLUMNS.notes }]}>
                  {guest.notes || ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>{labels.generatedOn}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              labels.page
                .replace("{page}", String(pageNumber))
                .replace("{total}", String(totalPages))
            }
          />
        </View>
      </Page>
    </Document>
  );
}
