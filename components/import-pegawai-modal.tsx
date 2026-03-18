"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react"
import * as XLSX from 'xlsx'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

interface ImportPegawaiItem {
  nip: string
  nama: string
  email: string
  golongan: string
  tmtJabatan: string
  unitKerja: string
  phone: string
  address: string
}

interface ImportResult {
  success: string[]
  failed: Array<{ nip: string; reason: string }>
  totalSuccess: number
  totalFailed: number
}

export function ImportPegawaiModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ImportPegawaiItem[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const resetState = () => {
    setFile(null)
    setParseError(null)
    setParsedData([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParseError(null)
    setImportResult(null)
    
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      setParsedData([])
      return
    }

    // Check file extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (extension !== 'csv' && extension !== 'xlsx') {
      setParseError("Format file tidak valid. Hanya file CSV dan Excel yang diperbolehkan.")
      setFile(null)
      setParsedData([])
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          setParseError("Gagal membaca file")
          return
        }
        
        let parsedRows: ImportPegawaiItem[] = []
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string
          const rows = text.split('\n')
          
          parsedRows = rows.map(row => {
            const values = row.trim().split(',')
            return {
              nip: (values[0] || "").trim(),
              nama: (values[1] || "").trim(),
              email: (values[2] || "").trim(),
              golongan: (values[3] || "").trim(),
              tmtJabatan: (values[4] || "").trim(),
              unitKerja: (values[5] || "").trim(),
              phone: (values[6] || "").trim(),
              address: (values[7] || "").trim()
            }
          }).filter(item => item.nip && item.nip !== "nip" && item.nip !== "NIP") // Filter out header row and empty rows
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)
          
          parsedRows = json.map(row => ({
            nip: String(row.nip || row.NIP || "").trim(),
            nama: String(row.nama || row.NAMA || row.Nama || row["Nama Lengkap"] || "").trim(),
            email: String(row.email || row.EMAIL || row.Email || "").trim(),
            golongan: String(row.golongan || row.GOLONGAN || row.Golongan || "").trim(),
            tmtJabatan: String(row.tmtJabatan || row["TMT Jabatan"] || row["TMT JABATAN"] || "").trim(),
            unitKerja: String(row.unitKerja || row["Unit Kerja"] || row["UNIT KERJA"] || row.Sekolah || row.SEKOLAH || "").trim(),
            phone: String(row.phone || row.PHONE || row.telp || row.TELP || row.NoTelp || row["No Telp"] || "").trim(),
            address: String(row.address || row.ADDRESS || row.alamat || row.ALAMAT || row.Alamat || "").trim()
          }))
        }
        
        if (parsedRows.length === 0) {
          setParseError("Tidak ada data yang valid dalam file")
          return
        }
        
        // Validate data
        const invalidRows = parsedRows.filter(row => !row.nip || !row.nama)
        if (invalidRows.length > 0) {
          setParseError(`${invalidRows.length} baris data tidak valid. NIP dan Nama wajib diisi.`)
        }
        
        setParsedData(parsedRows)
      } catch (error) {
        console.error("Error parsing file:", error)
        setParseError("Gagal mengurai file. Pastikan format file sesuai.")
      }
    }
    
    reader.onerror = () => {
      setParseError("Gagal membaca file")
    }
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handleImport = async () => {
    if (!file || parsedData.length === 0) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/operator-sekolah/pegawai/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pegawaiData: parsedData }),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setImportResult(result.results)
        toast({
          title: "Import berhasil",
          description: result.message,
        })
        if (result.results.totalSuccess > 0) {
          onImportSuccess()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Import gagal",
          description: result.message || "Terjadi kesalahan saat mengimpor data",
        })
      }
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        variant: "destructive",
        title: "Import gagal",
        description: "Terjadi kesalahan saat mengimpor data",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    // Create a simple template
    const template = [
      ["nip", "nama", "email", "golongan", "tmtJabatan", "unitKerja", "phone", "address"],
      ["198501012010011001", "Nama Pegawai", "email@example.com", "III/b", "2020-01-01", "SMKN 1 Balikpapan", "081234567890", "Jl. Contoh No. 123"]
    ]
    
    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    
    // Save the file
    XLSX.writeFile(wb, "template_import_pegawai.xlsx")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Data Pegawai</DialogTitle>
          <DialogDescription>
            Upload file CSV atau Excel yang berisi data pegawai untuk diimpor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="file">File Data Pegawai</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                type="button"
                className="text-xs"
              >
                <Download className="mr-2 h-3 w-3" />
                Download Template
              </Button>
            </div>
            
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isSubmitting}
            />
            
            <p className="text-xs text-muted-foreground">
              Format: NIP, Nama, Email, Golongan, TMT Jabatan (YYYY-MM-DD), Unit Kerja, No Telp, Alamat
            </p>
          </div>
          
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
          
          {file && parsedData.length > 0 && !parseError && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Data siap diimpor</AlertTitle>
              <AlertDescription>
                {parsedData.length} data pegawai akan diimpor dari file {file.name}
              </AlertDescription>
            </Alert>
          )}
          
          {importResult && (
            <Alert variant={importResult.totalFailed === 0 ? "default" : "destructive"}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Hasil Import</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{importResult.totalSuccess} data berhasil diimpor, {importResult.totalFailed} gagal</p>
                
                {importResult.totalFailed > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                    <p className="font-semibold">Detail error:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {importResult.failed.map((item, index) => (
                        <li key={index}>
                          {item.nip}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || parsedData.length === 0 || Boolean(parseError) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengimpor...
              </>
            ) : (
              'Import Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
