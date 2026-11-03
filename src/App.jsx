jsx
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default function App() {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20)
    if (data) setPosts(data)
    setLoading(false)
  }

  const handlePost = async () => {
    if (!newPost) return
    await supabase.from('posts').insert([{ content: newPost }])
    setNewPost('')
    fetchPosts()
  }

  if (loading) {
    return (
      <div style={{ background: 'black', color: 'gold', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1>ZUKA LOADING...</h1>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', color: 'white' }}>
      <div style={{ background: 'black', padding: '15px', borderBottom: '2px solid gold', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'gold', margin: 0 }}>ZUKA WORLD</h1>
        <span style={{ background: 'gold', color: 'black', padding: '5px 10px', borderRadius: '20px' }}>LIVE</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '20px auto', padding: '10px' }}>
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write something..."
            style={{ width: '100%', padding: '10px', background: '#2a2a2a', color: 'white', border: 'none', borderRadius: '5px' }}
            rows={3}
          />
          <button
            onClick={handlePost}
            style={{ background: 'gold', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '5px', marginTop: '10px', fontWeight: 'bold', width: '100%' }}
          >
            Post
          </button>
        </div>

        {posts.map((p) => (
          <div key={p.id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px', marginBottom: '15px', borderLeft: '3px solid gold' }}>
            <p>{p.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
