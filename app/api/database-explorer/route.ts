import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type TableRow = {
  table_name: string
}

type ColumnRow = {
  column_name: string
  data_type: string
  is_nullable: "YES" | "NO"
}

export async function GET() {
  try {
    const tables = (await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)) as TableRow[]

    const tableSummaries = await Promise.all(
      tables.map(async (t) => {
        const safeTableName = t.table_name.replace(/"/g, '""')

        const countResult = (await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count FROM "${safeTableName}"`
        )) as Array<{ count: number }>

        const columns = (await prisma.$queryRawUnsafe(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${safeTableName}'
          ORDER BY ordinal_position
          `
        )) as ColumnRow[]

        return {
          table: t.table_name,
          rowCount: countResult?.[0]?.count ?? 0,
          columns: columns.map((c) => ({
            name: c.column_name,
            type: c.data_type,
            nullable: c.is_nullable === "YES",
          })),
        }
      })
    )

    return NextResponse.json({
      success: true,
      database: "propangkat_db",
      tables: tableSummaries,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("database-explorer error", error)

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil metadata database",
      },
      { status: 500 }
    )
  }
}
