import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../firebaseConfig';

/*Compress image file*/
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/*Upload file*/
export const uploadListingPhotos = async (listingId, files, onProgress = null) => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image`);
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = 'jpg'; // We'll convert all to JPEG for consistency
      const baseFileName = `${timestamp}_${index}`;
      
      // Compress the main image
      const compressedImage = await compressImage(file, 1200, 1200, 0.8);
      const compressedFile = new File([compressedImage], `${baseFileName}.${fileExtension}`, {
        type: 'image/jpeg'
      });
      
      // Upload main image
      const mainImageRef = ref(storage, `listings/${listingId}/photos/${compressedFile.name}`);
      const mainSnapshot = await uploadBytes(mainImageRef, compressedFile);
      const mainImageURL = await getDownloadURL(mainSnapshot.ref);
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
      
      return {
        url: mainImageURL,
        thumbnailUrl: thumbnailURL,
        fileName: compressedFile.name,
        thumbnailFileName: thumbnailFile.name,
        path: mainSnapshot.ref.fullPath,
        thumbnailPath: thumbnailSnapshot.ref.fullPath,
        originalFileName: file.name,
        originalSize: file.size,
        compressedSize: compressedImage.size,
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

/*Delete a photo from storage and Firestore*/
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

/*Create a new listing with photos*/
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

/*Update an existing listing*/
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

/*Delete a listing and all its photos*/
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

/*Get a single listing by ID*/
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

/*Get all listings for the current user*/
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

/*Get all active listings (for browsing)*/
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

/*Search listings by title or description*/
export const searchListings = async (searchTerm) => {
  try {
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
