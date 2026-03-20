import React from 'react';
import { Navigate } from 'react-router-dom';

// With Supabase Auth, users are auto-created on first sign-in.
// Redirect to login page which handles both login and registration.
const Register = () => {
    return <Navigate to="/login" replace />;
};

export default Register;
