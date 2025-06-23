import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import "./ListingsPage.css";

const categories = ["All", "Books & Media", "Electronics", "Toys & Games", "Sports & Outdoors", "Home & Garden", "Office & School Supplies", "Vehicles & Parts", "Baby & Kids"];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title", label: "Title A-Z" },
    { value: "category", label: "Category" }
];

function ListingsPage({ listings = [], onContact, onFavorite, onShare, favorites = [], currentUserId }) {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter and sort listings
    const filteredAndSortedListings = useMemo(() => {
        let filtered = listings.filter(listing => {
            // Filter by category
            const categoryMatch = selectedCategory === "All" || listing.category === selectedCategory;
            
            // Filter by search query
            const searchMatch = !searchQuery || 
                listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.location.toLowerCase().includes(searchQuery.toLowerCase());
            
            return categoryMatch && searchMatch;
        });

        // Sort listings
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.datePosted) - new Date(a.datePosted);
                case "oldest":
                    return new Date(a.datePosted) - new Date(b.datePosted);
                case "title":
                    return a.title.localeCompare(b.title);
                case "category":
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [listings, selectedCategory, searchQuery, sortBy]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const clearFilters = () => {
        setSelectedCategory("All");
        setSearchQuery("");
        setSortBy("newest");
    };

    const handleListingContact = (listing) => {
        if (onContact) {
            onContact(listing);
        }
    };

    const handleListingFavorite = (listingId) => {
        if (onFavorite) {
            onFavorite(listingId);
        }
    };

    const handleListingShare = (listing) => {
        if (onShare) {
            onShare(listing);
        } else {
            // Default share functionality
            if (navigator.share) {
                navigator.share({
                    title: listing.title,
                    text: `Check out this free item: ${listing.title}`,
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            }
        }
    };

    const navigate = useNavigate();

    const handleBackToStart = () => {
        navigate('/');
    };

    return (
        <div className="listings-page">
            {/* Header */}
            <div className="listings-header">
                <button onClick={handleBackToStart} className="back-to-start-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Back to Home
                </button>
                <div className="header-content">
                    <h1>Free Items Marketplace</h1>
                    <p>Find free items in your community</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="listings-controls">
                <div className="controls-container">
                    {/* Search Bar */}
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="21 21l-4.35-4.35"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for items..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Toggle (Mobile) */}
                    <button
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                        </svg>
                        Filters
                    </button>

                    {/* View Mode Toggle */}
                    <div className="view-mode-toggle">
                        <button
                            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => handleViewModeChange("grid")}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7"/>
                                <rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/>
                            </svg>
                        </button>
                        <button
                            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                            onClick={() => handleViewModeChange("list")}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className={`filters-panel ${showFilters ? "show" : ""}`}>
                    {/* Categories */}
                    <div className="filter-section">
                        <h3>Categories</h3>
                        <div className="category-filters">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                                    onClick={() => handleCategoryChange(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="filter-section">
                        <h3>Sort By</h3>
                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className="sort-select"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className="results-summary">
                <span className="results-count">
                    {filteredAndSortedListings.length} item{filteredAndSortedListings.length !== 1 ? 's' : ''} found
                </span>
                {(selectedCategory !== "All" || searchQuery) && (
                    <div className="active-filters">
                        {selectedCategory !== "All" && (
                            <span className="filter-tag">
                                {selectedCategory}
                                <button onClick={() => setSelectedCategory("All")}>×</button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="filter-tag">
                                "{searchQuery}"
                                <button onClick={() => setSearchQuery("")}>×</button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Listings Grid/List */}
            <div className="listings-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading listings...</p>
                    </div>
                ) : filteredAndSortedListings.length > 0 ? (
                    <div className={`listings-grid ${viewMode}`}>
                        {filteredAndSortedListings.map(listing => (
                            <Listing
                                key={listing.id}
                                listing={listing}
                                onContact={handleListingContact}
                                onFavorite={handleListingFavorite}
                                onShare={handleListingShare}
                                isFavorited={favorites.includes(listing.id)}
                                currentUserId={currentUserId}
                                showActions={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="21 21l-4.35-4.35"/>
                        </svg>
                        <h3>No items found</h3>
                        <p>
                            {searchQuery || selectedCategory !== "All" 
                                ? "Try adjusting your search or filters" 
                                : "No listings available at the moment"
                            }
                        </p>
                        {(searchQuery || selectedCategory !== "All") && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ListingsPage;
