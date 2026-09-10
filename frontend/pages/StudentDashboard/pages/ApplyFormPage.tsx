import type { Listing } from '../../../types'
import type { StudentPage } from '../types'

type ApplyFormPageProps = {
  userName: string
  applyListing: Listing
  appForm: { studentId: string; phone: string; moveIn: string; message: string; employment: string }
  setAppForm: React.Dispatch<React.SetStateAction<{ studentId: string; phone: string; moveIn: string; message: string; employment: string }>>
  submitApplication: () => void
  onBack: (page: StudentPage) => void
}

export default function ApplyFormPage({ userName, applyListing, appForm, setAppForm, submitApplication, onBack }: ApplyFormPageProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Rental Application</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in your details to apply for this property</p>
        </div>
        <button onClick={() => onBack('browse')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">← Back</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center shadow-sm">
        <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img src={applyListing.image} alt={applyListing.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-semibold text-[#1a1a18]">{applyListing.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{applyListing.landlord} · {applyListing.distance} from UIU</div>
          <div className="text-sm font-mono text-[#1a1a18] font-semibold mt-0.5">৳{applyListing.price.toLocaleString()}/month</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="font-semibold text-[#1a1a18]">Applicant Information</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input value={userName} readOnly className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student ID</label>
            <input value={appForm.studentId} onChange={e => setAppForm(f => ({ ...f, studentId: e.target.value }))} placeholder="e.g. 2024-CSE-123" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input value={appForm.phone} onChange={e => setAppForm(f => ({ ...f, phone: e.target.value }))} placeholder="+880 17XX XXXXXX" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preferred Move-in Date</label>
            <input type="date" value={appForm.moveIn} onChange={e => setAppForm(f => ({ ...f, moveIn: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employment / Financial Status</label>
          <select value={appForm.employment} onChange={e => setAppForm(f => ({ ...f, employment: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
            {['Student (Family Support)', 'Student (Part-time Job)', 'Student (Scholarship)', 'Working Student'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message to Landlord</label>
          <textarea value={appForm.message} onChange={e => setAppForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Introduce yourself and explain why you'd be a great tenant…" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Supporting Documents (optional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1a1a18] cursor-pointer transition-colors">
            <div className="text-xl mb-1">📎</div>
            <div className="text-xs text-gray-500">Upload student ID card or admission letter</div>
          </div>
        </div>
        <button onClick={submitApplication} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">Submit Application</button>
      </div>
    </>
  )
}
