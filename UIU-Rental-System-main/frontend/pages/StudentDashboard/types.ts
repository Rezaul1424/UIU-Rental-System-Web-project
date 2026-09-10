export type StudentPage = 'overview' | 'browse' | 'listing-detail' | 'apply-form' | 'applications' | 'pay-rent' | 'receipts' | 'maintenance' | 'reviews' | 'review-history' | 'chat' | 'favorites' | 'settings'

export type AppStatus = 'under-review' | 'accepted' | 'rejected' | 'cancelled'

export type Application = { listingId: number; status: AppStatus; date: string }

export type Review = { id: number; landlord: string; property: string; listingId: number; landlordStars: number; propStars: number; text: string; date: string }

export type ChatMsg = { from: 'student' | 'landlord'; text: string }

export type MaintenanceRequest = { id: number; issue: string; status: string; date: string }

export type Complaint = { id: string; against: string; property: string; category: string; subject: string; description: string; date: string; status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed' }
