import { Link} from 'react-router-dom';
import logo from '../Fundit.png';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import '../CSS/App.css';
import SignIn from '../pages/SignIn';
import Register from '../pages/Register';

function NavBar() {
  const { user, logout } = useAuth();
  const [authTab, setAuthTab] = useState('signin');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authOverlayOpen, setAuthOverlayOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); 
  const toggleMenu = () => setMenuOpen(prev => !prev); 

  const closeAll = () => {
    setMenuOpen(false);
    setAuthOverlayOpen(false);
    setDropdownOpen(false);
  };
  const toggleDropdown = () => setDropdownOpen(prev => !prev);

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
      <Link to={user ? "/dashboard" : "/"}>
        <img src={logo} alt="Fundit Logo" width="120" />
      </Link>
      </div>


      <nav className="main-nav">
        <ul>
          {!user ? (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/support">Support</Link></li>
            </>
          ) : (
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
          <>
            <div className="user-dropdown">
              <button className="user-button" onClick={() => setAuthOverlayOpen(true)}>
                <FaUserCircle className="user-icon" />
                <span className="user-name">Sign In</span>
              </button>
            </div>
          </>
        ) : (
          <div className="user-dropdown">
            <button className="user-button" onClick={toggleDropdown}>
              <FaUserCircle className="user-icon" />
              <span className="user-name">{user?.name ? user.name.split(' ')[0] : 'Guest'}</span>
            </button>
            {dropdownOpen && (
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

      {menuOpen && (
        <div className="mobile-menu">
          <FaTimes className="close-icon" onClick={closeAll} />
          <ul>
            {!user ? (
              <>
                <li><Link to="/" onClick={closeAll}>Home</Link></li>
                <li><Link to="/about" onClick={closeAll}>About</Link></li>
                <li><Link to="/features" onClick={closeAll}>Features</Link></li>
                <li><Link to="/support" onClick={closeAll}>Support</Link></li>
              </>
            ) : (
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

{authOverlayOpen && (
  <div className="auth-overlay">

    <div className="main-auth">
    <div className="auth-overlay-header">
      <button className="close-auth-overlay" onClick={() => setAuthOverlayOpen(false)}>
        <FaTimes />
      </button>
    </div>

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


