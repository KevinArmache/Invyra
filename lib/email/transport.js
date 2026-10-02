import nodemailer from "nodemailer";

/**
 * Envoi des e-mails d'Invyra par SMTP (Gmail : SSL sur le port 465, ou
 * STARTTLS sur le 587).
 *
 * Module serveur ordinaire, volontairement pas "use server" : ses exports
 * deviendraient des points d'entrée appelables depuis le navigateur, et
 * n'importe qui pourrait envoyer des e-mails en notre nom. Seuls des modules
 * serveur l'importent (server actions, hooks d'authentification).
 */

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // true pour 465 (SSL), false pour 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * @param {{ to: string, subject: string, text: string, html: string }} message
 * @returns {Promise<{ messageId: string }>}
 */
export function sendMail({ to, subject, text, html }) {
  return getTransporter().sendMail({
    from: `"Invyra" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
