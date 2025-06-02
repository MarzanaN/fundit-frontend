import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../CSS/ForgotPassword.css';
import API_BASE_URL from '../api';

export default function ResetPassword() {
  const navigate = useNavigate(); // Hook to programmatically navigate between routes
  const { uidb64, token } = useParams(); // Get encoded user ID and token from URL parameters

  // State for managing user email (fetched from backend)
  const [email, setEmail] = useState('');

  // State for new password inputs and form messages
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error or success message display
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Toggles for showing/hiding password input
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Automatically run when component mounts to verify link and get user email
    const fetchEmail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get-user-email/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uidb64, token }) // Send encoded user ID and token to backend
        });

        const data = await res.json();

        if (res.ok) {
          // If link is valid, store the associated email for display/use
          setEmail(data.email);
        } else {
          // Handle invalid link or expired token
          setError(data.detail || 'Invalid reset link');
        }
      } catch (err) {
        // Catch network or unexpected errors
        setError('Something went wrong.');
      }
    };

    fetchEmail(); // Trigger email fetch on component load
  }, [uidb64, token]); // Dependency array ensures this only runs when URL params change

  
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setError('');
    setMessage('');

    // Basic validation to check if both password fields match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      return;
    }

    try {
      // Send new password, along with token and UID, to the backend for confirmation
      const response = await fetch(`${API_BASE_URL}/reset-password-confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uidb64,       // Encoded user ID from URL params
          token,        // Reset token from URL params
          new_password: password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If backend returns an error, throw it to be caught below
        throw new Error(data.detail || 'Password reset failed');
      }

      // If successful, show confirmation message and redirect to sign-in page after delay
      setMessage('Password reset successful! Redirecting to sign in...');
      setTimeout(() => {
        setMessage('');
        navigate('/signin');
      }, 4000); // 4-second delay before redirect
    } catch (err) {
      // Display any caught error messages
      setError(err.message || 'An error occurred');
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
    }
  };


  return (
    <div className="forgot-container">
      <div className="forgot-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="public-input-group-reset">
            <input
              type="email"
              value={email}
              readOnly
              placeholder="Email"
            />
          </div>

          <div className="public-input-group-reset">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span
              className="public-input-icon-reset"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          <div className="public-input-group-reset">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="public-input-icon-reset"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ cursor: 'pointer' }}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          <button type="submit" className="send-reset-button">
            Reset Password
          </button>
        </form>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
