import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function StartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="start-container">
      <div className="start-card">
        <div className="start-header">
          <h1 className="start-title">Welcome to GoodNeighbor</h1>
          <p className="start-subtitle">Your community marketplace</p>
        </div>

        <div className="start-content">
          <p className="start-description">
            Connect with your neighbors, discover local services, and build a stronger community together.
          </p>

          <div className="start-buttons">
            <button 
              className="start-button primary"
              onClick={() => navigate("/signin")}
            >
              Sign In
            </button>
            
            <button 
              className="start-button secondary"
              onClick={() => navigate("/listingspage")}
            >
              Browse Item Listings
            </button>

            {/*<button 
              className="start-button secondary"
              onClick={() => navigate("/servicespage")}
            >
              Browse Services
            </button>*/}
            
            <button 
              className="start-button secondary"
              onClick={() => navigate("/createlistings")}
            >
              Create Item Listing
            </button>

            {/*<button 
              className="start-button secondary"
              onClick={() => navigate("/createservices")}
            >
              Create Service
            </button>*/}

            {user && (
              <button 
                className="start-button secondary"
                onClick={() => navigate("/account")}
              >
                Account
              </button>
            )}
            <button 
              className="start-button secondary"
              onClick={() => navigate("/about")}
            >
              About
            </button>
          </div>

          <div className="start-footer">
            <p className="signup-prompt">
              New to GoodNeighbor?{' '}
              <button 
                className="signup-link"
                onClick={() => navigate("/signup")}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartPage;
