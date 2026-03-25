import { prisma } from "@fox-finance/prisma";

// Define the shape of the data we expect when the upload is called.
type HandleUploadCompletedInput = {
    uploadId: string;
}

export class UploadNotificationService {
    async handleUploadCompleted(
        input: HandleUploadCompletedInput): Promise<void> {
            // TODO: Implement logic to handle the upload completion. Goal is to fetch the completed upload and the related data the notifcation system will need later
            // TODO: At minimum, we need to load the upload itself, the upload link, and the client. We may also want the documentRequestId and timestamps
            // read upload from input.uploadId
            const uploadId = input.uploadId;
            // query the upload table
            // find the upload with the id = uploadId, and include the related uploadLink and client
            // store the result in  a variable called upload
            const upload = await prisma.upload.findUnique({
                where: { id: uploadId },
                include: {
                    uploadLink: {
                        include: {
                            client: true,
                        },
                    },
                },
            }); 
            // if upload does not exist, log that notification handling was skipped because upload was not found, and return
            if (!upload) {
                console.log(`Upload with id ${uploadId} not found. Skipping notification handling.`);
                return;
            }

            const client = upload.uploadLink.client;
            const clientId = client.id;
            const clientName = `${client.firstName} ${client.lastName}`;    
            const fileName = upload.fileName;
            const fileSize = upload.fileSize;

            // log that upload notification context was loaded, include uploadId, clientId, clientName, fileName, and fileSize in the log
            console.log(`Upload notification context loaded for uploadId ${uploadId}: clientId=${clientId}, clientName=${clientName}, fileName=${fileName}, fileSize=${fileSize}`);

            // Create a variable date representing the start of the rate limit window. We want a timestamp for 1 minute ago
            const oneMinuteAgo = new Date();
            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

            // Query the uploadNotificationLog for a recent notification for this client. We want to find the most recent notification where clientId matches this client and sentAt is within the last minute.
            const recentNotification = await prisma.uploadNotificationLog.findFirst({
                where: {
                    clientId: clientId,
                    sentAt: {
                        gte: oneMinuteAgo
                    }
                },
                orderBy: {
                    sentAt: 'desc'
                }
            });

            // If we find a recent notification, log that notification was skipped due to rate limiting, and return
            if (recentNotification) {
                console.log(`Upload notification for clientId ${clientId} skipped due to rate limiting. Most recent notification sent at ${recentNotification.sentAt}`);
                return;
            }      
            
            // If we do not find a recent notification, log that notification will be sent
            console.log(`No recent notification found for clientId ${clientId} - notification will be sent.`);

            // read uploadLinkId from upload.uploadLink.id
        const uploadLinkId = upload.uploadLinkId;

        // find all uploads where uploadLinkId matches this upload and updatedAt is within the last minute. order by uploadedAt ascending. Store result in recentUploads
        const recentUploads = await prisma.upload.findMany({
            where: {
                uploadLinkId: uploadLinkId,
                uploadedAt: {
                    gte: oneMinuteAgo
                }
            },
            orderBy: {
                uploadedAt: 'asc'
            }
        });

        // fileCount = number of uploads in recentUploads
        const fileCount = recentUploads.length;

        // totalSize = sum of fileSize for all uploads in recentUploads. 
        // Start with total = 0, and for each upload in recentUploads, add upload.fileSize to total, then return total.
        // Convert fileSize to a number before adding
        const totalSize = recentUploads.reduce((total, upload) => total + Number(upload.fileSize), 0);

        // Log: Number of uploads found, filecount, totalSize, and clientId or clientName
        console.log(`Found ${fileCount} uploads in the last minute for clientId ${clientId} (${clientName}). Total size: ${totalSize} bytes.`);

        // Query User table to find all users where role = admin and uploadNotificationEnabled = true. Store result in admins
        const admins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
                uploadNotificationEnabled: true
            }
        });

        // If admins is empty, log that no admins are available for notifications and return
        if (admins.length === 0) {
            console.log(`No admins with upload notifications enabled found. Skipping notification sending.`);
            return;
        }  

        // Create a new array called adminEmails. For each admin in admins: take admin.email and add it to adminEmails
        const adminEmails = admins.map(admin => admin.email);

        // For each upload in recentUploads, create a object with: fileName, fileSize (converted to number), and store result in fileList.
        const fileList = recentUploads.map(upload => ({
            fileName: upload.fileName,
            fileSize: Number(upload.fileSize)
        }));

        // read Frontend_URL from environment. Build a URL string: Frontend_URL + '/admin/upload-links/' + uploadLinkId. Store it in a variable like: viewUploadsUrl
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const viewUploadsUrl = `${frontendUrl}/admin/upload-links/${uploadLinkId}`;

        // Create object emailPayload: clientName, fileList, fileCount, totalSize, and viewUploadsUrl
        const emailPayload = {
            clientName,
            fileList,
            fileCount,
            totalSize,
            viewUploadsUrl
        };

        // Log the email payload
        console.log('Prepared upload notification email payload:', emailPayload)
    }
}

export const uploadNotificationService = new UploadNotificationService();