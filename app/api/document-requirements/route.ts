import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const requirements = await prisma.documentRequirement.findMany({
      include: {
        detailInfo: true,
      },
      orderBy: [
        { name: "asc" }
      ],
    })

    // Group by category for better organization
    const groupedByCategory = requirements.reduce((acc: Record<string, any[]>, doc: any) => {
      const category = getCategoryFromCode(doc.code)
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({
        id: doc.id,
        code: doc.code,
        name: doc.name,
        description: doc.description,
        isRequired: doc.isRequired,
        hasSimASN: doc.hasSimASN,
        format: "PDF",
        maxSize: 5242880, // 5MB
        category: category,
        
        // Detailed information
        detailInfo: doc.detailInfo ? {
          purpose: doc.detailInfo.purpose,
          obtainMethod: doc.detailInfo.obtainMethod,
          validityPeriod: doc.detailInfo.validityPeriod,
          legalBasis: doc.detailInfo.legalBasis,
          templateUrl: doc.detailInfo.templateUrl,
          sampleUrl: doc.detailInfo.sampleUrl,
          requirements: doc.detailInfo.requirements,
          fillTips: doc.detailInfo.fillTips,
          commonMistakes: doc.detailInfo.commonMistakes,
        } : null,
      })
      return acc
    }, {} as Record<string, any[]>)

    // Also keep the original grouping by type
    const groupedByType = requirements.reduce((acc: Record<string, any[]>, doc: any) => {
      const category = doc.isRequired ? 'Wajib' : 'Opsional'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({
        id: doc.id,
        code: doc.code,
        name: doc.name,
        description: doc.description,
        isRequired: doc.isRequired,
        hasSimASN: doc.hasSimASN
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      data: {
        requirements: requirements.map(doc => ({
          ...doc,
          format: "PDF",
          maxSize: 5242880,
          category: getCategoryFromCode(doc.code),
        })),
        groupedByCategory,
        groupedByType,
        summary: {
          total: requirements.length,
          required: requirements.filter((doc: any) => doc.isRequired).length,
          optional: requirements.filter((doc: any) => !doc.isRequired).length,
          hasSimASN: requirements.filter((doc: any) => doc.hasSimASN).length,
          categories: Object.keys(groupedByCategory).length,
        }
      }
    })
  } catch (error) {
    console.error("Error fetching document requirements:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to determine category from code
function getCategoryFromCode(code: string): string {
  if (code.includes('sk-') || code.includes('pengangkatan') || code.includes('pangkat')) {
    return "Dokumen Kepegawaian"
  } else if (code.includes('ijazah') || code.includes('sertifikat') || code.includes('diklat')) {
    return "Dokumen Pendidikan"
  } else if (code.includes('str') || code.includes('sip') || code.includes('profesi')) {
    return "Dokumen Profesi"
  } else if (code.includes('dp3') || code.includes('skp') || code.includes('kinerja')) {
    return "Dokumen Kinerja"
  } else {
    return "Dokumen Lainnya"
  }
}
