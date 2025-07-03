/**
 * Utilitas untuk mencari data sekolah dari API eksternal
 */

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
  kode_prop?: string;
  kode_kab_kota?: string;
  kode_kec?: string;
  id?: string;
  similarity?: number; // Added for sorting by similarity
}

interface SchoolSearchResponse {
  query: string;
  results: SchoolData[];
  total: number;
  page: number;
  perPage: number;
  totalPages?: number;
  locationFilter?: string | null;
}

/**
 * Mencari data sekolah dari API eksternal
 * 
 * @param query Nama sekolah yang akan dicari
 * @param options Opsi tambahan untuk pencarian
 * @returns Promise berisi data sekolah
 */
export const searchSchool = async (
  query: string, 
  options: { 
    page?: number; 
    perPage?: number;
    filterByLocation?: boolean;
    location?: string;
  } = {}
): Promise<SchoolSearchResponse> => {
  try {
    const { 
      page = 1, 
      perPage = 10,
      filterByLocation = false,
      location = ""
    } = options;
    
    console.log(`[Search] Searching for school: "${query}"`);
    if (filterByLocation) {
      console.log(`[Search] Filtering by location: "${location}"`);
    }
    
    // Gunakan timeout untuk menghindari permintaan yang terlalu lama
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
    
    try {
      // Build URL with query parameters
      const searchParams = new URLSearchParams();
      searchParams.append("q", query);
      searchParams.append("page", page.toString());
      searchParams.append("perPage", perPage.toString());
      
      if (filterByLocation) {
        searchParams.append("filterByLocation", "true");
        if (location) {
          searchParams.append("location", location);
        }
      }
      
      const url = `/api/sekolah/search?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
        credentials: 'include',
        signal: controller.signal,
        cache: "no-store"
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Search] API error (${response.status}):`, errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error("[Search] API error:", data.message);
        throw new Error(data.message || "Failed to fetch school data");
      }
      
      console.log(`[Search] API response:`, data);
      
      // Ekstrak data hasil dengan berbagai kemungkinan struktur
      let results: SchoolData[] = [];
      let total = 0;
      let resultPage = 1;
      let resultPerPage = 10;
      let totalPages = 1;
      let locationFilter = null;
      
      // Cek kemungkinan struktur respons
      if (data.data) {
        if (Array.isArray(data.data)) {
          results = data.data;
          total = data.data.length;
        } else if (data.data.results && Array.isArray(data.data.results)) {
          results = data.data.results;
          total = data.data.total || results.length;
          resultPage = data.data.page || 1;
          resultPerPage = data.data.perPage || 10;
          totalPages = data.data.totalPages || Math.ceil(total / resultPerPage);
          locationFilter = data.data.locationFilter || null;
        } else if (data.data.dataSekolah && Array.isArray(data.data.dataSekolah)) {
          results = data.data.dataSekolah;
          total = results.length;
          resultPage = data.data.page || 1;
          resultPerPage = data.data.per_page || 10;
        }
      }
      
      // Validasi data sekolah
      const validResults = results.filter(school => 
        school && typeof school === 'object' && school.npsn && school.sekolah
      );
      
      console.log(`[Search] Found ${validResults.length} valid schools`);
      
      // Pastikan data memiliki struktur yang diharapkan
      const responseData: SchoolSearchResponse = {
        query: query,
        results: validResults,
        total: total,
        page: resultPage,
        perPage: resultPerPage,
        totalPages: totalPages,
        locationFilter: locationFilter
      };
      
      return responseData;
    } catch (fetchError) {
      // Clear timeout if it hasn't triggered yet
      clearTimeout(timeoutId);
      
      // Check if this was an abort error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('API request timed out after 10 seconds');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error searching for school:", error);
    throw error;
  }
};

/**
 * Mencari data sekolah berdasarkan lokasi
 * 
 * @param location Nama lokasi (provinsi, kabupaten, kota, kecamatan)
 * @param options Opsi tambahan untuk pencarian
 * @returns Promise berisi data sekolah
 */
