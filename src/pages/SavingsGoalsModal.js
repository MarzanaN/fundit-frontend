import React, { useState } from 'react';
import '../CSS/AddIncomeModal.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

function SavingsGoalsModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [goalName, setGoalName] = useState('');
  const [isOngoing, setIsOngoing] = useState('yes');
  const [deadline, setDeadline] = useState(getCurrentMonth());
  const [message, setMessage] = useState('');
  const { user } = useAuth(); 
  const [date, setDate] = useState(getCurrentMonth());
  const { currencySymbol } = useAuth();
  const { refreshToken } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { logout} = useAuth();
  const navigate = useNavigate();
  
  /* ────────────────────────────────
     AUTH FETCH LOGIC
   ──────────────────────────────── */

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

    // Prepare the data object for the POST request
    const data = {
      category: category.toLowerCase(), // Convert category to lowercase for consistency
      goal_name: goalName,               // Name of the savings goal
      goal_amount: parseFloat(amount),  // Convert amount string to a float number
      current_amount: 0.00,              // Initialize current amount to zero
      deadline_ongoing: isOngoing,       // Flag indicating if deadline is ongoing
      deadline: isOngoing === 'no' ? `${date}-15` : null, // Set deadline date if not ongoing
    };

    try {
      // Make authenticated POST request to add a new savings goal
      const res = await authFetch(
        '/savings-goal/add/',
        {
          method: 'POST',
          body: JSON.stringify(data),      // Send data as JSON string
          headers: {
            'Content-Type': 'application/json',
          },
        },
        refreshToken,                      // Token used for refreshing authentication
        handleSessionExpired              // Callback for session expiration handling
      );

      if (res.ok) {
        // If request is successful, show success message
        setMessage('Savings Goal added successfully!');
        setTimeout(() => {
          onSuccess();   // Callback for post-success actions (e.g., refresh UI)
          onClose();     // Close the modal or form
          setMessage(''); // Clear the message after closing (optional)
        }, 1500);
      } else {
        // If response is not OK, handle error message parsing
        let errorMsg = 'Unknown error occurred';
        try {
          const errData = await res.json();
          errorMsg = errData.detail || JSON.stringify(errData);
        } catch {
          errorMsg = res.statusText; // Fallback to status text if JSON parsing fails
        }
        setMessage(`Error: ${errorMsg}`); // Show error message to user
      }
    } catch (error) {
      // Handle network or fetch errors
      setMessage('Network error: Unable to submit goal.');
    }
  };

    
  
  return (
    <div className="modal-overlay">
      <div className="modal-content-income">
        <h2>New Savings Goal</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-category">
            <label>Goal Category</label>
            <select
              className="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="emergency fund">🛟 Emergency Fund</option>
              <option value="travel / holiday">✈️ Travel / Holiday</option>
              <option value="new home">🏡 New Home</option>
              <option value="home Renovation">🛠️ Home Renovation</option>
              <option value="car / vehicle">🚗 Car / Vehicle</option>
              <option value="education / courses">🎓 Education / Courses</option>
              <option value="wedding / event">💍 Wedding / Event</option>
              <option value="tech / gadgets">💻 Tech / Gadgets</option>
              <option value="christmas / gifts">🎄 Christmas / Gifts</option>
              <option value="special event">🎉 Special Event</option>
              <option value="gifts">🎁 Gifts</option>
              <option value="rainy day fund">🌧️ Rainy Day Fund</option>
              <option value="investment fund">📈 Investment Fund</option>
              <option value="luxury purchase">🛍️ Luxury Purchase</option>
              <option value="other">🗂️ Other</option>
            </select>
          </div>

          <div className="form-group-custom">
            <label>Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>

          <label>Goal Amount ({currencySymbol})</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="form-group-category">
            <label>Is this goal deadline ongoing?</label>
            <select
              className="category-select"
              value={isOngoing}
              onChange={(e) => setIsOngoing(e.target.value)}
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No, I want to set a deadline</option>
            </select>
          </div>

          {isOngoing === 'no' && (
            <div className="form-group-assign">
              <label>Set Deadline</label>
              <input
                    type="month"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    required
                    />
            </div>
          )}

          <div className="modal-buttons">
            <button type="submit">Add Goal</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
        {message && <p className="success-message">{message}</p>}
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

export default SavingsGoalsModal;
