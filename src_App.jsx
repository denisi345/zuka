jsx
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function App(){
  const [user,setUser]=useState(null)
  const [posts,setPosts]=useState([])
  const [text,setText]=useState('')
  
  useEffect(()=>{ check(); load() },[])
  async function check(){ const {data}=await supabase.auth.getUser(); setUser(data.user) }
  async function load(){ const {data}=await supabase.from('posts').select('*').order('created_at',{ascending:false}); if(data) setPosts(data) }
  async function login(){
    const email=prompt('Email:'); const password=prompt('Password:')
    if(!email||!password) return
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error){ const {error:e2}=await supabase.auth.signUp({email,password}); if(e2) alert(e2.message); else alert('Akaunti imeundwa!') }
    check()
  }
  async function post(){
    if(!text) return; if(!user) return login()
    const {error}=await supabase.from('posts').insert({content:text, user_id:user.id})
    if(error) alert(error.message); else {setText(''); load()}
  }
  return(
    <div className="container">
      <h1 style={{textAlign:'center'}}>ZUKA 🌍</h1>
      <p style={{textAlign:'center',opacity:0.6}}>{user?user.email:'Hujajisajili'}</p>
      <div className="card"><input value={text} onChange={e=>setText(e.target.value)} placeholder="Andika..."/><button className="btn" onClick={post}>Post</button><button className="btn" style={{marginTop:8,background:'#333'}} onClick={login}>{user?'Logout':'Login / Jisajili'}</button></div>
      {posts.map(p=><div key={p.id} className="card"><p>{p.content}</p><small style={{opacity:0.5}}>{new Date(p.created_at).toLocaleString()}</small></div>)}
    </div>
  )
}