import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

const TwoFactorAuthComponent = () => {
  const { auth } = useContext(AuthContext);
  const { updateTokenStatus } = useAuth();

  const [isTokenEnabled, setIsTokenEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTokenStatus = async () => {
      if (!auth) {
        setLoading(false);
        return;
      }
      try {
        const response = await User.getTokenStatus({ signal: controller.signal });
        const tokenStatus = response?.data?.isTokenEnabled ?? response?.data?.data?.isTokenEnabled;
        setIsTokenEnabled(Boolean(tokenStatus));
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError(err.message || 'Error fetching token status');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenStatus();
    return () => controller.abort();
  }, [auth]);

  const toggleTwoFactorAuth = () => {
    if (isTokenEnabled) {
      setShowWarning(true);
      setConfirmDialogOpen(true);
    } else {
      updateTokenStatusOnly(true);
    }
  };
  const updateTokenStatusOnly = async (newStatus) => {
    const previousStatus = isTokenEnabled;
    setIsTokenEnabled(newStatus);
    setShowWarning(!newStatus);
    setLoading(true);
    try {
      const res = await updateTokenStatus({ email: auth.email, isTokenEnabled: newStatus });
      setSnackbar({ open: true, message: newStatus ? 'Autenticación de dos factores activada.' : 'Autenticación de dos factores desactivada.', severity: 'success' });
      return res;
    } catch (err) {
      setIsTokenEnabled(previousStatus);
      setShowWarning(!previousStatus);
      setError(err?.message || 'No se pudo actualizar el estado.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDialogClose = (confirm) => {
    setConfirmDialogOpen(false);
    if (confirm) {
      updateTokenStatusOnly(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(handleCloseSnackbar, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  // Components
  const Switch = ({ checked, onChange, disabled }) => (
    <button
      onClick={disabled ? null : onChange}
      className={`settings-switch-btn ${checked ? 'active' : 'inactive'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`settings-switch-thumb ${checked ? 'active' : 'inactive'}`}
      />
    </button>
  );

  return (
    <div className="settings-2fa-container">
      <h2 className="settings-title" style={{ marginBottom: '1.5rem' }}>
        2FA Auth
      </h2>
      
      <div className="settings-2fa-row">
        <div className="settings-2fa-status">
          <span style={{ marginRight: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {isTokenEnabled ? 'Desactivar' : 'Activar'}
          </span>
          {isTokenEnabled && <CheckCircleIcon style={{ color: '#22c55e', fontSize: '1.125rem' }} />}
        </div>
        <Switch 
          checked={isTokenEnabled} 
          onChange={toggleTwoFactorAuth} 
          disabled={loading} 
        />
      </div>

      {isTokenEnabled && (
        <p style={{ fontSize: '0.875rem', color: '#4ade80', marginBottom: '1rem' }}>
          La autenticación de dos factores está activa.
        </p>
      )}

      {showWarning && (
        <div className="settings-alert settings-alert-error">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <WarningIcon style={{ color: '#f87171', marginRight: '0.5rem' }} fontSize="small" />
            <span>Desactivar la autenticación de dos factores pone en riesgo tu cuenta.</span>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {confirmDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Desactivación</h3>
            <p className="modal-text">
              ¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto pone en riesgo tu cuenta a cibercriminales.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => handleConfirmDialogClose(false)}
                className="btn-danger"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDialogClose(true)}
                className="btn-secondary"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Snackbar */}
      {(snackbar.open || error) && (
        <div className={`custom-snackbar ${snackbar.severity === 'success' ? 'success' : 'error'} ${error ? 'error' : ''}`}>
          <span>{snackbar.open ? snackbar.message : error}</span>
          <button 
            onClick={() => {
                if(error) setError(null);
                else handleCloseSnackbar();
            }}
            className="snackbar-close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuthComponent;
