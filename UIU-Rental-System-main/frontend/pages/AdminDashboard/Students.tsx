import type { ReactNode } from 'react'
import { Badge } from '../../components/ui'
import type { StudentRow, SortDir } from '../../data'
import { statusVariant } from './utils'

type StudentsPageProps = {
  sRows: StudentRow[]
  sSearch: string
  setSSearch: React.Dispatch<React.SetStateAction<string>>
  sFilter: 'all' | 'active' | 'pending' | 'suspended'
  setSFilter: React.Dispatch<React.SetStateAction<'all' | 'active' | 'pending' | 'suspended'>>
  sSortKey: keyof StudentRow
  sSortDir: SortDir
  handleSSort: (key: keyof StudentRow) => void
  sPage: number
  setSPage: React.Dispatch<React.SetStateAction<number>>
  sTotalPages: number
  sPagedRows: StudentRow[]
  sProfile: StudentRow | undefined
  setSProfileId: React.Dispatch<React.SetStateAction<string | null>>
  approveStudentRow: (id: string) => void
  suspendStudentRow: (id: string) => void
  removeStudentRow: (id: string) => void
}

const TH = ({ col, sortKey, sortDir, onClick, children }: { col: keyof StudentRow | string; sortKey: string; sortDir: SortDir; onClick: () => void; children: ReactNode }) => (
  <th onClick={onClick} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-[#1a1a18] transition-colors">
    {children}<span className="ml-0.5 text-gray-300">{col === sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  </th>
)

export default function StudentsPage({ sRows, sSearch, setSSearch, sFilter, setSFilter, sSortKey, sSortDir, handleSSort, sPage, setSPage, sTotalPages, sPagedRows, sProfile, setSProfileId, approveStudentRow, suspendStudentRow, removeStudentRow }: StudentsPageProps) {
  return (
    <>
      {!sProfile ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Student Accounts</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sRows.length} registered students · {sRows.filter(r => r.status === 'pending').length} pending approval</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <input
              value={sSearch}
              onChange={e => { setSSearch(e.target.value); setSPage(1) }}
              placeholder="Search by name, email, phone, ID…"
              className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]"
            />
            <div className="flex gap-1">
              {(['all', 'active', 'pending', 'suspended'] as const).map(f => (
                <button key={f} onClick={() => { setSFilter(f); setSPage(1) }} className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-all ${sFilter === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{sRows.filter(r => sFilter === 'all' || r.status === sFilter).filter(r => !sSearch || [r.name, r.email, r.phone, r.id].some(v => v.toLowerCase().includes(sSearch.toLowerCase()))).length} result{ sRows.filter(r => sFilter === 'all' || r.status === sFilter).filter(r => !sSearch || [r.name, r.email, r.phone, r.id].some(v => v.toLowerCase().includes(sSearch.toLowerCase()))).length !== 1 ? 's' : ''}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <TH col="id" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('id')}>ID</TH>
                    <TH col="name" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('name')}>Full Name</TH>
                    <TH col="email" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('email')}>Email</TH>
                    <TH col="phone" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('phone')}>Phone</TH>
                    <TH col="rentalStatus" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('rentalStatus')}>Rental Status</TH>
                    <TH col="applications" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('applications')}>Apps</TH>
                    <TH col="status" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('status')}>Status</TH>
                    <TH col="regDate" sortKey={sSortKey} sortDir={sSortDir} onClick={() => handleSSort('regDate')}>Reg. Date</TH>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sPagedRows.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No students match your filters</td></tr>
                  )}
                  {sPagedRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                      <td className="px-3 py-3 font-medium text-[#111827] whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{r.email}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.phone}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.rentalStatus === 'Active Lease' ? 'bg-emerald-50 text-emerald-700' : r.rentalStatus === 'Searching' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{r.rentalStatus}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-[#1a1a18]">{r.applications}</td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{r.regDate}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setSProfileId(r.id)} className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 font-medium transition-colors">View</button>
                          {r.status === 'pending' && <button onClick={() => approveStudentRow(r.id)} className="text-xs bg-[#111827] text-white px-2 py-1 rounded-lg hover:bg-[#1f2937] font-medium transition-colors">Approve</button>}
                          {r.status === 'active' && <button onClick={() => suspendStudentRow(r.id)} className="text-xs border border-gray-200 text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50 font-medium transition-colors">Suspend</button>}
                          {r.status === 'suspended' && <button onClick={() => approveStudentRow(r.id)} className="text-xs border border-gray-200 text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 font-medium transition-colors">Reinstate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">Page {sPage} of {sTotalPages} · {sRows.filter(r => sFilter === 'all' || r.status === sFilter).filter(r => !sSearch || [r.name, r.email, r.phone, r.id].some(v => v.toLowerCase().includes(sSearch.toLowerCase()))).length} total</span>
              <div className="flex gap-1">
                <button disabled={sPage === 1} onClick={() => setSPage(p => p - 1)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">← Prev</button>
                {Array.from({ length: sTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setSPage(p)} className={`text-xs w-7 h-7 rounded-lg border font-medium transition-colors ${p === sPage ? 'bg-[#111827] text-white border-[#111827]' : 'border-gray-200 hover:bg-white'}`}>{p}</button>
                ))}
                <button disabled={sPage === sTotalPages} onClick={() => setSPage(p => p + 1)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">Next →</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setSProfileId(null)} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">← Back to Table</button>
            <h1 className="text-2xl font-bold text-[#111827]">{sProfile.name}</h1>
            <Badge variant={statusVariant(sProfile.status)}>{sProfile.status}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-0 divide-y divide-gray-100">
              <div className="pb-3 font-semibold text-[#1a1a18]">Account Details</div>
              {([['Student ID', sProfile.id], ['Full Name', sProfile.name], ['University', sProfile.university], ['Email', sProfile.email], ['Phone', sProfile.phone], ['Rental Status', sProfile.rentalStatus], ['Applications', String(sProfile.applications)], ['Registration Date', sProfile.regDate]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-[#1a1a18]">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-white">
                <div className="text-5xl">🪪</div>
                <div className="text-center">
                  <div className="font-semibold text-[#1a1a18]">{sProfile.name}</div>
                  <div className="font-mono text-sm text-gray-500 mt-0.5">{sProfile.id}</div>
                  <div className="text-xs text-gray-400 mt-1">{sProfile.university}</div>
                </div>
                <button className="text-xs text-[#1a1a18] font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">View Full-Size Image</button>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Actions</div>
                <div className="flex gap-2 flex-wrap">
                  {sProfile.status === 'pending' && <button onClick={() => approveStudentRow(sProfile.id)} className="text-xs bg-[#111827] text-white px-4 py-2 rounded-xl hover:bg-[#1f2937] font-semibold transition-colors">Approve Account</button>}
                  {sProfile.status === 'active' && <button onClick={() => suspendStudentRow(sProfile.id)} className="text-xs border border-amber-300 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-50 font-semibold transition-colors">Suspend Account</button>}
                  {sProfile.status === 'suspended' && <button onClick={() => approveStudentRow(sProfile.id)} className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-semibold transition-colors">Reinstate Account</button>}
                  <button onClick={() => removeStudentRow(sProfile.id)} className="text-xs border border-red-300 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 font-semibold transition-colors">Remove Account</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
