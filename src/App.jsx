jsx
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : 'Check your email')
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : 'Logged in')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ZUKA TEST</h1>
      <p>URL: {import.meta.env.VITE_SUPABASE_URL}</p>
      <p>KEY EXISTS: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'YES' : 'NO'}</p>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <br /><br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br /><br />
      <button onClick={signUp}>Sign Up</button>
      <button onClick={login}>Login</button>
      <p>{message}</p>
    </div>
  )
}
