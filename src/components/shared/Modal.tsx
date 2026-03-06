import type { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          maxWidth: 600,
          padding: 16,
          width: '90%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <Button onClick={onClose}>Close</Button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  )
}
