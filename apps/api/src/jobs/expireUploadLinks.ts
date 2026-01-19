import cron from "node-cron";
import { prisma } from "@fox-finance/prisma";

// Daily job to deactivate expired links and notify clients
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Cron job executed at:", new Date());
    console.log("Running daily cleanup for expired upload links...");

    try {
      // 1️⃣ Deactivate expired links in bulk
      const { count: expiredCount } = await prisma.uploadLink.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true,
        },
        data: { isActive: false },
      });
      console.log(`Deactivated ${expiredCount} expired links.`);

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
          const formattedExpiry = new Date(link.expiresAt).toLocaleString(
            "en-US",
            {
              dateStyle: "short",
              timeStyle: "medium",
            }
          );

          console.log(
            `[CRON][EXPIRING SOON] Upload link for ${link.client.email} expires at ${formattedExpiry}`
          );
          return null;
        })
        .filter(Boolean); // remove nulls if client.email is missing

      await Promise.all(emailPromises);
      console.log(`Sent ${emailPromises.length} expiration notifications.`);
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  },
  { name: "daily-link-cleanup", timezone: "America/Chicago" }
);
