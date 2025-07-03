import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { z } from "zod"

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
    })

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    // Check if proposal can be updated
    if (proposal.status !== "DRAFT" && proposal.status !== "DIKEMBALIKAN_OPERATOR") {
      return NextResponse.json({ message: "Documents cannot be uploaded in current proposal status" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const documentRequirementId = formData.get("documentRequirementId") as string

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    const parsed = uploadDocumentSchema.safeParse({ documentRequirementId })
    if (!parsed.success) {
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
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPLOAD_DOCUMENT",
        details: {
          proposalId: params.id,
          documentId: document.id,
          fileName: file.name,
        },
        userId: session.user.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
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
