import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user role from our backend
    const fetchUserRole = async (supabaseUser, accessToken) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return {
                id: supabaseUser.id,
                email: supabaseUser.email,
                role: res.data.role || 'student'
            };
        } catch (err) {
            // If profile endpoint fails, default to student
            return {
                id: supabaseUser.id,
                email: supabaseUser.email,
                role: 'student'
            };
        }
    };

    useEffect(() => {
        // Check active session on mount
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
                    const userWithRole = await fetchUserRole(session.user, session.access_token);
                    setUser(userWithRole);
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
                const userWithRole = await fetchUserRole(session.user, session.access_token);
                setUser(userWithRole);
                setLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                delete axios.defaults.headers.common['Authorization'];
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Send OTP to email
    const sendOtp = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    };

    // Verify OTP entered by the user
    const verifyOtp = async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
        if (error) throw error;
        return data;
    };

    // Sign in with Google OAuth
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    // Logout
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            sendOtp,
            verifyOtp,
            signInWithGoogle,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
