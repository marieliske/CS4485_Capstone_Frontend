type RotGaugeProps = {
  score: number
  compact?: boolean
}

function getGaugeLabel(score: number) {
  if (score <= 20) return 'Healthy'
  if (score <= 40) return 'Slightly Stale'
  if (score <= 60) return 'Needs Review'
  if (score <= 80) return 'At Risk'
  return 'Rotten'
}

export default function RotGauge({ score, compact = false }: RotGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = compact ? 54 : 84
  const width = compact ? 150 : 240
  const height = compact ? 96 : 150
  const startX = compact ? 21 : 30
  const endX = compact ? 129 : 210
  const baseY = compact ? 76 : 125
  const centerX = compact ? 75 : 120
  const scoreY = compact ? 56 : 88
  const subY = compact ? 70 : 108
  const strokeWidth = compact ? 12 : 18
  const circumference = Math.PI * radius
  const progress = circumference - (clamped / 100) * circumference
  const label = getGaugeLabel(clamped)

  return (
    <div className={`rot-gauge ${compact ? 'compact' : ''}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rot-gauge-svg">
        <defs>
          <linearGradient id="rotGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        <path
          d={`M ${startX} ${baseY} A ${radius} ${radius} 0 0 1 ${endX} ${baseY}`}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={`M ${startX} ${baseY} A ${radius} ${radius} 0 0 1 ${endX} ${baseY}`}
          fill="none"
          stroke="url(#rotGaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="rot-gauge-progress"
        />

        <text
          x={centerX}
          y={scoreY}
          textAnchor="middle"
          fontSize={compact ? '20' : '30'}
          fontWeight="700"
          fill="#F8FAFC"
        >
          {clamped}
        </text>

        <text
          x={centerX}
          y={subY}
          textAnchor="middle"
          fontSize={compact ? '10' : '13'}
          fontWeight="500"
          fill="#9FB2D1"
        >
          / 100
        </text>
      </svg>

      {!compact ? (
        <div className="rot-gauge-scale">
          <span>Fresh</span>
          <span>Rotten</span>
        </div>
      ) : null}

      <div className="rot-gauge-label">{label}</div>
    </div>
  )
}