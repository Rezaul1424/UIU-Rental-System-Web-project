import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export type AdminReportData = {
  generatedAt: string;
  userGrowth: { month: string; students: number; landlords: number }[];
  rentCollection: { month: string; collected: number; pending: number; overdue: number; expected: number }[];
  listingActivity: { month: string; newListings: number }[];
  listingStatuses: { available: number; occupied: number; maintenance: number };
  listingTypes: { type: string; count: number }[];
  accountStatuses: {
    landlords: Record<'active' | 'pending' | 'suspended' | 'deactivated', number>;
    students: Record<'active' | 'pending' | 'suspended' | 'deactivated', number>;
  };
  maintenanceByMonth: { month: string; open: number; inProgress: number; resolved: number }[];
  maintenanceRequests: { id: number; property: string; tenant: string; issue: string; createdAt: string; status: string }[];
};

const persistentReports = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});

function recentMonthKeys(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - index - 1), 1));
    return date.toISOString().slice(0, 7);
  });
}

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function emptyReport(): AdminReportData {
  const months = recentMonthKeys(8);
  const accountStatuses = () => ({ active: 0, pending: 0, suspended: 0, deactivated: 0 });
  return {
    generatedAt: new Date().toISOString(),
    userGrowth: months.map((month) => ({ month, students: 0, landlords: 0 })),
    rentCollection: months.slice(-6).map((month) => ({ month, collected: 0, pending: 0, overdue: 0, expected: 0 })),
    listingActivity: months.slice(-6).map((month) => ({ month, newListings: 0 })),
    listingStatuses: { available: 0, occupied: 0, maintenance: 0 },
    listingTypes: [],
    accountStatuses: { landlords: accountStatuses(), students: accountStatuses() },
    maintenanceByMonth: months.slice(-6).map((month) => ({ month, open: 0, inProgress: 0, resolved: 0 })),
    maintenanceRequests: [],
  };
}

export async function getAdminReportData(): Promise<AdminReportData> {
  const report = emptyReport();
  if (!persistentReports) {
    return {
      ...report,
      userGrowth: report.userGrowth.map((item, index) => ({ ...item, students: index % 3, landlords: index % 2 })),
      rentCollection: report.rentCollection.map((item, index) => ({ ...item, collected: index * 1000, pending: (6 - index) * 250, expected: index * 1000 + (6 - index) * 250 })),
      listingActivity: report.listingActivity.map((item, index) => ({ ...item, newListings: index % 3 })),
      listingStatuses: { available: 1, occupied: 1, maintenance: 0 },
      listingTypes: [{ type: 'Single', count: 1 }, { type: 'Shared', count: 1 }],
      accountStatuses: { landlords: { active: 1, pending: 1, suspended: 0, deactivated: 0 }, students: { active: 1, pending: 1, suspended: 0, deactivated: 0 } },
      maintenanceByMonth: report.maintenanceByMonth.map((item, index) => ({ ...item, open: index % 2, inProgress: (index + 1) % 2, resolved: index % 3 })),
      maintenanceRequests: [],
    };
  }

  const monthStart = 'DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), \'%Y-%m-01\')';
  const [userRows] = await db.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, role, COUNT(*) AS total
     FROM users WHERE role IN ('student', 'landlord') AND created_at >= ${monthStart}
     GROUP BY DATE_FORMAT(created_at, '%Y-%m'), role`,
  );
  for (const row of userRows) {
    const item = report.userGrowth.find((entry) => entry.month === String(row.month));
    if (item && row.role === 'student') item.students = toNumber(row.total);
    if (item && row.role === 'landlord') item.landlords = toNumber(row.total);
  }

  const [paymentRows] = await db.query<RowDataPacket[]>(
    `SELECT month_year AS month,
       SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS collected,
       SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue,
       SUM(amount) AS expected
     FROM rent_payments
     WHERE month_year >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m')
     GROUP BY month_year ORDER BY month_year`,
  );
  for (const row of paymentRows) {
    const item = report.rentCollection.find((entry) => entry.month === String(row.month));
    if (!item) continue;
    item.collected = Math.round(toNumber(row.collected));
    item.pending = Math.round(toNumber(row.pending));
    item.overdue = Math.round(toNumber(row.overdue));
    item.expected = Math.round(toNumber(row.expected));
  }

  const [listingRows] = await db.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
     FROM properties WHERE created_at >= ${monthStart}
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
  );
  for (const row of listingRows) {
    const item = report.listingActivity.find((entry) => entry.month === String(row.month));
    if (item) item.newListings = toNumber(row.total);
  }

  const [statusRows] = await db.query<RowDataPacket[]>(
    'SELECT status, COUNT(*) AS total FROM properties GROUP BY status',
  );
  for (const row of statusRows) {
    const status = String(row.status) as keyof AdminReportData['listingStatuses'];
    if (status in report.listingStatuses) report.listingStatuses[status] = toNumber(row.total);
  }

  const [typeRows] = await db.query<RowDataPacket[]>(
    'SELECT type, COUNT(*) AS total FROM properties GROUP BY type ORDER BY type',
  );
  report.listingTypes = typeRows.map((row) => ({ type: String(row.type), count: toNumber(row.total) }));

  const [accountRows] = await db.query<RowDataPacket[]>(
    `SELECT role, status, COUNT(*) AS total FROM users
     WHERE role IN ('landlord', 'student') GROUP BY role, status`,
  );
  for (const row of accountRows) {
    const role = row.role === 'landlord' ? 'landlords' : row.role === 'student' ? 'students' : undefined;
    const status = String(row.status) as keyof AdminReportData['accountStatuses']['students'];
    if (role && status in report.accountStatuses[role]) {
      report.accountStatuses[role][status] = toNumber(row.total);
    }
  }

  const [maintenanceRows] = await db.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, status, COUNT(*) AS total
     FROM maintenance_requests WHERE created_at >= ${monthStart}
     GROUP BY DATE_FORMAT(created_at, '%Y-%m'), status`,
  );
  for (const row of maintenanceRows) {
    const item = report.maintenanceByMonth.find((entry) => entry.month === String(row.month));
    if (!item) continue;
    if (row.status === 'open') item.open = toNumber(row.total);
    if (row.status === 'in-progress') item.inProgress = toNumber(row.total);
    if (row.status === 'resolved') item.resolved = toNumber(row.total);
  }

  const [requestRows] = await db.query<RowDataPacket[]>(
    `SELECT m.id, p.title AS property_title, u.name AS tenant_name, m.issue, m.created_at, m.status
     FROM maintenance_requests m
     JOIN properties p ON p.id = m.property_id
     JOIN users u ON u.id = m.student_id
     ORDER BY m.created_at DESC LIMIT 100`,
  );
  report.maintenanceRequests = requestRows.map((row) => ({
    id: toNumber(row.id),
    property: String(row.property_title),
    tenant: String(row.tenant_name),
    issue: String(row.issue),
    createdAt: new Date(row.created_at as Date).toISOString(),
    status: String(row.status),
  }));

  return report;
}