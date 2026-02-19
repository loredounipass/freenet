import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import Settings from './components/settings/Settings'
import ResendTokenForm from './components/2FA/ResendTokenForm'
import EmailVerificationComponent from './components/settings/verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConversationList from './components/chat/ConversationList'
import ChatView from './components/chat/ChatView'
import { LanguageProvider } from './hooks/LanguageContext';
import './i18n'; 

// APLICACION CLIENTE
export default function App() {
    const { auth, setAuth, loading } = useFindUser();
    const mdTheme = createTheme();

    return (
        <Router>
            <AuthContext.Provider value={{ auth, setAuth, loading }}>
                <LanguageProvider>
                <ThemeProvider theme={mdTheme}>
                    <Box sx={{ display: 'flex' }}>
                        <CssBaseline />
                        <Navbar />
                        <Box
                            component="main"
                            sx={{
                                backgroundColor: 'transparent',
                                flexGrow: 1,
                                height: '100vh',
                                overflow: 'auto',
                            }}
                        >
                            <Toolbar />
                            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative' }}>
                                <Routes>
                                    <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                                    <Route path="/verifyemail" element={<PrivateRoute><EmailVerificationComponent /></PrivateRoute>} />
                                    <Route path="/chat" element={<PrivateRoute><ConversationList /></PrivateRoute>} />
                                    <Route path="/chat/:userId" element={<PrivateRoute><ChatView /></PrivateRoute>} />

                                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                                    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                                    <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
                                    <Route path="/verifytoken" element={<PublicRoute><VerifyToken /></PublicRoute>} />
                                    <Route path="/resendtoken" element={<PublicRoute><ResendTokenForm /></PublicRoute>} />
                                </Routes>

                            </Container>
                        </Box>
                    </Box>
                </ThemeProvider>
                </LanguageProvider>
            </AuthContext.Provider>
        </Router>
    )
}