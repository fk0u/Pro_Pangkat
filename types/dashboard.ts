// Types for Dashboard Data

export interface UserInfo {
  id: string
  name: string
  nip: string
  role: string
  email?: string
  unitKerja: string | null
  wilayah: string | null
}

export interface DashboardStats {
  totalProposals: number
  pendingProposals?: number
  pendingDocuments: number
  approvedProposals?: number
  rejectedProposals?: number
  activeTimelines: number
  recentDocuments?: RecentDocument[]
}

export interface RecentDocument {
  id: string
  name: string
  documentType: string
  status: string
  uploadDate: string
  proposalId: string
}

export interface RecentActivityItem {
  id: string
  action: string
  details: Record<string, unknown>
  userName: string
  userRole?: string
  createdAt: string
  proposalId?: string
}

export interface UpcomingEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  priority: number
  isGlobal?: boolean
  type: string
}

export interface ChartDataPoint {
  month: string
  total: number
  approved: number
  rejected: number
  pending: number
}

export interface TimelineChartItem {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
}

export interface ChartData {
  proposals: ChartDataPoint[]
  timelines: TimelineChartItem[]
}

export interface EmployeeStats {
  totalProposals: number
  pendingProposals: number
  approvedProposals: number
  rejectedProposals: number
  latestProposal?: {
    id: string
    periode: string
    status: string
    createdAt: string
    documentCount: number
  }
}

export interface OperatorStats {
  totalProposals: number
  pendingProposals: number
  approvedProposals: number
  rejectedProposals: number
  employeesCount: number
  unitKerjaCount: number
  pendingReviews: {
    id: string
    periode: string
    status: string
    employeeName: string
    employeeNip: string
    unitKerja: string
    createdAt: string
  }[]
}

export interface AdminStats {
  totalUsers: number
  totalOperators: number
  totalEmployees: number
  totalUnitKerja: number
  proposalsByStatus: Array<{status: string, count: number}>
  proposalsByMonth: Array<{month: string, count: number}>
}

export interface DashboardData {
  userInfo: UserInfo
  stats: DashboardStats
  recentActivity: RecentActivityItem[]
  upcomingEvents: UpcomingEvent[]
  chartData: ChartData
  employeeStats?: EmployeeStats
  operatorStats?: OperatorStats
  adminStats?: AdminStats
}
