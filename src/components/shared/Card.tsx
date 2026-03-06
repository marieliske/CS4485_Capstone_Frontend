import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  className?: string
}

export function Card({ children, title, className }: CardProps) {
  return (
    <section className={className ? `card ${className}` : 'card'}>
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </section>
  )
}
