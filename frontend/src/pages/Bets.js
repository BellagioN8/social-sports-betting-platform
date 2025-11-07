import React from 'react';
import './Bets.css';

function Bets() {
  return (
    <div className="page-container">
      <h1 className="page-title">My Bets</h1>

      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">Bets Feature Coming Soon</div>
          <div className="empty-state-subtext">
            You'll be able to place and track your bets here
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bets;
