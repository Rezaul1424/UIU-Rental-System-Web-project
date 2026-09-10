import type { Listing } from './types'

export const listings: Listing[] = [
  {
    id: 1, title: 'Studio near Gate 3', landlord: 'Rahman Faruk', type: 'Single',
    distance: '0.3 km', price: 4200, status: 'available',
    facilities: ['AC', 'WiFi', 'Laundry'],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1001',
    rooms: { bedroom: 1, living: 0, bathroom: 1, kitchen: 1, veranda: 0 },
    roomSizes: { bedroom: 120, bathroom: 45, kitchen: 60 },
    totalSize: 280,
    roommateCapacity: 1,
    parking: 'Not Available',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&auto=format' },
      { room: 'Kitchen', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
  {
    id: 2, title: 'Shared Mess – South Campus', landlord: 'Nusrat Jahan', type: 'Mess',
    distance: '0.6 km', price: 2800, status: 'available',
    facilities: ['Meals', 'WiFi', 'CCTV'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1002',
    rooms: { bedroom: 2, living: 1, bathroom: 2, kitchen: 1, veranda: 0 },
    roomSizes: { bedroom: 100, living: 150, bathroom: 40, kitchen: 70 },
    totalSize: 460,
    roommateCapacity: 4,
    parking: 'Not Available',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop&auto=format' },
      { room: 'Living Room', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop&auto=format' },
      { room: 'Kitchen', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
  {
    id: 3, title: 'Sublet – Bashundhara R/A', landlord: 'Karim Abdullah', type: 'Sublet',
    distance: '1.2 km', price: 3500, status: 'available',
    facilities: ['AC', 'Parking', 'Generator'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1003',
    rooms: { bedroom: 2, living: 1, bathroom: 2, kitchen: 1, veranda: 1 },
    roomSizes: { bedroom: 140, living: 180, bathroom: 50, kitchen: 75, veranda: 40 },
    totalSize: 620,
    roommateCapacity: 2,
    parking: 'Available (Motorcycle)',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop&auto=format' },
      { room: 'Living Room', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop&auto=format' },
      { room: 'Balcony', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=500&fit=crop&auto=format' },
      { room: 'Kitchen', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
  {
    id: 4, title: 'Shared Room Block C', landlord: 'Salma Begum', type: 'Shared',
    distance: '0.9 km', price: 2200, status: 'occupied',
    facilities: ['WiFi', 'CCTV'],
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1004',
    rooms: { bedroom: 1, living: 0, bathroom: 1, kitchen: 0, veranda: 0 },
    roomSizes: { bedroom: 90, bathroom: 35 },
    totalSize: 180,
    roommateCapacity: 2,
    parking: 'Not Available',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
  {
    id: 5, title: 'Bachelor Flat – North Side', landlord: 'Hasan Mahmud', type: 'Single',
    distance: '0.4 km', price: 5500, status: 'available',
    facilities: ['AC', 'WiFi', 'Gas', 'Lift'],
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1005',
    rooms: { bedroom: 1, living: 1, bathroom: 1, kitchen: 1, veranda: 0 },
    roomSizes: { bedroom: 130, living: 160, bathroom: 55, kitchen: 65 },
    totalSize: 440,
    roommateCapacity: 1,
    parking: 'Not Available',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&auto=format' },
      { room: 'Living Room', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop&auto=format' },
      { room: 'Kitchen', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
  {
    id: 6, title: 'Family Flat – East Gate', landlord: 'Amina Khatun', type: 'Sublet',
    distance: '1.8 km', price: 7800, status: 'available',
    facilities: ['AC', 'Parking', 'Generator', 'Lift'],
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=380&fit=crop&auto=format',
    propertyId: 'UIU-1006',
    rooms: { bedroom: 2, living: 1, bathroom: 2, kitchen: 1, veranda: 1 },
    roomSizes: { bedroom: 160, living: 200, bathroom: 60, kitchen: 80, veranda: 50 },
    totalSize: 780,
    roommateCapacity: 3,
    parking: 'Available (Car)',
    images: [
      { room: 'Bedroom', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=500&fit=crop&auto=format' },
      { room: 'Living Room', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop&auto=format' },
      { room: 'Balcony', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=500&fit=crop&auto=format' },
      { room: 'Kitchen', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format' },
      { room: 'Bathroom', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=500&fit=crop&auto=format' },
    ],
  },
]

export const landlordAccounts = [
  { id: 1, name: 'Rahman Faruk', studentId: 'L-2021-441', proximity: '0.3 km', status: 'approved' },
  { id: 2, name: 'Nusrat Jahan', studentId: 'L-2020-112', proximity: '0.6 km', status: 'approved' },
  { id: 3, name: 'Mizanur Hossain', studentId: 'L-2023-889', proximity: '1.1 km', status: 'pending' },
  { id: 4, name: 'Farida Akter', studentId: 'L-2022-334', proximity: '0.8 km', status: 'pending' },
]

export const studentAccounts = [
  { id: 1, name: 'Tanvir Ahmed', studentId: '2023-CSE-104', status: 'approved', payment: 'paid' },
  { id: 2, name: 'Sadia Islam', studentId: '2022-BBA-217', status: 'approved', payment: 'pending' },
  { id: 3, name: 'Rifat Hassan', studentId: '2024-EEE-059', status: 'pending', payment: 'none' },
]

export const maintenanceRequests = [
  { id: 1, listing: 'Studio near Gate 3', tenant: 'Tanvir Ahmed', issue: 'AC not cooling', date: '25 Jul 2026', status: 'open' },
  { id: 2, listing: 'Shared Mess – South Campus', tenant: 'Sadia Islam', issue: 'Leaking pipe in bathroom', date: '22 Jul 2026', status: 'in-progress' },
  { id: 3, listing: 'Bachelor Flat – North Side', tenant: 'Rifat Hassan', issue: 'Door lock broken', date: '20 Jul 2026', status: 'resolved' },
]

export const testimonials = [
  { name: 'Tanvir Ahmed', dept: 'CSE, Batch 2023', text: 'Found a studio within 300m of Gate 3 in two days. The verified listings gave me confidence to sign without second-guessing.', avatar: 'T' },
  { name: 'Sadia Islam', dept: 'BBA, Batch 2022', text: 'The mess listings with meal plans saved me so much time. Payments and receipts are all in one place — no more chasing landlords.', avatar: 'S' },
  { name: 'Rifat Hassan', dept: 'EEE, Batch 2024', text: 'As a first-year I had no idea where to look. UIU Rental had everything filtered by distance and price. Applied in minutes.', avatar: 'R' },
]

export const rentTransactions = [
  { id: 1, tenant: 'Tanvir Ahmed', listing: 'Studio near Gate 3', amount: 4200, month: 'Jul 2026', paid: true },
  { id: 2, tenant: 'Sadia Islam', listing: 'Shared Mess – South Campus', amount: 2800, month: 'Jul 2026', paid: false },
  { id: 3, tenant: 'Tanvir Ahmed', listing: 'Studio near Gate 3', amount: 4200, month: 'Jun 2026', paid: true },
  { id: 4, tenant: 'Sadia Islam', listing: 'Shared Mess – South Campus', amount: 2800, month: 'Jun 2026', paid: true },
]

export type LandlordRow = { id: string; name: string; email: string; phone: string; address: string; properties: number; activeTenants: number; status: 'active' | 'pending' | 'suspended'; regDate: string }
export type StudentRow  = { id: string; name: string; university: string; email: string; phone: string; rentalStatus: 'Active Lease' | 'Searching' | 'No Application'; applications: number; status: 'active' | 'pending' | 'suspended'; regDate: string }
export type SortDir = 'asc' | 'desc'

export const EXT_LANDLORDS: LandlordRow[] = [
  { id: 'LL-001', name: 'Rahman Faruk',     email: 'rahman.faruk@gmail.com',    phone: '+880 1711-234567', address: 'Road 4, Block B, Badda',       properties: 2, activeTenants: 2, status: 'active',    regDate: '12 Jan 2025' },
  { id: 'LL-002', name: 'Nusrat Jahan',     email: 'nusrat.jahan@yahoo.com',    phone: '+880 1822-345678', address: 'Road 7, Block D, Vatara',      properties: 1, activeTenants: 1, status: 'active',    regDate: '03 Mar 2025' },
  { id: 'LL-003', name: 'Mizanur Hossain',  email: 'mizan.hossain@hotmail.com', phone: '+880 1933-456789', address: 'Road 12, Block A, Badda',      properties: 1, activeTenants: 0, status: 'pending',   regDate: '15 Jun 2026' },
  { id: 'LL-004', name: 'Farida Akter',     email: 'farida.akter@gmail.com',    phone: '+880 1644-567890', address: 'Road 2, Block C, Meradiya',    properties: 1, activeTenants: 0, status: 'pending',   regDate: '20 Jul 2026' },
  { id: 'LL-005', name: 'Karim Abdullah',   email: 'karim.ab@gmail.com',        phone: '+880 1755-678901', address: 'Road 9, Block E, Bashundhara', properties: 1, activeTenants: 1, status: 'active',    regDate: '28 Apr 2025' },
  { id: 'LL-006', name: 'Salma Begum',      email: 'salma.begum@yahoo.com',     phone: '+880 1866-789012', address: 'Road 3, Block H, Badda',       properties: 1, activeTenants: 0, status: 'suspended', regDate: '05 Nov 2024' },
  { id: 'LL-007', name: 'Hasan Mahmud',     email: 'hasan.mahmud@gmail.com',    phone: '+880 1977-890123', address: 'Road 6, Block F, Vatara',      properties: 1, activeTenants: 1, status: 'active',    regDate: '19 Feb 2025' },
  { id: 'LL-008', name: 'Amina Khatun',     email: 'amina.khatun@hotmail.com',  phone: '+880 1788-901234', address: 'Road 11, Block G, Meradiya',   properties: 1, activeTenants: 0, status: 'active',    regDate: '07 Aug 2025' },
]

export const EXT_STUDENTS: StudentRow[] = [
  { id: 'ST-001', name: 'Tanvir Ahmed',  university: 'UIU',  email: 'tanvir@uiu.ac.bd',  phone: '+880 1755-112233', rentalStatus: 'Active Lease',    applications: 2, status: 'active',    regDate: '10 Sep 2024' },
  { id: 'ST-002', name: 'Sadia Islam',   university: 'UIU',  email: 'sadia@uiu.ac.bd',   phone: '+880 1866-223344', rentalStatus: 'Active Lease',    applications: 1, status: 'active',    regDate: '14 Oct 2024' },
  { id: 'ST-003', name: 'Rifat Hassan',  university: 'UIU',  email: 'rifat@uiu.ac.bd',   phone: '+880 1712-334455', rentalStatus: 'Searching',       applications: 1, status: 'pending',   regDate: '05 Jun 2026' },
  { id: 'ST-004', name: 'Alif Hossain',  university: 'UIU',  email: 'alif@uiu.ac.bd',    phone: '+880 1823-445566', rentalStatus: 'Searching',       applications: 1, status: 'pending',   regDate: '18 Jul 2026' },
  { id: 'ST-005', name: 'Mitu Rahman',   university: 'UIU',  email: 'mitu@uiu.ac.bd',    phone: '+880 1934-556677', rentalStatus: 'Active Lease',    applications: 3, status: 'active',    regDate: '22 Jan 2025' },
  { id: 'ST-006', name: 'Fahim Khan',    university: 'BUET', email: 'fahim@buet.ac.bd',  phone: '+880 1645-667788', rentalStatus: 'No Application',  applications: 0, status: 'active',    regDate: '30 Mar 2025' },
  { id: 'ST-007', name: 'Nadia Sultana', university: 'UIU',  email: 'nadia@uiu.ac.bd',   phone: '+880 1756-778899', rentalStatus: 'No Application',  applications: 0, status: 'suspended', regDate: '11 Dec 2024' },
  { id: 'ST-008', name: 'Rafi Uddin',    university: 'BRAC', email: 'rafi@bracu.ac.bd',  phone: '+880 1867-889900', rentalStatus: 'Searching',       applications: 2, status: 'active',    regDate: '04 May 2026' },
]
