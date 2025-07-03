// Constants for Kalimantan Timur regions
export const KALIMANTAN_TIMUR_PROVINCE_ID = "64"

export const KALTIM_REGENCIES = [
  { id: "6401", name: "KABUPATEN PASER" },
  { id: "6402", name: "KABUPATEN KUTAI BARAT" },
  { id: "6403", name: "KABUPATEN KUTAI KARTANEGARA" },
  { id: "6404", name: "KABUPATEN KUTAI TIMUR" },
  { id: "6405", name: "KABUPATEN BERAU" },
  { id: "6409", name: "KABUPATEN PENAJAM PASER UTARA" },
  { id: "6411", name: "KABUPATEN MAHAKAM ULU" },
  { id: "6471", name: "KOTA BALIKPAPAN" },
  { id: "6472", name: "KOTA SAMARINDA" },
  { id: "6474", name: "KOTA BONTANG" },
]

export const BALIKPAPAN_DISTRICTS = [
  { id: "6471010", name: "BALIKPAPAN SELATAN" },
  { id: "6471020", name: "BALIKPAPAN TIMUR" },
  { id: "6471030", name: "BALIKPAPAN UTARA" },
  { id: "6471040", name: "BALIKPAPAN TENGAH" },
  { id: "6471050", name: "BALIKPAPAN KOTA" },
  { id: "6471060", name: "BALIKPAPAN BARAT" },
]

export const SAMARINDA_DISTRICTS = [
  { id: "6472010", name: "PALARAN" },
  { id: "6472020", name: "SAMARINDA ILIR" },
  { id: "6472030", name: "SAMARINDA ULU" },
  { id: "6472040", name: "SAMARINDA UTARA" },
  { id: "6472050", name: "SUNGAI KUNJANG" },
  { id: "6472060", name: "SAMBUTAN" },
  { id: "6472070", name: "SAMARINDA KOTA" },
  { id: "6472080", name: "SUNGAI PINANG" },
  { id: "6472090", name: "SAMARINDA SEBERANG" },
  { id: "6472100", name: "LOA JANAN ILIR" },
]

// API base URL for Indonesian regions
export const REGIONS_API_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api"

export interface RegionApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export const fetchProvinces = async () => {
  try {
    const response = await fetch(`${REGIONS_API_BASE}/provinces.json`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching provinces:", error)
    return []
  }
}

export const fetchRegencies = async (provinceId: string) => {
  try {
    const response = await fetch(`${REGIONS_API_BASE}/regencies/${provinceId}.json`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching regencies:", error)
    return []
  }
}

export const fetchDistricts = async (regencyId: string) => {
  try {
    const response = await fetch(`${REGIONS_API_BASE}/districts/${regencyId}.json`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching districts:", error)
    return []
  }
}

export const fetchVillages = async (districtId: string) => {
  try {
    const response = await fetch(`${REGIONS_API_BASE}/villages/${districtId}.json`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching villages:", error)
    return []
  }
}
