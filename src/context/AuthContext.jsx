import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

function isFirebaseKeyOrNetworkError(err) {
    if (!err) return false;
    const code = (err.code || '').toLowerCase();
    const msg = (err.message || '').toLowerCase();
    return (
        code.includes('api-key') ||
        code.includes('invalid-api-key') ||
        code.includes('api-key-not-valid') ||
        code.includes('app-not-authorized') ||
        code.includes('network-request-failed') ||
        code.includes('internal-error') ||
        code.includes('config') ||
        msg.includes('api-key') ||
        msg.includes('api key') ||
        msg.includes('network') ||
        msg.includes('offline')
    );
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('campussync_student_profile');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                return {
                    displayName: data.name,
                    email: data.email,
                    uid: data.studentId || 'local-demo-uid',
                };
            } catch (_) {}
        }
        return null;
    });
    const [loading, setLoading] = useState(false);
    const [jwtToken, setJwtToken] = useState(() => localStorage.getItem('campussync_token') || null);

    // Sync Firebase Auth State when real Firebase is configured
    useEffect(() => {
        if (!isFirebaseConfigured) {
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Get Firebase ID token to send to FastAPI for session JWT
                try {
                    const token = await user.getIdToken();
                    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ firebase_token: token })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setJwtToken(data.access_token);
                        localStorage.setItem('campussync_token', data.access_token);
                    }
                } catch (err) {
                    console.warn("Backend API auth sync skipped:", err);
                }
            } else {
                if (!localStorage.getItem('campussync_demo_user')) {
                    setCurrentUser(null);
                    setJwtToken(null);
                    localStorage.removeItem('campussync_token');
                }
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        if (!isFirebaseConfigured) {
            const mockUser = {
                displayName: email.split('@')[0],
                email: email,
                uid: 'local-' + Date.now(),
            };
            setCurrentUser(mockUser);
            return mockUser;
        }
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            if (isFirebaseKeyOrNetworkError(err)) {
                console.warn('Firebase key unconfigured or offline, continuing in local mode:', err);
                const mockUser = {
                    displayName: email.split('@')[0],
                    email: email,
                    uid: 'local-' + Date.now(),
                };
                setCurrentUser(mockUser);
                return mockUser;
            }
            throw err;
        }
    };

    const signup = async (email, password) => {
        if (!isFirebaseConfigured) {
            const mockUser = {
                displayName: email.split('@')[0],
                email: email,
                uid: 'local-' + Date.now(),
            };
            setCurrentUser(mockUser);
            return mockUser;
        }
        try {
            return await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            if (isFirebaseKeyOrNetworkError(err)) {
                console.warn('Firebase key unconfigured or offline, continuing in local mode:', err);
                const mockUser = {
                    displayName: email.split('@')[0],
                    email: email,
                    uid: 'local-' + Date.now(),
                };
                setCurrentUser(mockUser);
                return mockUser;
            }
            throw err;
        }
    };

    const logout = async () => {
        try {
            if (isFirebaseConfigured) {
                await signOut(auth);
            }
        } catch (_) {}
        setCurrentUser(null);
        setJwtToken(null);
        localStorage.removeItem('campussync_token');
        localStorage.removeItem('campussync_demo_user');
        localStorage.removeItem('campussync_student_profile');
    };

    const value = {
        currentUser,
        jwtToken,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
