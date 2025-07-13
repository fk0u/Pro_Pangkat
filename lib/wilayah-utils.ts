export function getWilayahName(wilayahCode: string): string {
  const wilayahMap: Record<string, string> = {
    'BALIKPAPAN_PPU': 'Balikpapan & PPU',
    'KUTIM_BONTANG': 'Kutai Timur & Bontang',
    'KUKAR': 'Kutai Kartanegara',
    'KUBAR_MAHULU': 'Kutai Barat & Mahulu',
    'PASER': 'Paser',
    'BERAU': 'Berau',
    'SAMARINDA': 'Samarinda',
  }
  
  return wilayahMap[wilayahCode] || wilayahCode
}

export function formatWilayahForDisplay(wilayahCode: string | null | undefined | { id?: string; nama?: string; wilayah?: string }): string {
  if (!wilayahCode) return 'Belum Ditentukan'
  
  // Handle the case where wilayahCode is an object with a nama property
  if (typeof wilayahCode === 'object' && wilayahCode !== null) {
    // Periksa terlebih dahulu apakah properti ada sebelum mengaksesnya
    if (wilayahCode.nama) return wilayahCode.nama
    if (wilayahCode.id) return getWilayahName(wilayahCode.id)
    if (wilayahCode.wilayah) return getWilayahName(wilayahCode.wilayah)
    
    // Jika tidak ada properti yang dapat digunakan, kembalikan nilai default
    return 'Belum Ditentukan'
  }
  
  return getWilayahName(wilayahCode as string)
}

export const WILAYAH_OPTIONS = [
  { value: 'BALIKPAPAN_PPU', label: 'Balikpapan & PPU' },
  { value: 'KUTIM_BONTANG', label: 'Kutai Timur & Bontang' },
  { value: 'KUKAR', label: 'Kutai Kartanegara' },
  { value: 'KUBAR_MAHULU', label: 'Kutai Barat & Mahulu' },
  { value: 'PASER', label: 'Paser' },
  { value: 'BERAU', label: 'Berau' },
  { value: 'SAMARINDA', label: 'Samarinda' },
]
