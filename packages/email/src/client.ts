import { Resend } from "resend";

export interface EmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface EmailClient {
  sendEmail: (params: EmailParams) => Promise<void>;
}

export const createEmailClient = (apiKey: string): EmailClient => {
  const resend = new Resend(apiKey);

  return {
    sendEmail: async ({ from, to, subject, html }) => {
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    },
  };
};
