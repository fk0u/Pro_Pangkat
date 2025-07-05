export interface User {
  id: string
  nip: string
  name: string
  email: string
  role: "PEGAWAI" | "OPERATOR" | "ADMIN" | "OPERATOR_SEKOLAH" | "OPERATOR_UNIT_KERJA"
  unitKerja?: string
  wilayah?: string
  golongan?: string
  jabatan?: string
  jenisJabatan?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse {
  success: boolean
  message?: string
  error?: string
  data?: any
}

export interface PromotionProposal {
  id: string
  pegawaiId: string
  currentGolongan: string
  targetGolongan: string
  periode: string
  status: StatusProposal
  notes?: string
  createdAt: Date
  updatedAt: Date
  pegawai: User
  documents: ProposalDocument[]
}

export interface ProposalDocument {
  id: string
  proposalId: string
  documentType: string
  fileName: string
  filePath: string
  fileSize: number
  uploadedAt: Date
  status: "UPLOADED" | "VERIFIED" | "REJECTED"
  notes?: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  details?: string
  createdAt: Date
  user: User
}

export interface Timeline {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
}

export interface DashboardStats {
  overview: {
    totalProposals: number
    draftProposals: number
    submittedProposals: number
    processingProposals: number
    approvedProposals: number
    completedProposals: number
    rejectedProposals: number
    totalUsers: number
  }
  monthlyData: Array<{
    month: number
    monthName: string
    count: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  recentActivities: Array<{
    id: string
    action: string
    details?: string
    userName: string
    userRole: string
    createdAt: Date
  }>
}

export enum StatusProposal {
  DRAFT = "DRAFT",
  DIAJUKAN = "DIAJUKAN",
  DIPROSES_OPERATOR = "DIPROSES_OPERATOR",
  DISETUJUI_OPERATOR = "DISETUJUI_OPERATOR",
  DIPROSES_ADMIN = "DIPROSES_ADMIN",
  SELESAI = "SELESAI",
  DITOLAK = "DITOLAK",
}

export interface Province {
  id: string
  name: string
}

export interface Regency {
  id: string
  province_id: string
  name: string
}

export interface District {
  id: string
  regency_id: string
  name: string
}

export interface Village {
  id: string
  district_id: string
  name: string
}
