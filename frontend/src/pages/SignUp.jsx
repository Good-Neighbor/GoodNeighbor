import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, db, incrementStat } from '../firebaseConfig';
import { doc, setDoc, getDocs, collection, query, where, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Check if username is unique (case-insensitive)
  const isUsernameUnique = async (username) => {
    try {
      // Check if username exists in the usernames collection
      const usernameDoc = doc(db, 'usernames', username.toLowerCase());
      const usernameSnap = await getDoc(usernameDoc);
      return !usernameSnap.exists();
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      // If there's an error, assume username is not unique to be safe
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Username validation
    const username = formData.username.trim().toLowerCase();
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    try {
      // Check username uniqueness first (fast check)
      const unique = await isUsernameUnique(username);
      if (!unique) {
        setError('Username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Set displayName in Firebase Auth
      await updateProfile(user, { displayName: formData.fullName });

      // Send email verification
      await sendEmailVerification(user);

      // Save additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        fullName: formData.fullName,
        email: formData.email,
        createdAt: new Date()
      });

      // Reserve the username
      await setDoc(doc(db, "usernames", username), {
        userId: user.uid,
        createdAt: new Date()
      });

      // Increment the accounts stat
      await incrementStat('accounts');

      setIsLoading(false);
      alert('Account created successfully! Please check your email and verify your account before signing in.');
      navigate('/account');
    } catch (err) {
      console.error('Signup error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'An error occurred during signup. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBackToStart = () => {
    navigate('/');
  };

  return (
    <div className="signup-container">
      <div className="back-button-container">
        <button onClick={handleBackToStart} className="back-to-start-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19L5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
      </div>
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join our community today</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="username" className="input-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="fullName" className="input-label">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="signup-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-footer">
          <p className="signin-prompt">
            Already have an account?{' '}
            <button 
              className="signin-link"
              onClick={() => navigate('/signin')}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
