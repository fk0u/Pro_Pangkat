import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Generate random NIP based on unit kerja data
function generateNIP(unitKerja: any): string {
  const year = new Date().getFullYear().toString()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Use NPSN if available, otherwise use unit name hash
  let baseCode = ''
  if (unitKerja.npsn && unitKerja.npsn !== '-') {
    baseCode = unitKerja.npsn.slice(-4) // Last 4 digits of NPSN
  } else {
    // Generate hash from unit name
    const nameHash = unitKerja.nama
      .split('')
      .reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
    baseCode = String(nameHash).slice(-4).padStart(4, '0')
  }
  
  // Random 4-digit suffix
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
  
  return `${year}${month}${baseCode}${randomSuffix}`
}

// Validate unit kerja has required data
function validateUnitKerja(unitKerja: any): boolean {
  return !!(
    unitKerja.nama && 
    unitKerja.nama.trim() !== '' &&
    unitKerja.jenjang &&
    unitKerja.wilayah
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { unitKerjaIds } = body

    if (!unitKerjaIds || !Array.isArray(unitKerjaIds) || unitKerjaIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Unit kerja IDs required'
      }, { status: 400 })
    }

    // Get operator's wilayah
    const operator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true }
    })

    if (!operator?.wilayah) {
      return NextResponse.json({
        success: false,
        message: 'Operator wilayah not found'
      }, { status: 400 })
    }

    // Get unit kerja data
    const unitKerjaList = await prisma.unitKerja.findMany({
      where: {
        id: { in: unitKerjaIds },
        wilayah: operator.wilayah // Ensure operator can only create accounts for their wilayah
      }
    })

    if (unitKerjaList.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid unit kerja found'
      }, { status: 404 })
    }

    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    }

    // Process each unit kerja
    for (const unitKerja of unitKerjaList) {
      try {
        // Validate unit kerja data
        if (!validateUnitKerja(unitKerja)) {
          results.errors.push({
            unitKerjaId: unitKerja.id,
            unitKerjaNama: unitKerja.nama,
            error: 'Data unit kerja tidak lengkap (nama, jenjang, atau wilayah kosong)'
          })
          continue
        }

        // Check if operator account already exists
        const existingOperator = await prisma.user.findFirst({
          where: {
            unitKerjaId: unitKerja.id,
            role: 'OPERATOR_SEKOLAH'
          }
        })

        if (existingOperator) {
          results.skipped.push({
            unitKerjaId: unitKerja.id,
            unitKerjaNama: unitKerja.nama,
            existingNip: existingOperator.nip,
            reason: 'Akun operator sekolah sudah ada'
          })
          continue
        }

        // Generate unique NIP
        let nip = generateNIP(unitKerja)
        let nipExists = await prisma.user.findUnique({ where: { nip } })
        
        // Ensure NIP is unique
        let attempts = 0
        while (nipExists && attempts < 10) {
          nip = generateNIP(unitKerja)
          nipExists = await prisma.user.findUnique({ where: { nip } })
          attempts++
        }

        if (nipExists) {
          results.errors.push({
            unitKerjaId: unitKerja.id,
            unitKerjaNama: unitKerja.nama,
            error: 'Gagal generate NIP unik setelah 10 percobaan'
          })
          continue
        }

        // Hash password (NIP as default password)
        const hashedPassword = await bcrypt.hash(nip, 12)

        // Create operator account
        const newOperator = await prisma.user.create({
          data: {
            nip,
            name: `Operator ${unitKerja.nama}`,
            password: hashedPassword,
            role: 'OPERATOR_SEKOLAH',
            mustChangePassword: true,
            unitKerjaId: unitKerja.id,
            wilayah: unitKerja.wilayah,
            email: null, // Will be set by operator when first login
            phone: null,
            address: null
          }
        })

        results.created.push({
          unitKerjaId: unitKerja.id,
          unitKerjaNama: unitKerja.nama,
          operatorId: newOperator.id,
          nip: newOperator.nip,
          name: newOperator.name,
          defaultPassword: nip // Return for display, but will be hashed in DB
        })

      } catch (error) {
        console.error(`Error creating operator for unit kerja ${unitKerja.id}:`, error)
        results.errors.push({
          unitKerjaId: unitKerja.id,
          unitKerjaNama: unitKerja.nama,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proses selesai: ${results.created.length} dibuat, ${results.skipped.length} dilewati, ${results.errors.length} error`,
      data: results
    })

  } catch (error) {
    console.error('Error in create operator accounts:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// Get status of operator accounts for unit kerja
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get operator's wilayah
    const operator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true }
    })

    if (!operator?.wilayah) {
      return NextResponse.json({
        success: false,
        message: 'Operator wilayah not found'
      }, { status: 400 })
    }

    // Get all unit kerja in operator's wilayah with their operator accounts
    const unitKerjaWithOperators = await prisma.unitKerja.findMany({
      where: {
        wilayah: operator.wilayah
      },
      include: {
        pegawai: {
          where: { role: 'OPERATOR_SEKOLAH' },
          select: {
            id: true,
            nip: true,
            name: true,
            email: true,
            phone: true,
            mustChangePassword: true,
            createdAt: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    })

    const operatorStatus = unitKerjaWithOperators.map(unitKerja => ({
      unitKerjaId: unitKerja.id,
      unitKerjaNama: unitKerja.nama,
      unitKerjaNpsn: unitKerja.npsn,
      hasOperator: unitKerja.pegawai.length > 0,
      hasValidData: validateUnitKerja(unitKerja),
      operator: unitKerja.pegawai[0] || null // Should only be one operator per school
    }))

    const summary = {
      totalUnitKerja: operatorStatus.length,
      withOperator: operatorStatus.filter(u => u.hasOperator).length,
      withoutOperator: operatorStatus.filter(u => !u.hasOperator).length,
      invalidData: operatorStatus.filter(u => !u.hasValidData).length
    }

    return NextResponse.json({
      success: true,
      data: operatorStatus,
      summary
    })

  } catch (error) {
    console.error('Error getting operator accounts status:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
