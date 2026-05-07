// Placeholders here are replaced by `personalize.sh` after the interview.
// Until then, generated emails read literally as `{{PROJECT_NAME}}` etc.
const PROJECT_NAME = "{{PROJECT_NAME}}";
const COMPANY_NAME = "{{COMPANY_NAME}}";
const BRAND_COLOR = "#4a6fa5";

export const buildEmailTemplate = (
  title: string,
  bodyHtml: string,
): string => `<!DOCTYPE html>
<html lang="en">
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
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.5px;">${PROJECT_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">&copy; ${COMPANY_NAME} — All rights reserved</p>
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
  subject: `Verify your account — ${PROJECT_NAME}`,
  html: buildEmailTemplate(
    "Verify your account",
    `
      <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">Hi ${firstName},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Use the code below to verify your account:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
        The code expires in 15 minutes. If you didn't create an account, ignore this email.
      </p>
    `,
  ),
});

export const buildPasswordResetEmail = (
  firstName: string,
  code: string,
): { subject: string; html: string } => ({
  subject: `Reset your password — ${PROJECT_NAME}`,
  html: buildEmailTemplate(
    "Reset your password",
    `
      <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">Hi ${firstName},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Use the code below to reset your password:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
        The code expires in 15 minutes. If you didn't request this code, ignore this email.
      </p>
    `,
  ),
});
