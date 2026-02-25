import { fileTypeFromBuffer } from "file-type";
import { ALLOWED_MIME_TYPES } from "../routes/upload/index";

/**
 * Flatten all allowed MIME types into a single set for quick lookup
 */
export const ALLOWED_MIME_TYPES_FLAT = new Set(ALLOWED_MIME_TYPES);

/**
 * Extension to MIME type mapping for validation
 */
export const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".bmp": ["image/bmp"],
  ".zip": ["application/zip"],
};

/**
 * Dangerous file extensions that should always be rejected
 * These are known executable formats that pose security risks
 */
export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".com",
  ".msi",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".app",
  ".dmg",
  ".pkg",
  ".deb",
  ".rpm",
  ".dll",
  ".so",
  ".dylib",
  ".ps1",
  ".psm1",
  ".psd1",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
];

/**
 * Dangerous MIME types that should always be rejected
 */
export const DANGEROUS_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-shellscript",
  "application/x-bat",
  "application/x-java-applet",
  "application/x-executable",
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: string;
}

/**
 * Extract file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * Validate file extension
 */
function validateExtension(fileName: string): {
  isValid: boolean;
  error?: string;
} {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return { isValid: false, error: "File has no extension" };
  }

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File type ${extension} is not allowed for security reasons (executable file)`,
    };
  }

  // Check if extension is in our allowed list
  if (!Object.keys(EXTENSION_MIME_MAP).includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not in the allowed list`,
    };
  }

  return { isValid: true };
}

/**
 * Validate MIME type
 */
function validateMimeType(mimeType: string): {
  isValid: boolean;
  error?: string;
} {
  if (!mimeType) {
    return { isValid: false, error: "MIME type is required" };
  }

  // Check for dangerous MIME types
  if (DANGEROUS_MIME_TYPES.includes(mimeType as any)) {
    return {
      isValid: false,
      error: `MIME type ${mimeType} is not allowed (executable file)`,
    };
  }

  // Check if MIME type is in allowed list
  if (!Array.from(ALLOWED_MIME_TYPES_FLAT).includes(mimeType as any)) {
    return {
      isValid: false,
      error: `MIME type ${mimeType} is not in the allowed list`,
    };
  }

  return { isValid: true };
}

/**
 * Validate magic bytes (file signature)
 * This checks the actual file content, not just the extension or MIME type
 */
async function validateMagicBytes(
  buffer: Buffer,
  fileName: string,
  declaredMimeType: string,
): Promise<FileValidationResult> {
  try {
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected) {
      return {
        isValid: false,
        error: "Could not determine file type from file content (magic bytes)",
      };
    }

    const { mime: detectedMimeType } = detected;

    // Check if detected MIME type is allowed
    if (
      !Array.from(ALLOWED_MIME_TYPES_FLAT).includes(detectedMimeType as any)
    ) {
      return {
        isValid: false,
        error: `File content indicates type ${detectedMimeType}, which is not allowed`,
        detectedMimeType,
      };
    }

    // Check if declared MIME type matches detected MIME type
    const declaredMimes = EXTENSION_MIME_MAP[getFileExtension(fileName)] || [
      declaredMimeType,
    ];

    if (!declaredMimes.includes(detectedMimeType as any)) {
      return {
        isValid: false,
        error: `MIME type mismatch: declared ${declaredMimeType} but file content indicates ${detectedMimeType}. Please verify your file is correct.`,
        detectedMimeType,
      };
    }

    return { isValid: true, detectedMimeType };
  } catch (error) {
    return {
      isValid: false,
      error: `Error validating file signature: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Comprehensive file validation
 * Performs extension, MIME type, and magic byte validation
 *
 * @param buffer - File buffer/content
 * @param fileName - Original filename
 * @param declaredMimeType - MIME type declared by client
 * @returns Validation result with error message if invalid
 */
export async function validateFile(
  buffer: Buffer,
  fileName: string,
  declaredMimeType: string,
): Promise<FileValidationResult> {
  // Step 1: Validate file extension
  const extensionValidation = validateExtension(fileName);
  if (!extensionValidation.isValid) {
    return { isValid: false, error: extensionValidation.error };
  }

  // Step 2: Validate declared MIME type
  const mimeTypeValidation = validateMimeType(declaredMimeType);
  if (!mimeTypeValidation.isValid) {
    return { isValid: false, error: mimeTypeValidation.error };
  }

  // Step 3: Validate magic bytes (file signature)
  const magicBytesValidation = await validateMagicBytes(
    buffer,
    fileName,
    declaredMimeType,
  );
  if (!magicBytesValidation.isValid) {
    return magicBytesValidation;
  }

  return {
    isValid: true,
    detectedMimeType: magicBytesValidation.detectedMimeType,
  };
}

/**
 * Quick validation without magic byte check (for presigned URL phase)
 * Use this when you only have filename and MIME type, not the file content
 *
 * @param fileName - Original filename
 * @param mimeType - MIME type declared by client
 * @returns Validation result with error message if invalid
 */
export function validateFileMetadata(
  fileName: string,
  mimeType: string,
): FileValidationResult {
  // Validate extension
  const extensionValidation = validateExtension(fileName);
  if (!extensionValidation.isValid) {
    return { isValid: false, error: extensionValidation.error };
  }

  // Validate MIME type
  const mimeTypeValidation = validateMimeType(mimeType);
  if (!mimeTypeValidation.isValid) {
    return { isValid: false, error: mimeTypeValidation.error };
  }

  return { isValid: true };
}

/**
 * Get human-readable list of allowed file types
 */
export function getAllowedFileTypesDescription(): string {
  const types = [
    "PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX)",
    "PNG, JPG/JPEG, GIF, WebP, BMP",
    "ZIP archives",
  ];
  return types.join("; ");
}
