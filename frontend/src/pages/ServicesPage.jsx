import React, { useState, useEffect } from 'react';
import { getAllListings, searchListings } from '../utils/listingStorage';
import { useNavigate } from 'react-router-dom';
import './ServicesPage.css';

const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const serviceCategories = [
    'all',
    'Home Services',
    'Tutoring & Education',
    'Pet Services',
    'Transportation',
    'Tech Support',
    'Health & Wellness',
    'Event Services',
    'Professional Services',
    'Other Services'
  ];

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, searchTerm, selectedCategory, sortBy]);

  const loadServices = async () => {
    try {
      setLoading(true);
      // Get all listings and filter for services
      const allListings = await getAllListings();
      const serviceListings = allListings.filter(listing => 
        listing.type === 'service' || 
        listing.category?.toLowerCase().includes('service') ||
        serviceCategories.slice(1).some(cat => 
          listing.category?.toLowerCase() === cat.toLowerCase()
        )
      );
      setServices(serviceListings);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortServices = () => {
    let filtered = [...services];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service =>
        service.category === selectedCategory
      );
    }

    // Sort services
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt.seconds * 1000) - new Date(b.createdAt.seconds * 1000));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredServices(filtered);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      try {
        setLoading(true);
        const searchResults = await searchListings(searchTerm);
        const serviceResults = searchResults.filter(listing => 
          listing.type === 'service' || 
          listing.category?.toLowerCase().includes('service') ||
          serviceCategories.slice(1).some(cat => 
            listing.category?.toLowerCase() === cat.toLowerCase()
          )
        );
        setServices(serviceResults);
      } catch (err) {
        console.error('Error searching services:', err);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      loadServices();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('newest');
    loadServices();
  };

  const formatPrice = (price) => {
    if (!price) return 'Contact for pricing';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="services-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      {/* Header */}
      <div className="services-header">
        <button onClick={() => navigate('/')} className="back-to-home-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19L5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
        <div className="header-content">
          <h1>Services</h1>
          <p>Find local services offered by your community</p>
        </div>
        <button 
          onClick={() => navigate('/create-service')} 
          className="create-service-btn"
        >
          + Offer Service
        </button>
      </div>

      {/* Search and Filters */}
      <div className="services-controls">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </form>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {serviceCategories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title">Alphabetical</option>
          </select>

          {(searchTerm || selectedCategory !== 'all') && (
            <button onClick={clearSearch} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div className="services-container">
        {filteredServices.length === 0 ? (
          <div className="no-services">
            <div className="no-services-icon">🔧</div>
            <h3>No services found</h3>
            <p>
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to offer a service in your community!'
              }
            </p>
            <button 
              onClick={() => navigate('/create-service')} 
              className="create-first-service-btn"
            >
              Offer a Service
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {filteredServices.map((service) => (
              <div key={service.id} className="service-card">
                {/* Service Image */}
                {/*<div className="service-image">
                  {service.photos && service.photos.length > 0 ? (
                    <img 
                      src={service.photos[0].url} 
                      alt={service.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="service-placeholder" style={{
                    display: service.photos && service.photos.length > 0 ? 'none' : 'flex'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                </div>*/}

                {/* Service Content */}
                <div className="service-content">
                  <div className="service-header">
                    <h3 className="service-title">{service.title}</h3>
                    <div className="service-price">{formatPrice(service.price)}</div>
                  </div>

                  <p className="service-description">
                    {service.description.length > 100 
                      ? `${service.description.substring(0, 100)}...` 
                      : service.description
                    }
                  </p>

                  <div className="service-details">
                    <div className="service-category">
                      <span className="category-tag">{service.category}</span>
                    </div>
                    <div className="service-location">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {service.location}
                    </div>
                  </div>

                  <div className="service-footer">
                    <div className="service-meta">
                      <span className="service-provider">By {service.userName}</span>
                      <span className="service-date">Posted {formatDate(service.createdAt)}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/service/${service.id}`)}
                      className="view-service-btn"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