export const searchSchoolByLocation = async (
  location: string,
  options: {
    schoolType?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<SchoolSearchResponse> => {
  try {
    const {
      schoolType = "",
      page = 1,
      perPage = 20
    } = options;
    
    console.log(`[Search] Searching for schools in location: "${location}"`);
    if (schoolType) {
      console.log(`[Search] Filtering by school type: "${schoolType}"`);
    }
    
    // Gunakan timeout untuk menghindari permintaan yang terlalu lama
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
    
    try {
      // Build URL with query parameters
      const searchParams = new URLSearchParams();
      searchParams.append("location", location);
      searchParams.append("page", page.toString());
      searchParams.append("perPage", perPage.toString());
      
      if (schoolType) {
        searchParams.append("type", schoolType);
      }
      
      const url = `/api/sekolah/location?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
        credentials: 'include',
        signal: controller.signal,
        cache: "no-store"
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Search] API error (${response.status}):`, errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error("[Search] API error:", data.message);
        throw new Error(data.message || "Failed to fetch school data");
      }
      
      console.log(`[Search] API response:`, data);
      
      // Ekstrak data hasil
      const results = data.data.results || [];
      const total = data.data.total || results.length;
      const resultPage = data.data.page || 1;
      const resultPerPage = data.data.perPage || perPage;
      const totalPages = data.data.totalPages || Math.ceil(total / resultPerPage);
      
      // Pastikan data memiliki struktur yang diharapkan
      const responseData: SchoolSearchResponse = {
        query: location,
        results: results,
        total: total,
        page: resultPage,
        perPage: resultPerPage,
        totalPages: totalPages
      };
      
      return responseData;
    } catch (fetchError) {
      // Clear timeout if it hasn't triggered yet
      clearTimeout(timeoutId);
      
      // Check if this was an abort error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('API request timed out after 10 seconds');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error searching for schools by location:", error);
    throw error;
  }
};

/**
 * Fungsi untuk mendapatkan data detail sekolah dengan NPSN
 * 
 * @param npsn NPSN sekolah
 * @returns Promise berisi detail sekolah
 */
export const getSchoolByNPSN = async (npsn: string): Promise<SchoolData | null> => {
  try {
    const encodedQuery = encodeURIComponent(`NPSN ${npsn}`);
    const response = await fetch(`/api/sekolah/search?q=${encodedQuery}`, {
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store"
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch school data");
    }
    
    // Return the first result if found
    return data.data.results.length > 0 ? data.data.results[0] : null;
  } catch (error) {
    console.error("Error getting school by NPSN:", error);
    throw error;
  }
};

/**
 * Fungsi untuk menyinkronkan data sekolah dari API eksternal ke database
 * 
 * @param unitKerjaId ID unit kerja di database
 * @param namaSekolah Nama sekolah untuk pencarian
 * @returns Promise berisi hasil sinkronisasi
 */
export const syncSchoolData = async (unitKerjaId: string, namaSekolah: string) => {
  try {
    if (!unitKerjaId || !namaSekolah) {
      return { success: false, message: "ID unit kerja dan nama sekolah harus disediakan" };
    }
    
    // Format query dari nama sekolah
    const searchQuery = namaSekolah.replace(/\s+/g, ' ').trim();
    
    console.log(`[Sync] Mencari data untuk sekolah: "${searchQuery}"`);
    
    // Cari data sekolah dari API eksternal dengan strategi multiple
    let schoolData = null;
    let searchError = null;
    const searchAttempts = [];
    
    /**
     * Strategi pencarian:
     * 1. Gunakan nama dengan standarisasi format (SMK NEGERI X Kota Y)
     * 2. Gunakan nama lengkap (original)
     * 3. Gunakan 3 kata pertama
     * 4. Gunakan kata pertama + jenjang
     * 5. Jika ada lokasi terdeteksi, gunakan pencarian lokasi
     */
    
  // Fungsi untuk standarisasi kapitalisasi nama sekolah
  const standardizeSchoolName = (name: string): string => {
    // Ubah ke lowercase dulu
    const lowercased = name.toLowerCase();
    
    // Deteksi jenjang pendidikan (SD, SMP, SMA, SMK)
    const jenjangPattern = /\b(sd|smp|sma|smk|mi|mts|ma)\b/i;
    const jenjangMatch = lowercased.match(jenjangPattern);
    
    // Deteksi status (negeri/swasta)
    const statusPattern = /\b(negeri|swasta)\b/i;
    const statusMatch = lowercased.match(statusPattern);
    
    // Deteksi kota/kabupaten
    const kotaPattern = /\b(kota|kabupaten|kab)?\s*([a-z]+)\b/i;
    const kotaMatch = lowercased.match(kotaPattern);
    
    // Kapitalisasi kata-kata penting (setiap awal kata kecuali kata sambung)
    let result = lowercased.replace(/\b([a-z])/g, (match) => match.toUpperCase());
    
    // Khusus untuk jenjang: FULL KAPITAL
    if (jenjangMatch) {
      const jenjang = jenjangMatch[0];
      result = result.replace(new RegExp("\\b" + jenjang, "i"), jenjang.toUpperCase());
    }
    
    // Khusus untuk status "Negeri": Kapital hanya di awal
    if (statusMatch) {
      const status = statusMatch[0];
      const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      result = result.replace(new RegExp("\\b" + status, "i"), statusCapitalized);
    }
    
    // Khusus untuk kota/kabupaten: Kapital hanya di awal
    if (kotaMatch && kotaMatch[2]) {
      const kota = kotaMatch[2];
      const kotaCapitalized = kota.charAt(0).toUpperCase() + kota.slice(1).toLowerCase();
      result = result.replace(new RegExp("\\b" + kota, "i"), kotaCapitalized);
    }
    
    return result;
  };
    
    // Extract location from school name (if present)
    let extractedLocation = "";
    const locationPattern = /\b(?:di|kota|kabupaten|kab|provinsi|prov)\s+([a-z\s]+)(?:\s|$)/i;
    const locationMatch = searchQuery.match(locationPattern);
    if (locationMatch && locationMatch[1]) {
      extractedLocation = locationMatch[1].trim();
      console.log(`[Sync] Extracted location from school name: "${extractedLocation}"`);
    }
    
    // Strategi 1: Gunakan nama dengan standarisasi format
    try {
      const standardizedQuery = standardizeSchoolName(searchQuery);
      console.log(`[Sync] Mencoba dengan standarisasi format: "${standardizedQuery}"`);
      
      const searchOptions = extractedLocation 
        ? { filterByLocation: true, location: extractedLocation }
        : {};
        
      schoolData = await searchSchool(standardizedQuery, searchOptions);
      if (schoolData && schoolData.results && schoolData.results.length > 0) {
        console.log(`[Sync] Berhasil menemukan dengan standarisasi format: ${schoolData.results.length} hasil`);
      } else {
        searchAttempts.push("standarisasi format - tidak ditemukan hasil");
      }
    } catch (error) {
      searchError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchAttempts.push(`standarisasi format - error: ${errorMessage}`);
      console.warn(`[Sync] Pencarian dengan standarisasi format gagal: ${errorMessage}`);
    }
    
    // Strategi 2: Gunakan nama lengkap (original) jika strategi 1 gagal
    if (!schoolData || !schoolData.results || schoolData.results.length === 0) {
      try {
        console.log(`[Sync] Mencoba dengan nama lengkap original: "${searchQuery}"`);
        
        const searchOptions = extractedLocation 
          ? { filterByLocation: true, location: extractedLocation }
          : {};
          
        schoolData = await searchSchool(searchQuery, searchOptions);
        if (schoolData && schoolData.results && schoolData.results.length > 0) {
          console.log(`[Sync] Berhasil menemukan dengan nama lengkap: ${schoolData.results.length} hasil`);
        } else {
          searchAttempts.push("nama lengkap - tidak ditemukan hasil");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        searchAttempts.push(`nama lengkap - error: ${errorMessage}`);
        console.warn(`[Sync] Pencarian dengan nama lengkap gagal: ${errorMessage}`);
      }
    }
    
    // Strategi 3: Gunakan kata kunci utama (3 kata pertama) jika strategi sebelumnya gagal
    if (!schoolData || !schoolData.results || schoolData.results.length === 0) {
      const shorterQuery = searchQuery.split(' ').slice(0, 3).join(' '); // Ambil 3 kata pertama
      
      if (shorterQuery !== searchQuery) {
        console.log(`[Sync] Mencoba dengan kata kunci utama: "${shorterQuery}"`);
        
        try {
          const searchOptions = extractedLocation 
            ? { filterByLocation: true, location: extractedLocation }
            : {};
            
          schoolData = await searchSchool(shorterQuery, searchOptions);
          if (schoolData && schoolData.results && schoolData.results.length > 0) {
            console.log(`[Sync] Berhasil menemukan dengan kata kunci utama: ${schoolData.results.length} hasil`);
          } else {
            searchAttempts.push("kata kunci utama - tidak ditemukan hasil");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          searchAttempts.push(`kata kunci utama - error: ${errorMessage}`);
          console.warn(`[Sync] Pencarian dengan kata kunci utama gagal: ${errorMessage}`);
        }
      }
    }
    
    // Strategi 4: Gunakan kata pertama + jenjang (jika ada) jika strategi sebelumnya gagal
    if (!schoolData || !schoolData.results || schoolData.results.length === 0) {
      const words = searchQuery.split(' ');
      const firstWord = words[0];
      
      // Coba deteksi jenjang pendidikan dari nama
      const jenjangPattern = /(SD|MI|SMP|MTS|SMA|MA|SMK)/i;
      const jenjangMatch = searchQuery.match(jenjangPattern);
      const jenjang = jenjangMatch ? jenjangMatch[0].toUpperCase() : "";
      
      if (jenjang) {
        const jenjangQuery = `${firstWord} ${jenjang}`;
        console.log(`[Sync] Mencoba dengan kata pertama + jenjang: "${jenjangQuery}"`);
        
        try {
          const searchOptions = extractedLocation 
            ? { filterByLocation: true, location: extractedLocation }
            : {};
            
          schoolData = await searchSchool(jenjangQuery, searchOptions);
          if (schoolData && schoolData.results && schoolData.results.length > 0) {
            console.log(`[Sync] Berhasil menemukan dengan kata pertama + jenjang: ${schoolData.results.length} hasil`);
          } else {
            searchAttempts.push("kata pertama + jenjang - tidak ditemukan hasil");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          searchAttempts.push(`kata pertama + jenjang - error: ${errorMessage}`);
          console.warn(`[Sync] Pencarian dengan kata pertama + jenjang gagal: ${errorMessage}`);
        }
      }
    }
    
    // Strategi 5: Jika ada lokasi yang diekstraksi, coba cari langsung dengan lokasi tersebut
    if ((!schoolData || !schoolData.results || schoolData.results.length === 0) && extractedLocation) {
      try {
        console.log(`[Sync] Mencoba dengan pencarian berbasis lokasi: "${extractedLocation}"`);
        
        // Deteksi jenjang pendidikan
        const jenjangPattern = /(SD|MI|SMP|MTS|SMA|MA|SMK)/i;
        const jenjangMatch = searchQuery.match(jenjangPattern);
        const jenjang = jenjangMatch ? jenjangMatch[0].toUpperCase() : "";
        
        const searchOptions = {
          schoolType: jenjang,
          perPage: 50  // Ambil lebih banyak hasil untuk lokasi
        };
        
        const locationResults = await searchSchoolByLocation(extractedLocation, searchOptions);
        
        if (locationResults && locationResults.results && locationResults.results.length > 0) {
          console.log(`[Sync] Berhasil menemukan dengan pencarian lokasi: ${locationResults.results.length} hasil`);
          
          // Tambahkan skor kemiripan untuk mengurutkan hasilnya
          const resultsWithSimilarity = locationResults.results.map(school => ({
            ...school,
            similarity: calculateNameSimilarity(school.sekolah, namaSekolah)
          }));
          
          // Urutkan berdasarkan skor kemiripan
          resultsWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          
          // Gunakan hasil pencarian lokasi
          schoolData = {
            ...locationResults,
            results: resultsWithSimilarity
          };
        } else {
          searchAttempts.push("pencarian lokasi - tidak ditemukan hasil");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        searchAttempts.push(`pencarian lokasi - error: ${errorMessage}`);
        console.warn(`[Sync] Pencarian dengan lokasi gagal: ${errorMessage}`);
      }
    }
    
    // Jika semua strategi pencarian gagal
    if (!schoolData || !Array.isArray(schoolData.results) || schoolData.results.length === 0) {
      const errorDetails = searchAttempts.length > 0 
        ? `Percobaan: ${searchAttempts.join('; ')}` 
        : (searchError ? `Error: ${searchError instanceof Error ? searchError.message : String(searchError)}` : "Tidak ada data ditemukan");
      
      return { 
        success: false, 
        message: `Tidak ditemukan data sekolah yang cocok untuk "${namaSekolah}". ${errorDetails}` 
      };
    }
    
    // Log hasil pencarian
    console.log(`[Sync] Total hasil pencarian: ${schoolData.results.length} sekolah ditemukan`);
    
    // Fungsi untuk menghitung skor kemiripan nama (ditingkatkan)
    const calculateNameSimilarity = (name1: string, name2: string): number => {
      // Normalisasi teks (hilangkan kapitalisasi, normalisasi whitespace)
      const normalizeText = (text: string): string => {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
      };
      
      const n1 = normalizeText(name1);
      const n2 = normalizeText(name2);
      
      // Jika sama persis, berikan skor tertinggi
      if (n1 === n2) return 1;
      
      // Hitung berapa kata yang sama
      const words1 = n1.split(/\s+/);
      const words2 = n2.split(/\s+/);
      
      // Hitung exact match (berikan bobot lebih tinggi)
      let exactMatchCount = 0;
      let partialMatchCount = 0;
      let jenjangMatch = 0;
      let statusMatch = 0;
      
      // Deteksi jenjang, status dan kota
      const jenjangPattern = /\b(sd|smp|sma|smk|mi|mts|ma)\b/i;
      const statusPattern = /\b(negeri|swasta)\b/i;
      
      // Cek kecocokan jenjang
      const jenjang1 = n1.match(jenjangPattern);
      const jenjang2 = n2.match(jenjangPattern);
      if (jenjang1 && jenjang2 && jenjang1[0].toLowerCase() === jenjang2[0].toLowerCase()) {
        jenjangMatch = 1;
      }
      
      // Cek kecocokan status
      const status1 = n1.match(statusPattern);
      const status2 = n2.match(statusPattern);
      if (status1 && status2 && status1[0].toLowerCase() === status2[0].toLowerCase()) {
        statusMatch = 1;
      }
      
      for (const word1 of words1) {
        if (word1.length <= 2) continue; // Abaikan kata yang terlalu pendek
        
        // Cek exact match (bobot lebih tinggi)
        if (words2.includes(word1)) {
          exactMatchCount++;
        }
        // Cek partial match
        else if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
          partialMatchCount++;
        }
      }
      
      // Berikan skor berdasarkan proporsi kata yang cocok, dengan bobot pada exact match
      const totalWords = Math.max(words1.length, words2.length);
      const baseScore = (exactMatchCount * 1.5 + partialMatchCount * 0.7) / totalWords;
      
      // Berikan bonus untuk kecocokan jenjang, status, dan lokasi
      const bonusScore = (jenjangMatch * 0.3 + statusMatch * 0.2) / totalWords;
      
      return Math.min(1, baseScore + bonusScore); // Cap the score at 1
    };
    
    // Urutkan hasil berdasarkan kemiripan nama untuk mendapatkan hasil terbaik
    // Jika data sudah memiliki skor kemiripan (dari pencarian lokasi), gunakan itu
    let sortedResults;
    if (schoolData.results[0].similarity !== undefined) {
      sortedResults = [...schoolData.results];
    } else {
      sortedResults = [...schoolData.results].sort((a, b) => {
        const similarityA = calculateNameSimilarity(a.sekolah, namaSekolah);
        const similarityB = calculateNameSimilarity(b.sekolah, namaSekolah);
        return similarityB - similarityA; // Urutkan dari kemiripan tertinggi
      });
    }
    
    // Ambil hasil yang paling mirip
    const bestMatch = sortedResults[0];
    console.log(`[Sync] Kecocokan terbaik: ${bestMatch.sekolah} (NPSN: ${bestMatch.npsn})`);
    
    // Validasi data penting
    if (!bestMatch || !bestMatch.npsn || !bestMatch.sekolah) {
      return { 
        success: false, 
        message: "Data sekolah tidak lengkap atau tidak valid" 
      };
    }
    
    // Konversi koordinat menjadi number jika perlu
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    try {
      if (bestMatch.lintang && typeof bestMatch.lintang === 'string') {
        latitude = parseFloat(bestMatch.lintang);
        if (isNaN(latitude)) latitude = null;
      }
      
      if (bestMatch.bujur && typeof bestMatch.bujur === 'string') {
        longitude = parseFloat(bestMatch.bujur);
        if (isNaN(longitude)) longitude = null;
      }
    } catch (e) {
      console.warn("[Sync] Error parsing coordinates:", e);
    }
    
    // Membersihkan nilai kosong dan null
    const cleanValue = (value: unknown): string => {
      if (value === null || value === undefined || value === "") return "";
      return String(value).trim();
    };
    
    // Data untuk update
    const updateData = {
      npsn: cleanValue(bestMatch.npsn),
      alamat: cleanValue(bestMatch.alamat_jalan),
      kecamatan: cleanValue(bestMatch.kecamatan),
      kabupaten: cleanValue(bestMatch.kabupaten_kota),
      provinsi: cleanValue(bestMatch.propinsi),
      latitude: latitude,
      longitude: longitude,
      bentukSekolah: cleanValue(bestMatch.bentuk),
      statusSekolah: bestMatch.status === "N" ? "NEGERI" : (bestMatch.status === "S" ? "SWASTA" : cleanValue(bestMatch.status))
    };
    
    console.log(`[Sync] Mengirim data update untuk unitKerja ID: ${unitKerjaId}`);
    
    // Update data di database menggunakan fetch ke API internal
    try {
      // Tambahkan timeout untuk request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
      
      const updateResponse = await fetch(`/api/unit-kerja/${unitKerjaId}/sync-external-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sync-Operation": "true", // Add this header to bypass permission checks for sync operations
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`[Sync] API error (${updateResponse.status}):`, errorText);
        return { 
          success: false, 
          message: `API error (${updateResponse.status}): ${errorText}` 
        };
      }
      
      const result = await updateResponse.json();
      
      if (!result.success) {
        return { 
          success: false, 
          message: result.message || "Gagal menyinkronkan data ke database" 
        };
      }
      
      console.log(`[Sync] Sinkronisasi berhasil untuk ${bestMatch.sekolah}`);
      return {
        success: true,
        message: `Data sekolah berhasil disinkronkan`,
        data: updateData,
        sourceSchool: bestMatch
      };
    } catch (updateError) {
      console.error("[Sync] Error updating school data:", updateError);
      const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
      const isTimeoutError = updateError instanceof Error && updateError.name === 'AbortError';
      
      return { 
        success: false, 
        message: isTimeoutError 
          ? "Waktu permintaan habis. Server mungkin sibuk, silakan coba lagi nanti." 
          : `Kesalahan saat memperbarui data: ${errorMsg}`
      };
    }
  } catch (error) {
    console.error("[Sync] Error syncing school data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `Gagal menyinkronkan data: ${errorMessage}` 
    };
  }
};

// Helper function used in multiple places
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateNameSimilarity(name1: string, name2: string): number {
  // Normalisasi teks (hilangkan kapitalisasi, normalisasi whitespace)
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  };
  
  const n1 = normalizeText(name1);
  const n2 = normalizeText(name2);
  
  // Jika sama persis, berikan skor tertinggi
  if (n1 === n2) return 1;
  
  // Hitung berapa kata yang sama
  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  
  // Hitung exact match (berikan bobot lebih tinggi)
  let exactMatchCount = 0;
  let partialMatchCount = 0;
  let jenjangMatch = 0;
  let statusMatch = 0;
  
  // Deteksi jenjang dan status
  const jenjangPattern = /\b(sd|smp|sma|smk|mi|mts|ma)\b/i;
  const statusPattern = /\b(negeri|swasta)\b/i;
  
  // Cek kecocokan jenjang
  const jenjang1 = n1.match(jenjangPattern);
  const jenjang2 = n2.match(jenjangPattern);
  if (jenjang1 && jenjang2 && jenjang1[0].toLowerCase() === jenjang2[0].toLowerCase()) {
    jenjangMatch = 1;
  }
  
  // Cek kecocokan status
  const status1 = n1.match(statusPattern);
  const status2 = n2.match(statusPattern);
  if (status1 && status2 && status1[0].toLowerCase() === status2[0].toLowerCase()) {
    statusMatch = 1;
  }
  
  for (const word1 of words1) {
    if (word1.length <= 2) continue; // Abaikan kata yang terlalu pendek
    
    // Cek exact match (bobot lebih tinggi)
    if (words2.includes(word1)) {
      exactMatchCount++;
    }
    // Cek partial match
    else if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      partialMatchCount++;
    }
  }
  
  // Berikan skor berdasarkan proporsi kata yang cocok, dengan bobot pada exact match
  const totalWords = Math.max(words1.length, words2.length);
  const baseScore = (exactMatchCount * 1.5 + partialMatchCount * 0.7) / totalWords;
  
  // Berikan bonus untuk kecocokan jenjang dan status
  const bonusScore = (jenjangMatch * 0.3 + statusMatch * 0.2) / totalWords;
  
  return Math.min(1, baseScore + bonusScore); // Cap the score at 1
}
