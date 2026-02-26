import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../hooks/AuthContext'
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ExploreIcon from '@mui/icons-material/Explore'
import SettingsIcon from '@mui/icons-material/Settings'

export default function LeftSidebar() {
  const { auth } = useContext(AuthContext)
  const navigate = useNavigate()

  const first = auth?.firstName || ''
  const last = auth?.lastName || ''
  const name = `${first} ${last}`.trim() || auth?.name || 'Usuario'

  const nav = (path) => {
    try { navigate(path) } catch (_) {}
  }

  return (
    <div className="fb-left-sidebar" style={{padding:'0.5rem', display:'flex', flexDirection:'column', gap:12}}>
      <div className="fb-left-profile" style={{display:'flex', alignItems:'center', gap:10}}>
        <div className="fb-left-avatar" style={{width:56, height:56, borderRadius:10, backgroundColor:'var(--fn-primary)', color:'var(--fn-on-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18}}>
          { (auth?.firstName && auth.firstName[0]) || (auth?.name && auth.name[0]) || 'U' }
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
