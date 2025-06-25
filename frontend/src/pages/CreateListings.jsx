import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateListings.css";

const categories = ["Books & Media", "Electronics", "Toys & Games", "Sports & Outdoors", "Home & Garden", "Office & School Supplies", "Vehicles & Parts", "Baby & Kids"];

function CreateListing({ onCreate }){
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        location: "",
        category: categories[0],
        condition: "Good",
        description: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (errors[name]) {
            setErrors( prev => ({ ...prev, [name]: ""}));
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};
        if (!form.title) {
            newErrors.title = "Title is required.";
            isValid = false;
        }
        if (!form.location) {
            newErrors.location = "Location is required.";
            isValid = false;
        }
        if (!form.category) {
            newErrors.category = "Category is required.";
            isValid = false;
        }
        if (!form.condition) {
            newErrors.condition = "Condition is required.";
            isValid = false;
        }
        if (!form.description) {
            newErrors.description = "Description is required."; 
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
        try{
            const newListing = {
                ...form,
                datePosted: new Date().toISOString(),
                status: "available"
            };       
            
            if (onCreate) {
                await onCreate(newListing);
            }

            setForm({
                title: "",
                description: "",
                location: "",
                category: categories[0],
                condition: "Good"
            });
            setErrors({});
            
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
                    <p>Share items you no longer need with your community - completely free!</p>
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
                            placeholder="What are you giving away?"
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
                            placeholder="Describe the item's condition, any flaws, pickup instructions, etc."
                            rows="4"
                            maxLength="500"
                            className={errors.description ? "error" : ""}
                        />
                        <div className="character-count">
                            {form.description.length}/500
                        </div>
                        {errors.description && <span className="error-message">{errors.description}</span>}
                    </div>

                    {/* Category */}
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

                    {/* Condition */}
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

                    {/* Location */}
                    <div className="form-group">
                        <label htmlFor="location">Pickup Location *</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleInputChange}
                            placeholder="City, State or general area"
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
