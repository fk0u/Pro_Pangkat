import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { unlink } from "fs/promises"
import { join } from "path"

export async function DELETE(req: NextRequest, { params }: { params: { id: string; documentId: string } }) {
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
      return NextResponse.json({ message: "Documents cannot be deleted in current proposal status" }, { status: 400 })
    }

    // Find the document
    const document = await prisma.proposalDocument.findFirst({
      where: {
        id: params.documentId,
        proposalId: params.id,
      },
    })

    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), document.fileUrl)
      await unlink(filepath)
    } catch (error) {
      console.error("Error deleting file:", error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.proposalDocument.delete({
      where: { id: params.documentId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE_DOCUMENT",
        details: {
          proposalId: params.id,
          documentId: params.documentId,
          fileName: document.fileName,
        },
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
