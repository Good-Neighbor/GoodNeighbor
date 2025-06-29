import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function StartPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="start-container">
      <div className="start-card">
        <div className="start-header">
          <h1 className="start-title">Welcome to Good Neighbor</h1>
          <p className="start-subtitle">Your community marketplace</p>
        </div>

        <div className="start-content">
          <p className="start-description">
            Connect with your neighbors, discover local services, and build a stronger community together.
          </p>

          <div className="start-buttons">
            {!currentUser ? (
              // Show sign-in/sign-up buttons for unauthenticated users
              <>
                <button 
                  className="start-button primary"
                  onClick={() => navigate("/signin")}
                >
                  Sign In
                </button>
                
                <button 
                  className="start-button secondary"
                  onClick={() => navigate("/signup")}
                >
                  Create Account
                </button>
              </>
            ) : (
              // Show app navigation for authenticated users
              <>
                <button 
                  className="start-button primary"
                  onClick={() => navigate("/listingspage")}
                >
                  Browse Listings
                </button>
                
                <button 
                  className="start-button secondary"
                  onClick={() => navigate("/createlistings")}
                >
                  Create Listing
                </button>

                <button 
                  className="start-button secondary"
                  onClick={() => navigate("/account")}
                >
                  My Account
                </button>
              </>
            )}
            
            <button 
              className="start-button secondary"
              onClick={() => navigate("/about")}
            >
              About
            </button>
          </div>

          {!currentUser && (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default StartPage;
