import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const unitKerjaData = [
  // Balikpapan dan PPU (Gabungan sesuai enum BALIKPAPAN_PPU)
  { nama: 'SMK N 4 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 9 BALIKPAPAN UTARA', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SLB NEGERI BALIKPAPAN', jenjang: 'SLB', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 1 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 6 BALIKPAPAN UTARA', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 3 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 5 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 8 BALIKPAPAN BARAT', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 1 BALIKPAPAN', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 2 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 7 BALIKPAPAN TIMUR', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 3 BALIKPAPAN', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 6 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 4 BALIKPAPAN SELATAN', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 2 BALIKPAPAN UTARA', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 7 BALIKPAPAN', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 5 BALIKPAPAN SELATAN', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },

  // PPU (Penajam Paser Utara) - masuk dalam enum BALIKPAPAN_PPU
  { nama: 'SMK N 4 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 5 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SLB NEGERI PENAJAM', jenjang: 'SLB', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 3 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 6 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 4 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 6 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 1 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 2 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMK N 2 PPU', jenjang: 'SMK', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 5 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 3 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 1 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },
  { nama: 'SMA N 8 PPU', jenjang: 'SMA', wilayah: 'BALIKPAPAN_PPU', status: 'Aktif' },

  // Kutai Timur dan Bontang (Gabungan sesuai enum KUTIM_BONTANG)
  { nama: 'SMA N 1 KALIORANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 KARANGAN', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 SANGATTA UTARA', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 KAUBUN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 BATU AMPAR', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 SANGATTA UTARA', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 TELEN', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 2 SANGATTA UTARA', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA WAHAU', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 2 MUARA ANCALONG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 TELUK PANDAN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 BENGALON', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 KONGBENG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 2 BENGALON', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 BENGALON', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 LONG MESANGAT', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 KALIORANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA WAHAU', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 2 SANGATTA UTARA', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 SANGATTA SELATAN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SLB NEGERI KUTAI TIMUR', jenjang: 'SLB', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 KONGBENG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 SANGKULIRANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 SANDARAN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 RANTAU PULUNG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 2 MUARA WAHAU', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA ANCALONG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 2 SANGKULIRANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA BENGKAL', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 2 BUSANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA BENGKAL', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 BUSANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 RANTAU PULUNG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 SANGKULIRANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 2 SANDARAN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 KARANGAN', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },

  // Bontang (masuk dalam enum KUTIM_BONTANG)
  { nama: 'SMA N 2 BONTANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 1 BONTANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 3 BONTANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 2 BONTANG', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 3 BONTANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMA N 1 BONTANG', jenjang: 'SMA', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SLB NEGERI BONTANG', jenjang: 'SLB', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },
  { nama: 'SMK N 4 Bontang', jenjang: 'SMK', wilayah: 'KUTIM_BONTANG', status: 'Aktif' },

  // Kutai Kartanegara (sesuai enum KUKAR)
  { nama: 'SMA N 1 MUARA BADAK', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 SEBULU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 MARANG KAYU', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 ANGGANA', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 3 MARANG KAYU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 TENGGARONG', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 TENGGARONG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 SAMBOJA', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 2 TENGGARONG', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 LOA JANAN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 TENGGARONG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 TENGGARONG SEBERANG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA MUNTAI', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA JAWA', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 MARANG KAYU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 SANGA SANGA', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 KOTA BANGUN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 LOA KULU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SLB N KUTAI KARTANEGARA', jenjang: 'SLB', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 TENGGARONG SEBERANG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 KOTA BANGUN', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 SEBULU', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 2 SEBULU', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 ANGGANA', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 SEBULU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 3 TENGGARONG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 MARANG KAYU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA KAMAN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA WIS', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 MUARA KAMAN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 3 TENGGARONG', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 KOTA BANGUN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 SAMBOJA', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 LOA JANAN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 TABANG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 3 MUARA MUNTAI', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 LOA KULU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 KEMBANG JANGGUT', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 MUARA MUNTAI', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 LOA JANAN', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 MUARA BADAK', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA JAWA', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 TENGGARONG SEBERANG', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 KENOHAN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA BADAK', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 KEMBANG JANGGUT', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA MUNTAI', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMK N 1 MUARA KAMAN', jenjang: 'SMK', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 SANGA SANGA', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 1 SAMBOJA', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 3 LOA KULU', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 3 KOTA BANGUN', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },
  { nama: 'SMA N 2 TABANG', jenjang: 'SMA', wilayah: 'KUKAR', status: 'Aktif' },

  // Kutai Barat dan Mahakam Ulu (sesuai enum KUBAR_MAHULU)
  { nama: 'SMA N 1 MUARA LAWA', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA PAHU', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 1 SENDAWAR', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LONG HUBUNG', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 3 SENDAWAR', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LONG IRAM', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 SENDAWAR', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 1 TERING', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 JEMPANG', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LONG APARI', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 2 SENDAWAR', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LINGGANG BIGUNG', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 1 MOOK MANAAR BULATN', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 3 SENDAWAR', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 SILUQ NGURAI', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 BONGAN', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 PENYINGGAHAN', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 1 LINGGANG BIGUNG', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LONG PAHANGAI', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 4 SENDAWAR', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 MOOK MANAAR BULATN', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 LONG BAGUN', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMK N 1 BONGAN', jenjang: 'SMK', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 BENTIAN BESAR', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 DAMAI', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 2 LINGGANG BIGUNG', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 1 NYUATAN', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SMA N 2 SENDAWAR', jenjang: 'SMA', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },
  { nama: 'SLB N LONG BAGUN', jenjang: 'SLB', wilayah: 'KUBAR_MAHULU', status: 'Aktif' },

  // Paser (sesuai enum PASER)
  { nama: 'SMK N 2 TANAH GROGOT', jenjang: 'SMK', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 BATU SOPANG', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 LONG IKIS', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 LONG KALI', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 TANAH GROGOT', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMK N 3 TANAH GROGOT', jenjang: 'SMK', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMK N 1 TANAH GROGOT', jenjang: 'SMK', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMK N 4 TANAH GROGOT', jenjang: 'SMK', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 BATU ENGAU', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 KUARO', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA KOMAM', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 MUARA SAMU', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 2 LONG IKIS', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 TANJUNG HARAPAN', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 2 BATU ENGAU', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SLB NEGERI TANAH GROGOT', jenjang: 'SLB', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 1 PASIR BELENGKONG', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 2 TANAH GROGOT', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 3 LONG IKIS', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },
  { nama: 'SMA N 2 PASIR BELENGKONG', jenjang: 'SMA', wilayah: 'PASER', status: 'Aktif' },

  // Berau (sesuai enum BERAU)
  { nama: 'SLB N BERAU', jenjang: 'SLB', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 5 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 11 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 3 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 9 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 3 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 6 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 8 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 1 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 7 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 6 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 12 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 2 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 4 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 4 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 5 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 8 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 13 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 14 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMK N 2 BERAU', jenjang: 'SMK', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 10 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 7 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 1 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },
  { nama: 'SMA N 15 BERAU', jenjang: 'SMA', wilayah: 'BERAU', status: 'Aktif' },

  // Samarinda (sesuai enum SAMARINDA)
  { nama: 'SMK N 05 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 04 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 13 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 06 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 11 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK NEGERI 8 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 08 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 02 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 18 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 11 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK NEGERI 9 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SLB N PEMBINA PEMPROV. KALTIM', jenjang: 'SLB', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 02 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 12 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 06 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 09 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 12 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 03 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 15 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 15 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 14 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 16 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 01 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK NEGERI 7 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 10 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 07 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 14 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 20 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 04 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 03 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 10 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 16 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 17 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK-SPP NEGERI SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 05 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA N 01 SAMARINDA', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 17 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK N 19 SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMA NEGERI KHUSUS OLAHRAGAWAN', jenjang: 'SMA', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SLB NEGERI SAMARINDA', jenjang: 'SLB', wilayah: 'SAMARINDA', status: 'Aktif' },
  { nama: 'SMK NEGERI PELAYARAN KALIMANTAN SAMARINDA', jenjang: 'SMK', wilayah: 'SAMARINDA', status: 'Aktif' }
]

async function seedUnitKerja() {
  console.log('🌱 Mulai seeding 242 unit kerja...')

  try {
    // Hapus data lama jika ada
    await prisma.unitKerja.deleteMany({})
    console.log('✅ Data unit kerja lama berhasil dihapus')

    // Insert data baru menggunakan createMany untuk performa lebih baik
    const result = await prisma.unitKerja.createMany({
      data: unitKerjaData,
      skipDuplicates: true
    })

    console.log(`✅ Berhasil menambahkan ${result.count} unit kerja`)
    
    // Tampilkan ringkasan per wilayah
    const summary = await prisma.unitKerja.groupBy({
      by: ['wilayah'],
      _count: {
        id: true
      },
      orderBy: {
        wilayah: 'asc'
      }
    })

    console.log('\n📊 Ringkasan Unit Kerja per Wilayah:')
    summary.forEach(item => {
      console.log(`   ${item.wilayah}: ${item._count.id} sekolah`)
    })

    const total = await prisma.unitKerja.count()
    console.log(`\n🎉 Total unit kerja dalam database: ${total}`)

  } catch (error) {
    console.error('❌ Error saat seeding unit kerja:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Jalankan seeding
if (require.main === module) {
  seedUnitKerja()
    .then(() => {
      console.log('✅ Seeding unit kerja selesai!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding gagal:', error)
      process.exit(1)
    })
}

export default seedUnitKerja
