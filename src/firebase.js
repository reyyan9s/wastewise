import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAsDXdMiatD05L0nGIBemsUfLqL131ZEXk",
  authDomain: "wastewise-1.firebaseapp.com",
  projectId: "wastewise-1",
  storageBucket: "wastewise-1.firebasestorage.app",
  messagingSenderId: "820264027346",
  appId: "1:820264027346:web:14e1011432823debbe190b",
  measurementId: "G-TV0CJZ6NRL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
