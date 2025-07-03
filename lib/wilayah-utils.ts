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

export function formatWilayahForDisplay(wilayahCode: string | null | undefined): string {
  if (!wilayahCode) return 'Belum Ditentukan'
  return getWilayahName(wilayahCode)
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
