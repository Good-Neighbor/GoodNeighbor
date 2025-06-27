import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, getStats, storage } from '../firebaseConfig';
import { ref, deleteObject } from 'firebase/storage';
import './Account.css';

function Account() {
    const { currentUser, userProfile, logout, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [myListings, setMyListings] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showOwnerContactModal, setShowOwnerContactModal] = useState(false);
    const [showContactExchangeModal, setShowContactExchangeModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedContactUser, setSelectedContactUser] = useState(null);
    const [matchingStates, setMatchingStates] = useState({});
    const [matchedUsers, setMatchedUsers] = useState({});
    const [contactStates, setContactStates] = useState({});
    const [contactShared, setContactShared] = useState({});
    const [stats, setStats] = useState({ accounts: 0, listings: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listingToDelete, setListingToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingListing, setEditingListing] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [myServices, setMyServices] = useState([]);

    // Fetch stats on mount
    useEffect(() => {
        async function fetchStats() {
            setStatsLoading(true);
            try {
                const data = await getStats();
                setStats(data);
            } catch (e) {
                setStats({ accounts: 0, listings: 0 });
            } finally {
                setStatsLoading(false);
            }
        }
        fetchStats();
    }, []);

    // Fetch user's listings
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribeListings = onSnapshot(
            query(collection(db, 'listings'), where('userId', '==', currentUser.uid)),
            (snapshot) => {
                const listings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'item',
                    ...doc.data()
                }));
                setMyListings(listings);
            }
        );

        const unsubscribeServices = onSnapshot(
            query(collection(db, 'services'), where('userId', '==', currentUser.uid)),
            (snapshot) => {
                const services = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'service',
                    ...doc.data()
                }));
                setMyListings(listings);
            }
        );

        // Fetch listings where user has requested
        const unsubscribeRequests = onSnapshot(
            collection(db, 'listings'),
            (snapshot) => {
                const allListings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'item',
                    ...doc.data()
                }));
                
                const userRequests = allListings.filter(listing => 
                    (listing.requestors || []).some(req => req.userId === currentUser.uid)
                ).map(listing => {
                    const userRequest = (listing.requestors || []).find(req => req.userId === currentUser.uid);
                    return {
                        ...listing,
                        userRequest,
                        isMatched: listing.matchedWith?.userId === currentUser.uid
                    };
                });
                
                setMyRequests(userRequests);
                setLoading(false);
            }
        );

        return () => {
            unsubscribeListings();
            unsubscribeServices();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const handleDeleteListing = (listing) => {
        setListingToDelete(listing);
        setShowDeleteModal(true);
    };

    const confirmDeleteListing = async () => {
        if (!listingToDelete) return;
    
        setIsDeleting(true);
        try {
            const collection = listingToDelete.type === 'service' ? 'services' : 'listings';
            const docRef = doc(db, collection, listingToDelete.id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error(`${listingToDelete.type === 'service' ? 'Service' : 'Listing'} not found`);
            }
            
            const data = docSnap.data();
            
            if (data.userId !== currentUser.uid) {
                throw new Error(`You can only delete your own ${listingToDelete.type === 'service' ? 'services' : 'listings'}`);
            }

            // Delete photos if they exist
            if (data.photos && data.photos.length > 0) {
                const deletePromises = data.photos.map(photo => {
                    const photoRef = ref(storage, photo.path);
                    return deleteObject(photoRef);
                });
                
                await Promise.allSettled(deletePromises);
            }

            await deleteDoc(docRef);
            
            alert(`${listingToDelete.type === 'service' ? 'Service' : 'Listing'} deleted successfully!`);
            setShowDeleteModal(false);
            setListingToDelete(null);
        } catch (error) {
            console.error('Error deleting:', error);
            alert(`Failed to delete ${listingToDelete.type === 'service' ? 'service' : 'listing'}. Please try again.`);
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDeleteListing = () => {
        setShowDeleteModal(false);
        setListingToDelete(null);
    };

    const handleEditListing = (listing) => {
        setEditingListing(listing);
        
        if (listing.type === 'service') {
            setEditFormData({
                title: listing.title || '',
                description: listing.description || '',
                serviceType: listing.serviceType || '',
                location: listing.location || ''
            });
        } else {
            setEditFormData({
                title: listing.title || '',
                description: listing.description || '',
                category: listing.category || '',
                condition: listing.condition || '',
                location: listing.location || ''
            });
        }
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = async () => {
        if (!editingListing) return;
        
        setIsUpdating(true);
        try {
            const collection = editingListing.type === 'service' ? 'services' : 'listings';
            const docRef = doc(db, collection, editingListing.id);
            
            await updateDoc(docRef, {
                ...editFormData,
                updatedAt: new Date()
            });
            
            alert(`${editingListing.type === 'service' ? 'Service' : 'Listing'} updated successfully!`);
            setShowEditModal(false);
            setEditingListing(null);
            setEditFormData({});
        } catch (error) {
            console.error('Error updating:', error);
            alert(`Failed to update ${editingListing.type === 'service' ? 'service' : 'listing'}. Please try again.`);
        } finally {
            setIsUpdating(false);
        }
    };

    const cancelEdit = () => {
        setShowEditModal(false);
        setEditingListing(null);
        setEditFormData({});
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleBackToStart = () => {
        navigate('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'status-available';
            case 'matched':
                return 'status-matched';
            case 'claimed':
                return 'status-claimed';
            default:
                return 'status-available';
        }
    };

    const handleViewRequests = (listing) => {
        setSelectedListing(listing);
        setShowRequestsModal(true);
    };

    const handleViewOwnerContact = (request) => {
        setSelectedRequest(request);
        setShowOwnerContactModal(true);
    };

    const handleContactExchange = (user, listingId) => {
        setSelectedContactUser(user);
        setSelectedListing({ id: listingId });
        setShowContactExchangeModal(true);
    };

    const closeModal = () => {
        setShowRequestsModal(false);
        setShowOwnerContactModal(false);
        setShowContactExchangeModal(false);
        setSelectedListing(null);
        setSelectedRequest(null);
        setSelectedContactUser(null);
    };

    const handleMatch = async (listingId, requestor) => {
        const matchKey = `${listingId}-${requestor.userId}`;
        
        // Set loading state for this specific match
        setMatchingStates(prev => ({ ...prev, [matchKey]: true }));
        
        try {
            // Update the listing with matched user info
            const listingRef = doc(db, 'listings', listingId);
            await updateDoc(listingRef, {
                matchedWith: {
                    userId: requestor.userId,
                    userEmail: requestor.userEmail,
                    userFullName: requestor.userFullName,
                    matchDate: new Date().toISOString()
                },
                status: 'matched'
            });
            
            // Show success state briefly
            setMatchedUsers(prev => ({ ...prev, [matchKey]: true }));
            
            // Reset after 3 seconds
            setTimeout(() => {
                setMatchedUsers(prev => {
                    const newState = { ...prev };
                    delete newState[matchKey];
                    return newState;
                });
                setMatchingStates(prev => {
                    const newState = { ...prev };
                    delete newState[matchKey];
                    return newState;
                });
            }, 3000);
            
        } catch (error) {
            console.error('Error matching with user:', error);
            alert('Failed to match with user. Please try again.');
        } finally {
            setMatchingStates(prev => {
                const newState = { ...prev };
                delete newState[matchKey];
                return newState;
            });
        }
    };

    const handleShareContact = async (userId, userEmail, userFullName) => {
        const contactKey = `${selectedListing.id}-${userId}`;
        
        // Set loading state
        setContactStates(prev => ({ ...prev, [contactKey]: true }));
        
        try {
            // Update the listing with contact exchange info
            const listingRef = doc(db, 'listings', selectedListing.id);
            await updateDoc(listingRef, {
                contactExchanged: {
                    [userId]: {
                        sharedBy: currentUser.uid,
                        sharedAt: new Date().toISOString(),
                        userEmail: currentUser.email,
                        userFullName: userProfile?.fullName || 'Unknown'
                    }
                }
            });
            
            // Show success state
            setContactShared(prev => ({ ...prev, [contactKey]: true }));
            
            // Reset after 3 seconds
            setTimeout(() => {
                setContactShared(prev => {
                    const newState = { ...prev };
                    delete newState[contactKey];
                    return newState;
                });
                setContactStates(prev => {
                    const newState = { ...prev };
                    delete newState[contactKey];
                    return newState;
                });
            }, 3000);
            
        } catch (error) {
            console.error('Error sharing contact:', error);
            alert('Failed to share contact. Please try again.');
        } finally {
            setContactStates(prev => {
                const newState = { ...prev };
                delete newState[contactKey];
                return newState;
            });
        }
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading account information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <button onClick={handleBackToStart} className="back-to-start-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Back to Home
                </button>

                <div className="account-header">
                    <h1>Account</h1>
                    <p>Manage your profile, listings, and requests</p>
                </div>

                {/* Tab Navigation */}
                <div className="account-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('listings')}
                    >
                        My Listings ({myListings.length + myServices.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        My Requests ({myRequests.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="profile-section">
                            <h3>Profile Information</h3>
                            <div className="profile-info">
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{currentUser.email}</span>
                                    <span className={`verification-badge ${currentUser.emailVerified ? 'verified' : 'unverified'}`}>
                                        {currentUser.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Full Name:</span>
                                    <span className="info-value">{userProfile?.fullName || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Username:</span>
                                    <span className="info-value">{userProfile?.username || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Member Since:</span>
                                    <span className="info-value">
                                        {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Profile Update Form */}
                            <div className="profile-update">
                                <h3>Update Profile</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const fullName = formData.get('fullName');
                                    
                                    if (fullName.trim()) {
                                        const success = await updateUserProfile({ fullName: fullName.trim() });
                                        if (success) {
                                            alert('Profile updated successfully!');
                                        } else {
                                            alert('Failed to update profile. Please try again.');
                                        }
                                    }
                                }}>
                                    <div className="form-group">
                                        <label htmlFor="fullName">Full Name</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Enter your full name"
                                            defaultValue={userProfile?.fullName || ''}
                                            className="profile-input"
                                        />
                                    </div>
                                    <button type="submit" className="update-profile-btn">
                                        Update Profile
                                    </button>
                                </form>
                            </div>
                            
                            <button onClick={handleLogout} className="logout-btn">
                                Sign Out
                            </button>
                        </div>
                    )}

                    {/* My Listings Tab */}
                    {activeTab === 'listings' && (
                        <div className="listings-section">
                            <h2>My Listings</h2>
                            {myListings.length === 0 && myServices.length === 0 ? (
                                <div className="empty-state">
                                    <p>You haven't created any listings yet.</p>
                                    <button onClick={() => navigate('/createlistings')} className="create-listing-btn">
                                        Create Your First Listing
                                    </button>
                                </div>
                            ) : (
                                <div className="listings-grid">
                                    {/* Render Items */}
                                    {myListings.map(listing => (
                                        <div key={`item-${listing.id}`} className="listing-card">
                                            <div className="listing-header">
                                                <h3>{listing.title}</h3>
                                                <div className="listing-status">
                                                    <span className="listing-type-badge item">Item</span>
                                                    {listing.status !== 'matched' && (
                                                        <span className={`status-badge ${getStatusClass(listing.status)}`}>
                                                            {listing.status}
                                                        </span>
                                                    )}
                                                    {listing.matchedWith && (
                                                        <span className="matched-badge">✓ Matched</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="listing-description">{listing.description}</p>
                                            <div className="listing-meta">
                                                <span>{listing.category}</span>
                                                <span>•</span>
                                                <span>{listing.condition}</span>
                                                <span>•</span>
                                                <span>{listing.location}</span>
                                            </div>
                                            <div className="listing-actions">
                                                <span className="request-count">
                                                    {(listing.requestors || []).length} request{(listing.requestors || []).length !== 1 ? 's' : ''}
                                                </span>
                                                <div className="listing-buttons">
                                                    {(listing.requestors || []).length > 0 && (
                                                        <button 
                                                            className="view-requests-btn"
                                                            onClick={() => handleViewRequests(listing)}
                                                        >
                                                            View Requests
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="edit-listing-btn"
                                                        onClick={() => handleEditListing(listing)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="delete-listing-btn"
                                                        onClick={() => handleDeleteListing(listing)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Render Services */}
                                    {myServices.map(service => (
                                        <div key={`service-${service.id}`} className="listing-card">
                                            <div className="listing-header">
                                                <h3>{service.title}</h3>
                                                <div className="listing-status">
                                                    <span className="listing-type-badge service">Service</span>
                                                    {service.status !== 'matched' && (
                                                        <span className={`status-badge ${getStatusClass(service.status)}`}>
                                                            {service.status}
                                                        </span>
                                                    )}
                                                    {service.matchedWith && (
                                                        <span className="matched-badge">✓ Matched</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="listing-description">{service.description}</p>
                                            <div className="listing-meta">
                                                <span>{service.serviceType}</span>
                                                <span>•</span>
                                                <span>{service.location}</span>
                                            </div>
                                            <div className="listing-actions">
                                                <span className="request-count">
                                                    {(service.requestors || []).length} request{(service.requestors || []).length !== 1 ? 's' : ''}
                                                </span>
                                                <div className="listing-buttons">
                                                    {(service.requestors || []).length > 0 && (
                                                        <button 
                                                            className="view-requests-btn"
                                                            onClick={() => handleViewRequests(service)}
                                                        >
                                                            View Requests
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="edit-listing-btn"
                                                        onClick={() => handleEditListing(service)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="delete-listing-btn"
                                                        onClick={() => handleDeleteListing(service)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="requests-section">
                            <h2>My Requests</h2>
                            {myRequests.length === 0 ? (
                                <div className="empty-state">
                                    <p>You haven't requested any items yet.</p>
                                    <button onClick={() => navigate('/listingspage')} className="browse-listings-btn">
                                        Browse Listings
                                    </button>
                                </div>
                            ) : (
                                <div className="requests-grid">
                                    {myRequests.map(request => (
                                        <div key={request.id} className="request-card">
                                            <div className="request-header">
                                                <h3>{request.title}</h3>
                                                <div className="request-status">
                                                    {(request.status === 'available' || request.status === 'claimed') && (
                                                        <span className={`status-badge ${getStatusClass(request.status)}`}>
                                                            {request.status}
                                                        </span>
                                                    )}
                                                    {request.isMatched && (
                                                        <span className="matched-badge">✓ Matched</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="request-description">{request.description}</p>
                                            <div className="request-meta">
                                                <span>Posted by: {request.userFullName}</span>
                                                <span>•</span>
                                                <span>Requested: {formatDate(request.userRequest.requestDate)}</span>
                                            </div>
                                            {request.isMatched && (
                                                <div className="matched-info">
                                                    <button 
                                                        className="view-owner-contact-btn"
                                                        onClick={() => handleViewOwnerContact(request)}
                                                    >
                                                        View Owner Contact
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Requests Modal */}
            {showRequestsModal && selectedListing && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Requests for "{selectedListing.title}"</h3>
                            <button className="close-modal-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {(selectedListing.requestors || []).length === 0 ? (
                                <p>No requests yet.</p>
                            ) : (
                                <div className="requests-list">
                                    {selectedListing.requestors.map((requestor, index) => {
                                        const matchKey = `${selectedListing.id}-${requestor.userId}`;
                                        const contactKey = `${selectedListing.id}-${requestor.userId}`;
                                        const isMatching = matchingStates[matchKey];
                                        const isMatched = matchedUsers[matchKey];
                                        const isSharingContact = contactStates[contactKey];
                                        const hasSharedContact = contactShared[contactKey];
                                        
                                        return (
                                            <div key={index} className="requestor-item">
                                                <div className="requestor-header">
                                                    <div className="requestor-info">
                                                        <h4>{requestor.userFullName}</h4>
                                                        <p>Email: {requestor.userEmail}</p>
                                                        <p>Requested: {formatDate(requestor.requestDate)}</p>
                                                    </div>
                                                    <div className="requestor-status">
                                                        <button 
                                                            className={`match-btn ${isMatching ? 'loading' : ''}`}
                                                            onClick={() => handleMatch(selectedListing.id, requestor)}
                                                            disabled={isMatching}
                                                        >
                                                            {isMatching ? (
                                                                <>
                                                                    <div className="spinner"></div>
                                                                    Matching...
                                                                </>
                                                            ) : (
                                                                'Match'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="requestor-actions">
                                                    {isMatched ? (
                                                        hasSharedContact ? (
                                                            <button className="contact-btn shared" disabled>
                                                                ✓ Contact Shared
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className={`contact-btn ${isSharingContact ? 'loading' : ''}`}
                                                                onClick={() => handleContactExchange(requestor, selectedListing.id)}
                                                                disabled={isSharingContact}
                                                            >
                                                                {isSharingContact ? (
                                                                    <>
                                                                        <div className="spinner"></div>
                                                                        Sharing...
                                                                    </>
                                                                ) : (
                                                                    'Share Contact'
                                                                )}
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button 
                                                            className="contact-btn"
                                                            onClick={() => handleContactExchange(requestor, selectedListing.id)}
                                                        >
                                                            Contact
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Owner Contact Modal */}
            {showOwnerContactModal && selectedRequest && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Owner Contact Information</h3>
                            <button className="close-modal-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="owner-info">
                                <h4>Item: {selectedRequest.title}</h4>
                                <p><strong>Owner Name:</strong> {selectedRequest.userFullName}</p>
                                <p><strong>Owner Email:</strong> {selectedRequest.userEmail}</p>
                                <p><strong>Posted:</strong> {formatDate(selectedRequest.datePosted)}</p>
                                <p><strong>Your Request:</strong> {formatDate(selectedRequest.userRequest.requestDate)}</p>
                            </div>
                            <div className="contact-actions">
                                <p className="contact-note">
                                    You can now contact the owner directly using their email address above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Exchange Modal */}
            {showContactExchangeModal && selectedContactUser && selectedListing && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Contact Exchange</h3>
                            <button className="close-modal-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="contact-exchange-info">
                                <h4>Exchange Contact with {selectedContactUser.userFullName}</h4>
                                <p>Share your contact information to facilitate the exchange.</p>
                                
                                <div className="contact-details">
                                    <div className="your-contact">
                                        <h5>Your Contact Information:</h5>
                                        <p><strong>Name:</strong> {userProfile?.fullName || 'Not set'}</p>
                                        <p><strong>Email:</strong> {currentUser?.email}</p>
                                    </div>
                                    
                                    <div className="their-contact">
                                        <h5>Their Contact Information:</h5>
                                        <p><strong>Name:</strong> {selectedContactUser.userFullName}</p>
                                        <p><strong>Email:</strong> {selectedContactUser.userEmail}</p>
                                    </div>
                                </div>
                                
                                <div className="contact-exchange-actions">
                                    <button 
                                        className="share-contact-btn"
                                        onClick={() => handleShareContact(
                                            selectedContactUser.userId, 
                                            selectedContactUser.userEmail, 
                                            selectedContactUser.userFullName
                                        )}
                                    >
                                        Share My Contact
                                    </button>
                                    <p className="contact-exchange-note">
                                        By sharing your contact, you agree to exchange contact information with this user.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Listing Modal */}
            {showDeleteModal && listingToDelete && (
                <div className="modal-overlay" onClick={cancelDeleteListing}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Listing</h3>
                            <button className="close-modal-btn" onClick={cancelDeleteListing}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{listingToDelete.title}</strong>? This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="cancel-btn" onClick={cancelDeleteListing} disabled={isDeleting}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={confirmDeleteListing} disabled={isDeleting} style={{ background: '#dc2626', color: 'white' }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Listing Modal */}
            {showEditModal && editingListing && (
                <div className="modal-overlay" onClick={cancelEdit}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit {editingListing.type === 'service' ? 'Service' : 'Listing'}</h3>
                            <button className="close-modal-btn" onClick={cancelEdit}>×</button>
                        </div>
                        <div className="modal-body">
                            <form className="edit-form">
                                <div className="form-group">
                                    <label htmlFor="edit-title">Title</label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={editFormData.title}
                                        onChange={handleEditFormChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="edit-description">Description</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleEditFormChange}
                                        className="form-textarea"
                                        rows="4"
                                        required
                                    />
                                </div>
                                
                                {/* Service Type (for services) */}
                                {editingListing.type === 'service' && (
                                    <div className="form-group">
                                        <label htmlFor="edit-serviceType">Service Type</label>
                                        <select
                                            id="edit-serviceType"
                                            name="serviceType"
                                            value={editFormData.serviceType}
                                            onChange={handleEditFormChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select Service Type</option>
                                            <option value="Tutoring">Tutoring</option>
                                            <option value="Volunteer Opportunity">Volunteer Opportunity</option>
                                            <option value="Yardwork">Yardwork</option>
                                            <option value="Pet Care">Pet Care</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}
                                
                                {/* Category and Condition (for items) */}
                                {editingListing.type === 'item' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="edit-category">Category</label>
                                            <select
                                                id="edit-category"
                                                name="category"
                                                value={editFormData.category}
                                                onChange={handleEditFormChange}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                <option value="Books & Media">Books & Media</option>
                                                <option value="Electronics">Electronics</option>
                                                <option value="Toys & Games">Toys & Games</option>
                                                <option value="Sports & Outdoors">Sports & Outdoors</option>
                                                <option value="Home & Garden">Home & Garden</option>
                                                <option value="Office & School Supplies">Office & School Supplies</option>
                                                <option value="Vehicles & Parts">Vehicles & Parts</option>
                                                <option value="Baby & Kids">Baby & Kids</option>
                                            </select>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="edit-condition">Condition</label>
                                            <select
                                                id="edit-condition"
                                                name="condition"
                                                value={editFormData.condition}
                                                onChange={handleEditFormChange}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">Select Condition</option>
                                                <option value="Like New">Like New</option>
                                                <option value="Good">Good</option>
                                                <option value="Fair">Fair</option>
                                                <option value="Poor">Poor</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            <div className="form-group">
                                <label htmlFor="edit-location">Location</label>
                                <input
                                type="text"
                                id="edit-location"
                                name="location"
                                value={editFormData.location}
                                onChange={handleEditFormChange}
                                className="form-input"
                                required
                                />
                            </div>
                            </form>
                    </div>
                    <div className="modal-footer">
                        <button 
                        className="cancel-btn" 
                        onClick={cancelEdit}
                        disabled={isUpdating}
                        >
                        Cancel
                        </button>
                        <button 
                        className={`save-btn ${isUpdating ? 'loading' : ''}`}
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                        >
                        {isUpdating ? (
                            <>
                            <div className="spinner"></div>
                            Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default Account; 