type RotGaugeProps = {
  score: number
}

function getGaugeColor(score: number) {
  if (score <= 20) return '#4FD1C5'
  if (score <= 40) return '#63B3ED'
  if (score <= 60) return '#F6AD55'
  if (score <= 80) return '#F687B3'
  return '#FC8181'
}

function getGaugeLabel(score: number) {
  if (score <= 20) return 'Healthy'
  if (score <= 40) return 'Slightly Stale'
  if (score <= 60) return 'Needs Review'
  if (score <= 80) return 'At Risk'
  return 'Rotten'
}

export default function RotGauge({ score }: RotGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 80
  const circumference = Math.PI * radius
  const progress = circumference - (clamped / 100) * circumference
  const color = getGaugeColor(clamped)
  const label = getGaugeLabel(clamped)

  return (
    <div className="rot-gauge">
      <svg width="220" height="140" viewBox="0 0 220 140" className="rot-gauge-svg">
        <path
          d="M 20 120 A 80 80 0 0 1 200 120"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 120 A 80 80 0 0 1 200 120"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
        <text
          x="110"
          y="85"
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill="#F8FAFC"
        >
          {clamped}
        </text>
      </svg>

      <div className="rot-gauge-label" style={{ color }}>
        {label}
      </div>
    </div>
  )
}