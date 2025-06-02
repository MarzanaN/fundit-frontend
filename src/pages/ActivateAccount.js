import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

const ActivateAccount = () => {
  const { uid, token } = useParams(); // Extract URL params from route
  const [message, setMessage] = useState(''); // Message to display status to user
  const [loading, setLoading] = useState(false); // Tracks loading state
  const navigate = useNavigate(); // Navigation hook to redirect user

  const handleActivate = async () => {
    setLoading(true); // Show loading spinner or disable button
    try {
      // Send activation request to backend using uid and token from URL
      const res = await fetch(`${API_BASE_URL}/activate/${uid}/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        // On success, show message and redirect to sign-in
        setMessage('✅ Your account has been activated! Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 3000); // Redirect after 3 seconds
      } else {
        // Handle failed activation or expired link
        const data = await res.json();
        setMessage(data.detail || '⚠️ Activation failed or link expired.');
      }
    } catch (error) {
      // Handle network error
      setMessage('❌ Network error. Please try again later.');
    } finally {
      setLoading(false); // Reset loading state
    }
  };


  return (
    <div
      style={{
        backgroundColor: 'black',
        color: 'white',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        fontFamily: "'Russo One', sans-serif",
      }}
    >
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#7b61ff' }}>
        Account Activation
      </h2>

      {!message && (
        <>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem' }}>
            Press the button below to activate your account.
          </p>
          <button
            onClick={handleActivate}
            disabled={loading}
            style={{
              backgroundColor: '#7b61ff',
              color: 'white',
              border: 'none',
              padding: '0.8rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(123, 97, 255, 0.6)',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#634bd1';
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#7b61ff';
            }}
          >
            {loading ? 'Activating...' : 'Activate Account'}
          </button>
        </>
      )}

      {message && (
        <p
          style={{
            fontSize: '1.3rem',
            marginTop: '1.5rem',
            whiteSpace: 'pre-line',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ActivateAccount;
