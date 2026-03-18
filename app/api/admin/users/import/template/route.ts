import { NextResponse } from "next/server"
import { generateUserImportTemplate } from "@/lib/excel-utils"

export async function GET() {
  try {
    const templateData = [
      {
        NIP: "123456789012345678",
        "Nama Lengkap": "Contoh Nama Pegawai",
        Email: "contoh@email.com",
        Role: "PEGAWAI",
        "Unit Kerja": "SMA Negeri 1 Balikpapan",
        Wilayah: "Kota Balikpapan",
        Golongan: "III/c",
        Jabatan: "Guru Muda",
        "Jenis Jabatan": "Guru",
      },
    ]

    const buffer = generateUserImportTemplate()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=template-import-pengguna.xlsx",
      },
    })
  } catch (error) {
    console.error("Error generating template:", error)
    return NextResponse.json({ success: false, message: "Failed to generate template" }, { status: 500 })
  }
}
