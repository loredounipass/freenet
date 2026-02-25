import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../hooks/AuthContext'
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia'
import User from '../../services/user'
import { useTranslation } from 'react-i18next'

export default function RightSidebar() {
  const { auth } = useContext(AuthContext)
  const { messages, fetchMyMessages, joinChat } = useMessagesAndMultimedia()
  const navigate = useNavigate()

  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)

  const currentUserId = auth?._id
  const [userCache, setUserCache] = useState({})
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuToggles, setMenuToggles] = useState({
    incomingCallSounds: true,
    messageSounds: true,
    popupNewMessages: true,
    showContacts: true,
  })

  useEffect(() => {
    // Ensure messages are loaded so we can compute contacts
    fetchMyMessages().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build list of contacts that I have written to (messages where I'm sender)
  const contacts = useMemo(() => {
    if (!currentUserId || !Array.isArray(messages)) return []
    const map = new Map()
    for (const m of messages) {
      if (!m) continue
      const sender = m.sender || m.senderId
      const receiver = m.receiver || m.receiverId
      if (String(sender) !== String(currentUserId)) continue
      if (!receiver) continue
      const existing = map.get(receiver)
      if (!existing) map.set(receiver, m)
      else {
        const tExisting = new Date(existing.createdAt || 0).getTime()
        const tNew = new Date(m.createdAt || 0).getTime()
        if (tNew > tExisting) map.set(receiver, m)
      }
    }
    // return up to 8 contacts sorted by last message
    return Array.from(map.entries())
      .map(([userId, lastMessage]) => ({ userId, lastMessage }))
      .sort((a, b) => new Date(b.lastMessage.createdAt || 0) - new Date(a.lastMessage.createdAt || 0))
      .slice(0, 8)
  }, [messages, currentUserId])

  const filteredContacts = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter((c) => {
      const u = userCache[c.userId] || {}
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      return fullName.includes(q) || email.includes(q)
    })
  }, [contacts, searchQuery, userCache])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return undefined
    const onDocClick = (e) => {
      const el = e.target
      if (menuRef.current && menuBtnRef.current) {
        if (!menuRef.current.contains(el) && !menuBtnRef.current.contains(el)) {
          setMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  useEffect(() => {
    const unknown = contacts.map(c => c.userId).filter(id => id && !userCache[id])
    if (unknown.length === 0) return
    let mounted = true
    ;(async () => {
      for (const uid of unknown) {
        try {
          const resp = await User.searchUsers(uid)
          const data = resp?.data
          let users = []
          if (Array.isArray(data)) users = data
          else if (data?.data && Array.isArray(data.data)) users = data.data
          const found = users.find(u => u._id === uid)
          if (found && mounted) setUserCache(prev => ({ ...prev, [uid]: found }))
        } catch (err) {
          // ignore
        }
      }
    })()
    return () => { mounted = false }
  }, [contacts, userCache])

  const handleOpenChat = (uid) => {
    try { joinChat(uid) } catch (_) {}
    navigate(`/chat/${uid}`)
  }

  const sponsored = [
    { id: 's1', title: 'Promoción local', image: '/assets/sponsored1.jpg', url: '#' },
    { id: 's2', title: 'Ofertas cerca de ti', image: '/assets/sponsored2.jpg', url: '#' },
  ]

  // distances removed per request

  return (
    <div className="fb-right-sidebar-inner">
      {/* Sponsored rendered without boxed section per request */}
      <div className="fb-sponsored-plain">
        <div className="fb-sidebar-header">Sponsored</div>
        <div className="fb-sponsored-list">
          {sponsored.map(s => (
            <a key={s.id} className="fb-sponsored-item" href={s.url} onClick={(e) => e.preventDefault()}>
              <div className="fb-sponsored-thumb" style={{backgroundImage: `url(${s.image})`}} />
              <div className="fb-sponsored-body">
                <div className="fb-sponsored-title">{s.title}</div>
                <div className="fb-sponsored-sub">Sponsored · Ad</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Divider between Sponsored and Contacts */}
      <hr className="fb-divider" />

      {/* Contacts rendered OUTSIDE boxed section per request */}
      <div className="fb-contacts-plain">
        <div className="fb-contacts-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem'}}>
          <div>Contacts</div>
          <div style={{display:'flex', alignItems:'center', gap:'0.25rem'}}>
            <button
              aria-label="contacts-menu"
              ref={menuBtnRef}
              className="fb-contacts-menu-btn"
              onClick={() => setMenuOpen((s) => !s)}
              style={{background:'transparent', border:'none', cursor:'pointer'}}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="12" cy="19" r="1.8" />
              </svg>
            </button>
            {menuOpen && (
              <div ref={menuRef} className="fb-contacts-menu" style={{position:'absolute', right:16, width:260, backgroundColor:'var(--fn-dark-card)', color:'var(--fn-text)', boxShadow:'0 6px 18px rgba(0,0,0,0.12)', borderRadius:8, padding:'0.5rem', zIndex:40, border:'1px solid var(--fn-border)'}}>
                <div style={{padding:'0.25rem 0.5rem', borderBottom:'1px solid var(--fn-border)', fontWeight:600}}>Chat settings</div>
                <div style={{padding:'0.5rem'}}>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem'}}>
                    <span>Incoming call sounds</span>
                    <input type="checkbox" checked={menuToggles.incomingCallSounds} onChange={(e) => setMenuToggles(prev => ({...prev, incomingCallSounds: e.target.checked}))} />
                  </label>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', marginTop:8}}>
                    <span>Message sounds</span>
                    <input type="checkbox" checked={menuToggles.messageSounds} onChange={(e) => setMenuToggles(prev => ({...prev, messageSounds: e.target.checked}))} />
                  </label>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', marginTop:8}}>
                    <span>Pop-up new messages</span>
                    <input type="checkbox" checked={menuToggles.popupNewMessages} onChange={(e) => setMenuToggles(prev => ({...prev, popupNewMessages: e.target.checked}))} />
                  </label>
                  <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', marginTop:8}}>
                    <span>Show contacts</span>
                    <input type="checkbox" checked={menuToggles.showContacts} onChange={(e) => setMenuToggles(prev => ({...prev, showContacts: e.target.checked}))} />
                  </label>
                </div>
                <div style={{padding:'0.5rem', borderTop:'1px solid var(--fn-border)', display:'flex', flexDirection:'column', gap:6}}>
                  <button className="fb-contacts-menu-link" style={{background:'transparent', border:'none', textAlign:'left', padding:6, cursor:'pointer'}}>Privacy & safety</button>
                  <button className="fb-contacts-menu-link" style={{background:'transparent', border:'none', textAlign:'left', padding:6, cursor:'pointer'}}>Active Status: ON</button>
                  <button className="fb-contacts-menu-link" style={{background:'transparent', border:'none', textAlign:'left', padding:6, cursor:'pointer'}}>Message delivery settings</button>
                  <button className="fb-contacts-menu-link" style={{background:'transparent', border:'none', textAlign:'left', padding:6, cursor:'pointer'}}>Block settings</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search (reused from ConversationList) - searching USERS not conversations */}
        <div className="conv-search-wrap" style={{padding:'0.5rem 0'}}>
          <span className="conv-search-icon" style={{display:'inline-flex', alignItems:'center', marginLeft:6}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
            <input
              className="conv-search-input"
              placeholder={t('chat.search_users')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{width:'100%'}}
            />
        </div>

        <div className="fb-contacts-list">
          {filteredContacts.length === 0 && (
            <div className="fb-contacts-empty">No has escrito a nadie aún.</div>
          )}

          {filteredContacts.map((c) => {
            const user = userCache[c.userId] || {}
            const name = user.firstName || user.name || user.email || `Usuario ${String(c.userId).slice(-4)}`
            if (!menuToggles.showContacts) return null
            return (
              <button key={c.userId} className="fb-contact-item plain" onClick={() => handleOpenChat(c.userId)}>
                <div className="fb-contact-avatar">{(user.firstName && user.firstName[0]) || 'U'}</div>
                <div className="fb-contact-info">
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <div className="fb-contact-name">{name}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
