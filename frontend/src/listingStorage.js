import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../firebaseConfig';

/**
 * Upload photos for a listing
 * @param {string} listingId - The ID of the listing
 * @param {FileList|File[]} files - Array of image files to upload
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<Array>} Array of photo objects with URLs and metadata
 */
export const uploadListingPhotos = async (listingId, files, onProgress = null) => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, `listings/${listingId}/photos/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
      
      return {
        url: downloadURL,
        fileName: fileName,
        path: snapshot.ref.fullPath,
        uploadedAt: new Date()
      };
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults;
    
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw error;
  }
};

/**
 * Delete a photo from storage and Firestore
 * @param {string} listingId - The ID of the listing
 * @param {Object} photoData - Photo object with path and url
 */
export const deleteListingPhoto = async (listingId, photoData) => {
  try {
    // Delete from Storage
    const photoRef = ref(storage, photoData.path);
    await deleteObject(photoRef);
    
    // Remove from Firestore listing document
    const listingRef = doc(db, 'listings', listingId);
    await updateDoc(listingRef, {
      photos: arrayRemove(photoData),
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

/**
 * Create a new listing with photos
 * @param {Object} listingData - The listing data to store
 * @param {FileList|File[]} photoFiles - Optional array of photo files
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<string>} The ID of the created listing
 */
export const createListingWithPhotos = async (listingData, photoFiles = [], onProgress = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create a listing');
    }

    // First, create the listing document
    const listingWithMetadata = {
      ...listingData,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'Anonymous',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      photos: [],
      views: 0,
      favorites: [],
      // Convert price to number if it exists
      price: listingData.price ? parseFloat(listingData.price) : null
    };

    const docRef = await addDoc(collection(db, 'listings'), listingWithMetadata);
    const listingId = docRef.id;
    
    // Upload photos if provided
    if (photoFiles && photoFiles.length > 0) {
      const uploadedPhotos = await uploadListingPhotos(listingId, photoFiles, onProgress);
      
      // Update the listing document with photo URLs
      await updateDoc(docRef, {
        photos: uploadedPhotos,
        updatedAt: new Date()
      });
    }

    console.log('Listing created with ID:', listingId);
    return listingId;
    
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

/**
 * Update an existing listing
 * @param {string} listingId - The ID of the listing to update
 * @param {Object} updateData - The data to update
 * @param {FileList|File[]} newPhotoFiles - Optional new photos to add
 * @param {Function} onProgress - Optional callback for upload progress
 */
export const updateListing = async (listingId, updateData, newPhotoFiles = [], onProgress = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Verify user owns the listing
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }
    
    if (listingDoc.data().userId !== user.uid) {
      throw new Error('You can only update your own listings');
    }

    // Prepare update data
    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: new Date(),
      // Convert price to number if it exists
      price: updateData.price ? parseFloat(updateData.price) : updateData.price
    };

    // Upload new photos if provided
    if (newPhotoFiles && newPhotoFiles.length > 0) {
      const uploadedPhotos = await uploadListingPhotos(listingId, newPhotoFiles, onProgress);
      
      // Add new photos to existing ones
      updateDataWithTimestamp.photos = arrayUnion(...uploadedPhotos);
    }

    await updateDoc(doc(db, 'listings', listingId), updateDataWithTimestamp);
    console.log('Listing updated successfully');
    
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

/**
 * Delete a listing and all its photos
 * @param {string} listingId - The ID of the listing to delete
 */
export const deleteListing = async (listingId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Get listing data first
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }
    
    const listingData = listingDoc.data();
    
    if (listingData.userId !== user.uid) {
      throw new Error('You can only delete your own listings');
    }

    // Delete all photos from storage
    if (listingData.photos && listingData.photos.length > 0) {
      const deletePromises = listingData.photos.map(photo => {
        const photoRef = ref(storage, photo.path);
        return deleteObject(photoRef);
      });
      
      await Promise.all(deletePromises);
    }

    // Delete the listing document
    await deleteDoc(doc(db, 'listings', listingId));
    console.log('Listing and all photos deleted successfully');
    
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

/**
 * Get a single listing by ID
 * @param {string} listingId - The ID of the listing
 * @returns {Promise<Object>} The listing data
 */
export const getListing = async (listingId) => {
  try {
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }
    
    return {
      id: listingDoc.id,
      ...listingDoc.data()
    };
    
  } catch (error) {
    console.error('Error fetching listing:', error);
    throw error;
  }
};

/**
 * Get all listings for the current user
 * @returns {Promise<Array>} Array of user's listings
 */
export const getUserListings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const q = query(
      collection(db, 'listings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const listings = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return listings;
    
  } catch (error) {
    console.error('Error fetching user listings:', error);
    throw error;
  }
};

/**
 * Get all active listings (for browsing)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of active listings
 */
export const getAllListings = async (filters = {}) => {
  try {
    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    // Add category filter if specified
    if (filters.category) {
      q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        where('category', '==', filters.category),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const listings = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return listings;
    
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

/**
 * Search listings by title or description
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} Array of matching listings
 */
export const searchListings = async (searchTerm) => {
  try {
    // Note: This is a basic implementation. For better search, consider using Algolia or similar
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const listings = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const searchTermLower = searchTerm.toLowerCase();
      
      if (
        data.title.toLowerCase().includes(searchTermLower) ||
        data.description.toLowerCase().includes(searchTermLower)
      ) {
        listings.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return listings;
    
  } catch (error) {
    console.error('Error searching listings:', error);
    throw error;
  }
};
