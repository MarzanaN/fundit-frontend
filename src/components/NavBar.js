import { Link } from 'react-router-dom';
import logo from '../Fundit.png';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import '../CSS/App.css';
import SignIn from '../pages/SignIn';
import Register from '../pages/Register';

function NavBar() {
  const { user, logout } = useAuth();  // Access user state and logout function from AuthContext
  const [authTab, setAuthTab] = useState('signin');  // Track whether to show SignIn or Register
  const [dropdownOpen, setDropdownOpen] = useState(false);  // Controls user dropdown menu visibility
  const [authOverlayOpen, setAuthOverlayOpen] = useState(false);  // Controls auth modal visibility
  const [menuOpen, setMenuOpen] = useState(false);  // Controls mobile nav menu visibility

  const toggleMenu = () => setMenuOpen(prev => !prev);  // Toggle hamburger menu open/close

  // Close all open overlays/menus (used when clicking outside or navigating)
  const closeAll = () => {
    setMenuOpen(false);
    setAuthOverlayOpen(false);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => setDropdownOpen(prev => !prev);  // Toggle user dropdown menu

  // Prevent body scroll when menu or auth overlay is open
  useEffect(() => {
    if (menuOpen || authOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [menuOpen, authOverlayOpen]);

  
  return (
  <header className="app-header">
    <div className="logo">
      {/* Clicking the logo redirects to dashboard if logged in, otherwise to home */}
      <Link to={user ? "/dashboard" : "/"}>
        <img src={logo} alt="Fundit Logo" width="120" />
      </Link>
    </div>

    <nav className="main-nav">
      <ul>
        {!user ? (
          // Public navigation links shown when user is not logged in
          <>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/support">Support</Link></li>
          </>
        ) : (
          // Authenticated navigation links shown when user is logged in
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/income">Income</Link></li>
            <li><Link to="/expenses">Expenses</Link></li>
            <li><Link to="/goals">Savings & Repayments</Link></li>
          </>
        )}
      </ul>
    </nav>

    <div className="auth-selection">
      {!user ? (
        // If user not logged in, show Sign In button that opens auth overlay
        <div className="user-dropdown">
          <button className="user-button" onClick={() => setAuthOverlayOpen(true)}>
            <FaUserCircle className="user-icon" />
            <span className="user-name">Sign In</span>
          </button>
        </div>
      ) : (
        // If user is logged in, show name and dropdown menu
        <div className="user-dropdown">
          <button className="user-button" onClick={toggleDropdown}>
            <FaUserCircle className="user-icon" />
            {/* Show first name if available, otherwise show "Guest" */}
            <span className="user-name">{user?.name ? user.name.split(' ')[0] : 'Guest'}</span>
          </button>
          {dropdownOpen && (
            // Dropdown menu with navigation options for logged-in user
            <ul className="user-dropdown-menu">
              <li><Link to="/settings" onClick={() => setDropdownOpen(false)}>Settings</Link></li>
              <li><Link to="/support" onClick={() => setDropdownOpen(false)}>Support</Link></li>
              <li><Link to="/" onClick={() => { logout(); setDropdownOpen(false); }}>Logout</Link></li>
            </ul>            
          )}
        </div>
      )}
    </div>


        <FaBars className="hamburger" onClick={toggleMenu} />
              
        {/* Mobile menu shown when hamburger is clicked */}
        {menuOpen && (
          <div className="mobile-menu">
            {/* Close icon to hide mobile menu and overlays */}
            <FaTimes className="close-icon" onClick={closeAll} />
            <ul>
              {!user ? (
                // Public mobile nav links (when user is not logged in)
                <>
                  <li><Link to="/" onClick={closeAll}>Home</Link></li>
                  <li><Link to="/about" onClick={closeAll}>About</Link></li>
                  <li><Link to="/features" onClick={closeAll}>Features</Link></li>
                  <li><Link to="/support" onClick={closeAll}>Support</Link></li>
                </>
              ) : (
                // Authenticated mobile nav links (when user is logged in)
                <>
                  <li><Link to="/dashboard" onClick={closeAll}>Dashboard</Link></li>
                  <li><Link to="/income" onClick={closeAll}>Income</Link></li>
                  <li><Link to="/expenses" onClick={closeAll}>Expenses</Link></li>
                  <li><Link to="/goals" onClick={closeAll}>Savings & Repayments</Link></li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Authentication overlay shown when Sign In is triggered */}
        {authOverlayOpen && (
          <div className="auth-overlay-signin">
            <div className="main-auth-signin">
              
              {/* Close button for auth overlay */}
              <div className="auth-overlay-header-signin">
                <button className="close-auth-overlay" onClick={() => setAuthOverlayOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              {/* Toggle buttons between Sign In and Register tabs */}
              <div className="auth-toggle">
                <button
                  className={authTab === 'signin' ? 'active' : ''}
                  onClick={() => setAuthTab('signin')}
                >
                  Sign In
                </button>
                <button
                  className={authTab === 'register' ? 'active' : ''}
                  onClick={() => setAuthTab('register')}
                >
                  Register
                </button>
              </div>

              {/* Render either the SignIn or Register form based on selected tab */}
              <div className="auth-form-container">
                {authTab === 'signin' ? (
                  <SignIn onClose={() => setAuthOverlayOpen(false)} />
                ) : (
                  <Register />
                )}
              </div>

            </div>
          </div>
        )}


    </header>
  );
}

export default NavBar;


