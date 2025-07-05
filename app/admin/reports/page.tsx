"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Download, FileType, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

// Map of status values to display text
export const PROPOSAL_STATUS_MAP: Record<string, string> = {
  "all": "Semua",
  "submitted": "Diajukan",
  "in_progress": "Diproses",
  "approved": "Disetujui",
  "rejected": "Ditolak"
};

// Map of status values to CSS classes for badges
export const statusCssMap: Record<string, string> = {
  "submitted": "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
  "in_progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  "approved": "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
  "rejected": "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
};

interface ReportItem {
  id: string;
  pegawai?: {
    nama?: string;
    nip?: string;
    unit_kerja?: {
      nama?: string;
    };
  };
  jenis_usulan?: string;
  created_at?: string;
  status?: string;
}

export default function AdminReports() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchReportData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/reports");
      if (!response.ok) {
        throw new Error(`Error fetching report data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("API Response Structure:", {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data),
        dataLength: Array.isArray(result.data) ? result.data.length : "N/A",
      });

      // Check if data is in the nested format {data: Array, pagination: Object}
      const responseData = result.data?.data 
        ? result.data.data 
        : Array.isArray(result.data) 
          ? result.data 
          : [];

      if (!Array.isArray(responseData)) {
        console.error("API response data is not an array:", result.data);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Format data tidak valid",
        });
        setReportData([]);
      } else {
        setReportData(responseData);
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const filteredData = reportData.filter((item) => {
    if (activeTab === "all") return true;
    return item.status === activeTab;
  });

  const countByStatus = (status: string) => {
    return reportData.filter((item) => item.status === status).length;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Laporan Usulan</h1>
          <p className="text-muted-foreground">Statistik dan data usulan kenaikan pangkat</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchReportData()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh Data"
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="h-6 w-1/4 bg-gray-200 rounded animate-pulse"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <FileType className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.length}</div>
              <p className="text-xs text-muted-foreground">Usulan dalam sistem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usulan Disetujui</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countByStatus("approved")}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.length > 0
                  ? Math.round((countByStatus("approved") / reportData.length) * 100)
                  : 0}
                % dari total
              </p>
              <Progress
                value={
                  reportData.length > 0
                    ? (countByStatus("approved") / reportData.length) * 100
                    : 0
                }
                className="mt-2 h-2 bg-green-100"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usulan Ditolak</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countByStatus("rejected")}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.length > 0
                  ? Math.round((countByStatus("rejected") / reportData.length) * 100)
                  : 0}
                % dari total
              </p>
              <Progress
                value={
                  reportData.length > 0
                    ? (countByStatus("rejected") / reportData.length) * 100
                    : 0
                }
                className="mt-2 h-2 bg-red-100"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usulan Diproses</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {countByStatus("in_progress") + countByStatus("submitted")}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.length > 0
                  ? Math.round(
                      ((countByStatus("in_progress") + countByStatus("submitted")) /
                        reportData.length) *
                        100
                    )
                  : 0}
                % dari total
              </p>
              <Progress
                value={
                  reportData.length > 0
                    ? ((countByStatus("in_progress") + countByStatus("submitted")) /
                        reportData.length) *
                      100
                    : 0
                }
                className="mt-2 h-2 bg-blue-100"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Semua ({reportData.length})</TabsTrigger>
            <TabsTrigger value="submitted">
              Diajukan ({countByStatus("submitted")})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Diproses ({countByStatus("in_progress")})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Disetujui ({countByStatus("approved")})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Ditolak ({countByStatus("rejected")})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Usulan {PROPOSAL_STATUS_MAP[activeTab] || "Semua"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Pegawai</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Jenis Usulan</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Tanggal Pengajuan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            Tidak ada data
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((item, index) => {
                          // Add defensive check for missing pegawai data
                          if (!item || !item.pegawai) {
                            console.warn("Skipping invalid item without pegawai data", item);
                            return (
                              <TableRow key={`invalid-${index}`}>
                                <TableCell colSpan={7} className="text-center text-red-500">
                                  Data pegawai tidak valid
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow key={item.id || index}>
                              <TableCell>{item.pegawai?.nama || "-"}</TableCell>
                              <TableCell>{item.pegawai?.nip || "-"}</TableCell>
                              <TableCell>{item.jenis_usulan || "-"}</TableCell>
                              <TableCell>{item.pegawai?.unit_kerja?.nama || "-"}</TableCell>
                              <TableCell>{formatDate(item.created_at || "")}</TableCell>
                              <TableCell>
                                <Badge className={statusCssMap[item.status || ""] || ""}>
                                  {PROPOSAL_STATUS_MAP[item.status || ""] || item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Link href={`/admin/proposals/${item.id}`}>
                                  <Button variant="outline" size="sm">
                                    Detail
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
