import type { ReactNode } from 'react'
import { Badge } from '../../components/ui'
import type { LandlordRow, SortDir } from '../../data'
import { statusVariant } from './utils'

type LandlordsPageProps = {
  lRows: LandlordRow[]
  lSearch: string
  setLSearch: React.Dispatch<React.SetStateAction<string>>
  lFilter: 'all' | 'active' | 'pending' | 'suspended'
  setLFilter: React.Dispatch<React.SetStateAction<'all' | 'active' | 'pending' | 'suspended'>>
  lSortKey: keyof LandlordRow
  lSortDir: SortDir
  handleLSort: (key: keyof LandlordRow) => void
  lPage: number
  setLPage: React.Dispatch<React.SetStateAction<number>>
  lTotalPages: number
  lPagedRows: LandlordRow[]
  lProfile: LandlordRow | undefined
  setLProfileId: React.Dispatch<React.SetStateAction<string | null>>
  approveLandlordRow: (id: string) => void
  suspendLandlordRow: (id: string) => void
  removeLandlordRow: (id: string) => void
}

const TH = ({ col, sortKey, sortDir, onClick, children }: { col: keyof LandlordRow | string; sortKey: string; sortDir: SortDir; onClick: () => void; children: ReactNode }) => (
  <th onClick={onClick} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-[#1a1a18] transition-colors">
    {children}<span className="ml-0.5 text-gray-300">{col === sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  </th>
)

export default function LandlordsPage({ lRows, lSearch, setLSearch, lFilter, setLFilter, lSortKey, lSortDir, handleLSort, lPage, setLPage, lTotalPages, lPagedRows, lProfile, setLProfileId, approveLandlordRow, suspendLandlordRow, removeLandlordRow }: LandlordsPageProps) {
  return (
    <>
      {!lProfile ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Landlord Accounts</h1>
            <p className="text-sm text-gray-500 mt-0.5">{lRows.length} registered landlords · {lRows.filter(r => r.status === 'pending').length} pending approval</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <input
              value={lSearch}
              onChange={e => { setLSearch(e.target.value); setLPage(1) }}
              placeholder="Search by name, email, phone, ID…"
              className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]"
            />
            <div className="flex gap-1">
              {(['all', 'active', 'pending', 'suspended'] as const).map(f => (
                <button key={f} onClick={() => { setLFilter(f); setLPage(1) }} className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-all ${lFilter === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{lRows.filter(r => lFilter === 'all' || r.status === lFilter).filter(r => !lSearch || [r.name, r.email, r.phone, r.id, r.address].some(v => v.toLowerCase().includes(lSearch.toLowerCase()))).length} result{lRows.filter(r => lFilter === 'all' || r.status === lFilter).filter(r => !lSearch || [r.name, r.email, r.phone, r.id, r.address].some(v => v.toLowerCase().includes(lSearch.toLowerCase()))).length !== 1 ? 's' : ''}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <TH col="id" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('id')}>ID</TH>
                    <TH col="name" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('name')}>Full Name</TH>
                    <TH col="email" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('email')}>Email</TH>
                    <TH col="phone" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('phone')}>Phone</TH>
                    <TH col="address" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('address')}>Address</TH>
                    <TH col="properties" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('properties')}>Props</TH>
                    <TH col="activeTenants" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('activeTenants')}>Tenants</TH>
                    <TH col="status" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('status')}>Status</TH>
                    <TH col="regDate" sortKey={lSortKey} sortDir={lSortDir} onClick={() => handleLSort('regDate')}>Reg. Date</TH>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lPagedRows.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No landlords match your filters</td></tr>
                  )}
                  {lPagedRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                      <td className="px-3 py-3 font-medium text-[#111827] whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{r.email}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.phone}</td>
                      <td className="px-3 py-3 text-xs text-gray-500 max-w-[140px] truncate">{r.address}</td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-[#1a1a18]">{r.properties}</td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-[#1a1a18]">{r.activeTenants}</td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{r.regDate}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setLProfileId(r.id)} className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 font-medium transition-colors">View</button>
                          {r.status === 'pending' && <button onClick={() => approveLandlordRow(r.id)} className="text-xs bg-[#111827] text-white px-2 py-1 rounded-lg hover:bg-[#1f2937] font-medium transition-colors">Approve</button>}
                          {r.status === 'active' && <button onClick={() => suspendLandlordRow(r.id)} className="text-xs border border-gray-200 text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50 font-medium transition-colors">Suspend</button>}
                          {r.status === 'suspended' && <button onClick={() => approveLandlordRow(r.id)} className="text-xs border border-gray-200 text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 font-medium transition-colors">Reinstate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">Page {lPage} of {lTotalPages} · {lRows.filter(r => lFilter === 'all' || r.status === lFilter).filter(r => !lSearch || [r.name, r.email, r.phone, r.id, r.address].some(v => v.toLowerCase().includes(lSearch.toLowerCase()))).length} total</span>
              <div className="flex gap-1">
                <button disabled={lPage === 1} onClick={() => setLPage(p => p - 1)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">← Prev</button>
                {Array.from({ length: lTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setLPage(p)} className={`text-xs w-7 h-7 rounded-lg border font-medium transition-colors ${p === lPage ? 'bg-[#111827] text-white border-[#111827]' : 'border-gray-200 hover:bg-white'}`}>{p}</button>
                ))}
                <button disabled={lPage === lTotalPages} onClick={() => setLPage(p => p + 1)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">Next →</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setLProfileId(null)} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">← Back to Table</button>
            <h1 className="text-2xl font-bold text-[#111827]">{lProfile.name}</h1>
            <Badge variant={statusVariant(lProfile.status)}>{lProfile.status}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-0 divide-y divide-gray-100">
              <div className="pb-3 font-semibold text-[#1a1a18]">Account Details</div>
              {([['Landlord ID', lProfile.id], ['Full Name', lProfile.name], ['Email', lProfile.email], ['Phone', lProfile.phone], ['Address', lProfile.address], ['Properties Listed', String(lProfile.properties)], ['Active Tenants', String(lProfile.activeTenants)], ['Registration Date', lProfile.regDate]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-[#1a1a18]">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Property Listings</div>
                {[]/* placeholder: no per-landlord listing data passed into this component */}
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Actions</div>
                <div className="flex gap-2 flex-wrap">
                  {lProfile.status === 'pending' && <button onClick={() => approveLandlordRow(lProfile.id)} className="text-xs bg-[#111827] text-white px-4 py-2 rounded-xl hover:bg-[#1f2937] font-semibold transition-colors">Approve Account</button>}
                  {lProfile.status === 'active' && <button onClick={() => suspendLandlordRow(lProfile.id)} className="text-xs border border-amber-300 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-50 font-semibold transition-colors">Suspend Account</button>}
                  {lProfile.status === 'suspended' && <button onClick={() => approveLandlordRow(lProfile.id)} className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-semibold transition-colors">Reinstate Account</button>}
                  <button onClick={() => removeLandlordRow(lProfile.id)} className="text-xs border border-red-300 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 font-semibold transition-colors">Remove Account</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
