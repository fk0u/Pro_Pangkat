import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, Role } from "@prisma/client"
import type { DashboardData, ChartData, RecentActivityItem, UpcomingEvent } from "@/types/dashboard"

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Check for user info
    if (!user) {
      return createErrorResponse("Unauthorized", "Not authenticated", 401)
    }

    // Dashboard data will depend on user role
    const { id, role } = user
    
    // Common stats
    const [
      totalProposals,
      activeTimelines,
      pendingDocuments,
      userDetails
    ] = await Promise.all([
      // Get total number of proposals in the system
      prisma.promotionProposal.count(),
      
      // Get active timelines
      prisma.timeline.findMany({
        where: { 
          isActive: true,
          OR: [
            { wilayahId: null }, // Global timelines
            { wilayahId: user.wilayahId } // User-specific timelines
          ]
        },
        orderBy: [
          { priority: "desc" },
          { startDate: "asc" }
        ],
        take: 5
      }),
      
      // Get documents awaiting verification
      prisma.proposalDocument.count({
        where: {
          status: "MENUNGGU_VERIFIKASI"
        }
      }),
      
      // Get detailed user info
      prisma.user.findUnique({
        where: { id },
        include: {
          unitKerja: true,
          wilayahRelasi: true
        }
      })
    ])
    
    // Base stats for all users
    const generalStats = {
      totalProposals,
      pendingDocuments,
      activeTimelines: activeTimelines.length
    }
    
    // User profile data
    const userProfile = {
      id: userDetails?.id,
      name: userDetails?.name,
      nip: userDetails?.nip,
      role: userDetails?.role,
      unitKerja: userDetails?.unitKerja?.nama,
      wilayah: userDetails?.wilayahRelasi?.nama || userDetails?.wilayah
    }
    
    // Active timelines
    const timelines = activeTimelines.map(timeline => ({
      id: timeline.id,
      title: timeline.title,
      description: timeline.description,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      priority: timeline.priority,
      jabatanType: timeline.jabatanType
    }))

    // Get recent activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10,
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    const recentActivities = activityLogs.map(activity => ({
      id: activity.id,
      action: activity.action,
      details: activity.details as Record<string, unknown>,
      userName: activity.user?.name || "System",
      createdAt: activity.createdAt.toISOString()
    }))
    
    // Get unread notifications
    const notificationEntries = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: id },
          { 
            userId: null,
            userRole: role
          }
        ],
        isRead: false
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    })
    
    const notifications = notificationEntries

    // Initialize dashboard data
    const dashboardData: DashboardData = {
      userInfo: userProfile,
      stats: generalStats,
      recentActivity: recentActivities,
      upcomingEvents: timelines.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        priority: t.priority,
        type: t.jabatanType || 'Semua'
      })),
      chartData: {
        proposals: generateRandomChartData(),
        timelines: []
      }
    }

    // Role-specific data
    if (role === Role.PEGAWAI) {
      // Get proposal stats for this employee
      const [
        userProposalsTotal, 
        userProposalsPending, 
        userProposalsApproved, 
        userProposalsRejected
      ] = await Promise.all([
        prisma.promotionProposal.count({
          where: { pegawaiId: id }
        }),
        prisma.promotionProposal.count({
          where: { 
            pegawaiId: id,
            status: { in: [
              StatusProposal.DIAJUKAN, 
              StatusProposal.DIPROSES_OPERATOR,
              StatusProposal.DIPROSES_ADMIN,
              StatusProposal.MENUNGGU_VERIFIKASI_DINAS,
              StatusProposal.MENUNGGU_VERIFIKASI_SEKOLAH
            ]}
          }
        }),
        prisma.promotionProposal.count({
          where: { 
            pegawaiId: id,
            status: { in: [
              StatusProposal.DISETUJUI_OPERATOR,
              StatusProposal.SELESAI
            ]}
          }
        }),
        prisma.promotionProposal.count({
          where: { 
            pegawaiId: id,
            status: { in: [
              StatusProposal.DITOLAK,
              StatusProposal.DITOLAK_SEKOLAH,
              StatusProposal.DITOLAK_DINAS,
              StatusProposal.DITOLAK_ADMIN,
              StatusProposal.PERLU_PERBAIKAN_DARI_DINAS,
              StatusProposal.PERLU_PERBAIKAN_DARI_SEKOLAH,
              StatusProposal.DIKEMBALIKAN_ADMIN,
              StatusProposal.DIKEMBALIKAN_OPERATOR
            ]}
          }
        })
      ])
      
      // Latest proposal
      const latestProposal = await prisma.promotionProposal.findFirst({
        where: { pegawaiId: id },
        orderBy: { createdAt: "desc" },
        include: { documents: true }
      })
      
      dashboardData.employeeStats = {
        totalProposals: userProposalsTotal,
        pendingProposals: userProposalsPending,
        approvedProposals: userProposalsApproved,
        rejectedProposals: userProposalsRejected,
        latestProposal: latestProposal ? {
          id: latestProposal.id,
          periode: latestProposal.periode,
          status: latestProposal.status,
          createdAt: latestProposal.createdAt.toISOString(),
          documentCount: latestProposal.documents.length
        } : undefined
      }
    } 
    else if (role === Role.OPERATOR || role === Role.OPERATOR_SEKOLAH) {
      // Get stats for operators in their region
      const [
        regionProposalsTotal,
        regionProposalsPending,
        regionProposalsApproved,
        regionProposalsRejected,
        employeesInRegion,
        unitKerjaInRegion
      ] = await Promise.all([
        // Total proposals in region
        prisma.promotionProposal.count({
          where: {
            pegawai: {
              OR: [
                { wilayahId: user.wilayahId },
                { wilayah: user.wilayah },
                { 
                  unitKerja: { 
                    OR: [
                      { wilayahId: user.wilayahId },
                      { wilayah: user.wilayah }
                    ]
                  } 
                }
              ]
            }
          }
        }),
        
        // Pending proposals in region
        prisma.promotionProposal.count({
          where: {
            status: { in: [
              StatusProposal.DIAJUKAN, 
              StatusProposal.DIPROSES_OPERATOR,
              StatusProposal.MENUNGGU_VERIFIKASI_DINAS
            ]},
            pegawai: {
              OR: [
                { wilayahId: user.wilayahId },
                { wilayah: user.wilayah },
                { 
                  unitKerja: { 
                    OR: [
                      { wilayahId: user.wilayahId },
                      { wilayah: user.wilayah }
                    ]
                  } 
                }
              ]
            }
          }
        }),
        
        // Approved proposals in region
        prisma.promotionProposal.count({
          where: {
            status: { in: [
              StatusProposal.DISETUJUI_OPERATOR,
              StatusProposal.SELESAI
            ]},
            pegawai: {
              OR: [
                { wilayahId: user.wilayahId },
                { wilayah: user.wilayah },
                { 
                  unitKerja: { 
                    OR: [
                      { wilayahId: user.wilayahId },
                      { wilayah: user.wilayah }
                    ]
                  } 
                }
              ]
            }
          }
        }),
        
        // Rejected proposals in region
        prisma.promotionProposal.count({
          where: {
            status: { in: [
              StatusProposal.DITOLAK,
              StatusProposal.DITOLAK_DINAS,
              StatusProposal.DIKEMBALIKAN_OPERATOR
            ]},
            pegawai: {
              OR: [
                { wilayahId: user.wilayahId },
                { wilayah: user.wilayah },
                { 
                  unitKerja: { 
                    OR: [
                      { wilayahId: user.wilayahId },
                      { wilayah: user.wilayah }
                    ]
                  } 
                }
              ]
            }
          }
        }),
        
        // Employees in region
        prisma.user.count({
          where: {
            role: "PEGAWAI",
            OR: [
              { wilayahId: user.wilayahId },
              { wilayah: user.wilayah },
              { 
                unitKerja: { 
                  OR: [
                    { wilayahId: user.wilayahId },
                    { wilayah: user.wilayah }
                  ]
                } 
              }
            ]
          }
        }),
        
        // Unit Kerja in region
        prisma.unitKerja.count({
          where: {
            OR: [
              { wilayahId: user.wilayahId },
              { wilayah: user.wilayah }
            ]
          }
        })
      ])
      
      // Recent proposals needing review
      const recentPendingProposals = await prisma.promotionProposal.findMany({
        where: {
          status: StatusProposal.DIAJUKAN,
          pegawai: {
            OR: [
              { wilayahId: user.wilayahId },
              { wilayah: user.wilayah },
              { 
                unitKerja: { 
                  OR: [
                    { wilayahId: user.wilayahId },
                    { wilayah: user.wilayah }
                  ]
                } 
              }
            ]
          }
        },
        include: {
          pegawai: {
            select: {
              name: true,
              nip: true,
              unitKerja: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      })
      
      dashboardData.operatorStats = {
        totalProposals: regionProposalsTotal,
        pendingProposals: regionProposalsPending,
        approvedProposals: regionProposalsApproved,
        rejectedProposals: regionProposalsRejected,
        employeesCount: employeesInRegion,
        unitKerjaCount: unitKerjaInRegion,
        pendingReviews: recentPendingProposals.map(p => ({
          id: p.id,
          periode: p.periode,
          status: p.status,
          employeeName: p.pegawai.name,
          employeeNip: p.pegawai.nip,
          unitKerja: p.pegawai.unitKerja?.nama || "Tidak diketahui",
          createdAt: p.createdAt.toISOString()
        }))
      }
    }

    return createSuccessResponse(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return createErrorResponse(
      "Failed to fetch dashboard data", 
      (error as Error).message || "Unknown error occurred", 
      500
    )
  }
})

// Helper function to generate random chart data for demonstration
function generateRandomChartData(): ChartData['proposals'] {
  const generateRandomAmount = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const months = []
  const today = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(today.getMonth() - i)
    
    const monthName = date.toLocaleDateString('id-ID', { month: 'short' })
    const year = date.getFullYear()
    
    const total = generateRandomAmount(5, 30)
    const approved = generateRandomAmount(1, Math.floor(total * 0.7))
    const rejected = generateRandomAmount(1, Math.floor(total * 0.3))
    const pending = total - approved - rejected

    months.push({
      month: `${monthName} ${year}`,
      total,
      approved,
      rejected,
      pending
    })
  }
  
  return months
}
