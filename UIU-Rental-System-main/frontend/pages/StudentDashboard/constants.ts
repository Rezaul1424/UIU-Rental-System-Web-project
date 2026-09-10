import type { Notification } from '../../components/NotificationBell'

export const studentNotifs: Notification[] = [
  { id: 1, text: 'Your application was reviewed', sub: 'Studio near Gate 3 · Rahman Faruk', time: '20 min ago', read: false },
  { id: 2, text: 'New message from landlord', sub: 'Rahman Faruk · Studio near Gate 3', time: '1 hr ago', read: false },
  { id: 3, text: 'Rent payment reminder', sub: 'August 2026 · ৳4,200 due', time: '3 hr ago', read: false },
  { id: 4, text: 'Maintenance request update', sub: 'AC not cooling · In Progress', time: 'Yesterday', read: true },
]
