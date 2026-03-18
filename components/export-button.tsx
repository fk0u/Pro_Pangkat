"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExportColumn, exportToExcel, exportToPDF } from "@/lib/export-utils"

interface ExportButtonProps {
  data: Record<string, any>[];
  columns: ExportColumn[];
  filename: string;
  title: string;
  disabled?: boolean;
}

export function ExportButton({
  data,
  columns,
  filename,
  title,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportType, setExportType] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(true);
      setExportType(type);

      if (type === "excel") {
        exportToExcel(data, columns, filename);
      } else if (type === "pdf") {
        exportToPDF(data, columns, title, filename);
      }

      toast({
        title: "Export Berhasil",
        description: `File ${filename}.${type === "excel" ? "xlsx" : "pdf"} berhasil diekspor`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data.",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={disabled || isExporting || data.length === 0}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ekspor {exportType === "excel" ? "Excel" : "PDF"}...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Ekspor Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isExporting || data.length === 0}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <span>Ekspor ke Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting || data.length === 0}
        >
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          <span>Ekspor ke PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
