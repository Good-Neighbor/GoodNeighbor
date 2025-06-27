import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    // Clear error and resend state when user starts typing
    if (error) setError('');
    if (showResend) setShowResend(false);
    if (resendMessage) setResendMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setShowResend(false);
    setResendMessage('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        setError('Please verify your email before signing in.');
        setShowResend(true);
        await signOut(auth);
        setIsLoading(false);
        return;
      }
      navigate('/listingspage');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage('');
    setIsLoading(true);
    try {
      // Sign in silently to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      setResendMessage('Verification email sent! Please check your inbox.');
      await signOut(auth);
    } catch (err) {
      setResendMessage('Failed to send verification email. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStart = () => {
    navigate('/');
  };

  return (
    <div className="signin-container">
      <div className="back-button-container">
        <button onClick={handleBackToStart} className="back-to-start-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19L5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
      </div>
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">Welcome Back</h1>
          <p className="signin-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
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
              className="signin-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="signin-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {showResend && (
            <div className="resend-verification-container">
              <button
                type="button"
                className="resend-button"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              {resendMessage && (
                <div className={`resend-message ${resendMessage.includes('Failed') ? 'error' : ''}`}>
                  {resendMessage}
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="signin-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p className="signup-prompt">
            Don't have an account?{' '}
            <button 
              className="signup-link"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </button>
          </p>
          <p className="verification-prompt">
            Need to verify your email?{' '}
            <button 
              className="verification-link"
              onClick={() => setShowResend(true)}
            >
              Resend verification email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;