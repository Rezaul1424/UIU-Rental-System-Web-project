export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type MaintStage = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type MaintComment = { from: 'landlord' | 'tenant'; text: string; date: string }
export type MaintReq = {
  id: number
  title: string
  description: string
  listing: string
  tenant: string
  date: string
  priority: Priority
  stage: MaintStage
  estimatedDate: string
  comments: MaintComment[]
  hasPhotos: boolean
}
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type RequestItem = {
  id: number
  student: string
  studentId: string
  dept: string
  phone: string
  moveIn: string
  employment: string
  message: string
  listing: string
  date: string
  status: RequestStatus
}
export type TenantContact = { name: string; listing: string; category: 'current' | 'potential' }
export type ChatMsg = { from: 'landlord' | 'tenant'; text: string }
export type RentTransaction = { id: number; tenant: string; listing: string; amount: number; month: string; paid: boolean }
export type LandlordComplaint = {
  id: string
  against: string
  property: string
  category: string
  subject: string
  description: string
  date: string
  status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'
}
