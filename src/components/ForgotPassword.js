import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import '../CSS/ForgotPassword.css'; 
import API_BASE_URL from '../api';

export default function ForgotPassword() {
  // State for email input, success message, and error
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Handle form submission to send password reset email
  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
  
    try {
      const res = await fetch(`${API_BASE_URL}/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }

      // Show success message for 5 seconds
      setMessage('Reset link sent! Please check your email.');
      setTimeout(() => setMessage(''), 5000);  
  
    } catch (err) {
      // Show error message for 5 seconds
      setError(err.message || 'Something went wrong.');
      setTimeout(() => setError(''), 5000);   
    }
  };
  

  return (
    <div className="forgot-container">
      <form className="forgot-box" onSubmit={handleReset}>
        <h2>Reset Password</h2>

        {/* Display success or error messages */}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Email input field with icon */}
        <div className="public-input-group-forgot">
          <FaEnvelope className="public-input-icon-forgot" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Submit button */}
        <button type="submit" className="send-reset-button">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
