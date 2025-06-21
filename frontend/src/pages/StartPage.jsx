import './StartPage.css'
import { useNavigate } from 'react-router-dom';
import React from 'react';

function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <div className="main-card">
        <h1 className="main-title">Welcome</h1>
        <div className="button-group">
          <button className="main-button sign-in-button" onClick={() => navigate("Navigate to Sign In")}>
            Sign In
          </button>
          <button className="main-button listings-button" onClick={() => navigate("Navigate to Listings")}>
            Go to Listings
          </button>
          <button className="main-button create-button" onClick={() => navigate("Navigate to Create Listing")}>
            Create Listing
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartPage
