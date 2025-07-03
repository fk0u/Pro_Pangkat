export const SCHOOL_POSITIONS = {
  GURU: {
    name: "Guru",
    levels: [
      { code: "GURU_PEMULA", name: "Guru Pemula", golongan: ["III/a", "III/b"] },
      { code: "GURU_MUDA", name: "Guru Muda", golongan: ["III/c", "III/d"] },
      { code: "GURU_MADYA", name: "Guru Madya", golongan: ["IV/a", "IV/b"] },
      { code: "GURU_UTAMA", name: "Guru Utama", golongan: ["IV/c", "IV/d", "IV/e"] },
    ],
  },
  TENAGA_KEPENDIDIKAN: {
    name: "Tenaga Kependidikan",
    positions: [
      { code: "PUSTAKAWAN", name: "Pustakawan", levels: ["Pemula", "Muda", "Madya", "Utama"] },
      { code: "LABORAN", name: "Laboran", levels: ["Pemula", "Muda", "Madya", "Utama"] },
      { code: "TEKNISI", name: "Teknisi", levels: ["Pemula", "Muda", "Madya", "Utama"] },
      { code: "ADMINISTRASI", name: "Tenaga Administrasi", levels: ["Pemula", "Muda", "Madya", "Utama"] },
    ],
  },
  STRUKTURAL: {
    name: "Struktural",
    positions: [
      { code: "KEPALA_SEKOLAH", name: "Kepala Sekolah", golongan: ["IV/a", "IV/b", "IV/c", "IV/d"] },
      { code: "WAKIL_KEPALA", name: "Wakil Kepala Sekolah", golongan: ["IV/a", "IV/b", "IV/c"] },
      { code: "KEPALA_TATA_USAHA", name: "Kepala Tata Usaha", golongan: ["III/c", "III/d", "IV/a"] },
    ],
  },
}

export const GOLONGAN_LEVELS = [
  "I/a",
  "I/b",
  "I/c",
  "I/d",
  "II/a",
  "II/b",
  "II/c",
  "II/d",
  "III/a",
  "III/b",
  "III/c",
  "III/d",
  "IV/a",
  "IV/b",
  "IV/c",
  "IV/d",
  "IV/e",
]

export const getNextGolongan = (currentGolongan: string): string | null => {
  const currentIndex = GOLONGAN_LEVELS.indexOf(currentGolongan)
  if (currentIndex === -1 || currentIndex === GOLONGAN_LEVELS.length - 1) {
    return null
  }
  return GOLONGAN_LEVELS[currentIndex + 1]
}

export const getPositionsByType = (type: keyof typeof SCHOOL_POSITIONS) => {
  return SCHOOL_POSITIONS[type]
}
