import { NextRequest } from "next/server";
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

interface SchoolData {
  npsn: string;
  sekolah: string;
  bentuk?: string;
  status?: string;
  alamat_jalan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  propinsi?: string;
  lintang?: string;
  bujur?: string;
  similarity?: number; // Added for sorting by similarity
}

interface ApiSchoolData {
  id?: string;
  npsn?: string;
  name?: string;
  sekolah?: string;
  bentuk?: string;
  jenis?: string;
  status?: string;
  alamat?: string;
  jalan?: string;
  kecamatan?: string;
  kabupaten?: string;
  kota?: string;
  provinsi?: string;
  propinsi?: string;
  [key: string]: unknown;
}

// API response types for different endpoints
interface ApiResponse1 {
  dataSekolah?: ApiSchoolData[];
  page?: number;
  per_page?: number;
  [key: string]: unknown;
}

interface ApiResponse2 {
  results?: ApiSchoolData[];
  page?: number;
  perPage?: number;
  total?: number;
  [key: string]: unknown;
}

type ApiResponse = ApiResponse1 | ApiResponse2 | ApiSchoolData[];

// Define multiple API endpoints for fallback
const API_ENDPOINTS = [
  'https://api-sekolah-indonesia.vercel.app/sekolah/s?sekolah=',
  'https://api-sekolah.vercel.app/api/sekolah/search?q=',
  'https://www.dapodik.co.id/api/search/school?term='
];

