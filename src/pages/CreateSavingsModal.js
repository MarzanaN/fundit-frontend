import React, { useState } from 'react';
import '../CSS/AddIncomeModal.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

const getCurrentMonth = () => {
  const now = new Date(); // Get current date and time
  const year = now.getFullYear(); // Extract current year (4 digits)
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Get current month (0-based), add 1, pad to 2 digits
  return `${year}-${month}`; // Return formatted string "YYYY-MM"
};

function CreateSavingModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(getCurrentMonth());
  const [SavingsName, setSavingsName] = useState('');
  const { user } = useAuth();
  const { currencySymbol } = useAuth();
  const { refreshToken } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { logout} = useAuth();
  const navigate = useNavigate();
  
  // Helper function to make authenticated fetch requests with token refresh handling
  const authFetch = async (url, options = {}, refreshToken, onSessionExpired) => {
    const fullUrl = API_BASE_URL + url;

    // Get access token from local storage
    let token = localStorage.getItem('accessToken');
    // Prepare headers including authorization
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Initial fetch request with current token
    let response = await fetch(fullUrl, { ...options, headers });

    // If unauthorized (401) and refresh token available, try to refresh token and retry
    if (response.status === 401 && refreshToken) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          const retryHeaders = {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
          // Retry request with new token
          response = await fetch(fullUrl, { ...options, headers: retryHeaders });
        } else {
          // Refresh failed, remove token and call session expired callback
          localStorage.removeItem('accessToken');
          if (typeof onSessionExpired === 'function') {
            onSessionExpired();
          }
        }
      } catch (error) {
        // Error refreshing token, remove token and call session expired callback
        console.error('Error refreshing token:', error);
        localStorage.removeItem('accessToken');
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
      }
    }

    // If still unauthorized after retry, clear token and notify session expired
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      if (typeof onSessionExpired === 'function') {
        onSessionExpired();
      }
    }

    return response; // Return the fetch response object
  };
  
  // Show the session expired message/UI
  const handleSessionExpired = () => {
    setShowSessionExpired(true); 
  };
  
  // Handle modal close due to session expiry: logout user, hide message, and redirect to home
  const handleModalClose = () => {
    logout(); 
    setShowSessionExpired(false);
    navigate('/'); 
  };


 const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Prepare data payload for the savings entry
  const data = {
    date: `${date}-15`,           // Format date with fixed day '15'
    amount: parseFloat(amount),   // Convert amount string to float
    savings_name: SavingsName,    // Name of the savings entry
  };

  try {
    // Send authenticated POST request to add savings entry
    const res = await authFetch(
      '/general-savings/add/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
      refreshToken,
      handleSessionExpired
    );

    if (res.ok) {
      setMessage('Saving Entry added successfully!');
      // Clear message and call success and close callbacks after delay
      setTimeout(() => {
        setMessage('');
        onSuccess();
        onClose();
      }, 1000);
    } else {
      // Handle API error response
      let errorMsg = 'Failed to add savings entry.';
      try {
        const errData = await res.json();
        errorMsg = errData.detail || errorMsg;
      } catch {
        // Ignore JSON parse errors
      }
      setMessage(`Error: ${errorMsg}`);
    }
  } catch (error) {
    // Handle network or unexpected errors
    setMessage('Network error: Unable to submit savings entry.');
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal-content-savings">
        <h2>Create General Savings Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label>Savings Name</label>
            <input
              type="text"
              value={SavingsName}
              onChange={(e) => setSavingsName(e.target.value)}
              required
            />
          </div>

          <div className="form-group-custom">
            <label>Current Amount ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group-assign">
            <label>Date</label>
            <input
              type="month"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-buttons">
            <button type="submit">Save Entry</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
        {message && (
          <p className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </p>
        )}
      </div>
      {showSessionExpired && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Session Expired</h3>
            <p className="expired">Your session has expired. Please log in again.</p>
            <button className="yes-button" onClick={handleModalClose}>
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateSavingModal;
