import React from "react";

function getColor(score: number) {
  if (score <= 20) return "#22c55e";
  if (score <= 40) return "#84cc16";
  if (score <= 60) return "#f59e0b";
  if (score <= 80) return "#f97316";
  return "#ef4444";
}

function getLabel(score: number) {
  if (score <= 20) return "Healthy";
  if (score <= 40) return "Slightly Stale";
  if (score <= 60) return "Needs Review";
  if (score <= 80) return "At Risk";
  return "Rotten";
}

export default function RotGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = getColor(clamped);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="220" height="140" viewBox="0 0 220 140">
        <path
          d="M 20 120 A 80 80 0 0 1 200 120"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
        />
        <path
          d="M 20 120 A 80 80 0 0 1 200 120"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text x="110" y="85" textAnchor="middle" fontSize="28" fontWeight="700">
          {clamped}
        </text>
      </svg>

      <div style={{ fontWeight: 600, color }}>{getLabel(clamped)}</div>
    </div>
  );
}