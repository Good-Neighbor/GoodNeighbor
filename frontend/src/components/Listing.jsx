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
    currentUserId = null,
    viewMode = 'grid',
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showContactPopup, setShowContactPopup] = useState(false);
    const [selectedRequestor, setSelectedRequestor] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);

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

    // Get type flair class
    const getTypeFlairClass = (type) => {
        switch (type?.toLowerCase()) {
            case 'service':
                return 'type-flair-service';
            case 'item':
                return 'type-flair-item';
            default:
                return 'type-flair-item';
        }
    };

    // Get type flair icon and text
    const getTypeFlairContent = (type) => {
        switch (type?.toLowerCase()) {
            case 'service':
                return { icon: '🛠️', text: 'Service' };
            case 'item':
                return { icon: '📦', text: 'Item' };
            default:
                return { icon: '📦', text: 'Item' };
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageLoad = () => {
         setImageLoaded(true);
    };

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
        setShowShareModal(true);
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

    const closeShareModal = () => {
        setShowShareModal(false);
    };

    const shareToSocial = (platform) => {
        const shareData = {
            title: `${listing.title} - GoodNeighbor`,
            text: `Check out this free ${listing.type || 'item'} on GoodNeighbor: ${listing.title}`,
            url: `${window.location.origin}/#/listingspage?listing=${listing.id}`
        };

        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct URL sharing, so we'll copy the text to clipboard
                const instagramText = `${shareData.text} ${shareData.url}`;
                navigator.clipboard.writeText(instagramText).then(() => {
                    alert('Content copied! You can now paste it in your Instagram story or post.');
                }).catch(() => {
                    alert('Please copy this text and share it on Instagram:\n\n' + instagramText);
                });
                closeShareModal();
                return;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
        closeShareModal();
    };

    const copyToClipboard = async () => {
        const shareData = {
            title: `${listing.title} - GoodNeighbor`,
            text: `Check out this free ${listing.type || 'item'} on GoodNeighbor: ${listing.title}`,
            url: `${window.location.origin}/#/listingspage?listing=${listing.id}`
        };

        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        
        try {
            await navigator.clipboard.writeText(shareText);
            alert('Link copied to clipboard!');
            closeShareModal();
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            alert('Failed to copy to clipboard. Please try again.');
        }
    };

    if (viewMode === 'list') {
        // Compact line view
        const typeContent = getTypeFlairContent(listing.type);
        return (
            <div className="listing-row" data-listing-id={listing.id}>
                <div className="listing-row-main">
                    <div className="listing-row-title">{listing.title}</div>
                    <div className="listing-row-meta">
                        <span className={`type-flair ${getTypeFlairClass(listing.type)}`}>
                            {typeContent.icon} {typeContent.text}
                        </span>
                        <span className="listing-row-sep">•</span>
                        <span className="listing-row-category">{listing.category || listing.serviceType}</span>
                        <span className="listing-row-sep">•</span>
                        <span className="listing-row-location">{listing.location}</span>
                        <span className="listing-row-sep">•</span>
                        {(listing.status === 'available' || listing.status === 'claimed') && (
                            <span className={`status-badge ${getStatusClass(listing.status)}`}>{listing.status}</span>
                        )}
                        {listing.status === 'matched' && (
                            <span className="matched-badge">✓ Matched</span>
                        )}
                        <span className="listing-row-sep">•</span>
                        <span className="listing-row-date">{formatDate(listing.datePosted)}</span>
                    </div>
                </div>
                {showActions && (
                    <div className="listing-row-actions">
                        {/* You can add compact action buttons here if desired */}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="listing-card" data-listing-id={listing.id}>
                {/* Image Section */}
                    <div className="listing-image-container">
                        {(() => {
                            // Handle both old format (single image) and new format (photos array)
                            let imageUrl = null;
                            
                            if (listing.photos && listing.photos.length > 0) {
                                // New format: array of photo objects
                                imageUrl = typeof listing.photos[0] === 'string' 
                                    ? listing.photos[0] 
                                    : listing.photos[0].url;
                            } else if (listing.image) {
                                // Old format: single image URL
                                imageUrl = listing.image;
                            }

                            return imageUrl && !imageError ? (
                                <>
                                    <img
                                        src={imageUrl}
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
                            ) : (
                                <div className="image-placeholder no-image">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21,15 16,10 5,21"/>
                                    </svg>
                                    <span>No Image</span>
                                </div>
                            );
                        })()}

                        {/* Badge Container: Only Matched */}
                        <div className="badge-stack">
                            {listing.status === 'matched' && (
                                <div className="matched-badge">✓ Matched</div>
                            )}
                        </div>

                        {/* Type Flair Badge */}
                        {(() => {
                            const typeContent = getTypeFlairContent(listing.type);
                            return (
                                <div className={`type-flair-badge ${getTypeFlairClass(listing.type)}`}>
                                    {typeContent.icon} {typeContent.text}
                                </div>
                            );
                        })()}

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

            {/* Share Modal - Rendered outside the listing card */}
            {showShareModal && (
                <div className="share-modal-overlay" onClick={closeShareModal}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Share this listing</h4>
                        <div className="share-options">
                            <button onClick={() => shareToSocial('facebook')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </button>
                            <button onClick={() => shareToSocial('twitter')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                                Twitter
                            </button>
                            <button onClick={() => shareToSocial('instagram')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </button>
                            <button onClick={() => shareToSocial('whatsapp')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </button>
                            <button onClick={() => shareToSocial('email')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                Email
                            </button>
                            <button onClick={copyToClipboard}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                Copy Link
                            </button>
                        </div>
                        <button className="close-modal-btn" onClick={closeShareModal}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Listing;
