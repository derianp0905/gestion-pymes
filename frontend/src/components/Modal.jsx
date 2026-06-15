import { useEffect } from 'react'
import { X } from 'lucide-react'

const WIDTHS = { sm: 420, md: 520, lg: 680, xl: 820 }

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,.5)',
        width: '100%',
        maxWidth: WIDTHS[size] ?? 520,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}
