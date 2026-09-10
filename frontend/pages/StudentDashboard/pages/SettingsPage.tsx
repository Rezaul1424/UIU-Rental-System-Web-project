import type { Application, Complaint, Review } from '../types'

type SettingsPageProps = {
  userName: string
  applications: Application[]
  reviewHistory: Review[]
  complaints: Complaint[]
  showComplaintForm: boolean
  setShowComplaintForm: (value: boolean) => void
  cForm: { against: string; property: string; category: string; subject: string; description: string }
  setCForm: React.Dispatch<React.SetStateAction<{ against: string; property: string; category: string; subject: string; description: string }>>
  submitComplaint: () => void
  setShowDeactivateConfirm: (value: boolean) => void
}

export default function SettingsPage({ userName, applications, reviewHistory, complaints, showComplaintForm, setShowComplaintForm, cForm, setCForm, submitComplaint, setShowDeactivateConfirm }: SettingsPageProps) {
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
                <div className="text-sm text-gray-400">Student Account</div>
                <button className="text-xs text-sky-600 mt-1 hover:underline">Change photo</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: userName, placeholder: 'Your full name' },
                { label: 'Email Address', value: 'student@uiu.ac.bd', placeholder: 'your@email.com' },
                { label: 'Student ID', value: '2024-CSE-104', placeholder: 'Student ID' },
                { label: 'Phone Number', value: '+880 1712-345678', placeholder: '+880...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input defaultValue={f.value} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]" />
                </div>
              ))}
            </div>
            <button className="bg-[#111827] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Save Changes</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Notification Preferences</div>
            <div className="space-y-3">
              {[
                { label: 'Rent payment reminders', sub: 'Get reminded before your rent is due', checked: true },
                { label: 'Maintenance request updates', sub: 'Updates when your request status changes', checked: true },
                { label: 'New messages from landlords', sub: 'Notify when a landlord sends you a message', checked: true },
                { label: 'Application status changes', sub: 'When your application is reviewed or approved', checked: true },
                { label: 'New listings nearby', sub: 'Be notified when new properties are listed near UIU', checked: false },
              ].map(n => (
                <div key={n.label} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#111827]">{n.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{n.sub}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input type="checkbox" defaultChecked={n.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]" />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Change Password</div>
            <div className="space-y-3">
              {['Current Password', 'New Password', 'Confirm New Password'].map(l => (
                <div key={l}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{l}</label>
                  <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]" placeholder="••••••••" />
                </div>
              ))}
            </div>
            <button className="border border-gray-200 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-[#111827]">Update Password</button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Account Status</div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-sm font-medium text-emerald-700">Active Student</span>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between"><span>Member since</span><span className="text-[#111827]">Mar 2025</span></div>
              <div className="flex justify-between"><span>Applications</span><span className="text-[#111827]">{applications.length}</span></div>
              <div className="flex justify-between"><span>Reviews written</span><span className="text-[#111827]">{reviewHistory.length}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Privacy</div>
            <div className="space-y-3">
              {[
                { label: 'Visible to landlords', checked: true },
                { label: 'Show phone to applicants', checked: false },
                { label: 'Allow direct messages', checked: true },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{p.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={p.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]" />
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile Visibility</div>
              {[
                ['Public', 'Visible to all landlords'],
                ['Private', 'Only applied landlords'],
                ['Hidden', 'Hidden from all'],
              ].map(([opt, desc]) => (
                <label key={opt} className="flex items-start gap-2.5 cursor-pointer py-1.5">
                  <input type="radio" name="student-privacy" defaultChecked={opt === 'Public'} className="accent-[#111827] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-[#111827]">{opt}</div>
                    <div className="text-[10px] text-gray-400">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-[#1a1a18]">Complaints</div>
                <div className="text-xs text-gray-500 mt-0.5">Submit and track complaints about landlords</div>
              </div>
              <button onClick={() => setShowComplaintForm(true)} className="bg-[#111827] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#1f2937] transition-colors">+ New Complaint</button>
            </div>
            {showComplaintForm && (
              <div className="border border-gray-200 rounded-xl p-4 mb-4 space-y-3 bg-gray-50">
                <div className="font-medium text-sm text-[#1a1a18]">New Complaint</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Landlord</label>
                    <input value={cForm.against} onChange={e => setCForm(f => ({ ...f, against: e.target.value }))} placeholder="Landlord name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Related Property</label>
                    <input value={cForm.property} onChange={e => setCForm(f => ({ ...f, property: e.target.value }))} placeholder="Property name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                    <select value={cForm.category} onChange={e => setCForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
                      {['Maintenance Neglect', 'Harassment', 'Overcharging', 'Privacy Violation', 'Property Damage', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
                    <input value={cForm.subject} onChange={e => setCForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief subject" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                  <textarea value={cForm.description} onChange={e => setCForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the issue in detail…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowComplaintForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={submitComplaint} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1f2937] transition-colors">Submit Complaint</button>
                </div>
              </div>
            )}
            {complaints.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No complaints submitted yet</div>
            ) : (
              <div className="space-y-3">
                {complaints.map(c => (
                  <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium text-sm text-[#1a1a18]">{c.subject}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Responded' ? 'bg-sky-50 text-sky-700' : c.status === 'Under Review' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Against: {c.against} · {c.property}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{c.category}</span>
                      <span>{c.id} · {c.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-100">
            <div className="font-semibold text-red-600 mb-2">Danger Zone</div>
            <p className="text-xs text-gray-400 mb-3">Permanently deactivate your student account. Your applications and data will be removed.</p>
            <button onClick={() => setShowDeactivateConfirm(true)} className="w-full border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors">Deactivate Account</button>
          </div>
        </div>
      </div>
    </>
  )
}
