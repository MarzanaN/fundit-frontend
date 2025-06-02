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

function CreateBudgetModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [message, setMessage] = useState('');
  const { user, currencySymbol, refreshToken, logout } = useAuth();
  const [recurringOption, setRecurringOption] = useState('');
  const [assignedMonth, setAssignedMonth] = useState(getCurrentMonth());
  const [showSessionExpired, setShowSessionExpired] = useState(false);
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

    // Validate that recurring option is selected
    if (recurringOption === '') {
      setMessage('Please select whether this budget is recurring monthly.');
      return;
    }

    // Validate that a category is selected
    if (category === '') {
      setMessage('Please select a category.');
      return;
    }

    // Validate custom category name if 'Custom' category is selected
    if (category === 'Custom' && !customCategory.trim()) {
      setMessage('Please enter a custom category name.');
      return;
    }

    // For non-recurring budgets, ensure an assigned month is provided
    if (recurringOption === 'no' && !assignedMonth) {
      setMessage('Please assign a month for non-recurring budgets.');
      return;
    }

    // Validate amount input is a valid number
    if (isNaN(parseFloat(amount))) {
      setMessage('Please enter a valid amount.');
      return;
    }

    // Determine the category to send ('custom' or lowercase category name)
    const selectedCategory = category === 'Custom' ? 'custom' : category.toLowerCase();

    // Determine date for the budget based on recurring option
    const dateForBudget =
      recurringOption === 'no'
        ? `${assignedMonth}-15` // Use assigned month for non-recurring budget
        : `${getCurrentMonth()}-15`; // Use current month for recurring budget

    // Prepare payload data for the API request
    const data = {
      date: dateForBudget,
      amount: parseFloat(amount),
      category: selectedCategory,
      custom_category: category === 'Custom' ? customCategory : '',
      recurring_monthly: recurringOption,
    };

    try {
      // Call authenticated fetch helper with POST request to add budget
      const res = await authFetch(
        '/budget/add/',
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
        setMessage('Budget added successfully!');
        if (onSuccess) onSuccess(); // Call success callback if provided

        // Close the modal after short delay to show success message
        setTimeout(() => onClose(), 1500);
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
      setMessage('Network error: Unable to submit budget.');
      console.error('Budget submit error:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-income">
        <h2>Create Expense Budget</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-category">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="Housing">Housing</option>
              <option value="Transport">Transport</option>
              <option value="Food">Food</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Personal">Personal</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Debt">Debt</option>
              <option value="Savings">Savings</option>
              <option value="Miscellaneous">Miscellaneous</option>
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

          <div className="form-group-custom">
            <label>Budget Amount ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group-monthly">
            <label>Recurring Monthly?</label>
            <select
              value={recurringOption}
              onChange={(e) => {
                setRecurringOption(e.target.value);
                if (e.target.value === 'yes') {
                  setAssignedMonth('');
                }
              }}
              required
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No I want to assign a month</option>
            </select>
          </div>

          {recurringOption === 'no' && (
            <div className="form-group-assign">
              <label>Assign to month</label>
              <input
                type="month"
                value={assignedMonth}
                onChange={(e) => setAssignedMonth(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                required
              />
            </div>
          )}

          <div className="modal-buttons">
            <button type="submit">Create Budget</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
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

export default CreateBudgetModal;

