export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 24, maxWidth: 320 }}>{description}</p>
      {action}
    </div>
  )
}
