import React, { useState, useEffect, useRef, useMemo } from 'react'
import { post, resetPasswordApi } from '../api/http'
import { useLocation, useNavigate } from 'react-router-dom'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function ResetPassword() {
  const query = useQuery()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')
  const [loading, setLoading] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    const qEmail = query.get('email') || ''
    const qToken = query.get('token') || ''
    setEmail(qEmail)
    setToken(qToken)
  }, [query])

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setSnackbarSeverity('error')
      setSnackbarMessage('Las contraseñas no coinciden')
      setOpenSnackbar(true)
      return
    }
    setLoading(true)
    try {
      const body = { email, token, newPassword, confirmNewPassword }
      const res = await post(resetPasswordApi, body)
      if (isMounted.current) {
        setSnackbarSeverity('success')
        setSnackbarMessage(res?.data?.message || 'Contraseña restablecida con éxito')
        setOpenSnackbar(true)
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      if (isMounted.current) {
        setSnackbarSeverity('error')
        setSnackbarMessage(err?.response?.data?.message || 'Error al restablecer la contraseña')
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card card-bg">
        <form onSubmit={submit} noValidate>
          <div className="auth-logo">
            <div className="freenet-logo-placeholder">F</div>
            <div className="auth-title">Crear nueva contraseña</div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              name="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <div className="password-wrapper">
              <input
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <div className="password-wrapper">
              <input
                name="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="form-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirmar contraseña"
              />
              <button
                type="button"
                className="password-toggle confirm-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
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
