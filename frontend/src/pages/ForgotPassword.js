import React, { useState, useRef, useEffect } from 'react'
import { post, forgotPasswordApi } from '../api/http'
import { useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isMounted = useRef(true)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await post(forgotPasswordApi, { email })
      if (isMounted.current) {
        setSnackbarSeverity('success')
        setSnackbarMessage('Si el correo existe, se ha enviado un mensaje con instrucciones.')
        setOpenSnackbar(true)
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      if (isMounted.current) {
        setSnackbarSeverity('error')
        setSnackbarMessage(err?.response?.data?.message || 'Error al enviar el correo')
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <div className="auth-wrapper">
      <div className="auth-card card-bg">
        <form onSubmit={submit} noValidate>
          <div className="auth-logo">
            <img src="/logo192.png" alt="Freenet" className="auth-logo-img" />
            <div className="auth-title">Restablecer contraseña</div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              name="email"
              type="email"
              required
              className="form-input"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </div>

          <div className="muted-link" style={{ textAlign: 'center' }}>
            <a href="/login">Volver al inicio de sesión</a>
          </div>

          {openSnackbar && (
            <div
              className="error-note"
              style={{ color: snackbarSeverity === 'success' ? '#7fffd4' : '#ff7b7b' }}
            >
              {snackbarMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
