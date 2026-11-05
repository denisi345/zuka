import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [stories, setStories] = useState([])
  const [newStory, setNewStory] = useState('')
  const [reels, setReels] = useState([])
  const [newReel, setNewReel] = useState('')
  const [reelComments, setReelComments] = useState({})
  const [newReelComment, setNewReelComment] = useState({})
  const [groups, setGroups] = useState([])
  const [groupPosts, setGroupPosts] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupPost, setNewGroupPost] = useState('')
  const [events, setEvents] = useState([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [pages, setPages] = useState([])
  const [newPageName, setNewPageName] = useState('')
  const [products, setProducts] = useState([])
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [tips, setTips] = useState([])
  const [newTip, setNewTip] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [profiles, setProfiles] = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [hashtags, setHashtags] = useState([])
  const [newHashtag, setNewHashtag] = useState('')
  const [trendingPosts, setTrendingPosts] = useState([])
  const [feedItems, setFeedItems] = useState([])
  const [aiConversations, setAiConversations] = useState([])
  const [aiGeneratedPosts, setAiGeneratedPosts] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [ceoPanel, setCeoPanel] = useState([])
  const [ceoTitle, setCeoTitle] = useState('')
  const [ceoContent, setCeoContent] = useState('')

  const loadAll = async () => {
    const tables = [
      ['posts', setPosts],
      ['stories', setStories],
      ['reels', setReels],
      ['groups', setGroups],
      ['group_posts', setGroupPosts],
      ['events', setEvents],
      ['pages', setPages],
      ['products', setProducts],
      ['tips', setTips],
      ['messages', setMessages],
      ['conversations', setConversations],
      ['notifications', setNotifications],
      ['profiles', setProfiles],
      ['hashtags', setHashtags],
      ['trending_posts', setTrendingPosts],
      ['feed_items', setFeedItems],
      ['ai_conversations', setAiConversations],
      ['ai_generated_posts', setAiGeneratedPosts],
      ['ceo_panel', setCeoPanel],
    ]
    for (const [table, setter] of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (!error && data) setter(data)
    }
    if (user?.id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setMyProfile(data)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (user) loadAll() }, [user])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignUp = async () => {
    if (!email || !password) return alert('Please enter email and password')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert('Sign up failed: ' + error.message)
    if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        email,
        username: username || email.split('@')[0],
        full_name: fullName || username || 'ZUKA User',
        bio: bio || 'Welcome to ZUKA World'
      }])
      await supabase.from('user_settings').insert([{ user_id: data.user.id, theme: 'dark', language: 'en' }])
      await supabase.from('notifications').insert([{ user_id: data.user.id, title: 'Welcome', content: 'Welcome to ZUKA World' }])
    }
    alert('Account created. Please click Login.')
  }

  const handleLogin = async () => {
    if (!email || !password) return alert('Please enter email and password')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert('Login failed: ' + error.message)
    setUser(data.user)
    alert('Welcome ' + data.user.email)
    loadAll()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMyProfile(null)
    alert('Logged out')
  }

  const handleUpdateProfile = async () => {
    if (!user) return alert('Please login first')
    const { error } = await supabase.from('profiles').update({ username, full_name: fullName, bio }).eq('id', user.id)
    if (error) alert('Update failed: ' + error.message)
    else { alert('Profile updated'); loadAll() }
  }

  const handlePost = async () => {
    if (!newPost) return alert('Please write something first')
    const { data, error } = await supabase.from('posts').insert([{ content: newPost, user_id: user?.id || null }]).select().single()
    if (error) return alert('Post failed: ' + error.message)
    if (data?.id) {
      await supabase.from('feed_items').insert([{ post_id: data.id, content: newPost, user_id: user?.id || null }])
      await supabase.from('post_views').insert([{ post_id: data.id, user_id: user?.id || null }])
    }
    alert('Post published')
    setNewPost('')
    loadAll()
  }

  const handleLikePost = async (postId) => {
    const { error } = await supabase.from('likes').insert([{ post_id: postId, user_id: user?.id || null }])
    if (error) alert('Like failed: ' + error.message)
    else alert('Liked')
  }

  const handleSavePost = async (postId) => {
    const { error } = await supabase.from('saved_posts').insert([{ post_id: postId, user_id: user?.id || null }])
    if (error) alert('Save failed: ' + error.message)
    else alert('Saved')
  }

  const handleComment = async (postId) => {
    const text = newComment[postId]
    if (!text) return alert('Please write a comment')
    const { error } = await supabase.from('comments').insert([{ post_id: postId, content: text, user_id: user?.id || null }])
    if (error) return alert('Comment failed: ' + error.message)
    alert('Comment posted')
    setNewComment({ ...newComment, [postId]: '' })
    loadAll()
  }

  const loadComments = async (postId) => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false })
    setComments({ ...comments, [postId]: data || [] })
  }

  const handleLikeComment = async (commentId) => {
    const { error } = await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: user?.id || null }])
    if (error) alert('Like failed: ' + error.message)
    else alert('Comment liked')
  }

  const handleReport = async (postId) => {
    const reason = prompt('Reason for report:')
    if (!reason) return
    const { error } = await supabase.from('reports').insert([{ post_id: postId, reason, user_id: user?.id || null }])
    if (error) alert('Report failed: ' + error.message)
    else alert('Reported')
  }

  const handleStory = async () => {
    if (!newStory) return alert('Please write a story')
    const { data, error } = await supabase.from('stories').insert([{ content: newStory, user_id: user?.id || null }]).select().single()
    if (error) return alert('Story failed: ' + error.message)
    if (data?.id) await supabase.from('story_views').insert([{ story_id: data.id, user_id: user?.id || null }])
    alert('Story published')
    setNewStory('')
    loadAll()
  }

  const handleReel = async () => {
    if (!newReel) return alert('Please write a reel caption')
    const { error } = await supabase.from('reels').insert([{ caption: newReel, user_id: user?.id || null }])
    if (error) return alert('Reel failed: ' + error.message)
    alert('Reel published')
    setNewReel('')
    loadAll()
  }

  const handleLikeReel = async (reelId) => {
    const { error } = await supabase.from('reel_likes').insert([{ reel_id: reelId, user_id: user?.id || null }])
    if (error) alert('Like failed: ' + error.message)
    else alert('Reel liked')
  }

  const handleReelComment = async (reelId) => {
    const text = newReelComment[reelId]
    if (!text) return alert('Please write a comment')
    const { error } = await supabase.from('reel_comments').insert([{ reel_id: reelId, content: text, user_id: user?.id || null }])
    if (error) return alert('Comment failed: ' + error.message)
    alert('Reel comment posted')
    setNewReelComment({ ...newReelComment, [reelId]: '' })
    loadAll()
  }

  const loadReelComments = async (reelId) => {
    const { data } = await supabase.from('reel_comments').select('*').eq('reel_id', reelId)
    setReelComments({ ...reelComments, [reelId]: data || [] })
  }

  const handleGroup = async () => {
    if (!newGroupName) return alert('Please enter group name')
    const { data, error } = await supabase.from('groups').insert([{ name: newGroupName, description: newGroupName }]).select().single()
    if (error) return alert('Group failed: ' + error.message)
    if (data?.id) {
      await supabase.from('group_members').insert([{ group_id: data.id, user_id: user?.id || null }])
      await supabase.from('group_posts').insert([{ group_id: data.id, content: 'Welcome to ' + newGroupName, user_id: user?.id || null }])
    }
    alert('Group created')
    setNewGroupName('')
    loadAll()
  }

  const handleJoinGroup = async (groupId) => {
    const { error } = await supabase.from('group_members').insert([{ group_id: groupId, user_id: user?.id || null }])
    if (error) alert('Join failed: ' + error.message)
    else alert('Joined group')
  }

  const handleGroupPost = async () => {
    if (!newGroupPost) return alert('Please write a group post')
    const { error } = await supabase.from('group_posts').insert([{ content: newGroupPost, user_id: user?.id || null }])
    if (error) return alert('Group post failed: ' + error.message)
    alert('Group post published')
    setNewGroupPost('')
    loadAll()
  }

  const handleEvent = async () => {
    if (!newEventTitle) return alert('Please enter event title')
    const { data, error } = await supabase.from('events').insert([{ title: newEventTitle, description: newEventDescription }]).select().single()
    if (error) return alert('Event failed: ' + error.message)
    if (data?.id) await supabase.from('event_attendees').insert([{ event_id: data.id, user_id: user?.id || null }])
    alert('Event created')
    setNewEventTitle('')
    setNewEventDescription('')
    loadAll()
  }

  const handleJoinEvent = async (eventId) => {
    const { error } = await supabase.from('event_attendees').insert([{ event_id: eventId, user_id: user?.id || null }])
    if (error) alert('Join failed: ' + error.message)
    else alert('Joined event')
  }

  const handlePage = async () => {
    if (!newPageName) return alert('Please enter page name')
    const { data, error } = await supabase.from('pages').insert([{ name: newPageName, description: newPageName }]).select().single()
    if (error) return alert('Page failed: ' + error.message)
    if (data?.id) await supabase.from('page_likes').insert([{ page_id: data.id, user_id: user?.id || null }])
    alert('Page created')
    setNewPageName('')
    loadAll()
  }

  const handleLikePage = async (pageId) => {
    const { error } = await supabase.from('page_likes').insert([{ page_id: pageId, user_id: user?.id || null }])
    if (error) alert('Like failed: ' + error.message)
    else alert('Page liked')
  }

  const handleProduct = async () => {
    if (!newProductName) return alert('Please enter product name')
    const { error } = await supabase.from('products').insert([{ name: newProductName, price: newProductPrice, description: newProductName }])
    if (error) return alert('Product failed: ' + error.message)
    alert('Product added')
    setNewProductName('')
    setNewProductPrice('')
    loadAll()
  }

  const handleTip = async () => {
    if (!newTip) return alert('Please write a tip')
    const { error } = await supabase.from('tips').insert([{ content: newTip }])
    if (error) return alert('Tip failed: ' + error.message)
    alert('Tip posted')
    setNewTip('')
    loadAll()
  }

  const handleConversation = async () => {
    const title = prompt('Conversation title:')
    if (!title) return
    const { error } = await supabase.from('conversations').insert([{ title }])
    if (error) alert('Conversation failed: ' + error.message)
    else { alert('Conversation created'); loadAll() }
  }

  const handleMessage = async () => {
    if (!newMessage) return alert('Please write a message')
    const { error } = await supabase.from('messages').insert([{ content: newMessage, sender_id: user?.id || null }])
    if (error) return alert('Message failed: ' + error.message)
    alert('Message sent')
    setNewMessage('')
    loadAll()
  }

  const handleFollow = async (targetId) => {
    const { error } = await supabase.from('follows').insert([{ following_id: targetId, follower_id: user?.id || null }])
    if (error) alert('Follow failed: ' + error.message)
    else alert('Following')
  }

  const handleBlock = async (targetId) => {
    const { error } = await supabase.from('blocked_users').insert([{ blocked_user_id: targetId, user_id: user?.id || null }])
    if (error) alert('Block failed: ' + error.message)
    else alert('User blocked')
  }

  const handleHashtag = async () => {
    if (!newHashtag) return alert('Please enter hashtag')
    const { error } = await supabase.from('hashtags').insert([{ name: newHashtag }])
    if (error) alert('Hashtag failed: ' + error.message)
    else { alert('Hashtag added'); setNewHashtag(''); loadAll() }
  }

  const handleAI = async () => {
    if (!aiInput) return alert('Please ask AI something')
    const { data, error } = await supabase.from('ai_conversations').insert([{ prompt: aiInput, title: aiInput }]).select().single()
    if (error) return alert('AI failed: ' + error.message)
    if (data?.id) {
      await supabase.from('ai_messages').insert([{ conversation_id: data.id, content: aiInput, role: 'user' }])
      await supabase.from('ai_generated_posts').insert([{ content: 'AI: ' + aiInput, prompt: aiInput }])
    }
    alert('AI received your question')
    setAiInput('')
    loadAll()
  }

  const handleCEO = async () => {
    if (!ceoTitle) return alert('Please enter title')
    const { error } = await supabase.from('ceo_panel').insert([{ title: ceoTitle, content: ceoContent }])
    if (error) return alert('CEO failed: ' + error.message)
    alert('CEO note saved')
    setCeoTitle('')
    setCeoContent('')
    loadAll()
  }

  if (loading) return <div style={{ background: 'black', color: 'gold', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>ZUKA LOADING...</div>

  const btnGold = { background: 'gold', color: 'black', padding: '11px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
  const btnWhite = { background: 'white', color: 'black', padding: '11px', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  const btnDark = { background: '#333', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  const btnRed = { background: '#c00', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  const inputStyle = { width: '100%', padding: '11px', marginBottom: '10px', background: '#2a2a2a', color: 'white', border: 'none', borderRadius: '6px', boxSizing: 'border-box' }
  const card = { background: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '16px' }
  const smallCard = { background: '#2a2a2a', padding: '10px', borderRadius: '8px', marginTop: '10px' }

  const filteredPosts = posts.filter(p => (p.content || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', color: 'white', paddingBottom: '80px' }}>
      <div style={{ background: 'black', padding: '15px', borderBottom: '2px solid gold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ color: 'gold', margin: 0, fontSize: '24px' }}>ZUKA WORLD</h1>
        <span style={{ background: 'gold', color: 'black', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' }}>LIVE</span>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '12px' }}>
        <input style={inputStyle} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." />

        <div style={card}>
          {user ? (
            <div>
              <p><b>Logged in:</b> {user.email}</p>
              <p>Username: {myProfile?.username || 'Not set'} | Bio: {myProfile?.bio || ''}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleLogout} style={btnRed}>Logout</button>
              </div>
              <h4>Update Profile</h4>
              <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
              <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
              <input style={inputStyle} value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
              <button onClick={handleUpdateProfile} style={btnGold}>Update Profile</button>
            </div>
          ) : (
            <div>
              <h3 style={{ marginTop: 0 }}>Sign Up / Login</h3>
              <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
              <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
              <input style={inputStyle} value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSignUp} style={{ ...btnGold, flex: 1 }}>Sign Up</button>
                <button onClick={handleLogin} style={{ ...btnWhite, flex: 1 }}>Login</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '6px' }}>
          {['home', 'stories', 'reels', 'groups', 'events', 'pages', 'shop', 'messages', 'notifications', 'people', 'hashtags', 'ceo', 'ai'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'gold' : '#333', color: tab === t ? 'black' : 'white', padding: '9px 15px', border: 'none', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{t.toUpperCase()}</button>
          ))}
        </div>

        {tab === 'home' && (
          <div>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Create Post</h3>
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Write something..." rows={4} style={{ width: '100%', padding: '12px', background: '#2a2a2a', color: 'white', border: 'none', borderRadius: '8px', boxSizing: 'border-box' }} />
              <button onClick={handlePost} style={{ ...btnGold, width: '100%', marginTop: '10px' }}>Post</button>
            </div>
            <div style={card}>
              <h4>Trending ({trendingPosts.length})</h4>
              {trendingPosts.length === 0 ? <p>No trending posts yet</p> : trendingPosts.map((t, i) => <p key={i} style={smallCard}>{t.title || t.content || 'Trending'}</p>)}
              <h4>Feed ({feedItems.length})</h4>
              {feedItems.slice(0, 3).map(f => <p key={f.id} style={smallCard}>{f.content || 'Feed item'}</p>)}
            </div>
            <h3>Posts ({filteredPosts.length})</h3>
            {filteredPosts.map(p => (
              <div key={p.id} style={card}>
                <p style={{ fontSize: '16px' }}>{p.content || p.caption || p.text || p.title || 'Post'}</p>
                <small style={{ color: '#aaa' }}>{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</small>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleLikePost(p.id)} style={btnDark}>Like</button>
                  <button onClick={() => loadComments(p.id)} style={btnDark}>View Comments</button>
                  <button onClick={() => handleSavePost(p.id)} style={btnDark}>Save</button>
                  <button onClick={() => handleReport(p.id)} style={btnDark}>Report</button>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <input style={inputStyle} value={newComment[p.id] || ''} onChange={e => setNewComment({ ...newComment, [p.id]: e.target.value })} placeholder="Write a comment..." />
                  <button onClick={() => handleComment(p.id)} style={btnGold}>Send Comment</button>
                </div>
                {comments[p.id] && comments[p.id].map(c => (
                  <div key={c.id} style={smallCard}>
                    <p style={{ margin: 0 }}>{c.content || c.text || 'Comment'}</p>
                    <button onClick={() => handleLikeComment(c.id)} style={{ ...btnDark, marginTop: '6px' }}>Like Comment</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === 'stories' && (
          <div style={card}>
            <h3>Stories ({stories.length})</h3>
            <input style={inputStyle} value={newStory} onChange={e => setNewStory(e.target.value)} placeholder="Write a story..." />
            <button onClick={handleStory} style={btnGold}>Add Story</button>
            {stories.map(s => <p key={s.id} style={smallCard}>{s.content || s.caption || 'Story'}</p>)}
          </div>
        )}

        {tab === 'reels' && (
          <div style={card}>
            <h3>Reels ({reels.length})</h3>
            <input style={inputStyle} value={newReel} onChange={e => setNewReel(e.target.value)} placeholder="Reel caption..." />
            <button onClick={handleReel} style={btnGold}>Add Reel</button>
            {reels.map(r => (
              <div key={r.id} style={smallCard}>
                <p>{r.caption || r.title || r.content || 'Reel'}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleLikeReel(r.id)} style={btnDark}>Like Reel</button>
                  <button onClick={() => loadReelComments(r.id)} style={btnDark}>View Comments</button>
                </div>
                <input style={{ ...inputStyle, marginTop: '8px' }} value={newReelComment[r.id] || ''} onChange={e => setNewReelComment({ ...newReelComment, [r.id]: e.target.value })} placeholder="Reel comment..." />
                <button onClick={() => handleReelComment(r.id)} style={btnGold}>Send</button>
                {reelComments[r.id] && reelComments[r.id].map(c => <p key={c.id} style={{ background: '#1a1a1a', padding: '8px', borderRadius: '6px' }}>{c.content || 'Comment'}</p>)}
              </div>
            ))}
          </div>
        )}

        {tab === 'groups' && (
          <div style={card}>
            <h3>Groups ({groups.length})</h3>
            <input style={inputStyle} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name..." />
            <button onClick={handleGroup} style={btnGold}>Create Group</button>
            <input style={{ ...inputStyle, marginTop: '12px' }} value={newGroupPost} onChange={e => setNewGroupPost(e.target.value)} placeholder="Group post..." />
            <button onClick={handleGroupPost} style={btnWhite}>Send Group Post</button>
            {groups.map(g => <div key={g.id} style={smallCard}><p><b>{g.name || g.title || 'Group'}</b> - {g.description || ''}</p><button onClick={() => handleJoinGroup(g.id)} style={btnDark}>Join Group</button></div>)}
            <h4>Group Posts</h4>
            {groupPosts.map(gp => <p key={gp.id} style={smallCard}>{gp.content || 'Group post'}</p>)}
          </div>
        )}

        {tab === 'events' && (
          <div style={card}>
            <h3>Events ({events.length})</h3>
            <input style={inputStyle} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Event title..." />
            <input style={inputStyle} value={newEventDescription} onChange={e => setNewEventDescription(e.target.value)} placeholder="Event description..." />
            <button onClick={handleEvent} style={btnGold}>Create Event</button>
            {events.map(e => <div key={e.id} style={smallCard}><p><b>{e.title || e.name || 'Event'}</b> - {e.description || ''}</p><button onClick={() => handleJoinEvent(e.id)} style={btnDark}>Join Event</button></div>)}
          </div>
        )}

        {tab === 'pages' && (
          <div style={card}>
            <h3>Pages ({pages.length})</h3>
            <input style={inputStyle} value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="Page name..." />
            <button onClick={handlePage} style={btnGold}>Create Page</button>
            {pages.map(p => <div key={p.id} style={smallCard}><p><b>{p.name || p.title || 'Page'}</b></p><button onClick={() => handleLikePage(p.id)} style={btnDark}>Like Page</button></div>)}
          </div>
        )}

        {tab === 'shop' && (
          <div style={card}>
            <h3>Shop - Products ({products.length})</h3>
            <input style={inputStyle} value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Product name..." />
            <input style={inputStyle} value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="Price..." />
            <button onClick={handleProduct} style={btnGold}>Add Product</button>
            {products.map(pr => <p key={pr.id} style={smallCard}>{pr.name || pr.title || 'Product'} - {pr.price || ''}</p>)}
            <h4>Tips ({tips.length})</h4>
            <input style={inputStyle} value={newTip} onChange={e => setNewTip(e.target.value)} placeholder="Write a tip..." />
            <button onClick={handleTip} style={btnWhite}>Send Tip</button>
            {tips.map(t => <p key={t.id} style={smallCard}>{t.content || 'Tip'}</p>)}
          </div>
        )}

        {tab === 'messages' && (
          <div style={card}>
            <h3>Messages ({messages.length})</h3>
            <button onClick={handleConversation} style={btnDark}>New Conversation</button>
            {conversations.map(c => <p key={c.id} style={smallCard}>Conversation: {c.title || c.name || c.id}</p>)}
            <input style={{ ...inputStyle, marginTop: '12px' }} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Write a message..." />
            <button onClick={handleMessage} style={btnGold}>Send Message</button>
            {messages.map(m => <p key={m.id} style={smallCard}>{m.content || m.text || m.message || 'Message'}</p>)}
          </div>
        )}

        {tab === 'notifications' && (
          <div style={card}>
            <h3>Notifications ({notifications.length})</h3>
            {notifications.length === 0 ? <p>No notifications</p> : notifications.map(n => <p key={n.id} style={smallCard}>{n.title || ''} - {n.content || n.message || 'Notification'}</p>)}
          </div>
        )}

        {tab === 'people' && (
          <div style={card}>
            <h3>People ({profiles.length})</h3>
            {profiles.map(pr => (
              <div key={pr.id} style={{ ...smallCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{pr.username || pr.email || pr.full_name || pr.id}<br /><small>{pr.bio || ''}</small></span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleFollow(pr.id)} style={btnDark}>Follow</button>
                  <button onClick={() => handleBlock(pr.id)} style={btnRed}>Block</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'hashtags' && (
          <div style={card}>
            <h3>Hashtags ({hashtags.length})</h3>
            <input style={inputStyle} value={newHashtag} onChange={e => setNewHashtag(e.target.value)} placeholder="Hashtag without #..." />
            <button onClick={handleHashtag} style={btnGold}>Add Hashtag</button>
            {hashtags.map(h => <p key={h.id} style={smallCard}># {h.name || h.tag || 'hashtag'}</p>)}
          </div>
        )}

        {tab === 'ceo' && (
          <div style={card}>
            <h3>CEO Panel ({ceoPanel.length})</h3>
            <p>Posts: {posts.length} | Profiles: {profiles.length} | Stories: {stories.length} | Reels: {reels.length} | Groups: {groups.length} | Events: {events.length} | Pages: {pages.length} | Products: {products.length}</p>
            <input style={inputStyle} value={ceoTitle} onChange={e => setCeoTitle(e.target.value)} placeholder="Title..." />
            <input style={inputStyle} value={ceoContent} onChange={e => setCeoContent(e.target.value)} placeholder="Content..." />
            <button onClick={handleCEO} style={btnGold}>Save CEO Note</button>
            {ceoPanel.map(c => <p key={c.id} style={smallCard}>{c.title || ''} - {c.content || ''}</p>)}
          </div>
        )}

        {tab === 'ai' && (
          <div style={card}>
            <h3>ZUKA AI</h3>
            <input style={inputStyle} value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask AI..." />
            <button onClick={handleAI} style={btnGold}>Ask AI</button>
            {aiConversations.map(a => <p key={a.id} style={smallCard}>{a.prompt || a.title || 'AI Conversation'}</p>)}
            {aiGeneratedPosts.map(a => <p key={a.id} style={smallCard}>AI Post: {a.content || ''}</p>)}
          </div>
        )}

      </div>
    </div>
  )
}
