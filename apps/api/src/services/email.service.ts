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
        const subject = "Your Secure Upload Link";

        // STEP 3: build email html (just placeholder for now)
        // Add paragraph about expiration
        // format expiresAt into readable string
        // add spacing between sections
        const expiresAtFormatted = expiresAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
        });
        
        // Build the HTML content of the email
        const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Hello ${clientName},</h2>

        <p>You have been requested to upload documents securely.</p>

        <p>
            <a href="${uploadLinkUrl}" 
            style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
            ">
            Upload Documents
            </a>
        </p>

        <p>This link will expire on:</p>
        <strong>${expiresAtFormatted} (UTC)</strong>

        <p style="margin-top: 20px;">
            If you have any questions, please contact support.
        </p>

        <p>Best regards,<br/>Fox Finance Team</p>
        </div>
        `;

        console.log("HTML Preview:", html);
        

        // try: stimulate sending email (console logs)
        try {
        console.log("📧 MOCK EMAIL SENT");
        console.log("To:", recipientEmail);
        console.log("Subject:", subject);
        console.log("Link:", uploadLinkUrl);

        // catch error: status = failed, errorMessage = error.message
        // simulate failure
         } catch (error) {
            status = "FAILED";
            errorMessage = (error as Error).message;

            console.error("❌ Email failed:", errorMessage);
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

    async sendUploadNotificationEmail(input: {
            recipientEmails: string[];
            clientName: string;
            fileList: { fileName: string; fileSize: number }[];
            fileCount: number;
            totalSize: number;
            viewUploadsUrl: string;
            }): Promise<void> {
        const { recipientEmails, clientName, fileList, fileCount, totalSize, viewUploadsUrl } = input;

        const subject = `New Uploads from ${clientName}`;

        const fileItems = fileList
            .map(f => `<li>${f.fileName} (${f.fileSize} bytes)</li>`)
            .join("");

        const html = `
            <div style="font-family: Arial, sans-serif;">
            <h2>New Upload Completed</h2>

            <p><strong>${clientName}</strong> has uploaded files.</p>

            <p>Total files: ${fileCount}</p>
            <p>Total size: ${totalSize} bytes</p>

            <ul>${fileItems}</ul>

            <p>
                <a href="${viewUploadsUrl}"
                style="padding: 10px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                View Uploads
                </a>
            </p>
            </div>
        `;
        console.log("HTML Preview:", html);

        console.log("📧 MOCK ADMIN EMAIL");
        console.log("To:", recipientEmails);
        console.log("Subject:", subject);
        console.log("Payload:", { clientName, fileCount, totalSize });

        // no failure simulation for demo stability
        }
}

export const emailService = new EmailService();