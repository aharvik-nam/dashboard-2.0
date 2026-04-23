import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const configStatus = {
    projectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
    apiKey: !!process.env.VITE_FIREBASE_API_KEY,
    authDomain: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: !!process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.VITE_FIREBASE_APP_ID,
  };

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    
    const querySnapshot = await getDocs(collection(db, "photographers"));
    const docs = querySnapshot.docs.map(d => ({ id: d.id, data: d.data() }));
    
    return res.status(200).json({
      configStatus,
      collectionFound: true,
      documentCount: querySnapshot.size,
      documents: docs
    });
  } catch (error: any) {
    return res.status(500).json({
      configStatus,
      collectionFound: false,
      error: error.message
    });
  }
}
