type SendUploadLinkEmailInput = {
  recipientEmail: string;
  clientName: string;
  uploadLinkUrl: string;
  expiresAt: Date;
};

export class EmailService {
    async sendUploadLinkEmail(input: SendUploadLinkEmailInput): Promise<void> {
        // STEP 1: extract data from input (just placeholder for now)

        const { recipientEmail, clientName, uploadLinkUrl, expiresAt } = input;

        // STEP 2: build email subject
        const subject = 'Your Upload Link is Ready';

        // STEP 3: build email html (just placeholder for now)
        // Add paragraph about expiration
        // format expiresAt into readable string
        // add spacing between sections
        const expiresAtFormatted = expiresAt.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC'
        });
        
        const html = `
        <p>Hello ${clientName},</p>
        <p>Your upload link is ready: <a href="${uploadLinkUrl}">${uploadLinkUrl}</a></p>
        <p>Please note that this link will expire on ${expiresAtFormatted} UTC.</p>
        <p>Best regards,<br/>Your Team</p>
        `;
        

        // STEP 4: log instead of sending (for now)
        console.log(`Sending email to ${recipientEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
    }
}

export const emailService = new EmailService();