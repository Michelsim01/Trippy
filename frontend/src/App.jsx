import { useEffect, useState } from 'react'

export default function App() {
  const [msg, setMsg] = useState('…')

  useEffect(() => {
    fetch('/api/hello')
      .then(r => r.text())
      .then(setMsg)
      .catch(() => setMsg('Failed to reach backend'))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>React + Spring Boot Starter</h1>
      <p>Backend says: <strong>{msg}</strong></p>
    </main>
  )
}
