import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../CSS/ForgotPassword.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uidb64, token } = useParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch('/api/get-user-email/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uidb64, token })
        });
  
        const data = await res.json();
  
        if (res.ok) {
          setEmail(data.email);
        } else {
          setError(data.detail || 'Invalid reset link');
        }
      } catch (err) {
        setError('Something went wrong.');
      }
    };
  
    fetchEmail();
  }, [uidb64, token]); 
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
  
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 5000);
      return;
    }
  
    try {
      const response = await fetch('/api/reset-password-confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uidb64,
          token,
          new_password: password
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }
  
      setMessage('Password reset successful! Redirecting to sign in...');
      setTimeout(() => {
        setMessage('');
        navigate('/signin');
      }, 4000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setTimeout(() => setError(''), 5000);
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
