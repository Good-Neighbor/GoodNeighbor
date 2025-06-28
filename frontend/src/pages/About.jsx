import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './About.css';

function About() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ accounts: 0, listings: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for stats
    const statsDocRef = doc(db, 'meta', 'stats');
    const unsubscribe = onSnapshot(statsDocRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      } else {
        setStats({ accounts: 0, listings: 0 });
      }
      setStatsLoading(false);
    }, (error) => {
      console.error('Error fetching stats:', error);
      setStats({ accounts: 0, listings: 0 });
      setStatsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBackToStart = () => {
    navigate('/');
  };

  return (
    <div className="about-page">
      <div className="about-container">
        <button onClick={handleBackToStart} className="back-to-start-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19L5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
        <h1 className="about-title">About GoodNeighbor</h1>
        <div className="community-stats-card">
          <div className="community-stats-title">Community Stats</div>
          {statsLoading ? (
            <div className="community-stats-loading">Loading...</div>
          ) : (
            <div className="community-stats-list">
              <div className="community-stat">
                <span className="community-stat-number accounts">{stats.accounts}</span>
                <span className="community-stat-label">Accounts</span>
              </div>
              <div className="community-stat">
                <span className="community-stat-number listings">{stats.listings}</span>
                <span className="community-stat-label">Listings</span>
              </div>
            </div>
          )}
        </div>
        <div className="about-section">
          <h2 className="about-section-title">About Us</h2>
          <div className="about-section-text">
            <p>
              Welcome to Good Neighbor! This is a community-driven marketplace where you can exchange goods and services with members of your community. As a kind reminder from Good Neighbor, please be mindful of both giving and receiving. This project is only sustainable if we all do our part to keep it going. Our dream is to not only create a platform for people to exchange, but to create a stronger, more connected community.
            </p>
          </div>
        </div>
        <div className="about-section">
          <h2 className="about-section-title">Team</h2>
          <div className="co-founders-list">
            <a href="https://www.instagram.com/_michael.yang/" target="_blank" rel="noopener noreferrer" className="co-founder-link">
              <div className="co-founder">
                <h3 className="co-founder-name">Michael Yang</h3>
                <p className="co-founder-nickname"><em>Blorg</em></p>
              </div>
            </a>
            <a href="https://www.instagram.com/ronit_kongara/" target="_blank" rel="noopener noreferrer" className="co-founder-link">
              <div className="co-founder">
                <h3 className="co-founder-name">Ronit Kongara</h3>
                <p className="co-founder-nickname"><em>Kongaroo</em></p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About; 