import React, { useContext, useState } from 'react'
import btcLogo from '../../assets/bitcoin-btc-logo.svg'
import usdtLogo from '../../assets/tether-usdt-logo.svg'
import { useNavigate } from 'react-router-dom'
import useDonations from '../../hooks/useDonations'
import useProfile from '../../hooks/useProfile'
import { AuthContext } from '../../hooks/AuthContext'
import { apiOrigin } from '../../api/http'
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ExploreIcon from '@mui/icons-material/Explore'
import SettingsIcon from '@mui/icons-material/Settings'

function resolveProfilePhotoUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${apiOrigin}${url}` : url
}

export default function LeftSidebar() {
  const { auth } = useContext(AuthContext)
  const { profile } = useProfile()
  const [copied, setCopied] = useState({ btc: false, usdt: false })
  const navigate = useNavigate()
  const profilePhotoUrl = resolveProfilePhotoUrl(profile?.profilePhotoUrl)

  const { wallets } = useDonations()
  const btcAddress = wallets.btc
  const usdtAddress = wallets.usdt

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied((p) => ({ ...p, [key]: true }))
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000)
    } catch (err) {
      console.error('copy failed', err)
    }
  }

  const first = auth?.firstName || ''
  const last = auth?.lastName || ''
  const name = `${first} ${last}`.trim() || auth?.name || 'Usuario'

  const nav = (path) => {
    try { navigate(path) } catch (_) {}
  }


  return (
    <div className="fb-left-sidebar" style={{padding:'0.5rem', display:'flex', flexDirection:'column', gap:12}}>
      <div className="fb-left-profile" style={{display:'flex', alignItems:'center', gap:10}}>
        <div
          className="fb-left-avatar"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: profilePhotoUrl ? 'transparent' : 'var(--fn-primary)',
            color: 'var(--fn-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (auth?.firstName && auth.firstName[0]) || (auth?.name && auth.name[0]) || 'U'
          )}
        </div>
        <div style={{display:'flex', flexDirection:'column'}}>
          <div className="fb-left-name" style={{fontWeight:700, color:'var(--fn-text)', fontSize:14}}>{name}</div>
        </div>
      </div>

      <div style={{borderTop:'1px solid var(--fn-border)', paddingTop:8}} />

      <div className="fb-left-nav" style={{display:'flex', flexDirection:'column', gap:16}}>
        <button className="fb-left-item nav-link" onClick={() => nav('/')} style={buttonStyle()} aria-label="dashboard">
          <span className="nav-icon teal" style={{fontSize:32, display:'inline-flex', alignItems:'center'}}><DynamicFeedIcon style={{fontSize:32}} /></span>
          <span style={{marginLeft:14, fontSize:16, fontWeight:700}}>Dashboard</span>
        </button>

        <button className="fb-left-item nav-link" onClick={() => nav('/videos')} style={buttonStyle()} aria-label="videos">
          <span className="nav-icon teal" style={{fontSize:32, display:'inline-flex', alignItems:'center'}}><VideoLibraryIcon style={{fontSize:32}} /></span>
          <span style={{marginLeft:14, fontSize:16, fontWeight:700}}>Videos</span>
        </button>

        <button className="fb-left-item nav-link" onClick={() => nav('/chat')} style={buttonStyle()} aria-label="chat">
          <span className="nav-icon blue" style={{fontSize:32, display:'inline-flex', alignItems:'center'}}><ChatBubbleOutlineIcon style={{fontSize:32}} /></span>
          <span style={{marginLeft:14, fontSize:16, fontWeight:700}}>Chat</span>
        </button>

        <button className="fb-left-item nav-link" onClick={() => nav('/activity')} style={buttonStyle()} aria-label="activity">
          <span className="nav-icon teal" style={{fontSize:32, display:'inline-flex', alignItems:'center'}}><ExploreIcon style={{fontSize:32}} /></span>
          <span style={{marginLeft:14, fontSize:16, fontWeight:700}}>Activity</span>
        </button>

        <button className="fb-left-item nav-link" onClick={() => nav('/settings')} style={buttonStyle()} aria-label="settings">
          <span className="nav-icon teal" style={{fontSize:32, display:'inline-flex', alignItems:'center'}}><SettingsIcon style={{fontSize:32}} /></span>
          <span style={{marginLeft:14, fontSize:16, fontWeight:700}}>Settings</span>
        </button>
      </div>
      {/* Divider + Support and Wallets */}
      <hr className="fb-divider" />

      <div style={{padding:'0 0.25rem', display:'flex', flexDirection:'column', gap:8}}>
        <div style={{fontSize:12, color:'var(--fn-muted)', fontWeight:600}}>Support the tech community</div>
        <div style={{fontSize:12, color:'var(--fn-muted)'}}>Support the tech community with some donations to keep the site alive</div>

        <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:6}}>
          <div style={{display:'flex', alignItems:'center', gap:8, padding:'0.45rem', borderRadius:8, border:'1px solid var(--fn-border)', background:'linear-gradient(180deg, rgba(255,255,255,0.01), transparent)'}}>
            <div style={{width:36, height:36, borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F7931A,#E2761B)'}}>
              <img src={btcLogo} alt="BTC" style={{width:20, height:20, objectFit:'contain'}} />
            </div>
            <div style={{display:'flex', flexDirection:'column', minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--fn-text)'}}>Bitcoin</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{fontSize:12, color:'var(--fn-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140}}>{btcAddress || <span style={{color:'var(--fn-muted)'}}>Not configured</span>}</div>
                <button onClick={() => copyToClipboard(btcAddress, 'btc')} aria-label="copy-btc" title="Copy address" style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--fn-muted)', display:'inline-flex', alignItems:'center'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2"/>
                    <path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  </svg>
                </button>
                {copied.btc && <span style={{fontSize:12, color:'var(--fn-teal)'}}>Copied</span>}
              </div>
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:8, padding:'0.45rem', borderRadius:8, border:'1px solid var(--fn-border)', background:'linear-gradient(180deg, rgba(255,255,255,0.01), transparent)'}}>
            <div style={{width:36, height:36, borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#22c1c3,#1e90ff)'}}>
              <img src={usdtLogo} alt="USDT" style={{width:20, height:20, objectFit:'contain'}} />
            </div>
            <div style={{display:'flex', flexDirection:'column', minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--fn-text)'}}>USDT</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{fontSize:12, color:'var(--fn-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140}}>{usdtAddress || <span style={{color:'var(--fn-muted)'}}>Not configured</span>}</div>
                <button onClick={() => copyToClipboard(usdtAddress, 'usdt')} aria-label="copy-usdt" title="Copy address" style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--fn-muted)', display:'inline-flex', alignItems:'center'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2"/>
                    <path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  </svg>
                </button>
                {copied.usdt && <span style={{fontSize:12, color:'var(--fn-teal)'}}>Copied</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function buttonStyle() {
  return {
    display:'flex',
    alignItems:'center',
    gap:8,
    padding:'0.5rem',
    background:'transparent',
    border:'none',
    color:'var(--fn-text)',
    cursor:'pointer',
    borderRadius:8,
    textAlign:'left'
  }
}
