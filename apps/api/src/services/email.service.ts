import { prisma } from "@fox-finance/prisma";

// Define email status type
type EmailStatus = "SENT" | "FAILED";

// Define the input type for sending upload link email
type SendUploadLinkEmailInput = {
  recipientEmail: string;
  clientName: string;
  uploadLinkUrl: string;
  expiresAt: Date;
  uploadLinkId: string;
};

export class EmailService {
    async sendUploadLinkEmail(input: SendUploadLinkEmailInput): Promise<void> {
        // 1. declare variable: status = sent (default)
        // 2. declare variable: errorMessage = null

        let status: EmailStatus = "SENT";
        let errorMessage: string | null = null;


        // STEP 1: extract data from input (just placeholder for now)

        const { recipientEmail, clientName, uploadLinkUrl, expiresAt, uploadLinkId } = input;

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
        
        // Build the HTML content of the email
        const html = `
        <p>Hello ${clientName},</p>
        <p>Your upload link is ready: <a href="${uploadLinkUrl}">${uploadLinkUrl}</a></p>
        <p>Please note that this link will expire on ${expiresAtFormatted} UTC.</p>
        <p>Best regards,<br/>Your Team</p>
        `;
        

        // try: stimulate sending email (console logs)
        try {
        console.log(`Sending email to ${recipientEmail}`);
        console.log("----- EMAIL DEBUG -----");
        console.log(`Subject: ${subject}`);
        console.log("----- EMAIL DEBUG -----");
        console.log(`Body: ${html}`);

        // catch error: status = failed, errorMessage = error.message
        // simulate failure
         if (Math.random() < 0.1) {
            throw new Error("Simulated email sending failure");
          }
      
          console.log(`Email sent successfully to ${recipientEmail}`);
        } catch (error) {
           status = "FAILED";
           errorMessage = (error as Error).message;

           console.error(`Failed to send email to ${recipientEmail}: ${errorMessage}`);
        }       

        // await prisma.emailLog.create({
        // uploadLinkId
        // recipientEmail,
        // status,
        // errorMessage,
        // });

         await prisma.emailLog.create({
            data: {
                uploadLinkId,
                recipientEmail,
                status,
                errorMessage,
            },
        });
    }
}

export const emailService = new EmailService();