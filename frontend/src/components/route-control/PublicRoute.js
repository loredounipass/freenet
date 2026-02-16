import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

export default function PublicRoute({ children }) {
    const { auth, loading } = useContext(AuthContext);

    if (loading) return <></>;

    return !auth ? children : <Navigate to="/" replace />;
}