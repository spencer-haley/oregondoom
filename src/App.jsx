import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  useEffect(() => {
    async function testFirestore() {
      const snapshot = await getDocs(collection(db, 'events'));
      console.log('🔥 Events:', snapshot.docs.map(doc => doc.data()));
    }
    testFirestore();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-doomGreen">
      <h1 className="text-4xl font-metal text-doomOrange">Testing Firebase Connection...</h1>
    </div>
  );
}
