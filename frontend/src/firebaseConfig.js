// Import the functions you need from the SDKs you need
// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDM7ok2P_WnrqMcH69gVC4cR9EP4J9fD_8",
  authDomain: "goodneighbor-b1fb3.firebaseapp.com",
  projectId: "goodneighbor-b1fb3",
  storageBucket: "goodneighbor-b1fb3.firebasestorage.app",
  messagingSenderId: "437041543135",
  appId: "1:437041543135:web:c20ac170d742746f49366a",
  measurementId: "G-CCYJ56JPMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);