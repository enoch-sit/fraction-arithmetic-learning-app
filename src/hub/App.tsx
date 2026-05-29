export default function App() {
  const apps = [
    { href: 'expanding.html', emoji: '🔢', title: '分數擴分與約分', desc: '以視覺化長條圖學習分數的擴分與約分操作', color: '#9b59b6' },
    { href: 'addition.html', emoji: '➕', title: '異分母分數加法', desc: '通分後進行分數加法，含拖拉色塊合併動畫', color: '#27ae60' },
    { href: 'subtraction.html', emoji: '➖', title: '異分母分數減法', desc: '通分後進行分數減法，含拖拉丟棄動畫', color: '#e74c3c' },
    { href: 'multiplication.html', emoji: '✖️', title: '分數乘法', desc: '以長條圖視覺化分數乘法的細分與保留過程', color: '#e67e22' },
    { href: 'division.html', emoji: '➗', title: '異分母分數除法', desc: '通分後以模具量測法演示分數除法', color: '#3498db' },
    { href: 'comparison.html', emoji: '⚖️', title: '分數比較', desc: '以長條圖與數線比較 2 到 3 個分數的大小關係', color: '#16a085' },
  ]

  return (
    <div style={{ fontFamily: "'PingFang HK', 'Microsoft JhengHei', sans-serif", background: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', margin: 0 }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '2.2rem', marginBottom: 8 }}>分數教學應用</h1>
        <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem', marginBottom: 40 }}>選擇一個主題開始學習</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {apps.map(app => (
            <a
              key={app.href}
              href={app.href}
              style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'white', borderRadius: 16, padding: '20px 28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textDecoration: 'none', color: 'inherit', transition: 'transform 0.15s, box-shadow 0.15s', borderLeft: `6px solid ${app.color}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <span style={{ fontSize: '2.5rem', minWidth: 48, textAlign: 'center' }}>{app.emoji}</span>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>{app.title}</div>
                <div style={{ fontSize: '1rem', color: '#7f8c8d' }}>{app.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '1.5rem', color: app.color }}>›</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
