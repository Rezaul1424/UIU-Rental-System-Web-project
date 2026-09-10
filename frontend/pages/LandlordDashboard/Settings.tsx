import type { LandlordComplaint } from './types'

type SettingsPageProps = {
  userName: string
  myListingsCount: number
  landlordComplaints: LandlordComplaint[]
  showLandlordComplaintForm: boolean
  setShowLandlordComplaintForm: (value: boolean) => void
  lcForm: { against: string; property: string; category: string; subject: string; description: string }
  setLcForm: (value: { against: string; property: string; category: string; subject: string; description: string }) => void
  submitLandlordComplaint: () => void
  setShowLandlordDeactivateConfirm: (value: boolean) => void
}

export default function SettingsPage({ userName, myListingsCount, landlordComplaints, showLandlordComplaintForm, setShowLandlordComplaintForm, lcForm, setLcForm, submitLandlordComplaint, setShowLandlordDeactivateConfirm }: SettingsPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Profile Information</div>
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#111827] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{userName[0].toUpperCase()}</div>
              <div>
                <div className="font-semibold text-[#111827]">{userName}</div>
                <div className="text-sm text-gray-400">Landlord Account</div>
                <button className="text-xs text-sky-600 mt-1 hover:underline">Change photo</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: userName, placeholder: 'Your full name' },
                { label: 'Email Address', value: 'landlord@gmail.com', placeholder: 'your@email.com' },
                { label: 'Phone Number', value: '+880 1712-345678', placeholder: '+880...' },
                { label: 'National ID / TIN', value: '19881234567890', placeholder: 'ID number' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input defaultValue={field.value} placeholder={field.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]" />
                </div>
              ))}
            </div>
            <button className="bg-[#111827] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Save Changes</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Notification Preferences</div>
            <div className="space-y-3">
              {[
                { label: 'New rental applications', sub: 'Notify when someone applies for your listing', checked: true },
                { label: 'Maintenance updates', sub: 'Updates on maintenance request progress', checked: true },
                { label: 'Rent payment received', sub: 'Confirmation when rent is paid', checked: true },
                { label: 'Chat messages', sub: 'New messages from tenants and applicants', checked: false },
                { label: 'Weekly summary', sub: 'Weekly digest of your property activity', checked: false },
              ].map(pref => (
                <div key={pref.label} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#111827]">{pref.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{pref.sub}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input type="checkbox" defaultChecked={pref.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Change Password</div>
            {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]" placeholder="••••••••" />
              </div>
            ))}
            <button className="border border-gray-200 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-[#111827]">Update Password</button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Account Status</div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-sm font-medium text-emerald-700">Active & Verified</span>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between"><span>Member since</span><span className="text-[#111827]">Jan 2025</span></div>
              <div className="flex justify-between"><span>Total listings</span><span className="text-[#111827]">{myListingsCount}</span></div>
              <div className="flex justify-between"><span>Total tenants served</span><span className="text-[#111827]">6</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Privacy</div>
            <div className="space-y-3">
              {[
                { label: 'Show phone to applicants', checked: false },
                { label: 'Show listings on public map', checked: true },
                { label: 'Allow direct messages', checked: true },
              ].map(pref => (
                <div key={pref.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{pref.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-[#1a1a18]">Complaints</div>
                <div className="text-xs text-gray-500 mt-0.5">Submit and track complaints about tenants</div>
              </div>
              <button onClick={() => setShowLandlordComplaintForm(true)} className="bg-[#111827] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#1f2937] transition-colors">+ New Complaint</button>
            </div>

            {showLandlordComplaintForm && (
              <div className="border border-gray-200 rounded-xl p-4 mb-4 space-y-3 bg-gray-50">
                <div className="font-medium text-sm text-[#1a1a18]">New Complaint</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Student</label>
                    <input value={lcForm.against} onChange={e => setLcForm({ ...lcForm, against: e.target.value })} placeholder="Student name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Related Property</label>
                    <input value={lcForm.property} onChange={e => setLcForm({ ...lcForm, property: e.target.value })} placeholder="Property name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                    <select value={lcForm.category} onChange={e => setLcForm({ ...lcForm, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
                      {['Late Payment', 'Property Damage', 'Noise Disturbance', 'Unauthorized Guests', 'Contract Violation', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
                    <input value={lcForm.subject} onChange={e => setLcForm({ ...lcForm, subject: e.target.value })} placeholder="Brief subject" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                  <textarea value={lcForm.description} onChange={e => setLcForm({ ...lcForm, description: e.target.value })} rows={3} placeholder="Describe the issue in detail…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowLandlordComplaintForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={submitLandlordComplaint} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1f2937] transition-colors">Submit Complaint</button>
                </div>
              </div>
            )}

            {landlordComplaints.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No complaints submitted yet</div>
            ) : (
              <div className="space-y-3">
                {landlordComplaints.map(complaint => (
                  <div key={complaint.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium text-sm text-[#1a1a18]">{complaint.subject}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : complaint.status === 'Responded' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>{complaint.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Against: {complaint.against} · {complaint.property}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{complaint.category}</span>
                      <span>{complaint.id} · {complaint.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-100">
            <div className="font-semibold text-red-600 mb-2">Danger Zone</div>
            <p className="text-xs text-gray-400 mb-3">Permanently deactivate your landlord account. All listings will be hidden and tenant access will be revoked.</p>
            <button onClick={() => setShowLandlordDeactivateConfirm(true)} className="w-full border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors">Deactivate Account</button>
          </div>
        </div>
      </div>
    </>
  )
}
