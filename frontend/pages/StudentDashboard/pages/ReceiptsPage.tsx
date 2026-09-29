import { Badge } from '../../../components/ui'
import type { StudentPage } from '../types'

type LeaseInfo = {
  id?: string
  propertyId: string
  propertyTitle?: string
  propertyCode?: string
  landlordId?: string
  landlordName?: string
  status: string
  monthlyRent?: number
  startDate?: string
  endDate?: string
}

type ReceiptsPageProps = {
  receipts: Array<{ month: string; amount: number; paid: boolean }>
  leases?: LeaseInfo[]
  userName: string
  setPage: (page: StudentPage) => void
}

export default function ReceiptsPage({ receipts, leases = [], userName, setPage }: ReceiptsPageProps) {
  const activeLease = leases.find(l => l.status === 'active') ?? leases[0]
  const propertyName = activeLease?.propertyTitle || (activeLease?.propertyCode ? activeLease.propertyCode : (activeLease ? `Property ${activeLease.propertyId}` : 'My Rental Unit'))

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Rent Receipts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Payment history for your current property</p>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {receipts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No rent receipts recorded yet. Once rent payments are processed, your receipts will be available for download here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Month', 'Property', 'Amount', 'Status', 'Receipt'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receipts.map(r => (
                <tr key={r.month} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold">{r.month}</td>
                  <td className="px-5 py-3.5 text-gray-500">{propertyName}</td>
                  <td className="px-5 py-3.5 font-mono text-[#1a1a18] font-semibold">৳{r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5"><Badge variant={r.paid ? 'success' : 'warning'}>{r.paid ? 'Paid' : 'Pending'}</Badge></td>
                  <td className="px-5 py-3.5">
                    {r.paid ? (
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          const content = `UIU Rental System\nRent Receipt\n\nTenant: ${userName}\nProperty: ${propertyName}\nMonth: ${r.month}\nAmount: ৳${r.amount.toLocaleString()}\nStatus: Paid\nIssued Date: ${new Date().toLocaleDateString('en-GB')}`
                          link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
                          link.download = `receipt-${r.month.replace(/\s+/g, '-')}.txt`
                          link.click()
                        }}
                        className="text-xs bg-gray-100 text-[#1a1a18] border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        ⬇ Download
                      </button>
                    ) : (
                      <button onClick={() => setPage('pay-rent')} className="text-xs bg-[#111827] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f2937] transition-colors font-medium">Pay Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
