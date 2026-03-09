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
         }
    }

export const uploadNotificationService = new UploadNotificationService();