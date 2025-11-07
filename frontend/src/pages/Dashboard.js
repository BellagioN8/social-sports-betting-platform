import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { scoresAPI, betsAPI } from '../services/apiClient';
import './Dashboard.css';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [recentBets, setRecentBets] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [betsRes, scoresRes] = await Promise.all([
        betsAPI.getAll(),
        scoresAPI.getAll()
      ]);

      if (betsRes.data.success) {
        setRecentBets(betsRes.data.data.slice(0, 5));
      }

      if (scoresRes.data.success) {
        const live = scoresRes.data.data.filter(g => g.status === 'live').slice(0, 5);
        setLiveGames(live);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">
        Welcome back, {user?.user?.username || 'User'}!
      </h1>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Live Games</h2>
            <Link to="/scores" className="section-link">View All</Link>
          </div>

          {liveGames.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚽</div>
              <div className="empty-state-text">No live games right now</div>
              <div className="empty-state-subtext">Check back later for live action!</div>
            </div>
          ) : (
            <div className="game-list">
              {liveGames.map((game) => (
                <div key={game.game_id} className="game-card">
                  <div className="game-status">LIVE • {game.period}</div>
                  <div className="game-teams">
                    <div className="team">
                      <span className="team-name">{game.away_team}</span>
                      <span className="team-score">{game.away_score}</span>
                    </div>
                    <div className="team">
                      <span className="team-name">{game.home_team}</span>
                      <span className="team-score">{game.home_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Bets</h2>
            <Link to="/bets" className="section-link">View All</Link>
          </div>

          {recentBets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-text">No bets yet</div>
              <div className="empty-state-subtext">
                <Link to="/bets" className="auth-link">Place your first bet</Link>
              </div>
            </div>
          ) : (
            <div className="bet-list">
              {recentBets.map((bet) => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-amount">${bet.amount}</div>
                  <div className="bet-description">{bet.description || 'No description'}</div>
                  <div className={`bet-status status-${bet.status}`}>{bet.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/bets" className="action-card">
              <div className="action-icon">💰</div>
              <div className="action-title">Place a Bet</div>
              <div className="action-description">Create a new bet on upcoming games</div>
            </Link>
            <Link to="/groups" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-title">Join a Group</div>
              <div className="action-description">Connect with friends and compete</div>
            </Link>
            <Link to="/scores" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-title">Live Scores</div>
              <div className="action-description">Track all ongoing games in real-time</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
