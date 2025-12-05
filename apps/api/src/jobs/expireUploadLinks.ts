import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../utils/sendEmail";

// Daily job to deactivate expired links and notify clients
cron.schedule("0 0 * * *", async () => {
  console.log("Cron job executed at:", new Date());
  console.log("Running daily cleanup for expired upload links...");

  try {
    // 1️⃣ Deactivate expired links
    const expiredLinks = await prisma.uploadLink.findMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
    });

    const updatePromises = expiredLinks.map((link) =>
      prisma.uploadLink.update({
        where: { id: link.id },
        data: { isActive: false },
      })
    );

    await Promise.all(updatePromises);
    console.log(`Deactivated ${expiredLinks.length} expired links.`);

    // 2️⃣ Notify clients about links expiring in 24 hours
    const expiringSoonLinks = await prisma.uploadLink.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
          lt: new Date(Date.now() + 24 * 60 * 60 * 1000), // next 24 hours
        },
        isActive: true,
      },
      include: { client: true },
    });

    const emailPromises = expiringSoonLinks
      .map((link) => {
        if (!link.client.email) return null;

        const clientName = `${link.client.firstName} ${link.client.lastName}`;
        const linkUrl = `${process.env.FRONTEND_URL}/upload/${link.token}`;
        const hoursLeft = Math.round(
          (link.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        const formattedExpiry = new Date(link.expiresAt).toLocaleString("en-US", {
          dateStyle: "short",
          timeStyle: "medium",
        });

        return sendEmail(
          link.client.email,
          "Your Fox Finance upload link is about to expire",
          `Hello ${clientName},\n\n` +
          `This is a reminder from Fox Finance that your secure upload link will expire soon.\n\n` +
          `📅 Expiration Time: ${formattedExpiry}\n` +
          `⏳ Time Remaining: ~${hoursLeft} hour(s)\n` +
          `🔗 Upload Link: ${linkUrl}\n\n` +
          `If you still need to submit your documents, please do so before the link expires.\n\n` +
          `Thank you,\nFox Finance Team`
        );
      })
      .filter(Boolean); // remove nulls if client.email is missing

    await Promise.all(emailPromises);
    console.log(`Sent ${emailPromises.length} expiration notifications.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
});
