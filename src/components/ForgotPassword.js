import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import '../CSS/ForgotPassword.css'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
  
    try {
      const res = await fetch('/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }
  
      setMessage('Reset link sent! Please check your email.');
      setTimeout(() => setMessage(''), 5000);  
  
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setTimeout(() => setError(''), 5000);   
    }
  };
  

  return (
    <div className="forgot-container">
      <form className="forgot-box" onSubmit={handleReset}>
        <h2>Reset Password</h2>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

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

        <button type="submit" className="send-reset-button">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
