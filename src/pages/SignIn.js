import { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../CSS/SignIn.css';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API_BASE_URL from '../api';

export default function SignIn({ onClose }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setError('');       // Clear any previous error messages
    setSuccess('');     // Clear any previous success messages

    try {
      // Send POST request to the login endpoint with form data as JSON
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      // Check if response's content-type header includes 'application/json'
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If response is not JSON, throw an error
        throw new Error('Unexpected response from server');
      }

      // Parse response JSON body
      const data = await response.json();

      // If response status is not OK (e.g., 4xx or 5xx)
      if (!response.ok) {
        // Extract error message or default to 'Invalid credentials'
        const message = data?.detail || 'Invalid credentials';

        // Handle specific error messages from backend to provide user-friendly errors
        if (message === 'Email not found.') {
          throw new Error('This email is not registered.');
        } else if (message === 'Incorrect password.') {
          throw new Error('The password you entered is incorrect.');
        } else if (message === 'Account is not activated. Please check your email.') {
          throw new Error('Sign in unsuccessful. Account needs to be activated.');
        } else {
          throw new Error(message);
        }
      }

      // Store received JWT access and refresh tokens in localStorage
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Call login function (from context or props) to update auth state with user info
      login({
        name: `${data.user.first_name} ${data.user.last_name}`,
        email: data.user.email,
        id: data.user.id,
      });

      // Show success message to user
      setSuccess('Signed in successfully!');
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

      // Navigate to the dashboard page after successful login
      navigate('/dashboard');
      // Close the login modal or form
      onClose();

    } catch (err) {
      // Log error to console for debugging
      console.error(err);
      // Display error message to user or a default message if none provided
      setError(err.message || 'Login failed. Please try again.');
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };


  const handleForgotPassword = () => {
    setFadeOut(true); // Start fade-out animation effect on the modal/form
    setTimeout(() => {
      onClose();       // Close the login modal/form after animation completes (300ms)
      navigate('/forgot-password'); // Redirect user to the Forgot Password page
    }, 300); 
  };


  return (
    <div className={`signin-container ${fadeOut ? 'fade-out' : ''}`}>
      <form className="signin-box" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="public-input-group">
          <FaEnvelope className="public-input-icon" />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="public-input-group">
            <span className="public-input-icon"><FaLock /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <span
              className="toggle-password-icon"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer', marginLeft: '8px' }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

        <div className="forgot-password">
          <span onClick={handleForgotPassword} style={{ cursor: 'pointer', fontSize: '12px', color: '#007bff' }}>
            Forgot Password?
          </span>
        </div>

        <button type="submit" className="signin-button">Sign In</button>
      </form>
    </div>
  );
}