export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = parseInt(url.searchParams.get("perPage") || "10", 10);
    const filterByLocation = url.searchParams.get("filterByLocation") === "true";
    const location = url.searchParams.get("location") || "";
    
    if (!query) {
      return createErrorResponse("Parameter pencarian (q) diperlukan", 400);
    }
    
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
    
    // Fungsi untuk menghitung skor kemiripan nama
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
    };
    
    // Normalisasi query - memastikan pencarian case-insensitive
    const normalizedQuery = query.trim();
    
    // Coba beberapa variasi kapitalisasi untuk meningkatkan peluang hasil
    const queryVariations = [
      normalizedQuery,                                           // Original 
      normalizedQuery.toLowerCase(),                             // lowercase
      normalizedQuery.toUpperCase(),                             // UPPERCASE
      standardizeSchoolName(normalizedQuery)                     // Standardized format
    ];
    
    console.log("Searching with query variations:", queryVariations);

    // Encode query for URL - gunakan query asli untuk log saja
    console.log(`Encoded query: ${encodeURIComponent(normalizedQuery)}`);
    
    // Try each API endpoint until one succeeds
    let apiResponse: { url: string; data: ApiResponse } | null = null;
    const errors: string[] = [];
    
    // Prioritaskan query dengan format standar (jenjang: KAPITAL, negeri: Kapital di awal, kota/kab: Kapital di awal)
    const priorityQuery = standardizeSchoolName(normalizedQuery);
    
    // Log informasi pencarian
    console.log(`Original query: "${normalizedQuery}"`);
    console.log(`Standardized query: "${priorityQuery}"`);
    
    // Detect if this is a location-based search
    const isLocationSearch = /\b(di|dari|kota|kabupaten|provinsi|kec|kecamatan|prov)\b/i.test(normalizedQuery);
    
    // If this looks like a location search and no explicit location filter is set,
    // we should extract the location part
    let extractedLocation = "";
    if (isLocationSearch && !filterByLocation) {
      // Try to extract location from the query
      const locationPattern = /\b(?:di|dari|kota|kabupaten|provinsi|kec|kecamatan|prov)?\s*([a-z\s]+)$/i;
      const locationMatch = normalizedQuery.match(locationPattern);
      
      if (locationMatch && locationMatch[1]) {
        extractedLocation = locationMatch[1].trim();
        console.log(`Detected location in query: "${extractedLocation}"`);
      }
    }
    
    // Use explicit location filter or extracted location
    const locationFilter = filterByLocation ? location : extractedLocation;
    
    for (const baseUrl of API_ENDPOINTS) {
      const apiUrl = `${baseUrl}${encodeURIComponent(priorityQuery)}`;
      console.log(`Trying API endpoint with standardized query: ${apiUrl}`);
      
      try {
        // Set a timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(apiUrl, {
          headers: {
            "Accept": "application/json",
          },
          signal: controller.signal,
          cache: "no-store"
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error text');
          throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json() as ApiResponse;
        apiResponse = { url: apiUrl, data };
        
        // If we got a successful response with data, break the loop
        if (hasResults(data)) {
          console.log(`Found results with standardized query`);
          break;
        }
        
        // If no results, we'll continue to next endpoint
        console.log(`No results from ${baseUrl} with standardized query, trying next endpoint`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${baseUrl} (standardized query) - ${errorMessage}`);
        console.warn(`Error fetching from ${baseUrl}:`, errorMessage);
        // Continue to next endpoint
      }
    }
    
    // If no results with standardized query, try other variations
    if (!apiResponse || !hasResults(apiResponse.data)) {
      // Try alternative capitalizations if standardized query didn't work
      const alternativeQueries = [
        normalizedQuery,                            // Original
        normalizedQuery.toLowerCase(),              // lowercase
        normalizedQuery.toUpperCase(),              // UPPERCASE
      ].filter(q => q !== priorityQuery); // Filter out duplicates
      
      console.log("No results with standardized query, trying alternative capitalizations:", alternativeQueries);
      
      for (const altQuery of alternativeQueries) {
        // Only try alternative queries if they're different from the standardized one
        if (altQuery === priorityQuery) continue;
        
        for (const baseUrl of API_ENDPOINTS) {
          if (apiResponse && hasResults(apiResponse.data)) break; // Stop if we already have results
          
          const apiUrl = `${baseUrl}${encodeURIComponent(altQuery)}`;
          console.log(`Trying alternative capitalization: ${apiUrl}`);
          
          try {
            // Set a timeout for the fetch operation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(apiUrl, {
              headers: {
                "Accept": "application/json",
              },
              signal: controller.signal,
              cache: "no-store"
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              continue; // Just try next endpoint for alternative queries
            }
            
            const data = await response.json() as ApiResponse;
            
            // Only use this response if it has results
            if (hasResults(data)) {
              apiResponse = { url: apiUrl, data };
              console.log(`Found results with alternative capitalization: ${altQuery}`);
              break; // Break out of endpoints loop
            }
          } catch {
            // Just continue for alternative queries
            continue;
          }
        }
        
        // If we got results with this alternative query, stop trying others
        if (apiResponse && hasResults(apiResponse.data)) break;
      }
    }
    
    // Helper to check if a response has results
    function hasResults(data: ApiResponse): boolean {
      if (Array.isArray(data) && data.length > 0) return true;
      
      // Check ApiResponse1 format
      const asResp1 = data as ApiResponse1;
      if (asResp1 && asResp1.dataSekolah && Array.isArray(asResp1.dataSekolah) && asResp1.dataSekolah.length > 0) {
        return true;
      }
      
      // Check ApiResponse2 format
      const asResp2 = data as ApiResponse2;
      if (asResp2 && asResp2.results && Array.isArray(asResp2.results) && asResp2.results.length > 0) {
        return true;
      }
      
      return false;
    }
    
    // If all API calls failed
    if (!apiResponse) {
      console.error("All API endpoints failed:", errors.join("; "));
      return createErrorResponse(
        "Gagal mengambil data dari semua endpoint API. Silakan coba lagi nanti.", 
        503
      );
    }
    
    // Process the successful response based on which endpoint succeeded
    const { url: successUrl, data } = apiResponse;
    let allSchools: SchoolData[] = [];
    
    // Fungsi untuk memastikan nilai selalu string
    const ensureString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };
    
    // Handle different response structures based on which API was used
    if (successUrl.includes('api-sekolah-indonesia.vercel.app')) {
      // First API format (ApiResponse1)
      const response = data as ApiResponse1;
      const dataSekolah = Array.isArray(response.dataSekolah) ? response.dataSekolah : [];
      allSchools = dataSekolah.filter((school) => 
        school && typeof school === 'object' && (school.npsn || school.id) && (school.sekolah || school.name)
      ).map((school) => ({
        npsn: ensureString(school.npsn || school.id),
        sekolah: ensureString(school.sekolah || school.name),
        bentuk: ensureString(school.bentuk || school.jenis),
        status: ensureString(school.status),
        alamat_jalan: ensureString(school.alamat_jalan || school.alamat || school.jalan),
        kecamatan: ensureString(school.kecamatan),
        kabupaten_kota: ensureString(school.kabupaten_kota || school.kabupaten || school.kota),
        propinsi: ensureString(school.propinsi || school.provinsi),
        lintang: ensureString(school.lintang),
        bujur: ensureString(school.bujur)        }));
        // Page info (not used in final response as we do our own pagination)
        console.log(`API pagination: page ${response.page || 1}, perPage ${response.per_page || perPage}`);
      }
    else if (successUrl.includes('api-sekolah.vercel.app')) {
      // Second API format (ApiResponse2)
      const response = data as ApiResponse2;
      if (response.results && Array.isArray(response.results)) {
        allSchools = response.results.filter((school) => 
          school && typeof school === 'object' && (school.npsn || school.id) && (school.sekolah || school.name)
        ).map((school) => ({
          npsn: ensureString(school.npsn || school.id),
          sekolah: ensureString(school.sekolah || school.name),
          bentuk: ensureString(school.bentuk || school.jenis),
          status: ensureString(school.status),
          alamat_jalan: ensureString(school.alamat_jalan || school.alamat || school.jalan),
          kecamatan: ensureString(school.kecamatan),
          kabupaten_kota: ensureString(school.kabupaten_kota || school.kabupaten || school.kota),
          propinsi: ensureString(school.propinsi || school.provinsi),
          lintang: ensureString(school.lintang),
          bujur: ensureString(school.bujur)
        }));
        // Page info (not used in final response as we do our own pagination)
        console.log(`API pagination: page ${response.page || 1}, perPage ${response.perPage || perPage}`);
      }
    }
    else if (successUrl.includes('dapodik.co.id')) {
      // Third API format - convert to our required format (array)
      if (Array.isArray(data)) {
        allSchools = data
          .filter((item) => item && (item.id || item.npsn) && (item.name || item.sekolah))
          .map((item) => ({
            npsn: ensureString(item.id || item.npsn),
            sekolah: ensureString(item.name || item.sekolah),
            bentuk: ensureString(item.bentuk || item.jenis),
            status: ensureString(item.status),
            alamat_jalan: ensureString(item.alamat || item.jalan),
            kecamatan: ensureString(item.kecamatan),
            kabupaten_kota: ensureString(item.kabupaten || item.kota),
            propinsi: ensureString(item.provinsi || item.propinsi),
            lintang: ensureString(item.lintang),
            bujur: ensureString(item.bujur)
          }));
      }
    }
    
    // Add similarity scores for better ranking
    allSchools = allSchools.map(school => ({
      ...school,
      similarity: calculateNameSimilarity(school.sekolah, normalizedQuery)
    }));
    
    // Apply location filtering if requested
    let filteredSchools = allSchools;
    if (locationFilter) {
      const normalizedLocation = locationFilter.toLowerCase();
      console.log(`Filtering schools by location: "${normalizedLocation}"`);
      
      filteredSchools = allSchools.filter(school => 
        (school.propinsi && school.propinsi.toLowerCase().includes(normalizedLocation)) ||
        (school.kabupaten_kota && school.kabupaten_kota.toLowerCase().includes(normalizedLocation)) ||
        (school.kecamatan && school.kecamatan.toLowerCase().includes(normalizedLocation))
      );
      
      console.log(`After location filtering: ${filteredSchools.length} schools match`);
    }
    
    // Sort schools by similarity score (descending)
    filteredSchools.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedSchools = filteredSchools.slice(startIndex, endIndex);
    
    // Log the result and return
    console.log(`Found ${filteredSchools.length} schools (showing ${paginatedSchools.length})`);
    
    return createSuccessResponse({
      query,
      results: paginatedSchools,
      total: filteredSchools.length,
      page: page,
      perPage: perPage,
      totalPages: Math.ceil(filteredSchools.length / perPage),
      locationFilter: locationFilter || null
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error in school search API:", errorMessage);
    return createErrorResponse(errorMessage || "Terjadi kesalahan tak terduga saat mencari data sekolah");
  }
});
