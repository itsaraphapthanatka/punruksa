'use client'

export function LanguageSwitcher({ locale }: { locale: 'th' | 'en' }) {
  const set = (l: string) => {
    if (l === locale) return
    document.cookie = `lang=${l};path=/;max-age=31536000`
    location.reload()
  }
  return (
    <div style={{ display: 'inline-flex', border: '1px solid #e3e4f0', borderRadius: 999, overflow: 'hidden' }}>
      {(['th', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          style={{ padding: '5px 11px', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: locale === l ? '#667eea' : 'transparent', color: locale === l ? '#fff' : '#6b7280' }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
