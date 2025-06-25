import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListingWithPhotos } from "../utils/listingStorage";
import "./CreateService.css";

const serviceCategories = [
  "Home Services",
  "Tutoring & Education", 
  "Pet Services",
  "Transportation",
  "Tech Support",
  "Health & Wellness",
  "Event Services",
  "Professional Services",
  "Other Services"
];

function CreateService() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        location: "",
        category: serviceCategories[0],
        description: "",
        price: "",
        priceType: "fixed", // fixed, hourly, negotiable
        availability: "",
        contactMethod: "email",
        phoneNumber: "",
        experience: ""
    });

    const [photos, setPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [errors, setErrors] = useState({}); 

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });

        if (errors[name]) {
            setErrors( prev => ({ ...prev, [name]: ""}));
        }
    };

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(files);
        
        if (files.length > 0 && errors.photos) {
            setErrors(prev => ({ ...prev, photos: "" }));
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};
        
        if (!form.title.trim()) {
            newErrors.title = "Service title is required.";
            isValid = false;
        }
        if (!form.location.trim()) {
            newErrors.location = "Service location is required.";
            isValid = false;
        }
        if (!form.category) {
            newErrors.category = "Category is required.";
            isValid = false;
        }
        if (!form.description.trim()) {
            newErrors.description = "Service description is required."; 
            isValid = false;
        }
        if (!form.availability.trim()) {
            newErrors.availability = "Availability information is required.";
            isValid = false;
        }
        if ((form.contactMethod === 'phone' || form.contactMethod === 'both') && !form.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required for selected contact method.";
            isValid = false;
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
        
        try {
            // Prepare service data with type identifier
            const serviceData = {
                ...form,
                type: 'service', // This identifies it as a service
                datePosted: new Date().toISOString(),
                status: "active"
            };

            // Create service with photos using Firebase
            const serviceId = await createListingWithPhotos(
                serviceData,
                photos,
                (current, total) => setUploadProgress({ current, total })
            );

            // Reset form
            setForm({
                title: "",
                location: "",
                category: serviceCategories[0],
                description: "",
                price: "",
                priceType: "fixed",
                availability: "",
                contactMethod: "email",
                phoneNumber: "",
                experience: ""
            });
            setPhotos([]);
            setErrors({});
            setUploadProgress({ current: 0, total: 0 });
            
            alert("Service created successfully!");
            navigate('/services');
            
        } catch (error) {
            console.error("Error creating service:", error);
            alert("Failed to create service. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToStart = () => {
        navigate('/');
    };

    return (
        <div className="create-service-page">
            <div className="create-service-container">
                <button onClick={handleBackToStart} className="back-to-start-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 19L5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Home
                </button>
                
                <div className="create-service-header">
                    <h1>Offer a Service</h1>
                    <p>Share your skills and help your community while earning income!</p>
                </div>

                <form onSubmit={handleSubmit} className="create-service-form">
                    {/* Basic Information Section */}
                    <div className="form-section">
                        <h3>Service Information</h3>
                        
                        {/* Title */}
                        <div className="form-group">
                            <label htmlFor="title">Service Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleInputChange}
                                placeholder="What service are you offering?"
                                maxLength="100"
                                className={errors.title ? "error" : ""}
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="description">Service Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleInputChange}
                                placeholder="Describe your service in detail. What do you offer? What makes you qualified?"
                                rows="5"
                                maxLength="1000"
                                className={errors.description ? "error" : ""}
                            />
                            <div className="character-count">
                                {form.description.length}/1000
                            </div>
                            {errors.description && <span className="error-message">{errors.description}</span>}
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <label htmlFor="category">Category *</label>
                            <select
                                id="category"
                                name="category"
                                value={form.category}
                                onChange={handleInputChange}
                                className={errors.category ? "error" : ""}
                            >
                                {serviceCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <span className="error-message">{errors.category}</span>}
                        </div>

                        {/* Location */}
                        <div className="form-group">
                            <label htmlFor="location">Service Area *</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleInputChange}
                                placeholder="Where do you provide this service? (City, State or area)"
                                className={errors.location ? "error" : ""}
                            />
                            {errors.location && <span className="error-message">{errors.location}</span>}
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="form-section">
                        <h3>Pricing & Availability</h3>
                        
                        {/* Price Type */}
                        <div className="form-group">
                            <label htmlFor="priceType">Pricing Type</label>
                            <select
                                id="priceType"
                                name="priceType"
                                value={form.priceType}
                                onChange={handleInputChange}
                            >
                                <option value="fixed">Fixed Price</option>
                                <option value="hourly">Hourly Rate</option>
                                <option value="negotiable">Negotiable</option>
                            </select>
                        </div>

                        {/* Price */}
                        <div className="form-group">
                            <label htmlFor="price">
                                Price {form.priceType === 'hourly' ? '(per hour)' : ''}
                                {form.priceType !== 'negotiable' && ' *'}
                            </label>
                            <div className="price-input-group">
                                <span className="price-symbol">$</span>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={form.price}
                                    onChange={handleInputChange}
                                    placeholder={form.priceType === 'negotiable' ? 'Leave blank for negotiable' : '0.00'}
                                    min="0"
                                    step="0.01"
                                    disabled={form.priceType === 'negotiable'}
                                    className={errors.price ? "error" : ""}
                                />
                            </div>
                            {errors.price && <span className="error-message">{errors.price}</span>}
                        </div>

                        {/* Availability */}
                        <div className="form-group">
                            <label htmlFor="availability">Availability *</label>
                            <textarea
                                id="availability"
                                name="availability"
                                value={form.availability}
                                onChange={handleInputChange}
                                placeholder="When are you available? (e.g., Weekdays 9-5, Weekends, Flexible schedule)"
                                rows="3"
                                maxLength="300"
                                className={errors.availability ? "error" : ""}
                            />
                            <div className="character-count">
                                {form.availability.length}/300
                            </div>
                            {errors.availability && <span className="error-message">{errors.availability}</span>}
                        </div>
                    </div>

                    {/* Experience Section */}
                    <div className="form-section">
                        <h3>Experience & Qualifications</h3>
                        
                        <div className="form-group">
                            <label htmlFor="experience">Experience & Qualifications</label>
                            <textarea
                                id="experience"
                                name="experience"
                                value={form.experience}
                                onChange={handleInputChange}
                                placeholder="Tell potential clients about your experience, certifications, or qualifications (optional)"
                                rows="4"
                                maxLength="500"
                            />
                            <div className="character-count">
                                {form.experience.length}/500
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="form-section">
                        <h3>Contact Information</h3>
                        
                        {/* Contact Method */}
                        <div className="form-group">
                            <label htmlFor="contactMethod">Preferred Contact Method</label>
                            <select
                                id="contactMethod"
                                name="contactMethod"
                                value={form.contactMethod}
                                onChange={handleInputChange}
                            >
                                <option value="email">Email Only</option>
                                <option value="phone">Phone Only</option>
                                <option value="both">Both Email & Phone</option>
                            </select>
                        </div>

                        {/* Phone Number */}
                        {(form.contactMethod === 'phone' || form.contactMethod === 'both') && (
                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number *</label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="(555) 123-4567"
                                    className={errors.phoneNumber ? "error" : ""}
                                />
                                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                            </div>
                        )}
                    </div>

                    {/* Photos Section */}
                    <div className="form-section">
                        <h3>Photos</h3>
                        
                        <div className="form-group">
                            <label htmlFor="photos">Service Photos</label>
                            <input
                                type="file"
                                id="photos"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="photo-input"
                            />
                            <div className="photo-help-text">
                                <small>Add photos of your work, certifications, or yourself (optional but recommended)</small>
                            </div>
                            
                            {/* Photo Preview */}
                            {photos.length > 0 && (
                                <div className="photo-preview">
                                    <p>{photos.length} photo{photos.length > 1 ? 's' : ''} selected:</p>
                                    <div className="photo-list">
                                        {photos.map((file, index) => (
                                            <div key={index} className="photo-item">
                                                <span className="photo-name">{file.name}</span>
                                                <span className="photo-size">
                                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Upload Progress */}
                            {isSubmitting && photos.length > 0 && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ 
                                                width: `${(uploadProgress.current / uploadProgress.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        Uploading photos: {uploadProgress.current} of {uploadProgress.total}
                                    </span>
                                </div>
                            )}
                            
                            {errors.photos && <span className="error-message">{errors.photos}</span>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            {isSubmitting ? "Creating Service..." : "Create Service"}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => navigate('/services')}
                            className="cancel-btn"
                            disabled={isSubmitting}
                        >
                            x
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


export default CreateServices;