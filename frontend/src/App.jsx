import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { collection, addDoc, getDocs, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StartPage from './pages/StartPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ListingsPage from './pages/ListingsPage';  
import CreateListings from './pages/CreateListings';
import Account from './pages/Account';

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
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile, getUserProfile } = useAuth();

  // Fetch listings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'listings'), (snapshot) => {
      const listingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove the custom id field if it exists, keep the Firestore document ID
        const { id: customId, ...listingData } = data;
        return {
          id: doc.id, // This is the Firestore document ID
          ...listingData
        };
      });
      setListings(listingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create new listing
  const handleCreateListing = async (newListing) => {
    try {
      const docRef = await addDoc(collection(db, 'listings'), {
        ...newListing,
        userId: currentUser.uid,
        userEmail: userProfile?.email || currentUser.email,
        userFullName: userProfile?.fullName || currentUser.displayName || 'User',
        createdAt: new Date(),
        requestors: [],
        matchedWith: null,
        status: 'available'
      });
      console.log('Listing created with ID:', docRef.id);
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
  const handleShare = (listing) => {
    // You can implement share functionality here
    console.log('Sharing listing:', listing.title);
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

  return (
    <Router basename="/GoodNeighbor">
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/listingspage" 
          element={
            <ListingsPage 
              listings={listings}
              loading={loading}
              onContact={handleContact}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onMatch={handleMatch}
              onClaim={handleClaim}
              currentUserId={currentUser?.uid}
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
