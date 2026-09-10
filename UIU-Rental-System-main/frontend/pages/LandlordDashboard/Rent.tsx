import { Badge, Stat } from '../../components/ui'

type RentPageProps = {
  rentTransactions: { id: number; tenant: string; listing: string; amount: number; month: string; paid: boolean }[]
}

export default function RentPage({ rentTransactions }: RentPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Rent Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monthly payment records for all tenants</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total collected" value="৳18,200" sub="Jul 2026" />
        <Stat label="Pending" value="৳2,800" sub="1 tenant" />
        <Stat label="Transactions" value={rentTransactions.length} sub="All time" />
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Tenant', 'Property', 'Amount', 'Month', 'Status'].map(header => (
                <th key={header} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rentTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a1a18]">{transaction.tenant}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{transaction.listing}</td>
                <td className="px-5 py-3.5 font-mono text-[#1a1a18] font-semibold">৳{transaction.amount.toLocaleString()}</td>
                <td className="px-5 py-3.5 font-mono text-xs">{transaction.month}</td>
                <td className="px-5 py-3.5"><Badge variant={transaction.paid ? 'success' : 'warning'}>{transaction.paid ? 'Paid' : 'Pending'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
