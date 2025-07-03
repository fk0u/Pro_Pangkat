import * as XLSX from "xlsx"

// Type for user import data
export type UserImportData = {
  nip: string
  name: string
  email?: string
  unitKerja?: string
  wilayah?: string
  golongan?: string
  jabatan?: string
  jenisJabatan?: string
  role?: string
}

// Function to generate Excel template for user import
export const generateUserImportTemplate = (): Buffer => {
  // Create sample data
  const sampleData = [
    {
      NIP: "199001012020121001",
      Nama: "Budi Gunawan",
      Email: "budi.g@example.com",
      "Unit Kerja": "SMA Negeri 2 Balikpapan",
      Wilayah: "BALIKPAPAN_PPU",
      Golongan: "III/a",
      Jabatan: "Guru Matematika",
      "Jenis Jabatan": "Fungsional",
      Role: "PEGAWAI",
    },
  ]

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData)

  // Add column widths
  const colWidths = [
    { wch: 20 }, // NIP
    { wch: 30 }, // Nama
    { wch: 30 }, // Email
    { wch: 40 }, // Unit Kerja
    { wch: 15 }, // Wilayah
    { wch: 10 }, // Golongan
    { wch: 30 }, // Jabatan
    { wch: 15 }, // Jenis Jabatan
    { wch: 10 }, // Role
  ]
  ws["!cols"] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Template Pegawai")

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return buf
}

// Function to parse Excel file for user import
export const parseUserImportExcel = (buffer: Buffer): UserImportData[] => {
  // Read workbook
  const workbook = XLSX.read(buffer, { type: "buffer" })

  // Get first sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON
  const json = XLSX.utils.sheet_to_json(worksheet) as any[]

  // Format data
  const formattedData: UserImportData[] = json.map((row) => ({
    nip: String(row.NIP || ""),
    name: String(row.Nama || ""),
    email: row.Email ? String(row.Email) : undefined,
    unitKerja: row["Unit Kerja"] ? String(row["Unit Kerja"]) : undefined,
    wilayah: row.Wilayah ? String(row.Wilayah) : undefined,
    golongan: row.Golongan ? String(row.Golongan) : undefined,
    jabatan: row.Jabatan ? String(row.Jabatan) : undefined,
    jenisJabatan: row["Jenis Jabatan"] ? String(row["Jenis Jabatan"]) : undefined,
    role: row.Role ? String(row.Role) : undefined,
  }))

  return formattedData
}

// Function to validate user import data
export const validateUserImportData = (data: UserImportData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check if data is empty
  if (data.length === 0) {
    errors.push("File tidak berisi data")
    return { valid: false, errors }
  }

  // Validate each row
  data.forEach((row, index) => {
    // Required fields
    if (!row.nip) {
      errors.push(`Baris ${index + 1}: NIP wajib diisi`)
    } else if (row.nip.length !== 18) {
      errors.push(`Baris ${index + 1}: NIP harus 18 digit`)
    }

    if (!row.name) {
      errors.push(`Baris ${index + 1}: Nama wajib diisi`)
    }

    // Email format
    if (row.email && !row.email.includes("@")) {
      errors.push(`Baris ${index + 1}: Format email tidak valid`)
    }

    // Role validation
    if (row.role && !["PEGAWAI", "OPERATOR", "ADMIN"].includes(row.role)) {
      errors.push(`Baris ${index + 1}: Role harus salah satu dari PEGAWAI, OPERATOR, atau ADMIN`)
    }

    // Wilayah validation
    const validWilayah = [
      'BALIKPAPAN_PPU', 'KUTIM_BONTANG', 'KUKAR', 'KUBAR_MAHULU', 
      'PASER', 'BERAU', 'SAMARINDA'
    ]
    if (row.wilayah && !validWilayah.includes(row.wilayah)) {
      errors.push(`Baris ${index + 1}: Wilayah tidak valid`)
    }
  })

  return { valid: errors.length === 0, errors }
}

// Function to generate Excel export for any data
export const generateExcelExport = <T>(data: T[], sheetName: string, fileName: string): Buffer => {
  // Create worksheet\
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
};
