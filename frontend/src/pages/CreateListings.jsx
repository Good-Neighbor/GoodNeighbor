import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateListings.css";

const categories = ["Textbooks/School", "Clothing", "Sports", "Other"];

function CreateListing({ onCreate }){
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        location: "",
        category: categories[0],
        condition: "Good",
        description: "",
        serviceType: "Tutoring"
    });

    const [photos, setPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [errors, setErrors] = useState({});
    const [listingType, setListingType] = useState('item'); // 'item' or 'service'
    const serviceTypes = [
        'Tutoring',
        'Volunteering',
        'Carpooling',
        'Other'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (errors[name]) {
            setErrors( prev => ({ ...prev, [name]: ""}));
        }
    };

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(files);
        
        // Clear photo error if photos are selected
        if (files.length > 0 && errors.photos) {
            setErrors(prev => ({ ...prev, photos: "" }));
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};
        
        if (!form.title.trim()) {
            newErrors.title = "Title is required.";
            isValid = false;
        }
        if (!form.location.trim()) {
            newErrors.location = "Location is required.";
            isValid = false;
        }
        if (!form.description.trim()) {
            newErrors.description = "Description is required."; 
            isValid = false;
        }
        if (listingType === 'item') {
            if (!form.category) {
                newErrors.category = "Category is required.";
                isValid = false;
            }
            if (!form.condition) {
                newErrors.condition = "Condition is required.";
                isValid = false;
            }
        } else if (listingType === 'service') {
            if (!form.serviceType) {
                newErrors.serviceType = "Service type is required.";
                isValid = false;
            }
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) { 
            return;
        }
        setIsSubmitting(true);
        setUploadProgress({ current: 0, total: photos.length });
        
        try{
            let listingId = null;
            
            if (listingType === 'item') {
                // Create item listing with photos - use the onCreate prop
                const itemListing = {
                    ...form, 
                    type: 'item'
                };
                
                if (onCreate) {
                    listingId = await onCreate(itemListing, photos); // Pass photos as second parameter
                }
            } else {
                // Create service listing (no photos)
                const serviceData = {
                    title: form.title,
                    description: form.description,
                    location: form.location,
                    serviceType: form.serviceType,
                    type: 'service'
                };
                
                if (onCreate) {
                    listingId = await onCreate(serviceData); // No photos for services
                }
            }
            
            // Reset form
            setForm({
                title: "",
                description: "",
                location: "",
                category: categories[0],
                condition: "Good",
                serviceType: serviceTypes[0]
            });
            setPhotos([]);
            setErrors({});
            setUploadProgress({ current: 0, total: 0 });
            alert("Listing created successfully!");
            navigate('/');
        } catch (error) {
            console.error("Error creating listing:", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToStart = () => {
        navigate('/');
    };

    return (
        <div className="create-listing-page">
            <div className="create-listing-container">
                <button onClick={handleBackToStart} className="back-to-start-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Back to Home
                </button>
                <div className="create-listing-header">
                    <h1>Create New Listing</h1>
                    <p>Share items or services you can offer to your community - completely free!</p>
                </div>
                {/* Listing Type Toggle */}
                <div className="listing-type-toggle">
                    <label className={listingType === 'item' ? 'selected' : ''}>
                        <input
                            type="radio"
                            name="listingType"
                            value="item"
                            checked={listingType === 'item'}
                            onChange={() => setListingType('item')}
                        />
                        <span>Item</span>
                    </label>
                    <label className={listingType === 'service' ? 'selected' : ''}>
                        <input
                            type="radio"
                            name="listingType"
                            value="service"
                            checked={listingType === 'service'}
                            onChange={() => setListingType('service')}
                        />
                        <span>Service</span>
                    </label>
                </div>
                <form onSubmit={handleSubmit} className="create-listing-form">
                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleInputChange}
                            placeholder={listingType === 'item' ? "What are you giving away?" : "What service are you offering?"}
                            maxLength="100"
                            className={errors.title ? "error" : ""}
                        />
                        {errors.title && <span className="error-message">{errors.title}</span>}
                    </div>
                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            placeholder={listingType === 'item' ? "Describe the item's condition, any flaws, pickup instructions, etc." : "Describe the service, requirements, schedule, etc."}
                            rows="4"
                            maxLength="500"
                            className={errors.description ? "error" : ""}
                        />
                        <div className="character-count">
                            {form.description.length}/500
                        </div>
                        {errors.description && <span className="error-message">{errors.description}</span>}
                    </div>
                    {/* Service Type (for services) */}
                    {listingType === 'service' && (
                        <div className="form-group">
                            <label htmlFor="serviceType">Service Type *</label>
                            <select
                                id="serviceType"
                                name="serviceType"
                                value={form.serviceType || serviceTypes[0]}
                                onChange={handleInputChange}
                                className={errors.serviceType ? "error" : ""}
                            >
                                {serviceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.serviceType && <span className="error-message">{errors.serviceType}</span>}
                        </div>
                    )}
                    {/* Category (for items) */}
                    {listingType === 'item' && (
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={form.category}
                                onChange={handleInputChange}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Condition (for items) */}
                    {listingType === 'item' && (
                        <div className="form-group">
                            <label htmlFor="condition">Condition</label>
                            <select
                                id="condition"
                                name="condition"
                                value={form.condition}
                                onChange={handleInputChange}
                            >
                                <option value="">Select condition</option>
                                <option value="Like New">Like New</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                    )}
                    {/* Photo Upload (for items) */}
                    {listingType === 'item' && (
                        <div className="form-group">
                            <label htmlFor="photos">Photos</label>
                            <label htmlFor="photos" className="image-upload-label">
                                <span role="img" aria-label="camera" style={{ marginRight: 8 }}>📷</span>
                                {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected` : 'Choose Photos'}
                            </label>
                            <input
                                type="file"
                                id="photos"
                                name="photos"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoSelect}
                                disabled={isSubmitting}
                                className="image-input"
                            />
                            {photos.length > 0 && (
                                <div className="image-preview-list">
                                    {photos.map((file, idx) => (
                                        <div key={idx} className="image-preview-item">
                                            <span className="image-preview-name">{file.name}</span>
                                            <span className="image-preview-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.photos && <span className="error-message">{errors.photos}</span>}
                            {uploadProgress.total > 0 && (
                                <div className="upload-progress">
                                    Uploading {uploadProgress.current} of {uploadProgress.total} photos...
                                </div>
                            )}
                        </div>
                    )}
                    {/* Location */}
                    <div className="form-group">
                        <label htmlFor="location">{listingType === 'item' ? 'Pickup Location *' : 'Service Location *'}</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleInputChange}
                            placeholder={listingType === 'item' ? 'City, State or general area' : 'Where is the service provided?'}
                            className={errors.location ? "error" : ""}
                        />
                        {errors.location && <span className="error-message">{errors.location}</span>}
                    </div>
                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            {isSubmitting ? "Creating Listing..." : "Create Listing"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default CreateListing;

