export type { AdminComplaint } from '../../api/admin'

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