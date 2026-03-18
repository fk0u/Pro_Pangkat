import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

// Tipe data untuk kolom
export interface ExportColumn {
  header: string;
  accessor: string;
  width?: number;
}

// Fungsi untuk mengekspor data ke Excel
export function exportToExcel(
  data: any[], 
  columns: ExportColumn[], 
  filename: string = 'export'
): void {
  // Mengubah data menjadi format yang cocok untuk Excel
  const excelData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(column => {
      row[column.header] = getNestedValue(item, column.accessor);
    });
    return row;
  });

  // Membuat workbook baru
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Mengatur lebar kolom jika didefinisikan
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // Menambahkan worksheet ke workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Mengekspor workbook
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Fungsi untuk mengekspor data ke PDF
export function exportToPDF(
  data: any[], 
  columns: ExportColumn[], 
  title: string = 'Data Export',
  filename: string = 'export'
): void {
  const pdf = new jsPDF();
  
  // Menambahkan judul
  pdf.setFontSize(16);
  pdf.text(title, 14, 15);
  
  // Mengatur header dan body untuk autoTable
  const headers = columns.map(col => col.header);
  const rows = data.map(item => 
    columns.map(col => getNestedValue(item, col.accessor)?.toString() || '-')
  );

  // Membuat tabel
  autoTable(pdf, {
    head: [headers],
    body: rows,
    startY: 25,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
  });

  // Menyimpan PDF
  pdf.save(`${filename}.pdf`);
}

// Fungsi bantu untuk mendapatkan nilai dalam objek nested berdasarkan path
// Contoh: "user.name" akan mengakses objek.user.name
function getNestedValue(obj: any, path: string): any {
  if (!obj) return null;
  const keys = path.split('.');
  return keys.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
    obj
  );
}

// Fungsi untuk memformat tanggal ke format yang lebih mudah dibaca
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Fungsi untuk memformat status proposal
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Diajukan',
    REJECTED: 'Ditolak',
    VERIFIED: 'Diverifikasi',
    APPROVED: 'Disetujui',
    COMPLETED: 'Selesai',
  };
  
  return statusMap[status] || status;
}
