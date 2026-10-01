const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export type AdminAccountStatus = 'active' | 'pending' | 'suspended' | 'deactivated'
export type AdminAccountRole = 'landlord' | 'student'
export type AdminModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
export type AdminAvailabilityStatus = 'available' | 'occupied' | 'maintenance'

export type AdminAccount = {
  id: string
  name: string
  email: string
  role: AdminAccountRole
  status: AdminAccountStatus
  studentId?: string
  createdAt?: string
  propertyCount?: number
  applicationCount?: number
}

export type AdminListing = {
  id: string
  propertyCode: string
  title: string
  landlordId: string
  landlordName: string
  categoryId?: number
  categoryName?: string
  moderationStatus: AdminModerationStatus
  availabilityStatus: AdminAvailabilityStatus
  priceBDT: number
  createdAt: string
  updatedAt: string
}

export type AdminCategory = { id: string; name: string; createdAt: string }

export type AdminReportData = {
  generatedAt: string
  userGrowth: { month: string; students: number; landlords: number }[]
  rentCollection: { month: string; collected: number; pending: number; overdue: number; expected: number }[]
  listingActivity: { month: string; newListings: number }[]
  listingStatuses: { available: number; occupied: number; maintenance: number }
  listingTypes: { type: string; count: number }[]
  accountStatuses: {
    landlords: Record<'active' | 'pending' | 'suspended' | 'deactivated', number>
    students: Record<'active' | 'pending' | 'suspended' | 'deactivated', number>
  }
  maintenanceByMonth: { month: string; open: number; inProgress: number; resolved: number }[]
  maintenanceRequests: { id: number; property: string; tenant: string; issue: string; createdAt: string; status: string }[]
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('uiu_auth_token')
  if (!token) throw new Error('Please sign in with an administrator account to manage users.')

  const response = await fetch(`${API_BASE_URL}/api/v1/admin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const result = await response.json() as { error?: { message?: string } }
  if (!response.ok) {
    throw new Error(result.error?.message || `Admin request failed (${response.status}).`)
  }
  return result as T
}

export async function fetchAdminAccounts(role: AdminAccountRole): Promise<AdminAccount[]> {
  const accounts: AdminAccount[] = []
  let page = 1
  let totalPages = 1
  do {
    const params = new URLSearchParams({ role, page: String(page), limit: '100' })
    const response = await adminRequest<{ data: AdminAccount[]; meta: { totalPages: number } }>(`/users?${params}`)
    accounts.push(...response.data)
    totalPages = response.meta.totalPages
    page += 1
  } while (page <= totalPages)
  return accounts
}

export async function setAdminAccountStatus(
  userId: string,
  status: AdminAccountStatus,
  reason: string,
): Promise<AdminAccount> {
  const response = await adminRequest<{ user: AdminAccount }>(`/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
  return response.user
}

export async function fetchAdminListings(): Promise<AdminListing[]> {
  const listings: AdminListing[] = []
  let page = 1
  let totalPages = 1
  do {
    const params = new URLSearchParams({ page: String(page), limit: '100' })
    const response = await adminRequest<{ data: AdminListing[]; meta: { totalPages: number } }>(`/listings?${params}`)
    listings.push(...response.data)
    totalPages = response.meta.totalPages
    page += 1
  } while (page <= totalPages)
  return listings
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const response = await adminRequest<{ data: AdminCategory[] }>('/categories')
  return response.data
}

export async function createAdminCategory(name: string): Promise<AdminCategory> {
  const response = await adminRequest<{ data: AdminCategory }>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return response.data
}

export async function renameAdminCategory(id: string, name: string): Promise<AdminCategory> {
  const response = await adminRequest<{ data: AdminCategory }>(`/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
  return response.data
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await adminRequest<void>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function setAdminListingModerationStatus(
  identifier: string,
  status: AdminModerationStatus,
  reason: string,
): Promise<AdminListing> {
  const response = await adminRequest<{ data: AdminListing }>(`/listings/${encodeURIComponent(identifier)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
  return response.data
}

export async function setAdminListingCategory(
  identifier: string,
  categoryId: number | null,
): Promise<AdminListing> {
  const response = await adminRequest<{ data: AdminListing }>(`/listings/${encodeURIComponent(identifier)}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId }),
  })
  return response.data
}

export async function fetchAdminReportData(): Promise<AdminReportData> {
  const response = await adminRequest<{ data: AdminReportData }>('/reports')
  return response.data
}
