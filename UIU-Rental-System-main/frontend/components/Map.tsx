import React from 'react'

export function CampusMap({ pinX, pinY, label, color = '#c87941' }: { pinX: number; pinY: number; label: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full rounded-xl bg-gray-100 border border-gray-200" style={{ minHeight: 160 }}>
      {/* Grid roads */}
      <line x1="50" y1="0" x2="50" y2="100" stroke="#c8ddd9" strokeWidth="1.5" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#c8ddd9" strokeWidth="1.5" />
      <line x1="25" y1="0" x2="25" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="75" y1="0" x2="75" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="0" y1="25" x2="100" y2="25" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="#d8e8e5" strokeWidth="0.6" />
      {/* UIU campus block */}
      <rect x="40" y="40" width="20" height="20" rx="2" fill="#1a1a18" opacity="0.2" />
      <text x="50" y="52.5" textAnchor="middle" fontSize="3.5" fill="#1a1a18" fontWeight="bold">UIU</text>
      {/* Distance rings */}
      <circle cx="50" cy="50" r="8" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.5" />
      <circle cx="50" cy="50" r="16" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.35" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.2" />
      <text x="59" y="42.5" fontSize="2.5" fill="#1a1a18" opacity="0.6">0.5km</text>
      <text x="67" y="34.5" fontSize="2.5" fill="#1a1a18" opacity="0.5">1km</text>
      {/* Property pin */}
      <circle cx={pinX} cy={pinY} r="3.5" fill={color} stroke="white" strokeWidth="1" />
      <circle cx={pinX} cy={pinY} r="1.3" fill="white" />
      <text x={pinX} y={pinY - 5.5} textAnchor="middle" fontSize="3" fill="#1a1a18" fontWeight="600">{label}</text>
    </svg>
  )
}

export function InteractiveMap({ onPin, pin }: { onPin: (p: { x: number; y: number }) => void; pin: { x: number; y: number } | null }) {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onPin({ x, y })
  }
  return (
    <svg viewBox="0 0 100 100" onClick={handleClick} className="w-full rounded-xl bg-gray-100 border border-gray-200 cursor-crosshair" style={{ minHeight: 200 }}>
      <line x1="50" y1="0" x2="50" y2="100" stroke="#c8ddd9" strokeWidth="1.5" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#c8ddd9" strokeWidth="1.5" />
      <line x1="25" y1="0" x2="25" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="75" y1="0" x2="75" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="0" y1="25" x2="100" y2="25" stroke="#d8e8e5" strokeWidth="0.6" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="#d8e8e5" strokeWidth="0.6" />
      <rect x="40" y="40" width="20" height="20" rx="2" fill="#1a1a18" opacity="0.2" />
      <text x="50" y="52.5" textAnchor="middle" fontSize="3.5" fill="#1a1a18" fontWeight="bold">UIU</text>
      <circle cx="50" cy="50" r="8"  fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.5" />
      <circle cx="50" cy="50" r="16" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.35" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.2" />
      <text x="59" y="42.5" fontSize="2.5" fill="#1a1a18" opacity="0.6">0.5km</text>
      <text x="67" y="34.5" fontSize="2.5" fill="#1a1a18" opacity="0.5">1km</text>
      {pin && (
        <g transform={`translate(${pin.x},${pin.y})`}>
          <circle r="4" fill="#c87941" stroke="white" strokeWidth="1.2" />
          <circle r="1.5" fill="white" />
        </g>
      )}
      {!pin && <text x="50" y="86" textAnchor="middle" fontSize="3.5" fill="#9ca3af">Click to pin your property</text>}
    </svg>
  )
}
