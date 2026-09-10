import type { Notification } from '../../components/NotificationBell'

export const adminNotifs: Notification[] = [
  { id: 1, text: 'New landlord registration pending approval', sub: 'Mizanur Hossain · L-2023-889', time: '10 min ago', read: false },
  { id: 2, text: 'New complaint submitted', sub: 'CMP-003 · Privacy Violation', time: '2 hr ago', read: false },
  { id: 3, text: 'Student account approved', sub: 'Rifat Hassan · EEE', time: '5 hr ago', read: true },
  { id: 4, text: 'Monthly report generated', sub: 'August 2026', time: 'Yesterday', read: true },
]

export const chatConversations = [
  { id: 'CH-001', student: 'Tanvir Ahmed', landlord: 'Rahman Faruk', property: 'Studio near Gate 3', propertyId: 'UIU-1001', lastMsg: '31 Jul 2026', status: 'Active', msgs: [{ from: 'student', text: 'Hello! How can I help you today?', time: '10:00' }, { from: 'landlord', text: 'I wanted to ask about the parking availability.', time: '10:05' }, { from: 'landlord', text: 'Yes, we have one parking spot included with your unit.', time: '10:06' }] },
  { id: 'CH-002', student: 'Sadia Islam', landlord: 'Nusrat Jahan', property: 'Shared Mess – South Campus', propertyId: 'UIU-1002', lastMsg: '29 Jul 2026', status: 'Active', msgs: [{ from: 'student', text: 'Is the mess still accepting new students?', time: '09:00' }, { from: 'landlord', text: 'Yes, we have 2 spots available from August.', time: '09:15' }] },
  { id: 'CH-003', student: 'Rifat Hassan', landlord: 'Karim Abdullah', property: 'Sublet – Bashundhara R/A', propertyId: 'UIU-1003', lastMsg: '27 Jul 2026', status: 'Inactive', msgs: [{ from: 'student', text: 'What is the earliest move-in date?', time: '14:00' }, { from: 'landlord', text: 'You can move in from August 1st.', time: '14:30' }] },
]

export const initialAdminComplaints = [
  { id: 'CMP-001', from: 'Tanvir Ahmed', fromType: 'Student', against: 'Rahman Faruk', property: 'Studio near Gate 3', category: 'Maintenance Neglect', date: '22 Jul 2026', status: 'Under Review', description: 'Reported the AC issue on July 10th but no response received from the landlord.' },
  { id: 'CMP-002', from: 'Rahman Faruk', fromType: 'Landlord', against: 'Sadia Islam', property: 'Shared Mess – South Campus', category: 'Late Payment', date: '18 Jul 2026', status: 'Submitted', description: 'Rent for July 2026 has not been paid despite multiple reminders.' },
  { id: 'CMP-003', from: 'Sadia Islam', fromType: 'Student', against: 'Nusrat Jahan', property: 'Shared Mess – South Campus', category: 'Privacy Violation', date: '10 Jul 2026', status: 'Responded', description: 'Landlord entered the room without prior notice on multiple occasions.' },
]

export const initialComplaintThreads = {
  'CMP-001': [{ from: 'Admin', text: 'We have received your complaint and are reviewing it.', date: '23 Jul 2026' }],
  'CMP-003': [{ from: 'Admin', text: 'We have contacted the landlord regarding this matter.', date: '11 Jul 2026' }, { from: 'Sadia Islam', text: 'Thank you for the quick response.', date: '11 Jul 2026' }],
}
