import { db, storage } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads photos to Firebase Storage and creates a listing in Firestore.
 * @param {Object} form - Listing form data (title, description, etc.)
 * @param {File[]} photos - Array of File objects
 * @param {Function} onProgress - Callback(current, total) for upload progress
 * @returns {Promise<string>} - The new listing's Firestore document ID
 */
export async function createListingWithPhotos(form, photos, onProgress) {
  // 1. Upload photos to Storage
  const photoUrls = [];
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const storagePath = `listing_photos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    photoUrls.push({ url, path: storagePath });
    if (onProgress) onProgress(i + 1, photos.length);
  }

  // 2. Create listing in Firestore
  const docRef = await addDoc(collection(db, 'listings'), {
    ...form,
    photos: photoUrls,
    createdAt: serverTimestamp(),
    status: 'available',
    requestors: [],
    matchedWith: null
  });
  return docRef.id;
} 