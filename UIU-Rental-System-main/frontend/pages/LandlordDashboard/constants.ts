import type { Notification } from '../../components/NotificationBell'

export const landlordNotifs: Notification[] = [
  { id: 1, text: 'New rental request received', sub: 'Tanvir Ahmed → Studio near Gate 3', time: '5 min ago', read: false },
  { id: 2, text: 'Maintenance request updated', sub: 'AC not cooling · Stage advanced', time: '1 hr ago', read: false },
  { id: 3, text: 'Rent payment received', sub: 'Sadia Islam · ৳2,800 · Jul 2026', time: '3 hr ago', read: true },
  { id: 4, text: 'Your listing was viewed 12 times today', sub: 'Studio near Gate 3', time: 'Yesterday', read: true },
]
