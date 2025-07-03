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

/**
 * Location-based school search API endpoint
 * This endpoint allows searching for schools by location keywords (province, district, city)
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const locationQuery = url.searchParams.get("location");
    const schoolTypeQuery = url.searchParams.get("type");  // Optional: filter by school type (SD, SMP, SMA, SMK)
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = parseInt(url.searchParams.get("perPage") || "20", 10);
    
    if (!locationQuery) {
      return createErrorResponse("Parameter lokasi (location) diperlukan", 400);
    }
    
    // Normalisasi query - memastikan pencarian case-insensitive
    const normalizedQuery = locationQuery.trim();
    
    // Deteksi jenis query: provinsi, kabupaten/kota, atau kecamatan
    const isProvince = /^(provinsi|prov)\s+/i.test(normalizedQuery);
    const isDistrict = /^(kabupaten|kab|kota)\s+/i.test(normalizedQuery);
    
    // Extract the actual location name without prefixes
    let locationName = normalizedQuery
      .replace(/^(provinsi|prov|kabupaten|kab|kota)\s+/i, '')
      .trim();
    
    console.log(`Searching schools in location: "${locationName}" (${isProvince ? 'Province' : (isDistrict ? 'District/City' : 'General')})`);
    
    // Include school type in search query if provided
    let searchQuery = locationName;
    if (schoolTypeQuery) {
      const normalizedType = schoolTypeQuery.trim().toUpperCase();
      searchQuery = `${normalizedType} ${locationName}`;
      console.log(`Filtering by school type: ${normalizedType}`);
    }
    
    // Encode query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Try each API endpoint until one succeeds
    let apiResponse: { url: string; data: ApiResponse } | null = null;
    const errors: string[] = [];
    
    for (const baseUrl of API_ENDPOINTS) {
      const apiUrl = `${baseUrl}${encodedQuery}`;
      console.log(`Trying API endpoint: ${apiUrl}`);
      
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
          console.log(`Found results from ${baseUrl}`);
          break;
        }
        
        // If no results, we'll continue to next endpoint
        console.log(`No results from ${baseUrl}, trying next endpoint`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${baseUrl} - ${errorMessage}`);
        console.warn(`Error fetching from ${baseUrl}:`, errorMessage);
        // Continue to next endpoint
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
    let responsePage = 1;
    let responsePerPage = perPage;
    
    // Fungsi untuk memastikan nilai selalu string
    const ensureString = (value: any): string => {
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
        propinsi: ensureString(school.propinsi || school.provinsi)
      }));
      responsePage = response.page || 1;
      responsePerPage = response.per_page || perPage;
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
          propinsi: ensureString(school.propinsi || school.provinsi)
        }));
        responsePage = response.page || 1;
        responsePerPage = response.perPage || perPage;
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
            propinsi: ensureString(item.provinsi || item.propinsi)
          }));
      }
    }
    
    // Filter schools by location
    let filteredSchools = allSchools;
    
    // Apply location filtering based on the query type
    if (isProvince) {
      // Filter by province
      filteredSchools = allSchools.filter(school => 
        school.propinsi && 
        school.propinsi.toLowerCase().includes(locationName.toLowerCase())
      );
    } else if (isDistrict) {
      // Filter by district/city
      filteredSchools = allSchools.filter(school => 
        school.kabupaten_kota && 
        school.kabupaten_kota.toLowerCase().includes(locationName.toLowerCase())
      );
    } else {
      // General location search - check province, district/city, and subdistrict
      filteredSchools = allSchools.filter(school => 
        (school.propinsi && school.propinsi.toLowerCase().includes(locationName.toLowerCase())) ||
        (school.kabupaten_kota && school.kabupaten_kota.toLowerCase().includes(locationName.toLowerCase())) ||
        (school.kecamatan && school.kecamatan.toLowerCase().includes(locationName.toLowerCase()))
      );
    }
    
    // Apply school type filtering if provided
    if (schoolTypeQuery) {
      const normalizedType = schoolTypeQuery.trim().toUpperCase();
      filteredSchools = filteredSchools.filter(school => 
        school.bentuk && school.bentuk.toUpperCase().includes(normalizedType)
      );
    }
    
    // Sort schools alphabetically by name
    filteredSchools.sort((a, b) => a.sekolah.localeCompare(b.sekolah));
    
    // Apply pagination
    const total = filteredSchools.length;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedSchools = filteredSchools.slice(startIndex, endIndex);
    
    // Log the result and return
    console.log(`Found ${filteredSchools.length} schools in location "${locationName}" (showing ${paginatedSchools.length})`);
    
    return createSuccessResponse({
      location: locationQuery,
      schoolType: schoolTypeQuery || null,
      results: paginatedSchools,
      total: total,
      page: page,
      perPage: perPage,
      totalPages: Math.ceil(total / perPage)
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error in location-based school search API:", errorMessage);
    return createErrorResponse(errorMessage || "Terjadi kesalahan tak terduga saat mencari data sekolah berdasarkan lokasi");
  }
});
