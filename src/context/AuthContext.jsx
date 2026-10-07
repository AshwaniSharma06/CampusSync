import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jwtToken, setJwtToken] = useState(null);

    // Sync Firebase Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Get Firebase ID token to send to FastAPI for session JWT
                const token = await user.getIdToken();
                
                try {
                    // Swap Firebase Token for backend JWT
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
                    console.error("Failed to authenticate with backend API", err);
                }
            } else {
                setCurrentUser(null);
                setJwtToken(null);
                localStorage.removeItem('campussync_token');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
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
