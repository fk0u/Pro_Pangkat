import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { z } from "zod"
import { logDocumentActivity } from "@/lib/activity-logger"

const uploadDocumentSchema = z.object({
  documentRequirementId: z.string().min(1, "Document requirement ID is required"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if proposal exists and belongs to user
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id,
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    // In development mode, be more lenient with status checks
    if (process.env.NODE_ENV === 'production') {
      // Check if proposal can be updated
      if (proposal.status !== "DRAFT" && 
          proposal.status !== "DIKEMBALIKAN_OPERATOR" && 
          proposal.status !== "PERLU_PERBAIKAN_DARI_SEKOLAH" && 
          proposal.status !== "PERLU_PERBAIKAN_DARI_DINAS") {
        return NextResponse.json({ message: "Documents cannot be uploaded in current proposal status" }, { status: 400 })
      }
    }

    const formData = await req.formData()
    console.log("Document upload formData keys:", Array.from(formData.keys()));
    
    const file = formData.get("file") as File
    const documentRequirementId = formData.get("documentRequirementId") as string

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type);
    console.log("Document requirement ID:", documentRequirementId);

    const parsed = uploadDocumentSchema.safeParse({ documentRequirementId })
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed. Only PDF, JPG, JPEG, PNG are allowed." },
        { status: 400 },
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json({ message: "File size too large. Maximum 10MB allowed." }, { status: 400 })
    }

    // Get document requirement info for logging
    const documentRequirement = await prisma.documentRequirement.findUnique({
      where: { id: documentRequirementId },
      select: { name: true, code: true }
    })

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads", "documents")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${params.id}_${documentRequirementId}_${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)
    console.log("File saved to:", filepath);

    // Check if document already exists for this requirement
    const existingDocument = await prisma.proposalDocument.findUnique({
      where: {
        proposalId_documentRequirementId: {
          proposalId: params.id,
          documentRequirementId: documentRequirementId,
        },
      },
    })

    let document
    if (existingDocument) {
      // Update existing document
      document = await prisma.proposalDocument.update({
        where: { id: existingDocument.id },
        data: {
          fileUrl: `/uploads/documents/${filename}`,
          fileName: file.name,
          fileSize: file.size,
          status: "MENUNGGU_VERIFIKASI",
          notes: null,
        },
        include: {
          documentRequirement: true,
        },
      })
      console.log("Updated existing document:", document.id);
    } else {
      // Create new document
      document = await prisma.proposalDocument.create({
        data: {
          proposalId: params.id,
          documentRequirementId: documentRequirementId,
          fileUrl: `/uploads/documents/${filename}`,
          fileName: file.name,
          fileSize: file.size,
          status: "MENUNGGU_VERIFIKASI",
        },
        include: {
          documentRequirement: true,
        },
      })
      console.log("Created new document:", document.id);
    }

    // Log activity using our activity logger
    await logDocumentActivity('UPLOAD', document.id, session, {
      proposalId: params.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      documentName: documentRequirement?.name || 'Dokumen',
      documentCode: documentRequirement?.code || '',
      pegawaiName: proposal.pegawai.name,
      pegawaiNip: proposal.pegawai.nip,
      action: existingDocument ? 'UPDATED' : 'CREATED'
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error uploading document:", error)
    
    // Provide more detailed error message
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      detail: "Failed to upload document. Please check the file and try again."
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if proposal exists and belongs to user
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id,
      },
    })

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    const documents = await prisma.proposalDocument.findMany({
      where: { proposalId: params.id },
      include: {
        documentRequirement: true,
      },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
