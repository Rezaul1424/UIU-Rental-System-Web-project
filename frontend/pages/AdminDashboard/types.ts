import type { Listing } from '../../types'
import type { LandlordRow, StudentRow } from '../../data'

export type AdminComplaint = {
  id: string
  from: string
  fromType: 'Student' | 'Landlord'
  against: string
  property: string
  category: string
  date: string
  status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'
  description: string
}

export type AdminComplaintThreadMessage = {
  from: string
  text: string
  date: string
}

export type AdminChatMessage = {
  from: 'student' | 'landlord'
  text: string
  time: string
}

export type AdminChatConversation = {
  id: string
  student: string
  landlord: string
  property: string
  propertyId: string
  lastMsg: string
  status: 'Active' | 'Inactive'
  msgs: AdminChatMessage[]
}

export type AdminOverviewProps = {
  listings: Listing[]
  lRows: LandlordRow[]
  sRows: StudentRow[]
  pendingLandlords: number
  pendingStudents: number
  setPage: (page: import('./Sidebar').AdminPage) => void
  openAdminListing: (listing: Listing) => void
}
