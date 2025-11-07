import React, { useState, useEffect } from 'react';
import { scoresAPI } from '../services/apiClient';
import './LiveScores.css';

function LiveScores() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
    const interval = setInterval(loadScores, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadScores = async () => {
    try {
      const response = await scoresAPI.getAll();
      if (response.data.success) {
        setGames(response.data.data);
      }
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = filter === 'all'
    ? games
    : games.filter(g => g.status === filter);

  return (
    <div className="page-container">
      <h1 className="page-title">Live Scores</h1>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button
          className={`filter-btn ${filter === 'scheduled' ? 'active' : ''}`}
          onClick={() => setFilter('scheduled')}
        >
          Upcoming
        </button>
        <button
          className={`filter-btn ${filter === 'final' ? 'active' : ''}`}
          onClick={() => setFilter('final')}
        >
          Final
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner"></div></div>
      ) : filteredGames.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <div className="empty-state-text">No games found</div>
        </div>
      ) : (
        <div className="scores-grid">
          {filteredGames.map((game) => (
            <div key={game.game_id} className="score-card">
              <div className="score-header">
                <span className="sport-type">{game.sport_type}</span>
                <span className={`game-status status-${game.status}`}>{game.status}</span>
              </div>

              <div className="score-body">
                <div className="team away">
                  <span className="team-name">{game.away_team}</span>
                  <span className="score">{game.away_score}</span>
                </div>
                <div className="team home">
                  <span className="team-name">{game.home_team}</span>
                  <span className="score">{game.home_score}</span>
                </div>
              </div>

              {game.period && (
                <div className="score-footer">
                  <span>{game.period}</span>
                  {game.time_remaining && <span> • {game.time_remaining}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveScores;
