# REST API - Fox Finance Upload System

## Architecture Overview

The API supports two types of users:

- **Admins**: Authenticated via Firebase, manage clients and upload links
- **Upload Users**: Authenticated via secure tokens, upload documents to encrypted S3

## Project Structure

```
src/
├── index.ts                    # Server entry point
├── middleware/
│   ├── auth.ts                # Firebase authentication for admins
│   ├── uploadAuth.ts          # Token authentication for uploads
│   ├── validation.ts          # Zod schema validation
│   └── errorHandler.ts        # Global error handling
├── routes/
│   ├── index.ts               # Route aggregator
│   ├── admin/                 # Admin-only routes
│   │   ├── index.ts
│   │   ├── clients.ts        # Client CRUD (EXAMPLE PATTERN)
│   │   └── upload-links.ts   # Upload link management
│   └── upload/                # Public upload routes (token auth)
│       └── index.ts          # Upload verification & S3 URLs
├── schemas/                   # Zod validation schemas
│   ├── client.schema.ts
│   └── uploadLink.schema.ts
├── services/
│   └── s3.service.ts         # S3 operations & pre-signed URLs
└── lib/
    ├── prisma.ts             # Prisma client
    ├── s3.ts                 # S3 client
    └── firebase.ts           # Firebase admin
```

## API Endpoints

### Admin Routes (Require Firebase Auth)

All admin routes require a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

#### Clients

- `GET /api/admin/clients` - List all clients
- `GET /api/admin/clients/:id` - Get client details
- `POST /api/admin/clients` - Create a new client
- `PUT /api/admin/clients/:id` - Update a client
- `DELETE /api/admin/clients/:id` - Delete a client

#### Upload Links

- `GET /api/admin/upload-links` - List all upload links
- `GET /api/admin/upload-links/:id` - Get upload link details
- `POST /api/admin/upload-links` - Create a new upload link (rate limited per admin user)
- `PATCH /api/admin/upload-links/:id/deactivate` - Deactivate a link
- `PATCH /api/admin/upload-links/:id/activate` - Reactivate a link
- `DELETE /api/admin/upload-links/:id` - Delete a link

### Upload Routes (Require Token Auth)

Upload routes require a token either in the `Authorization` header or as a query parameter:

```
Authorization: Bearer <upload-token>
OR
?token=<upload-token>
```

- `GET /api/upload/verify` - Verify token and get upload requirements
- `POST /api/upload/presigned-url` - Get pre-signed S3 URL for upload
- `POST /api/upload/complete` - Record completed upload metadata

## Example Workflows

### Creating an Upload Link (Admin)

```typescript
POST /api/admin/upload-links
Authorization: Bearer <firebase-token>

{
  "clientId": "clxxx123",
  "expiresAt": "2024-12-31T23:59:59Z",
  "maxUploads": 5,
  "documents": [
    {
      "name": "Driver's License",
      "description": "Front and back",
      "required": true
    },
    {
      "name": "Proof of Income",
      "description": "Pay stubs or tax return",
      "required": true
    }
  ]
}

Response:
{
  "id": "clxxx456",
  "token": "abc123...",
  "uploadUrl": "https://app.fox-finance.net/upload?token=abc123...",
  "client": {...},
  "documents": [...]
}
```

### Uploading a File (Client)

```typescript
// Step 1: Verify token and get requirements
GET /api/upload/verify?token=abc123

Response:
{
  "uploadLink": {
    "id": "clxxx456",
    "expiresAt": "2024-12-31T23:59:59Z",
    "maxUploads": 5
  },
  "client": {...},
  "documents": [...],
  "uploadedCount": 2,
  "remainingUploads": 3
}

// Step 2: Get pre-signed URL for direct S3 upload
POST /api/upload/presigned-url
Authorization: Bearer abc123

{
  "fileName": "drivers-license.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "documentRequestId": "clxxx789"
}

Response:
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "fields": {
    "key": "uploads/client123/link456/1234567890-drivers-license.pdf",
    "Content-Type": "application/pdf",
    ...
  },
  "key": "uploads/..."
}

// Step 3: Upload file directly to S3
POST <uploadUrl>
FormData with fields + file

// Step 4: Confirm upload completion
POST /api/upload/complete
Authorization: Bearer abc123

{
  "key": "uploads/...",
  "fileName": "drivers-license.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "documentRequestId": "clxxx789"
}
```

## Development Patterns

### Adding New Routes

1. **Create route file** in `routes/admin/` or `routes/upload/`
2. **Define Zod schema** in `schemas/`
3. **Implement handler** with proper error handling
4. **Register route** in appropriate index file

Example:

```typescript
// routes/admin/my-resource.ts
import { Router } from "express";
import { prisma } from "@fox-finance/prisma";
import { validate } from "../../middleware/validation";
import { myResourceSchema } from "../../schemas/myResource.schema";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.myResource.findMany();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(myResourceSchema), async (req, res, next) => {
  try {
    const item = await prisma.myResource.create({
      data: req.body,
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Validation with Zod

```typescript
// schemas/myResource.schema.ts
import { z } from "zod";

export const createMyResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    value: z.number().positive(),
  }),
});

export type CreateMyResourceInput = z.infer<
  typeof createMyResourceSchema
>["body"];
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# S3
S3_UPLOADS_BUCKET=dev-fox-finance-uploads
AWS_REGION=us-east-1

# Server
PORT=4000
NODE_ENV=development
TRUST_PROXY_HOPS=1

# Rate limiting
RATE_LIMIT_EXEMPT_IPS=127.0.0.1,::1
RATE_LIMIT_ADMIN_UPLOAD_LINK_CREATE_MAX=10
RATE_LIMIT_ADMIN_UPLOAD_LINK_WINDOW_MS=3600000
RATE_LIMIT_UPLOAD_PRESIGNED_MAX=50
RATE_LIMIT_UPLOAD_PRESIGNED_WINDOW_MS=3600000
RATE_LIMIT_UPLOAD_COMPLETE_MAX=100
RATE_LIMIT_UPLOAD_COMPLETE_WINDOW_MS=3600000
```

## Running Locally

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm generate

# Run migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

## Testing with curl

```bash
# Health check
curl http://localhost:4000/health

# List clients (requires Firebase token)
curl http://localhost:4000/api/admin/clients \
  -H "Authorization: Bearer <firebase-token>"

# Verify upload token
curl "http://localhost:4000/api/upload/verify?token=<upload-token>"
```

## Student Tasks

The following features are scaffolded and ready for implementation:

### Core Features

- 🎓 Client CRUD
- 🎓 Upload link creation
- 🎓 Admin dashboard UI
- 🎓 Upload form UI
- 🎓 Email notifications for upload links
- 🎓 File type/size validation
- 🎓 Upload progress tracking
- 🎓 Document status management

### Advanced Features

- 🎓 Bulk upload link creation
- 🎓 Upload link expiration reminders
- 🎓 File preview/download for admins
- 🎓 Audit logging
- FF-68 rate limiting for admin link creation and upload endpoints
- 🎓 Virus scanning integration

## Security Notes

- S3 buckets are encrypted with KMS
- All uploads blocked from public access
- Pre-signed URLs expire after 1 hour
- Upload tokens can be deactivated
- Max file size: 50MB
- CORS properly configured

## Deployment

The API automatically deploys to AWS ECS Fargate when pushed to main branch. See `.github/workflows/deploy-api.yml` for details.
