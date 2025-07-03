import { NextRequest } from "next/server"
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

interface AdvancedSearchFilters {
  search?: string
  status?: StatusProposal[]
  unitKerja?: string[]
  jabatan?: string[]
  golongan?: string[]
  dateRange?: {
    start: string
    end: string
    field: "createdAt" | "updatedAt" | "submittedAt"
  }
  documentStatus?: StatusDokumen[]
  priority?: "urgent" | "normal" | "low"
  hasUnverifiedDocs?: boolean
  completionRate?: {
    min: number
    max: number
  }
  processingTime?: {
    min: number // days
    max: number // days
  }
  sortBy?: "createdAt" | "updatedAt" | "priority" | "completionRate" | "processingTime"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}

interface SearchResult {
  proposals: Array<{
    id: string
    periode: string
    status: string
    priority: "urgent" | "normal" | "low"
    pegawai: {
      id: string
      name: string
      nip: string
      unitKerja: string
      jabatan: string
      golongan: string
    }
    documents: {
      total: number
      verified: number
      pending: number
      rejected: number
    }
    timeline: {
      created: string
      lastUpdate: string
      processingDays: number
      estimatedCompletion: string | null
    }
    flags: {
      isUrgent: boolean
      hasUnverifiedDocs: boolean
      isOverdue: boolean
      needsAttention: boolean
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalProposals: number
    urgentCount: number
    processingCount: number
    completedCount: number
    avgProcessingTime: number
    completionRate: number
  }
  filters: {
    availableUnits: string[]
    availableJabatan: string[]
    availableGolongan: string[]
    statusOptions: Array<{ value: string; label: string; count: number }>
  }
}

export const POST = async (req: NextRequest) => {
  try {
    // TODO: Add proper authentication
    // Hanya operator yang bisa mengakses endpoint ini
    // if (user.role !== "OPERATOR") {
    //   return createErrorResponse("Access denied", 403)
    // }

    // Get operator's wilayah - temporary hardcoded
    const operatorData = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
      select: { wilayah: true, name: true },
    })

    if (!operatorData?.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    const filters: AdvancedSearchFilters = await req.json()
    const {
      search = "",
      status = [],
      unitKerja = [],
      jabatan = [],
      golongan = [],
      dateRange,
      documentStatus = [],
      priority,
      hasUnverifiedDocs,
      completionRate,
      processingTime,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20
    } = filters

    // Build base where clause
    const whereClause: Record<string, unknown> = {
      pegawai: {
        wilayah: operatorData.wilayah
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          pegawai: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          pegawai: {
            nip: { contains: search }
          }
        },
        {
          pegawai: {
            unitKerja: { contains: search, mode: "insensitive" }
          }
        },
        {
          periode: { contains: search, mode: "insensitive" }
        }
      ]
    }

    // Add status filter
    if (status.length > 0) {
      whereClause.status = { in: status }
    }

    // Add unit kerja filter
    if (unitKerja.length > 0) {
      whereClause.pegawai.unitKerja = { in: unitKerja }
    }

    // Add jabatan filter
    if (jabatan.length > 0) {
      whereClause.pegawai.jabatan = { in: jabatan }
    }

    // Add golongan filter
    if (golongan.length > 0) {
      whereClause.pegawai.golongan = { in: golongan }
    }

