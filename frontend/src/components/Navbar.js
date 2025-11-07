import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          Sports Betting
        </Link>

        <div className="navbar-menu">
          <Link
            to="/dashboard"
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/scores"
            className={`navbar-link ${isActive('/scores') ? 'active' : ''}`}
          >
            Live Scores
          </Link>
          <Link
            to="/bets"
            className={`navbar-link ${isActive('/bets') ? 'active' : ''}`}
          >
            My Bets
          </Link>
          <Link
            to="/groups"
            className={`navbar-link ${isActive('/groups') ? 'active' : ''}`}
          >
            Groups
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-name">{user?.user?.username || 'User'}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
