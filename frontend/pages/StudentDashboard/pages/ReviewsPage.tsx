import { Badge } from '../../../components/ui'
import type { Review, StudentPage } from '../types'

type ReviewsPageProps = {
  page: StudentPage
  reviewHistory: Review[]
  reviewableLandlords: Array<{ landlord: string; property: string; listingId: number }>
  reviewTarget: { landlord: string; property: string; listingId: number }
  setReviewTarget: (value: { landlord: string; property: string; listingId: number }) => void
  reviewText: string
  setReviewText: (value: string) => void
  questionAnswers: number[]
  setQuestionAnswers: React.Dispatch<React.SetStateAction<number[]>>
  wouldRecommend: 'yes' | 'no' | 'maybe' | ''
  setWouldRecommend: (value: 'yes' | 'no' | 'maybe' | '') => void
  reviewStep: number
  setReviewStep: (value: number) => void
  submitReview: () => void
  setPage: (page: StudentPage) => void
  alreadyReviewed: (listingId: number) => boolean
}

export default function ReviewsPage({ page, reviewHistory, reviewableLandlords, reviewTarget, setReviewTarget, reviewText, setReviewText, questionAnswers, setQuestionAnswers, wouldRecommend, setWouldRecommend, reviewStep, setReviewStep, submitReview, setPage, alreadyReviewed }: ReviewsPageProps) {
  const starQuestions = [
    { key: 0, label: 'Landlord Communication', q: "How would you rate your landlord's communication?" },
    { key: 1, label: 'Maintenance Responsiveness', q: 'How responsive was your landlord to maintenance issues?' },
    { key: 2, label: 'Property Condition', q: 'How would you rate the overall property condition?' },
    { key: 3, label: 'Value for Money', q: 'How would you rate value for money?' },
  ]
  const starLabel = (n: number) => ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n] ?? ''
  const allStarsDone = questionAnswers.slice(0, 4).every(v => v > 0)
  const canSubmit = allStarsDone && wouldRecommend !== '' && reviewText.trim().length > 0

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Rate & Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rate landlords and view your review history</p>
        </div>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([['reviews', 'Write a Review'], ['review-history', `History (${reviewHistory.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => { setPage(id); setReviewStep(0) }} className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${page === id ? 'bg-white text-[#1a1a18] shadow-sm' : 'text-gray-500 hover:text-[#1a1a18]'}`}>
            {label}
          </button>
        ))}
      </div>
      {page === 'reviews' && reviewStep === 7 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center max-w-lg">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-xl font-bold text-[#111827] mb-1">Review Submitted!</div>
          <div className="text-sm text-gray-500 mb-6">Thank you for reviewing {reviewTarget.landlord}. Your feedback helps other students.</div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPage('review-history')} className="text-sm bg-[#111827] text-white px-5 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors font-semibold">View History</button>
            <button onClick={() => { setReviewStep(0); setQuestionAnswers([0, 0, 0, 0, 0]); setWouldRecommend(''); setReviewText('') }} className="text-sm border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl hover:bg-gray-50">Write Another</button>
          </div>
        </div>
      ) : page === 'reviews' ? (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3 border-t-4 border-[#111827]">
            <div className="font-bold text-[#111827] text-base">Rate & Review a Landlord</div>
            <p className="text-sm text-gray-500">Select the landlord you'd like to review, then complete the form below.</p>
            <div className="space-y-2 pt-1">
              {reviewableLandlords.map(opt => (
                <label key={opt.listingId} onClick={() => setReviewTarget(opt)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${reviewTarget.listingId === opt.listingId ? 'border-[#111827] bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${reviewTarget.listingId === opt.listingId ? 'border-[#111827]' : 'border-gray-300'}`}>
                    {reviewTarget.listingId === opt.listingId && <div className="w-2 h-2 bg-[#111827] rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#111827]">{opt.landlord}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.property}</div>
                  </div>
                  {alreadyReviewed(opt.listingId) && <Badge variant="success">Reviewed</Badge>}
                </label>
              ))}
            </div>
            {alreadyReviewed(reviewTarget.listingId) && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-sm text-emerald-800 font-medium">You've already reviewed {reviewTarget.landlord}</span>
                <button onClick={() => setPage('review-history')} className="text-xs text-emerald-700 font-semibold hover:underline flex-shrink-0">View →</button>
              </div>
            )}
          </div>
          {!alreadyReviewed(reviewTarget.listingId) && (
            <>
              {starQuestions.map(({ key, label, q }) => (
                <div key={key} className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="font-semibold text-[#111827] text-sm">{label} <span className="text-red-500">*</span></div>
                  <p className="text-sm text-gray-500">{q}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setQuestionAnswers(a => { const n = [...a]; n[key] = s; return n })} className={`text-3xl transition-all hover:scale-110 ${s <= questionAnswers[key] ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}>★</button>
                    ))}
                    {questionAnswers[key] > 0 && <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{starLabel(questionAnswers[key])}</span>}
                  </div>
                </div>
              ))}
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
                <div className="font-semibold text-[#111827] text-sm">Would you recommend this landlord / property? <span className="text-red-500">*</span></div>
                <p className="text-sm text-gray-500">Based on your overall experience, would you recommend this to other students?</p>
                <div className="flex gap-3 pt-1">
                  {(['yes', 'no', 'maybe'] as const).map(opt => (
                    <button key={opt} onClick={() => setWouldRecommend(opt)} className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${wouldRecommend === opt ? 'bg-[#111827] text-white border-[#111827]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      {opt === 'yes' ? '👍 Yes' : opt === 'no' ? '👎 No' : '🤔 Maybe'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
                <div className="font-semibold text-[#111827] text-sm">Overall Experience <span className="text-red-500">*</span></div>
                <p className="text-sm text-gray-500">Share your experience in detail — what was great, and what could be better.</p>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={5} placeholder="Write your experience here…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#111827] mt-1 bg-gray-50 focus:bg-white transition-colors" />
                <div className="text-xs text-gray-400 text-right">{reviewText.length} characters</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="text-xs text-gray-400">{canSubmit ? <span className="text-emerald-600 font-medium">✓ Ready to submit</span> : <span>Complete all required fields <span className="text-red-500">*</span></span>}</div>
                <button disabled={!canSubmit} onClick={() => { submitReview(); setReviewStep(7) }} className="bg-[#111827] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1f2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Submit Review</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviewHistory.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-500">
              <div className="text-4xl mb-3">⭐</div>
              <div className="font-semibold">No reviews yet</div>
              <div className="text-sm mt-1">Submit your first review from the Write a Review tab</div>
            </div>
          ) : reviewHistory.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-[#1a1a18]">{r.landlord}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.property}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{r.date}</div>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500 mr-1.5">Landlord</span>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= r.landlordStars ? 'text-amber-400' : 'text-gray-200'}>★</span>)}
                </div>
                <div>
                  <span className="text-gray-500 mr-1.5">Property</span>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= r.propStars ? 'text-amber-400' : 'text-gray-200'}>★</span>)}
                </div>
              </div>
              {r.text && <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">&ldquo;{r.text}&rdquo;</p>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
