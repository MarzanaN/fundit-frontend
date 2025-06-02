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

function RepaymentGoalsModal({ onClose, onSuccess }) {
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

    // Prepare data object to send in POST request
    const data = {
      category: category.toLowerCase(), // Normalize category to lowercase
      goal_name: goalName,               // Goal name from input
      goal_amount: parseFloat(amount),  // Convert amount string to float
      current_amount: 0.00,              // Initialize current amount to zero
      deadline_ongoing: isOngoing,       // Whether deadline is ongoing or fixed
      deadline: isOngoing === 'no' ? `${date}-15` : null, // Set deadline date if not ongoing
    };

    // Retrieve auth token from local storage
    const token = localStorage.getItem('accessToken');

    if (!token) {
      // If no token, show message that user must be signed in
      setMessage('You must be signed in to add a goal.');
      return;
    }

    try {
      // Make authenticated POST request to add repayment goal
      const res = await authFetch(
        '/repayments-goal/add/',
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        refreshToken,
        handleSessionExpired
      );

      if (res.ok) {
        // On success, show confirmation message
        setMessage('Repayment Goal added successfully!');
        setTimeout(() => {
          onSuccess();    // Callback for successful submission (e.g., refresh data)
          onClose();      // Close modal or form
          setMessage(''); // Clear message optionally after closing
        }, 1500);
      } else {
        // If response not OK, attempt to parse error details
        let errorMsg = 'Unknown error occurred';
        try {
          const errData = await res.json();
          errorMsg = errData.detail || JSON.stringify(errData);
        } catch {
          // Fallback to status text if parsing fails
          errorMsg = res.statusText;
        }
        setMessage(`Error: ${errorMsg}`); // Show error message to user
      }
    } catch (error) {
      // Catch network or other fetch errors
      setMessage('Network error: Unable to submit goal.');
    }
  };

    
  return (
    <div className="modal-overlay">
      <div className="modal-content-income">
        <h2>New Repayment Goal</h2>
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
            <option value="credit card">💳 Credit Card</option>
            <option value="loan">🏦 Loan</option>
            <option value="student loan">🎓 Student Loan</option>
            <option value="mortgage">🏠 Mortgage</option>
            <option value="car finance">🚗 Car Finance</option>
            <option value="buy now pay later">🛍️ Buy Now Pay Later</option>
            <option value="medical bills">💊 Medical Bills</option>
            <option value="overdraft">📉 Overdraft</option>
            <option value="utility arrears">💡 Utility Arrears</option>
            <option value="tax debt">📄 Tax Debt</option>
            <option value="family or friend loan">👪 Family or Friend Loan</option>
            <option value="business loan">💼 Business Loan</option>
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
          <select className="category-select"
            value={isOngoing}
            onChange={(e) => setIsOngoing(e.target.value)}
            required
          >
            <option value="yes">Yes</option>
            <option value="no">No I want to set a deadline</option>
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
          {message && <p className="success-message">{message}</p>}
        </form>
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

export default RepaymentGoalsModal;

