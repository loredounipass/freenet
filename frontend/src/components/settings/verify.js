import React, { useContext, useState } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';

const EmailVerificationComponent = () => {
    const { auth } = useContext(AuthContext);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [showCloseMessage, setShowCloseMessage] = useState(false);

    const verifyEmail = async (email) => {
        try {
            const { data } = await User.verifyEmail({ email });
            if (data && data.message === 'Correo electrónico verificado con éxito.') {
                handleVerificationResult({ verified: true, message: `✔️ ${data.message}` });
            } else {
                handleVerificationResult({ verified: false, message: data.error || 'Error al verificar el correo electrónico.' });
            }
        } catch (err) {
            handleVerificationResult({ verified: false, message: err.message });
        }
    };

    const handleVerifyClick = () => {
        if (auth && auth.email) {
            verifyEmail(auth.email);
        } else {
            handleVerificationResult({ verified: false, message: 'No se encontró el correo electrónico autenticado.' });
        }
    };

    const handleVerificationResult = (result) => {
        setDialogMessage(result.message);
        setOpenDialog(true);
        setShowCloseMessage(false); 

        if (result.verified) {
            setTimeout(() => {
                setOpenDialog(false);
                setShowCloseMessage(true); 
            }, 5000); 
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setShowCloseMessage(true);
    };

    return (
        <div className="settings-full-page">
            <div className="settings-section-wrapper" style={{ maxWidth: '32rem' }}>
                {!showCloseMessage ? (
                    <>
                        <h1 className="settings-title-large">
                            Verificar correo electrónico
                        </h1>
                        <p className="settings-text-secondary" style={{ fontSize: '1.125rem' }}>
                            Haz clic en el botón para validar tu dirección de correo asociada a la cuenta.
                        </p>

                        <button
                            onClick={handleVerifyClick}
                            className="settings-btn settings-btn-primary"
                            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                        >
                            Validar correo electrónico
                        </button>

                        {/* Custom Modal */}
                        {openDialog && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h3 className="modal-title">Estado de verificación</h3>
                                    <p className="modal-text">
                                        {dialogMessage}
                                    </p>
                                    <div className="modal-actions">
                                        <button
                                            onClick={handleCloseDialog}
                                            className="btn-secondary"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="settings-text-secondary" style={{ fontSize: '1.125rem', marginTop: '1rem' }}>
                        Puedes cerrar esta ventana.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationComponent;
