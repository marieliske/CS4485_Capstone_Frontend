import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button {...props} className={className ? `btn ${className}` : 'btn'}>
      {children}
    </button>
  )
}
