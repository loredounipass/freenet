import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

export default function PrivateRoute({ children }) {
    const { auth, loading } = useContext(AuthContext);

    if (loading) return <></>;

    return auth ? children : <Navigate to="/login" replace />;
}