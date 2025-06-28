// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, runTransaction, getDoc, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
export const storage = getStorage(app);

// Stats utility functions
const statsDocRef = doc(db, 'meta', 'stats');

export async function incrementStat(statName) {
  // statName: 'accounts' or 'listings'
  await runTransaction(db, async (transaction) => {
    const statsDoc = await transaction.get(statsDocRef);
    if (!statsDoc.exists()) {
      transaction.set(statsDocRef, { [statName]: 1 });
    } else {
      const data = statsDoc.data();
      const current = typeof data[statName] === 'number' ? data[statName] : 0;
      transaction.update(statsDocRef, { [statName]: current + 1 });
    }
  });
}

export async function getStats() {
  const statsSnap = await getDoc(statsDocRef);
  return statsSnap.exists() ? statsSnap.data() : { accounts: 0, listings: 0 };
}

export async function updateStatsFromExistingData() {
  try {
    // Count users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userCount = usersSnapshot.size;
    
    // Count listings
    const listingsSnapshot = await getDocs(collection(db, 'listings'));
    const listingCount = listingsSnapshot.size;
    
    // Update stats document
    await runTransaction(db, async (transaction) => {
      transaction.set(statsDocRef, { 
        accounts: userCount, 
        listings: listingCount 
      });
    });
    
    console.log(`Updated stats: ${userCount} accounts, ${listingCount} listings`);
    return { accounts: userCount, listings: listingCount };
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
}

export async function initializeStatsIfNeeded() {
  try {
    const statsSnap = await getDoc(statsDocRef);
    if (!statsSnap.exists()) {
      console.log('Stats document does not exist, initializing from existing data...');
      await updateStatsFromExistingData();
    }
  } catch (error) {
    console.error('Error initializing stats:', error);
  }
}