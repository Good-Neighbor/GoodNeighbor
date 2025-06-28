import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import "./ListingsPage.css";

const categories = ["All", "Textbooks/School", "Clothing", "Sports", "Other"];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title", label: "Title A-Z" },
    { value: "category", label: "Category" }
];

function ListingsPage({ listings = [], onContact, onFavorite, onMatch, onClaim, favorites = [], currentUserId, loading = false }) {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 18;

    // Filter and sort listings
    const filteredAndSortedListings = useMemo(() => {
        let filtered = listings;

        // Apply category filter
        if (selectedCategory !== "All") {
            filtered = filtered.filter(listing => listing.category === selectedCategory);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(listing =>
                listing.title.toLowerCase().includes(query) ||
                listing.description.toLowerCase().includes(query) ||
                listing.location.toLowerCase().includes(query) ||
                listing.category.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt || b.datePosted) - new Date(a.createdAt || a.datePosted);
                case "oldest":
                    return new Date(a.createdAt || a.datePosted) - new Date(b.createdAt || b.datePosted);
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

    // Calculate pagination
    const totalPages = Math.ceil(filteredAndSortedListings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedListings = filteredAndSortedListings.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, sortBy]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
        // Share functionality is now handled directly in the Listing component
        console.log('Share requested for:', listing.title);
    };

    const handleListingMatch = (listingId, requestor) => {
        if (onMatch) {
            onMatch(listingId, requestor);
        }
    };

    const handleListingClaim = (listingId) => {
        if (onClaim) {
            onClaim(listingId);
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
                        <path d="m12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Back to Home
                </button>
                <div className="header-content">
                    <h1>Marketplace</h1>
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
                                <path d="M21 21l-4.35-4.35"/>
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
            {(filteredAndSortedListings.length > 0 || selectedCategory !== "All" || searchQuery) && (
              <div className="results-summary">
                  {filteredAndSortedListings.length > 0 && (
                    <>
                      <span className="results-count-badge">
                        {filteredAndSortedListings.length}
                      </span>
                      <span className="results-count-text">
                        {filteredAndSortedListings.length === 1 ? 'item found' : 'items found'}
                      </span>
                    </>
                  )}
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
            )}

            {/* Listings Grid/List */}
            <div className="listings-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading listings...</p>
                    </div>
                ) : filteredAndSortedListings.length > 0 ? (
                    <div className={`listings-grid ${viewMode}`}>
                        {paginatedListings.map(listing => (
                            <Listing
                                key={listing.id}
                                listing={listing}
                                onContact={handleListingContact}
                                onFavorite={handleListingFavorite}
                                onMatch={handleListingMatch}
                                onClaim={handleListingClaim}
                                isFavorited={favorites.includes(listing.id)}
                                currentUserId={currentUserId}
                                showActions={true}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                          </svg>
                        </div>
                        <h2 className="no-results-title">No items found</h2>
                        <p className="no-results-message">
                          {searchQuery || selectedCategory !== "All" 
                            ? "Try adjusting your search or filters."
                            : "There are no listings available at the moment. Be the first to share something with your community!"}
                        </p>
                        <div className="no-results-actions">
                          {(searchQuery || selectedCategory !== "All") && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                              Clear Filters
                            </button>
                          )}
                          <button className="create-listing-cta" onClick={() => navigate('/createlistings')}>
                            + Create a Listing
                          </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className={`page-btn ${currentPage === totalPages ? "disabled" : ""}`}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ListingsPage;
