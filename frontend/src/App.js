import React, { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthContext } from './hooks/AuthContext'
import useFindUser from './hooks/useFindUser'

import Login from "./pages/Login"
import { Box, Container, CssBaseline, Toolbar } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PublicRoute from './components/route-control/PublicRoute'
import PrivateRoute from './components/route-control/PrivateRoute'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import Home from './components/Home'
import VerifyToken from './components/2FA/verify-token'
import Footer from './components/Footer'
import Settings from './components/settings/Settings'
import ResendTokenForm from './components/2FA/ResendTokenForm'
import EmailVerificationComponent from './components/settings/verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConversationList from './components/chat/ConversationList'
import ChatView from './components/chat/ChatView'
import FeedList from './components/feed/FeedList'
import PostPage from './components/feed/PostPage'
import VideoFeed from './components/videos/VideoFeed'
import Discover from './components/discover/Discover'
import UserProfile from './components/profile/userProfile'
import { LanguageProvider } from './hooks/LanguageContext';
import { SocketProvider } from './hooks/SocketContext';
import './i18n';

// APLICACION CLIENTE
export default function App() {
    const { auth, setAuth, loading } = useFindUser();
    const mdTheme = createTheme();

    return (
            <AuthContext.Provider value={{ auth, setAuth, loading }}>
                <SocketProvider>
                <LanguageProvider>
                <ThemeProvider theme={mdTheme}>
                    <Box sx={{ display: 'flex' }}>
                        <CssBaseline />
                        <Navbar />
                        <MainBox />
                    </Box>
                </ThemeProvider>
                </LanguageProvider>
                </SocketProvider>
            </AuthContext.Provider>
    )
}

// Reads location so we can adapt the main Box overflow per route
function MainBox() {
    const location = useLocation()
    const isVideoPage = location.pathname === '/videos'

    return (
        <Box
            component="main"
            sx={{
                backgroundColor: 'transparent',
                flexGrow: 1,
                height: '100vh',
                overflow: isVideoPage ? 'hidden' : 'auto',
            }}
        >
            <Toolbar />
            <MainContent />
        </Box>
    )
}


// Separate component so we can read location after Router context is available
function MainContent() {
    const location = useLocation()
    const isVideoPage = location.pathname === '/videos'
    const isDiscoverPage = location.pathname === '/discover'

    return (
        <>
            <Routes>
                {/* Full-viewport video page — no Container wrapper */}
                <Route path="/videos" element={<PrivateRoute><VideoFeed /></PrivateRoute>} />
                <Route path="/discover" element={<PrivateRoute><WithContainer><Discover /></WithContainer></PrivateRoute>} />

                {/* All other routes inside a centred Container */}
                <Route path="/" element={<PrivateRoute><WithContainer><Home /></WithContainer></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><WithContainer><Settings /></WithContainer></PrivateRoute>} />
                <Route path="/feed" element={<PrivateRoute><WithFeedContainer><FeedList /></WithFeedContainer></PrivateRoute>} />
                <Route path="/feed/:id" element={<PrivateRoute><WithFeedContainer><PostPage /></WithFeedContainer></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><WithContainer><UserProfile /></WithContainer></PrivateRoute>} />
                <Route path="/profile/:userId" element={<PrivateRoute><WithContainer><UserProfile /></WithContainer></PrivateRoute>} />
                <Route path="/verifyemail" element={<PrivateRoute><WithContainer><EmailVerificationComponent /></WithContainer></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><WithContainer><ConversationList /></WithContainer></PrivateRoute>} />
                <Route path="/chat/:userId" element={<PrivateRoute><WithContainer><ChatView /></WithContainer></PrivateRoute>} />

                <Route path="/login" element={<PublicRoute><WithContainer><Login /></WithContainer></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><WithContainer><Register /></WithContainer></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><WithContainer><ForgotPassword /></WithContainer></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><WithContainer><ResetPassword /></WithContainer></PublicRoute>} />
                <Route path="/verifytoken" element={<PublicRoute><WithContainer><VerifyToken /></WithContainer></PublicRoute>} />
                <Route path="/resendtoken" element={<PublicRoute><WithContainer><ResendTokenForm /></WithContainer></PublicRoute>} />
            </Routes>

            {!isVideoPage && !isDiscoverPage && <FooterLoader />}
        </>
    )
}

function WithContainer({ children }) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative' }}>
            {children}
        </Container>
    )
}

// Feed-specific container: edge-to-edge on mobile, centered on desktop
function WithFeedContainer({ children }) {
    return (
        <Box
            sx={{
                width: '100%',
                mt: { xs: 0, sm: 1 },
                mb: { xs: 0, sm: 2 },
                px: { xs: 0, sm: 0 },
                position: 'relative',
            }}
        >
            {children}
        </Box>
    )
}

function FooterLoader() {
    const location = useLocation()
    const [show, setShow] = useState(false)

    useEffect(() => {
        // show footer only on public / pages / 2FA routes to avoid footer on private areas
        const publicPaths = new Set([
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/verifytoken',
            '/resendtoken'
        ])

        const path = location.pathname

        const shouldShow = publicPaths.has(path)

        // small delay to let route/component render first and avoid footer-only flash on refresh
        const t = setTimeout(() => setShow(shouldShow), 80)
        return () => clearTimeout(t)
    }, [location.pathname])

    return (
        <div className={show ? 'footer-mounted' : 'footer-hidden'}>
            {show && <Footer />}
        </div>
    )
}
