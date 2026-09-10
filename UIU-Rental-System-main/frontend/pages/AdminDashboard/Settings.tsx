type SettingsPageProps = {
  userName: string
}

export default function SettingsPage({ userName }: SettingsPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage platform configuration and admin preferences</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Admin Profile</div>
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#111827] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{userName[0].toUpperCase()}</div>
              <div>
                <div className="font-semibold text-[#111827]">{userName}</div>
                <div className="text-sm text-gray-400">System Administrator</div>
                <button className="text-xs text-sky-600 mt-1 hover:underline">Change photo</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: userName },
                { label: 'Email Address', value: 'admin@uiu.ac.bd' },
                { label: 'Phone', value: '+880 1700-000000' },
                { label: 'Role', value: 'Super Admin' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input defaultValue={f.value} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]" />
                </div>
              ))}
            </div>
            <button className="bg-[#111827] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Save Changes</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#111827]">Platform Configuration</div>
            <div className="space-y-3">
              {[
                { label: 'Require landlord verification before listing', sub: 'Landlords must be approved before publishing listings', checked: true },
                { label: 'Allow guest browsing', sub: 'Non-registered users can browse listings', checked: true },
                { label: 'Email notifications to admin', sub: 'Receive email alerts for new registrations and reports', checked: true },
                { label: 'Maintenance auto-escalation', sub: 'Auto-escalate requests not resolved within 7 days', checked: false },
                { label: 'Show platform stats to landlords', sub: 'Let landlords see overall occupancy and market data', checked: false },
              ].map(n => (
                <div key={n.label} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#111827]">{n.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{n.sub}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input type="checkbox" defaultChecked={n.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]" />
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
            <div className="font-semibold text-[#111827] mb-3">System Status</div>
            <div className="space-y-2.5">
              {[
                { label: 'Platform', status: 'Operational', color: 'bg-emerald-400' },
                { label: 'Database', status: 'Healthy', color: 'bg-emerald-400' },
                { label: 'Email Service', status: 'Operational', color: 'bg-emerald-400' },
                { label: 'Payment Gateway', status: 'Active', color: 'bg-emerald-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.color}`} /><span className="text-xs text-emerald-600 font-semibold">{s.status}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Platform Summary</div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between"><span>Version</span><span className="text-[#111827] font-semibold">v2.4.1</span></div>
              <div className="flex justify-between"><span>Total Users</span><span className="text-[#111827]">{userName.length}</span></div>
              <div className="flex justify-between"><span>Total Listings</span><span className="text-[#111827]">N/A</span></div>
              <div className="flex justify-between"><span>Last Updated</span><span className="text-[#111827]">9 Aug 2026</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
