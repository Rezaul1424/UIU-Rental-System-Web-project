const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export type AdminAccountStatus = 'active' | 'pending' | 'suspended' | 'deactivated'
export type AdminAccountRole = 'landlord' | 'student'

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
  const result = await response.json() as { error?: { message?: string }; data?: AdminAccount[]; user?: AdminAccount }
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
