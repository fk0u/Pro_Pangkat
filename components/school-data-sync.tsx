"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw, Search, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { searchSchool, syncSchoolData } from "@/lib/school-utils"

interface SchoolData {
  npsn: string;
  sekolah: string;
  bentuk: string;
  status: string;
  alamat_jalan: string;
  kecamatan: string;
  kabupaten_kota: string;
  propinsi: string;
  lintang: string;
  bujur: string;
}

interface SchoolSyncProps {
  unitKerjaId: string;
  unitKerjaNama: string;
  onSyncComplete?: () => void;
}

export function SchoolDataSync({ unitKerjaId, unitKerjaNama, onSyncComplete }: SchoolSyncProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchResults, setSearchResults] = useState<SchoolData[]>([])
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null)
  
  const { toast } = useToast()

  // Generate search variations for better results
  const generateSearchVariations = (name: string): string[] => {
    const schoolName = name.trim();
    const variations = [];
    
    // Coba ekstrak jenjang (SD/SMP/SMA/SMK) dan nomor sekolah
    const jenjangMatch = schoolName.match(/\b(SD|SMP|SMA|SMK|MTS|MTsN|MA|MAN)\b\s*(?:NEGERI|N)?\s*(\d+)?/i);
    
    if (jenjangMatch) {
      const jenjang = jenjangMatch[1]?.toUpperCase();
      const nomor = jenjangMatch[2] || '';
      const lokasi = schoolName.replace(/\b(SD|SMP|SMA|SMK|MTS|MTsN|MA|MAN)\b\s*(?:NEGERI|N)?\s*\d*/i, '').trim();
      
      // Format 1: SMA N 1 (N Terpisah dengan Jenjang)
      variations.push(`${jenjang} N ${nomor} ${lokasi}`.trim());
      
      // Format 2: SMA NEGERI 1 (N menjadi NEGERI)
      variations.push(`${jenjang} NEGERI ${nomor} ${lokasi}`.trim());
      
      // Format 3: SMAN 1 (N di gabung dengan Jenjang)
      variations.push(`${jenjang}N ${nomor} ${lokasi}`.trim());
      
      // Format 4: Original
      variations.push(schoolName);
      
      // Format 5: Sekolah + Nomor saja (mis. "SMA 1")
      if (nomor) {
        variations.push(`${jenjang} ${nomor}`);
      }
      
      // Format 6: Coba dengan lokasi saja jika ada
      if (lokasi && lokasi.length > 3) {
        variations.push(`${jenjang} ${lokasi}`);
      }
    } else {
      // Jika tidak match dengan pola di atas, buat beberapa variasi
      variations.push(schoolName);
      
      // Coba gunakan 3 kata pertama
      const words = schoolName.split(/\s+/);
      if (words.length > 3) {
        variations.push(words.slice(0, 3).join(' '));
      }
      
      // Coba cari kata-kata yang mungkin mengindikasikan jenjang
      const possibleLevels = ['SD', 'SMP', 'SMA', 'SMK', 'MADRASAH', 'SEKOLAH'];
      for (const level of possibleLevels) {
        if (schoolName.toUpperCase().includes(level)) {
          // Coba ekstrak nama dengan kata kunci jenjang + beberapa kata setelahnya
          const regex = new RegExp(`${level}\\s+([\\w\\s]{3,20})`, 'i');
          const match = schoolName.match(regex);
          if (match && match[1]) {
            variations.push(`${level} ${match[1].trim()}`);
          }
        }
      }
    }
    
    // Hapus duplikat, trim, dan kosongkan
    return [...new Set(variations.filter(v => v.trim()))].map(v => v.trim());
  };

  const handleSearch = async () => {
    const queryToUse = searchQuery.trim() || unitKerjaNama;
    if (!queryToUse) {
      toast({
        title: "Input kosong",
        description: "Masukkan nama sekolah untuk mencari",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchResults([]);
      
      // Generate search variations
      const searchVariations = generateSearchVariations(queryToUse);
      console.log("Mencoba variasi pencarian:", searchVariations);
      
      let allResults: SchoolData[] = [];
      let foundResults = false;
      let lastError: Error | null = null;
      
      // Coba setiap variasi hingga menemukan hasil
      for (const query of searchVariations) {
        if (foundResults) break; // Hentikan jika sudah menemukan hasil
        
        try {
          // Tambahkan jeda antar permintaan untuk menghindari rate limit
          if (searchVariations.indexOf(query) > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          const data = await searchSchool(query);
          
          // Validasi respons API
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            // Periksa bahwa data yang diperlukan ada
            const validResults = data.results.filter(school => 
              school && 
              typeof school === 'object' && 
              school.npsn && 
              school.sekolah
            );
            
            if (validResults.length > 0) {
              // Coba lacak sekolah yang paling cocok dengan nama
              const matchedResults = findBestMatchingSchools(validResults, queryToUse);
              allResults = matchedResults;
              foundResults = true;
              console.log(`Berhasil menemukan data dengan kata kunci: "${query}"`);
              break; // Berhenti setelah menemukan hasil
            }
          }
        } catch (variationError) {
          console.warn(`Error mencari dengan variasi "${query}":`, variationError);
          if (variationError instanceof Error) {
            lastError = variationError;
          }
          // Lanjutkan ke variasi berikutnya
        }
      }
      
      setSearchResults(allResults);
      
      if (foundResults) {
        setSelectedSchool(allResults[0]);
        
        // Berikan feedback sesuai hasil pencarian
        if (allResults.length > 1) {
          toast({
            title: "Beberapa sekolah ditemukan",
            description: `Ditemukan ${allResults.length} sekolah. Pilih yang sesuai.`,
          });
        }
      } else {
        let errorMessage = "Tidak ada data sekolah yang ditemukan. Coba kata kunci lain.";
        if (lastError) {
          errorMessage = `Error: ${lastError.message}. Coba kata kunci lain.`;
        }
        
        toast({
          title: "Data tidak ditemukan",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching school:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Gagal mencari data: ${error.message}` 
          : "Gagal mencari data sekolah. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSyncData = async () => {
    if (!selectedSchool) {
      toast({
        title: "Pilih sekolah",
        description: "Silakan pilih sekolah dari hasil pencarian untuk disinkronkan",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      toast({
        title: "Menyinkronkan data",
        description: "Sedang menyinkronkan data sekolah...",
      });
      
      // Tambahkan timeout untuk mendeteksi operasi yang terlalu lama
      const syncPromise = syncSchoolData(unitKerjaId, selectedSchool.sekolah);
      const timeoutPromise = new Promise<{success: false, message: string}>((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            message: "Operasi sinkronisasi terlalu lama. Server mungkin sibuk atau tidak merespons."
          });
        }, 30000); // 30 detik timeout
      });
      
      // Gunakan Promise.race untuk membatasi waktu
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Data sekolah berhasil disinkronkan",
          variant: "default"
        });
        
        // Reset form setelah berhasil
        setSearchQuery("");
        setSearchResults([]);
        setSelectedSchool(null);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(result.message || "Gagal menyinkronkan data");
      }
    } catch (error) {
      console.error("Error syncing school data:", error);
      
      // Periksa jenis error untuk memberikan pesan yang lebih spesifik
      let errorMessage = "Gagal menyinkronkan data sekolah. Silakan coba lagi.";
      
      if (error instanceof Error) {
        // Error biasa dengan pesan
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Kemungkinan error dari API dengan format khusus
        const errorObj = error as {message?: string};
        if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }
      
      toast({
        title: "Error Sinkronisasi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Cari dengan nama sekolah (SMAN 3 Balikpapan)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 ${isSearching ? 'pr-10' : ''}`}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isSearching}
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className={isSearching ? 'bg-blue-500' : ''}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mencari...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Cari
            </>
          )}
        </Button>
      </div>

      {!isSearching && searchQuery && searchResults.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm">
          <p className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Tidak ditemukan hasil untuk "{searchQuery}". Coba kata kunci lain atau gunakan format nama yang berbeda.
          </p>
          <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
            <p>Tips pencarian:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Gunakan nama resmi sekolah (contoh: "SMA Negeri 1 Balikpapan")</li>
              <li>Coba format singkat (contoh: "SMAN 1 Balikpapan")</li>
              <li>Sertakan lokasi sekolah untuk hasil yang lebih akurat</li>
            </ul>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Hasil Pencarian
            </CardTitle>
            <CardDescription>
              {searchResults.length > 1 
                ? `Ditemukan ${searchResults.length} data sekolah. Pilih yang sesuai untuk disinkronkan.`
                : 'Ditemukan 1 data sekolah yang sesuai.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.map((school, index) => (
              <div 
                key={school.npsn || index}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedSchool === school 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => setSelectedSchool(school)}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>{school.sekolah}</span>
                  {selectedSchool === school && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <div className="text-gray-500 dark:text-gray-400">NPSN:</div>
                  <div className="font-mono">{school.npsn}</div>
                  <div className="text-gray-500 dark:text-gray-400">Bentuk:</div>
                  <div>{school.bentuk}</div>
                  <div className="text-gray-500 dark:text-gray-400">Status:</div>
                  <div>
                    <Badge variant={school.status === "N" ? "default" : "outline"} className="text-xs">
                      {school.status === "N" ? "Negeri" : "Swasta"}
                    </Badge>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Alamat:</div>
                  <div className="truncate">{school.alamat_jalan || '-'}</div>
                  <div className="text-gray-500 dark:text-gray-400">Kecamatan:</div>
                  <div>{school.kecamatan || '-'}</div>
                  <div className="text-gray-500 dark:text-gray-400">Kota/Kab:</div>
                  <div>{school.kabupaten_kota || '-'}</div>
                  <div className="text-gray-500 dark:text-gray-400">Provinsi:</div>
                  <div>{school.propinsi || '-'}</div>
                  {school.lintang && school.bujur && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Koordinat:</div>
                      <div className="font-mono text-xs">{school.lintang}, {school.bujur}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSyncData} 
              disabled={!selectedSchool || isSyncing}
            >
              {isSyncing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyinkronkan Data...</>
              ) : (
                <><RefreshCw className="mr-2 h-4 w-4" /> Sinkronkan Data</>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