    // Add date range filter
    if (dateRange) {
      const dateField = dateRange.field || "createdAt"
      whereClause[dateField] = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end)
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Fetch proposals with all related data
    const [proposals, totalCount] = await Promise.all([
      prisma.promotionProposal.findMany({
        where: whereClause,
        include: {
          pegawai: {
            select: {
              id: true,
              name: true,
              nip: true,
              unitKerja: true,
              jabatan: true,
              golongan: true
            }
          },
          documents: {
            include: {
              documentRequirement: {
                select: { name: true, isRequired: true }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: offset,
        take: limit
      }),
      prisma.promotionProposal.count({ where: whereClause })
    ])

    // Process proposals and apply additional filters
    let processedProposals = proposals.map(proposal => {
      const totalDocs = proposal.documents.length
      const verifiedDocs = proposal.documents.filter(d => d.status === StatusDokumen.DISETUJUI).length
      const pendingDocs = proposal.documents.filter(d => d.status === StatusDokumen.MENUNGGU_VERIFIKASI).length
      const rejectedDocs = proposal.documents.filter(d => 
        [StatusDokumen.DITOLAK, StatusDokumen.PERLU_PERBAIKAN].includes(d.status)
      ).length

      const processingDays = Math.floor(
        (new Date().getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )

      const completionPercentage = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0

      // Determine priority based on various factors
      const isUrgent = processingDays > 7 || 
                      (pendingDocs > 0 && processingDays > 3) ||
                      proposal.status === StatusProposal.DIAJUKAN && processingDays > 5

      const calculatedPriority: "urgent" | "normal" | "low" = 
        isUrgent ? "urgent" : 
        processingDays > 3 ? "normal" : "low"

      // Estimate completion time
      let estimatedCompletion: string | null = null
      if (proposal.status === StatusProposal.DIPROSES_OPERATOR) {
        const avgProcessingTime = 10 // days, could be calculated dynamically
        const estimatedDate = new Date(proposal.updatedAt.getTime() + avgProcessingTime * 24 * 60 * 60 * 1000)
        estimatedCompletion = estimatedDate.toISOString()
      }

      return {
        id: proposal.id,
        periode: proposal.periode,
        status: proposal.status,
        priority: calculatedPriority,
        pegawai: proposal.pegawai,
        documents: {
          total: totalDocs,
          verified: verifiedDocs,
          pending: pendingDocs,
          rejected: rejectedDocs
        },
        timeline: {
          created: proposal.createdAt.toISOString(),
          lastUpdate: proposal.updatedAt.toISOString(),
          processingDays,
          estimatedCompletion
        },
        flags: {
          isUrgent,
          hasUnverifiedDocs: pendingDocs > 0,
          isOverdue: processingDays > 14,
          needsAttention: isUrgent || pendingDocs > 3 || rejectedDocs > 0
        },
        _completionRate: completionPercentage,
        _processingTime: processingDays
      }
    })

    // Apply additional filters that require calculated data
    if (priority) {
      processedProposals = processedProposals.filter(p => p.priority === priority)
    }

    if (hasUnverifiedDocs !== undefined) {
      processedProposals = processedProposals.filter(p => 
        hasUnverifiedDocs ? p.flags.hasUnverifiedDocs : !p.flags.hasUnverifiedDocs
      )
    }

    if (completionRate) {
      processedProposals = processedProposals.filter(p => 
        p._completionRate >= completionRate.min && p._completionRate <= completionRate.max
      )
    }

    if (processingTime) {
      processedProposals = processedProposals.filter(p => 
        p._processingTime >= processingTime.min && p._processingTime <= processingTime.max
      )
    }

    // Apply document status filter
    if (documentStatus.length > 0) {
      const filteredIds = new Set()
      for (const proposal of proposals) {
        const hasMatchingDocStatus = proposal.documents.some(doc => 
          documentStatus.includes(doc.status)
        )
        if (hasMatchingDocStatus) {
          filteredIds.add(proposal.id)
        }
      }
      processedProposals = processedProposals.filter(p => filteredIds.has(p.id))
    }

    // Remove internal calculation fields
    const finalProposals = processedProposals.map(proposal => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _completionRate, _processingTime, ...rest } = proposal
      return rest
    })

    // Calculate summary statistics
    const urgentCount = finalProposals.filter(p => p.priority === "urgent").length
    const processingCount = finalProposals.filter(p => p.status === StatusProposal.DIPROSES_OPERATOR).length
    const completedCount = finalProposals.filter(p => 
      [StatusProposal.SELESAI, StatusProposal.DISETUJUI_OPERATOR].includes(p.status as StatusProposal)
    ).length

    const avgProcessingTime = finalProposals.length > 0
      ? Math.round(finalProposals.reduce((sum, p) => sum + p.timeline.processingDays, 0) / finalProposals.length)
      : 0

    const overallCompletionRate = finalProposals.length > 0
      ? Math.round((completedCount / finalProposals.length) * 100)
      : 0

    // Get filter options for frontend
    const [availableUnits, availableJabatan, availableGolongan, statusCounts] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "PEGAWAI",
          wilayah: operatorData.wilayah,
          unitKerja: { not: null }
        },
        select: { unitKerja: true },
        distinct: ["unitKerja"]
      }).then(units => units.map(u => u.unitKerja).filter(Boolean)),

      prisma.user.findMany({
        where: {
          role: "PEGAWAI",
          wilayah: operatorData.wilayah,
          jabatan: { not: null }
        },
        select: { jabatan: true },
        distinct: ["jabatan"]
      }).then(jabatan => jabatan.map(j => j.jabatan).filter(Boolean)),

      prisma.user.findMany({
        where: {
          role: "PEGAWAI",
          wilayah: operatorData.wilayah,
          golongan: { not: null }
        },
        select: { golongan: true },
        distinct: ["golongan"]
      }).then(golongan => golongan.map(g => g.golongan).filter(Boolean)),

