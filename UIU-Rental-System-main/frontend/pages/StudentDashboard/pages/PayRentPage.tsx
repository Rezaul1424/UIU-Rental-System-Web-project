import type { StudentPage } from '../types'

type PayRentPageProps = {
  payStep: 'form' | 'success'
  payMethod: 'card' | 'mobile' | 'bank'
  setPayMethod: (value: 'card' | 'mobile' | 'bank') => void
  payForm: { card: string; expiry: string; cvv: string; name: string }
  setPayForm: React.Dispatch<React.SetStateAction<{ card: string; expiry: string; cvv: string; name: string }>>
  submitPayment: () => void
  setPage: (page: StudentPage) => void
  setPayStep: (value: 'form' | 'success') => void
}

export default function PayRentPage({ payStep, payMethod, setPayMethod, payForm, setPayForm, submitPayment, setPage, setPayStep }: PayRentPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Pay Rent</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monthly rent payment for your current property</p>
      </div>
      {payStep === 'success' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
          <div className="text-xl font-bold text-[#1a1a18] mb-1">Payment Successful</div>
          <div className="text-sm text-gray-500 mb-4">৳4,200 paid for July 2026 · Studio near Gate 3</div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPage('receipts')} className="text-sm bg-[#1a1a18] text-white px-5 py-2 rounded-xl hover:bg-[#333] transition-colors font-medium">View Receipt</button>
            <button onClick={() => setPayStep('form')} className="text-sm border border-gray-200 text-gray-500 px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors">Done</button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Summary</div>
              <div className="space-y-2">
                {[
                  ['Property', 'Studio near Gate 3'],
                  ['Month', 'July 2026'],
                  ['Due Date', '1 Aug 2026'],
                  ['Amount', '৳4,200'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm pb-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-[#1a1a18]">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span>
                  <span className="font-mono text-[#1a1a18]">৳4,200</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Lease Info</div>
              <div className="space-y-2">
                {[
                  ['Property', 'Studio near Gate 3'],
                  ['Landlord', 'Rahman Faruk'],
                  ['Monthly Rent', '৳4,200'],
                  ['Next Due', '1 Aug 2026'],
                  ['Lease Status', 'Active'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm pb-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{k}</span>
                    <span className={`font-medium ${k === 'Lease Status' ? 'text-emerald-600' : 'text-[#1a1a18]'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="font-semibold text-[#1a1a18]">Payment Method</div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {([['card', '💳 Card'], ['mobile', '📱 Mobile Banking'], ['bank', '🏦 Bank Transfer']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setPayMethod(id)} className={`flex-1 text-xs font-medium py-2 px-2 rounded-lg transition-all ${payMethod === id ? 'bg-white text-[#1a1a18] shadow-sm' : 'text-gray-500 hover:text-[#1a1a18]'}`}>{label}</button>
              ))}
            </div>
            {payMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                  <input value={payForm.name} onChange={e => setPayForm(f => ({ ...f, name: e.target.value }))} placeholder="As on card" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Card Number</label>
                  <input value={payForm.card} onChange={e => setPayForm(f => ({ ...f, card: e.target.value }))} placeholder="0000 0000 0000 0000" maxLength={19} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a18]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expiry</label>
                    <input value={payForm.expiry} onChange={e => setPayForm(f => ({ ...f, expiry: e.target.value }))} placeholder="MM / YY" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CVV</label>
                    <input value={payForm.cvv} onChange={e => setPayForm(f => ({ ...f, cvv: e.target.value }))} placeholder="···" maxLength={3} type="password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a18]" />
                  </div>
                </div>
              </div>
            )}
            {payMethod === 'mobile' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[['bKash', '🟣'], ['Nagad', '🟠'], ['Rocket', '🔵']].map(([name, emoji]) => (
                    <button key={name} className="border border-gray-200 rounded-xl py-3 flex flex-col items-center gap-1 hover:border-[#111827] transition-colors">
                      <span className="text-xl">{emoji}</span>
                      <span className="text-xs font-medium text-gray-600">{name}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input placeholder="+880 1X XX-XXXXXX" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
                </div>
              </div>
            )}
            {payMethod === 'bank' && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ['Account Name', 'UIU Rental Trust'],
                    ['Account No', '1234-5678-9012'],
                    ['Bank', 'Dutch-Bangla Bank'],
                    ['Branch', 'Badda'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-mono font-semibold text-[#1a1a18]">{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={submitPayment} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors">I've completed the transfer</button>
              </div>
            )}
            {payMethod !== 'bank' && (
              <>
                <div className="flex gap-2 text-xs text-gray-500 items-center"><span>🔒</span><span>Payments are processed securely</span></div>
                <button onClick={submitPayment} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">Pay ৳4,200</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
