import React, { useState } from "react";
import "./Listing.css";

function Listing({ 
    listing, 
    onContact, 
    onFavorite, 
    onShare, 
    onMatch,
    onClaim,
    showActions = true,
    isFavorited = false,
    currentUserId = null 
}) {
    // const [imageLoaded, setImageLoaded] = useState(false);
    // const [imageError, setImageError] = useState(false);
    const [showContactPopup, setShowContactPopup] = useState(false);
    const [selectedRequestor, setSelectedRequestor] = useState(null);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Get condition badge color
    const getConditionClass = (condition) => {
        switch (condition?.toLowerCase()) {
            case 'like new':
                return 'condition-like-new';
            case 'good':
                return 'condition-good';
            case 'fair':
                return 'condition-fair';
            case 'poor':
                return 'condition-poor';
            default:
                return 'condition-good';
        }
    };

    // Get status badge
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

    // const handleImageError = () => {
    //     setImageError(true);
    // };

    // const handleImageLoad = () => {
    //     setImageLoaded(true);
    // };

    const handleContact = (e) => {
        e.stopPropagation();
        if (onContact) {
            onContact(listing);
        }
    };

    const handleFavorite = (e) => {
        e.stopPropagation();
        if (onFavorite) {
            onFavorite(listing.id);
        }
    };

    const handleShare = (e) => {
        e.stopPropagation();
        if (onShare) {
            onShare(listing);
        }
    };

    const handleMatch = (e, requestor) => {
        e.stopPropagation();
        if (onMatch) {
            onMatch(listing.id, requestor);
        }
    };

    const handleClaim = (e) => {
        e.stopPropagation();
        if (onClaim) {
            onClaim(listing.id);
        }
    };

    const showRequestorContact = (e, requestor) => {
        e.stopPropagation();
        setSelectedRequestor(requestor);
        setShowContactPopup(true);
    };

    const closeContactPopup = () => {
        setShowContactPopup(false);
        setSelectedRequestor(null);
    };

    // Check if listing is from current user
    const isOwnListing = currentUserId && listing.userId === currentUserId;

    // Check if current user has already requested this item
    const hasRequested = (listing.requestors || []).some(req => req.userId === currentUserId);

    // Get request count
    const requestCount = (listing.requestors || []).length;

    return (
        <div className="listing-card">
            {/* Image Section */}
            <div className="listing-image-container">
                {/* {!imageError && listing.image ? (
                    <>
                        <img
                            src={listing.image}
                            alt={listing.title}
                            className={`listing-image ${imageLoaded ? 'loaded' : ''}`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                        {!imageLoaded && (
                            <div className="image-placeholder">
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                    </>
                ) : ( */}
                    <div className="image-placeholder no-image">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>No Image</span>
                    </div>
                {/* )} */}

                {/* Status Badge */}
                <div className={`status-badge ${getStatusClass(listing.status)}`}>
                    {listing.status || 'Available'}
                </div>

                {/* Request Count Badge (for own listings) */}
                {isOwnListing && requestCount > 0 && (
                    <div className="request-count-badge">
                        {requestCount} request{requestCount !== 1 ? 's' : ''}
                    </div>
                )}

                {/* Favorite Button */}
                {showActions && !isOwnListing && (
                    <button
                        className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                        onClick={handleFavorite}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor">
                            <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className="listing-content">
                {/* Title */}
                <h3 className="listing-title">{listing.title}</h3>

                {/* Category and Condition */}
                <div className="listing-meta">
                    <span className="listing-category">{listing.category}</span>
                    {listing.condition && (
                        <>
                            <span className="meta-separator">•</span>
                            <span className={`condition-badge ${getConditionClass(listing.condition)}`}>
                                {listing.condition}
                            </span>
                        </>
                    )}
                </div>

                {/* Description */}
                {listing.description && (
                    <p className="listing-description">
                        {listing.description.length > 100 
                            ? `${listing.description.substring(0, 100)}...` 
                            : listing.description
                        }
                    </p>
                )}

                {/* Location and Date */}
                <div className="listing-footer">
                    <div className="location-date">
                        <span className="listing-location">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {listing.location}
                        </span>
                        <span className="listing-date">
                            {formatDate(listing.datePosted)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                {showActions && (
                    <div className="listing-actions">
                        {!isOwnListing && listing.status === 'available' && !hasRequested && (
                            <button 
                                className="contact-btn primary"
                                onClick={handleContact}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                Contact
                            </button>
                        )}

                        {!isOwnListing && hasRequested && (
                            <span className="requested-indicator">Requested</span>
                        )}
                        
                        <button 
                            className="share-btn secondary"
                            onClick={handleShare}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>

                        {isOwnListing && (
                            <span className="own-listing-indicator">Your listing</span>
                        )}
                    </div>
                )}
            </div>

            {/* Contact Info Popup */}
            {showContactPopup && selectedRequestor && (
                <div className="contact-popup-overlay" onClick={closeContactPopup}>
                    <div className="contact-popup" onClick={(e) => e.stopPropagation()}>
                        <h4>Contact Information</h4>
                        <p><strong>Name:</strong> {selectedRequestor.userFullName}</p>
                        <p><strong>Email:</strong> {selectedRequestor.userEmail}</p>
                        <p><strong>Requested:</strong> {formatDate(selectedRequestor.requestDate)}</p>
                        <button className="close-popup-btn" onClick={closeContactPopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Listing;