      prisma.promotionProposal.groupBy({
        by: ["status"],
        where: {
          pegawai: { wilayah: operatorData.wilayah }
        },
        _count: true
      })
    ])

    const result: SearchResult = {
      proposals: finalProposals,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalProposals: finalProposals.length,
        urgentCount,
        processingCount,
        completedCount,
        avgProcessingTime,
        completionRate: overallCompletionRate
      },
      filters: {
        availableUnits,
        availableJabatan,
        availableGolongan,
        statusOptions: statusCounts.map(item => ({
          value: item.status,
          label: getStatusLabel(item.status),
          count: item._count
        }))
      }
    }

    return createSuccessResponse(result)

  } catch (error: unknown) {
    console.error("Error in advanced search:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to perform advanced search"
    return createErrorResponse(errorMessage)
  }
}

// Helper function to get status label
function getStatusLabel(status: StatusProposal): string {
  const labels: Record<StatusProposal, string> = {
    [StatusProposal.DRAFT]: "Draft",
    [StatusProposal.DIAJUKAN]: "Diajukan",
    [StatusProposal.DIPROSES_OPERATOR]: "Diproses Operator",
    [StatusProposal.DIKEMBALIKAN_OPERATOR]: "Dikembalikan Operator",
    [StatusProposal.DISETUJUI_OPERATOR]: "Disetujui Operator",
    [StatusProposal.DIPROSES_ADMIN]: "Diproses Admin",
    [StatusProposal.DIKEMBALIKAN_ADMIN]: "Dikembalikan Admin",
    [StatusProposal.SELESAI]: "Selesai",
    [StatusProposal.DITOLAK]: "Ditolak",
    [StatusProposal.DITARIK]: "Ditarik",
    [StatusProposal.MENUNGGU_VERIFIKASI_DINAS]: "Menunggu Verifikasi Dinas",
    [StatusProposal.MENUNGGU_VERIFIKASI_SEKOLAH]: "Menunggu Verifikasi Sekolah",
    [StatusProposal.PERLU_PERBAIKAN_DARI_DINAS]: "Perlu Perbaikan dari Dinas",
    [StatusProposal.PERLU_PERBAIKAN_DARI_SEKOLAH]: "Perlu Perbaikan dari Sekolah",
    [StatusProposal.DITOLAK_SEKOLAH]: "Ditolak Sekolah",
    [StatusProposal.DITOLAK_DINAS]: "Ditolak Dinas",
    [StatusProposal.DITOLAK_ADMIN]: "Ditolak Admin",
  }
  return labels[status] || status
}

// Saved searches endpoint
export const GET = async () => {
  try {
    // TODO: Add proper authentication
    // if (user.role !== "OPERATOR") {
    //   return createErrorResponse("Access denied", 403)
    // }

    // Get first operator for now
    const user = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
      select: { id: true }
    })

    if (!user) {
      return createErrorResponse("No operator found", 404)
    }

    // Get saved search filters for this operator
    const savedSearches = await prisma.userPreference.findMany({
      where: {
        userId: user.id,
        key: { startsWith: "saved_search_" }
      },
      select: {
        id: true,
        key: true,
        value: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" }
    })

    const formattedSearches = savedSearches.map(search => ({
      id: search.id,
      name: search.key.replace("saved_search_", ""),
      filters: typeof search.value === "string" ? JSON.parse(search.value) : search.value,
      createdAt: search.createdAt,
      lastUsed: search.updatedAt
    }))

    return createSuccessResponse({
      savedSearches: formattedSearches,
      count: formattedSearches.length
    })

  } catch (error: unknown) {
    console.error("Error fetching saved searches:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch saved searches"
    return createErrorResponse(errorMessage)
  }
}

// Save search filters
export const PUT = async (req: NextRequest) => {
  try {
    // TODO: Add proper authentication
    // if (user.role !== "OPERATOR") {
    //   return createErrorResponse("Access denied", 403)
    // }

    // Get first operator for now
    const user = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
      select: { id: true }
    })

    if (!user) {
      return createErrorResponse("No operator found", 404)
    }

    const { name, filters } = await req.json()

    if (!name || !filters) {
      return createErrorResponse("Name and filters are required", 400)
    }

    // Save or update search filters
    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: user.id,
          key: `saved_search_${name}`
        }
      },
      create: {
        userId: user.id,
        key: `saved_search_${name}`,
        value: JSON.stringify(filters)
      },
      update: {
        value: JSON.stringify(filters),
        updatedAt: new Date()
      }
    })

    return createSuccessResponse({
      message: "Search filters saved successfully",
      name,
      savedAt: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error("Error saving search filters:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save search filters"
    return createErrorResponse(errorMessage)
  }
}
