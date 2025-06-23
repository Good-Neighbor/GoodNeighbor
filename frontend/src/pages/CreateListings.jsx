import React, { useState } from "react";
import "./CreateListings.css";

const categories = ["Books & Media", "Electronics", "Toys & Games", "Sports & Outdoors", "Home & Garden", "Office & School Supplies", "Vehicles & Parts", "Baby & Kids"];

function CreateListing({ onCreate }){
    const [form, setForm] = useState({
        title: "",
        image: "",
        location: "",
        category: categories[0],
        condition: "Good",
        description: ""
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (errors[name]) {
            setErrors( prev => ({ ...prev, [name]: ""}));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setErrors(prev => ({ ...prev, image: "Invalid file type. Please select an image."})); 
                return;
            }
            if(file.size > 5*1024*1024) {
                setErrors(prev => ({ ...prev, image: "File size exceeds the limit of 5MB."})); 
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
                setForm(prev => ({ ...prev, image: reader.result}));
            };
            reader.readAsDataURL(file);
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
        if (!form.image) {
            newErrors.image = "Image is required.";
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
                id: Date.now(),
                datePosted: new Date().toISOString(),
                status: "available"
            };       
            if (onCreate) {
                await onCreate(newListing);
            }

            setForm({
                title: "",
                description: "",
                image: "",
                location: "",
                category: categories[0],
                condition: "Good"
            });
            setImagePreview(null);
            setErrors({});
            
            alert("Listing created successfully!");
            
        } catch (error) {
            console.error("Error creating listing:", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-listing-container">
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

                {/* Image Upload */}
                <div className="form-group">
                    <label htmlFor="image">Photos *</label>
                    <div className="image-upload-container">
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="image-input"
                        />
                        <label htmlFor="image" className="image-upload-label">
                            {imagePreview ? "Change Photo" : "Add Photo"}
                        </label>
                        
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setForm(prev => ({ ...prev, image: "" }));
                                    }}
                                    className="remove-image-btn"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                    {errors.image && <span className="error-message">{errors.image}</span>}
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
    );
}
export default CreateListing;
