import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    console.log("[REPORTS API] Starting request processing...")
    
    // Check authentication
    const session = await getSession()
    if (!session.isLoggedIn || session.user?.role !== "ADMIN") {
      console.log("Unauthorized access attempt - wrong role:", session.user?.role);
      return NextResponse.json({ 
        status: "error",
        message: "Unauthorized access. Admin privileges required."
      }, { status: 401 })
    }

    const url = new URL(req.url)
    console.log("Admin reports API called with URL:", req.url);
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10000") // Set high limit to get all data

    console.log("[REPORTS API] Query params:", { page, limit });

    // For reports, we want to show ALL data from database - no filters
    const where = {} // Empty where clause to get ALL data including approved and rejected
    
    console.log("[REPORTS API] Using empty filter - showing ALL data from database");

    // Get proposals with pagination - include ALL statuses
    console.log("[REPORTS API] Executing database queries...");
    const [proposals, total] = await Promise.all([
      prisma.promotionProposal.findMany({
        where, // No filters - get everything
        include: {
          pegawai: {
            select: {
              id: true,
              name: true,
              nip: true,
              jabatan: true,
              golongan: true,
              tmtGolongan: true,
              jenisJabatan: true,
              unitKerja: {
                select: {
                  id: true,
                  nama: true,
                  wilayah: true // Include wilayah for statistics
                }
              }
            }
          },
          documents: {
            include: {
              documentRequirement: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        },
        orderBy: [
          { updatedAt: "desc" },
          { createdAt: "desc" }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.promotionProposal.count({ where }) // Count all records
    ])

    console.log("[REPORTS API] Database query results:", {
      proposalsCount: proposals.length,
      totalCount: total
    });

    // Process data for better frontend consumption
    const processedProposals = proposals.map(proposal => {
      // Handle wilayah extraction
      let wilayahInfo = null;
      if (proposal.pegawai?.unitKerja?.wilayah) {
        const wilayah = proposal.pegawai.unitKerja.wilayah;
        if (typeof wilayah === 'string') {
          wilayahInfo = { id: wilayah, nama: wilayah };
        } else if (typeof wilayah === 'object' && wilayah !== null) {
          wilayahInfo = { 
            id: (wilayah as any).id || (wilayah as any), 
            nama: (wilayah as any).nama || (wilayah as any).name || (wilayah as any) 
          };
        }
      }

      return {
        id: proposal.id,
        pegawai: {
          id: proposal.pegawai?.id || "",
          name: proposal.pegawai?.name || "",
          nip: proposal.pegawai?.nip || "",
          jabatan: proposal.pegawai?.jabatan || "",
          golongan: proposal.pegawai?.golongan || "",
          tmtGolongan: proposal.pegawai?.tmtGolongan || "",
          jenisJabatan: proposal.pegawai?.jenisJabatan || "",
          unitKerja: proposal.pegawai?.unitKerja,
          wilayah: wilayahInfo
        },
        status: proposal.status,
        periode: proposal.periode,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        documents: (proposal.documents || []).map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          status: doc.status,
          requirement: doc.documentRequirement
        }))
      };
    });

    // Return data in consistent format for frontend
    const responseData = {
      data: processedProposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      statistics: {
        total,
        byStatus: await getStatusStatistics(),
        byWilayah: await getWilayahStatistics(),
        byGolongan: await getGolonganStatistics(),
        byPeriode: await getPeriodeStatistics()
      },
      message: processedProposals.length > 0 
        ? `Berhasil memuat ${processedProposals.length} usulan dari total ${total} data`
        : "Database tidak memiliki data usulan"
    };

    console.log("[REPORTS API] Sending success response with", processedProposals.length, "proposals");
    return NextResponse.json({
      status: "success",
      ...responseData
    })
  } catch (error: unknown) {
    console.error("[REPORTS API] Error occurred:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({ 
      status: "error",
      message: "Terjadi kesalahan saat memuat data laporan. Silakan coba lagi.",
      details: process.env.NODE_ENV === 'development' ? {
        error: error instanceof Error ? error.message : 'Unknown error'
      } : {}
    }, { status: 500 })
  }
}

// Helper functions for statistics
async function getStatusStatistics() {
  try {
    const statusGroups = await prisma.promotionProposal.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    return statusGroups.map(group => ({
      status: group.status,
      count: group._count.status
    }));
  } catch (error) {
    console.error("Error getting status statistics:", error);
    return [];
  }
}

async function getWilayahStatistics() {
  try {
    // Get wilayah statistics from unitKerja
    const proposalsWithWilayah = await prisma.promotionProposal.findMany({
      include: {
        pegawai: {
          include: {
            unitKerja: {
              select: {
                wilayah: true
              }
            }
          }
        }
      }
    });
    
    const wilayahCounts: Record<string, number> = {};
    
    proposalsWithWilayah.forEach(proposal => {
      const wilayah = proposal.pegawai?.unitKerja?.wilayah;
      if (wilayah) {
        let wilayahName = '';
        if (typeof wilayah === 'string') {
          wilayahName = wilayah;
        } else if (typeof wilayah === 'object' && wilayah !== null) {
          wilayahName = (wilayah as any).nama || (wilayah as any).name || 'Tidak Diketahui';
        }
        
        wilayahCounts[wilayahName] = (wilayahCounts[wilayahName] || 0) + 1;
      } else {
        wilayahCounts['Tidak Diketahui'] = (wilayahCounts['Tidak Diketahui'] || 0) + 1;
      }
    });
    
    return Object.entries(wilayahCounts).map(([wilayah, count]) => ({
      wilayah,
      count
    }));
  } catch (error) {
    console.error("Error getting wilayah statistics:", error);
    return [];
  }
}

async function getGolonganStatistics() {
  try {
    // Get golongan statistics from pegawai
    const proposalsWithGolongan = await prisma.promotionProposal.findMany({
      include: {
        pegawai: {
          select: {
            golongan: true
          }
        }
      }
    });
    
    const golonganCounts: Record<string, number> = {};
    
    proposalsWithGolongan.forEach(proposal => {
      const golongan = proposal.pegawai?.golongan || 'Tidak Diketahui';
      golonganCounts[golongan] = (golonganCounts[golongan] || 0) + 1;
    });
    
    return Object.entries(golonganCounts).map(([golongan, count]) => ({
      golongan,
      count
    }));
  } catch (error) {
    console.error("Error getting golongan statistics:", error);
    return [];
  }
}

async function getPeriodeStatistics() {
  try {
    const periodeGroups = await prisma.promotionProposal.groupBy({
      by: ['periode'],
      _count: {
        periode: true
      }
    });
    
    return periodeGroups.map(group => ({
      periode: group.periode || 'Tidak Diketahui',
      count: group._count.periode
    }));
  } catch (error) {
    console.error("Error getting periode statistics:", error);
    return [];
  }
}
