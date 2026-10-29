import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "BURAYA_KOPYALADIGINIZ_API_KEY",
  authDomain: "site-yonetim-sistemi.firebaseapp.com",
  projectId: "site-yonetim-sistemi",
  storageBucket: "site-yonetim-sistemi.appspot.com",
  messagingSenderId: "NUMARANIZ",
  appId: "APP_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);