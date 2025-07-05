// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUC0wEEITI-kbhhiwQZTyuyQlLw6b9ipg",
  authDomain: "proproductivity-3870d.firebaseapp.com",
  projectId: "proproductivity-3870d",
  storageBucket: "proproductivity-3870d.firebasestorage.app",
  messagingSenderId: "843977547944",
  appId: "1:843977547944:web:8c528061bec2070414229d",
  measurementId: "G-RPKM5RXMKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics
export const analytics = getAnalytics(app);

export default app;