export type Role = 'admin' | 'landlord' | 'student' | 'guest'
export type Screen = 'landing' | 'app'
export type Modal = null | 'login' | 'signup'

export type Listing = {
  id: number
  title: string
  landlord: string
  type: string
  distance: string
  price: number
  status: string
  facilities: string[]
  image: string
  propertyId?: string
  rooms?: { bedroom: number; living: number; bathroom: number; kitchen: number; veranda: number }
  roomSizes?: Record<string, number>
  totalSize?: number
  roommateCapacity?: number
  parking?: string
  images?: { room: string; url: string }[]
}
