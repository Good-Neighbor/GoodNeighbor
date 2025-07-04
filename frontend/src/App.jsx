import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { collection, addDoc, getDocs, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, incrementStat, storage, initializeStatsIfNeeded } from './firebaseConfig';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StartPage from './pages/StartPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ListingsPage from './pages/ListingsPage';  
import CreateListings from './pages/CreateListings';
import Account from './pages/Account';
import About from './pages/About';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return currentUser ? children : <Navigate to="/signin" />;
};

function AppContent() {
  const [listings, setListings] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile, getUserProfile } = useAuth();

  // Initialize stats when app starts
  useEffect(() => {
    initializeStatsIfNeeded();
  }, []);

  // Fetch listings and services from Firestore
  useEffect(() => {
    const unsubscribeListings = onSnapshot(collection(db, 'listings'), (snapshot) => {
      const listingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const { id: customId, ...listingData } = data;
        return {
          id: doc.id,
          type: 'item',
          ...listingData
        };
      });

      const unsubscribeServices = onSnapshot(collection(db, 'services'), (servicesSnapshot) => {
        const servicesData = servicesSnapshot.docs.map(doc => {
          const data = doc.data();
          const { id: customId, ...serviceData } = data;
          return {
            id: doc.id,
            type: 'service',
            ...serviceData
          };
        });

        // Combine listings and services
        const allListings = [...listingsData, ...servicesData];
        setListings(allListings);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching services:', error);
        setListings(listingsData);
        setLoading(false);
      });

      return () => {
        unsubscribeServices();
      };
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeListings();
    };
  }, []);

  // Image compression function
  const compressImage = async (file, options = {}) => {
    const defaultOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.8,
      ...options
    };

    try {
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, defaultOptions);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original if compression fails
    }
  };

  // Upload photos function
  const uploadPhotos = async (listingId, photoFiles) => {
    const uploadPromises = photoFiles.map(async (file, index) => {
      try {
        // Compress the image
        const compressedFile = await compressImage(file);
        
        // Create storage reference
        const fileName = `${listingId}_${index}_${Date.now()}.jpg`;
        const photoRef = ref(storage, `listings/${listingId}/${fileName}`);
        
        // Upload compressed file
        const snapshot = await uploadBytes(photoRef, compressedFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          url: downloadURL,
          fileName: fileName,
          originalName: file.name
        };
      } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  // Create new listing
  const handleCreateListing = async (newListing, photoFiles = []) => {
    try {
      // Determine which collection to use based on listing type
      const collectionName = newListing.type === 'service' ? 'services' : 'listings';
      
      // First, create the listing document without photos
      const listingWithMetadata = {
        ...newListing,
        userId: currentUser.uid,
        userEmail: userProfile?.email || currentUser.email,
        userFullName: userProfile?.fullName || currentUser.displayName || 'User',
        createdAt: new Date(),
        requestors: [],
        matchedWith: null,
        status: 'available',
        photos: [],
        views: 0,
        favorites: []
      };

      const docRef = await addDoc(collection(db, collectionName), listingWithMetadata);
      const listingId = docRef.id;
      
      // Increment the listings stat
      await incrementStat('listings');
      
      // Upload and compress photos if provided (only for items)
      if (newListing.type === 'item' && photoFiles && photoFiles.length > 0) {
        console.log('Compressing and uploading', photoFiles.length, 'photos...');
        const uploadedPhotos = await uploadPhotos(listingId, photoFiles);
        
        // Update the listing document with photo URLs
        await updateDoc(docRef, {
          photos: uploadedPhotos,
          updatedAt: new Date()
        });
        
        console.log('Photos uploaded and compressed successfully');
      }

      console.log('Listing created with ID:', listingId);
      return listingId;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }; 

  // Handle listing contact (add requestor)
  const handleContact = async (listing) => {
    if (!currentUser) {
      alert('Please sign in to contact the owner');
      return;
    }

    if (!listing) {
      console.error('Invalid listing object:', listing);
      alert('Invalid listing. Please try again.');
      return;
    }

    try {
      console.log('Listing object:', listing);
      console.log('Current user:', currentUser.uid);
      
      // Check if user already requested this item
      const requestors = Array.isArray(listing.requestors) ? listing.requestors : [];
      console.log('Requestors array:', requestors);
      
      const alreadyRequested = requestors.some(req => req.userId === currentUser.uid);
      if (alreadyRequested) {
        alert('You have already requested this item');
        return;
      }

      // Use the Firestore document ID
      const listingRef = doc(db, 'listings', listing.id);
      const newRequestor = {
        userId: currentUser.uid,
        userEmail: userProfile?.email || currentUser.email,
        userFullName: userProfile?.fullName || currentUser.displayName || 'User',
        requestDate: new Date().toISOString()
      };

      console.log('New requestor:', newRequestor);
      console.log('Updated requestors array:', [...requestors, newRequestor]);

      await updateDoc(listingRef, {
        requestors: [...requestors, newRequestor]
      });

      alert('Request sent successfully!');
    } catch (error) {
      console.error('Error sending request:', error);
      console.error('Error details:', {
        listing: listing,
        currentUser: currentUser?.uid,
        userProfile: userProfile
      });
      alert('Failed to send request. Please try again.');
    }
  };

  // Handle listing favorite
  const handleFavorite = (listingId) => {
    // You can implement favorite functionality here
    console.log('Favoriting listing:', listingId);
  };

  // Handle listing share
  const handleShare = async (listing) => {
    const shareData = {
      title: `${listing.title} - GoodNeighbor`,
      text: `Check out this free ${listing.type || 'item'} on GoodNeighbor: ${listing.title}`,
      url: `${window.location.origin}/#/listingspage?listing=${listing.id}`
    };

    try {
      // Try native Web Share API first (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      console.log('Native sharing failed, falling back to clipboard');
    }

    // Fallback: Copy to clipboard
    try {
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      
      // Show success message
      const shareBtn = document.querySelector(`[data-listing-id="${listing.id}"] .share-btn`);
      if (shareBtn) {
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          Copied!
        `;
        shareBtn.style.background = '#42b883';
        shareBtn.style.color = 'white';
        
        setTimeout(() => {
          shareBtn.innerHTML = originalText;
          shareBtn.style.background = '';
          shareBtn.style.color = '';
        }, 2000);
      } else {
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to share. Please try again.');
    }
  };

  // Handle matching with requestor
  const handleMatch = async (listingId, requestor) => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        matchedWith: requestor,
        status: 'matched'
      });
      alert('Successfully matched with requestor!');
    } catch (error) {
      console.error('Error matching with requestor:', error);
      alert('Failed to match with requestor. Please try again.');
    }
  };

  // Handle marking listing as claimed
  const handleClaim = async (listingId) => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        status: 'claimed'
      });
      alert('Listing marked as claimed!');
    } catch (error) {
      console.error('Error claiming listing:', error);
      alert('Failed to mark as claimed. Please try again.');
    }
  };

  /*Update an existing listing*/
  const updateListing = async (listingId, updateData, newPhotoFiles = [], onProgress = null) => {
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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/listingspage" 
          element={
            <ListingsPage 
              listings={listings}
              onContact={handleContact}
              onFavorite={handleFavorite}
              onMatch={handleMatch}
              onClaim={handleClaim}
              currentUserId={currentUser?.uid}
              loading={loading}
            />
          } 
        />
        <Route 
          path="/createlistings" 
          element={
            <ProtectedRoute>
              <CreateListings onCreate={handleCreateListing} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } 
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
