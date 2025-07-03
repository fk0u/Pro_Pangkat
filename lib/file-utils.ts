import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export interface FileUploadResult {
  success: boolean
  filePath?: string
  error?: string
}

export async function saveUploadedFile(file: File, directory: string, filename?: string): Promise<FileUploadResult> {
  try {
    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads", directory)
    await mkdir(uploadDir, { recursive: true })

    // Generate filename if not provided
    const finalFilename = filename || `${Date.now()}_${file.name}`
    const filepath = join(uploadDir, finalFilename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    return {
      success: true,
      filePath: `/uploads/${directory}/${finalFilename}`,
    }
  } catch (error) {
    console.error("Error saving file:", error)
    return {
      success: false,
      error: "Failed to save file",
    }
  }
}

export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = join(process.cwd(), filePath)
    if (existsSync(fullPath)) {
      await unlink(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error("Error deleting file:", error)
    return false
  }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes
}

export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
