import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Check if a real, valid Firebase API key is configured
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'AIzaSyFakeKeyForLocalDevelopment12345' &&
  !apiKey.includes('FakeKey') &&
  apiKey.length > 20
);

const firebaseConfig = {
  apiKey: apiKey || 'AIzaSyFakeKeyForLocalDevelopment12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'campussync-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'campussync-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'campussync-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
