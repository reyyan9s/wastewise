import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplace",
  authDomain: "wastewise-demo.firebaseapp.com",
  projectId: "wastewise-demo",
  storageBucket: "wastewise-demo.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
