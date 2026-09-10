export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  let cum = 0
  const stops = segments.map(s => { const a = (cum / total) * 360; cum += s.value; return `${s.color} ${a.toFixed(1)}deg ${((cum / total) * 360).toFixed(1)}deg` }).join(', ')
  const pct = Math.round((segments[0]?.value / total) * 100)
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0 w-20 h-20">
        <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(from -90deg, ${stops})` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-[#1a1a18] leading-none">{pct}%</span>
            <span className="text-[8px] text-gray-400 leading-none mt-0.5">{segments[0]?.label}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="font-semibold text-[#1a1a18] ml-1">{seg.value}</span>
            <span className="text-gray-400">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BarChartH({ bars }: { bars: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="space-y-2.5">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-xs text-gray-500 text-right truncate flex-shrink-0">{b.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className="h-4 rounded-full" style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color ?? '#1a1a18', transition: 'width 0.4s ease' }} />
          </div>
          <div className="w-8 text-right text-xs font-semibold font-mono text-[#1a1a18] flex-shrink-0">{b.value}</div>
        </div>
      ))}
    </div>
  )
}

export function LineChart({ points, labels, color = '#1a1a18' }: { points: number[]; labels: string[]; color?: string }) {
  const n = points.length; if (n < 2) return null
  const max = Math.max(...points, 1)
  const W = 280; const H = 70; const pL = 20; const pR = 10; const pT = 12; const pB = 18
  const plotW = W - pL - pR; const plotH = H - pT
  const xs = points.map((_, i) => pL + (i / (n - 1)) * plotW)
  const ys = points.map(v => pT + (1 - v / max) * plotH)
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const area = `${line} L${xs[n-1].toFixed(1)},${(pT + plotH).toFixed(1)} L${xs[0].toFixed(1)},${(pT + plotH).toFixed(1)} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H + pB}`} className="w-full">
      {[0, 0.5, 1].map(t => <line key={t} x1={pL} y1={pT + t * plotH} x2={W - pR} y2={pT + t * plotH} stroke="#e5e5e3" strokeWidth="0.8" />)}
      <path d={area} fill={color} opacity="0.07" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="2.5" fill={color} />
          <text x={x} y={H + pB - 2} textAnchor="middle" fontSize="6.5" fill="#9ca3af">{labels[i]}</text>
          <text x={x} y={ys[i] - 5} textAnchor="middle" fontSize="7" fontWeight="600" fill={color}>{points[i]}</text>
        </g>
      ))}
    </svg>
  )
}
