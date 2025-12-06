import AWS from "aws-sdk";

// Configure AWS SES
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // e.g., "us-east-1"
});

const ses = new AWS.SES();

export async function sendEmail(to: string, subject: string, body: string) {
  const params = {
    Source: "noreply@yourdomain.com", // Replace with the verified email
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body,
        },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log("Email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}