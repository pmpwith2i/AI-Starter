const BRAND_COLOR = "#4a6fa5";

export const buildEmailTemplate = (
  title: string,
  bodyHtml: string,
): string => `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.5px;">oncologo.it</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">&copy; oncologo.it — Tutti i diritti riservati</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const buildVerificationEmail = (
  firstName: string,
  code: string,
): { subject: string; html: string } => ({
  subject: "Verifica il tuo account — oncologo.it",
  html: buildEmailTemplate(
    "Verifica il tuo account",
    `
      <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">Ciao ${firstName},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Inserisci il codice qui sotto per verificare il tuo account:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
        Il codice scade tra 15 minuti. Se non hai creato un account su oncologo.it, ignora questa email.
      </p>
    `,
  ),
});

export const buildPasswordResetEmail = (
  firstName: string,
  code: string,
): { subject: string; html: string } => ({
  subject: "Reimposta la tua password — oncologo.it",
  html: buildEmailTemplate(
    "Reimposta la tua password",
    `
      <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">Ciao ${firstName},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Inserisci il codice qui sotto per reimpostare la tua password:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
        Il codice scade tra 15 minuti. Se non hai richiesto questo codice, ignora questa email.
      </p>
    `,
  ),
});
