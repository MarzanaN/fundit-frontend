import React, { useState} from 'react';
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

  function AddIncomeModal({ onClose, onSuccess }) {
  const [date, setDate] = useState(getCurrentMonth());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isRecurring, setIsRecurring] = useState('');
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { user, currencySymbol, refreshToken, logout } = useAuth();
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
    e.preventDefault(); // Prevent default form submission behavior

    // Validate that recurring monthly option is selected
    if (isRecurring === '') {
      setMessage('Please select whether this income is recurring monthly.');
      return;
    }

    // Determine category value to send in API (lowercase or 'custom')
    const selectedCategory = category === 'Custom' ? 'custom' : category.toLowerCase();

    // Prepare payload data for the API request
    const data = {
      date: `${date}-15`, // Use 15th of the selected month as the date
      amount: parseFloat(amount), // Convert amount to a number
      category: selectedCategory,
      custom_category: category === 'Custom' ? customCategory : '', // Include custom category if applicable
      recurring_monthly: isRecurring,
    };

    try {
      // Call authenticated fetch helper with POST request to add income
      const res = await authFetch(
        '/income/add/',
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
        setMessage('Income added successfully!');

        // Call success callback and close modal after short delay to show message
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        // Attempt to parse error message from response
        let errorMsg = 'Unknown error occurred';
        try {
          const errData = await res.json();
          errorMsg = errData.detail || JSON.stringify(errData);
        } catch {
          errorMsg = res.statusText;
        }
        setMessage(`Error: ${errorMsg}`); // Show error message to user
      }
    } catch (error) {
      // Handle network or unexpected errors
      setMessage('Network error: Unable to submit income.');
      console.error('Income submit error:', error);
    }
  };

  
  
  return (
    <div className="modal-overlay">
      <div className="modal-content-income">
        <h2>Add Income</h2>
        <form onSubmit={handleSubmit}>

          <label>Date</label>
          <input
            type="month"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            required
            />
            
          <label>Amount ({currencySymbol})</label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />

          <div className="form-group-category">
          <label>Category</label>
          <select className="select-category"
           value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            <option value="Salary">Salary</option>
            <option value="Extra Income">Extra Income</option>
            <option value="Investments">Investments</option>
            <option value="Pension">Pension</option>
            <option value="Other">Other</option>
            <option value="Custom">Custom</option>
          </select>
          </div>

          {category === 'Custom' && (
            <div className="form-group-custom">
                <label>Custom Category</label>
                <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                />
            </div>
            )}

        <div className="form-group-monthly">
            <label>Recurring Monthly?</label>
            <select
              className="select-category"
              value={isRecurring}
              onChange={(e) => setIsRecurring(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
        </div>

          <div className="modal-buttons">
            <button type="submit">Add Income</button>
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
                <p className='expired'>Your session has expired. Please log in again.</p>
                <button className='yes-button'onClick={handleModalClose}>Okay</button>
              </div>
            </div>
          )}
    </div>
  );
}

export default AddIncomeModal;
