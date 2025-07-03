import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's activity logs
    const activities = await prisma.activityLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to last 20 activities
    })

    // Get user's proposals with their status progression
    const proposals = await prisma.promotionProposal.findMany({
      where: { pegawaiId: session.user.id },
      include: {
        documents: {
          include: {
            documentRequirement: true,
          },
        },
        operator: {
          select: {
            name: true,
            wilayah: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Create timeline data combining activities and proposals
    const timelineData = [
      // Map proposals to timeline entries
      ...proposals.map((proposal) => ({
        id: `proposal-${proposal.id}`,
        title: `Usulan Kenaikan Pangkat - ${proposal.periode}`,
        description: `Status: ${proposal.status.replace(/_/g, " ")}`,
        date: proposal.createdAt,
        type: "proposal",
        status: proposal.status,
        notes: proposal.notes,
        operator: proposal.operator?.name,
        wilayah: proposal.operator?.wilayah,
        documentCount: proposal.documents.length,
      })),
      // Map activities to timeline entries
      ...activities.map((activity) => ({
        id: `activity-${activity.id}`,
        title: activity.action,
        description: typeof activity.details === "object" 
          ? JSON.stringify(activity.details) 
          : activity.details?.toString() || "",
        date: activity.createdAt,
        type: "activity",
        status: "completed",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      data: {
        timeline: timelineData,
        summary: {
          totalActivities: activities.length,
          totalProposals: proposals.length,
          lastActivity: activities[0]?.createdAt || null,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching timeline:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
