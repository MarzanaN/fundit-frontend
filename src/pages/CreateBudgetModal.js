import React, { useState } from 'react';
import '../CSS/AddIncomeModal.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

  const authFetch = async (url, options = {}, refreshToken, onSessionExpired) => {
    let token = localStorage.getItem('accessToken');
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && refreshToken) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          const retryHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
          response = await fetch(url, { ...options, headers: retryHeaders });
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }

    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      if (typeof onSessionExpired === 'function') {
        onSessionExpired();
      }
    }
    return response;
  };

  const handleSessionExpired = () => {
    setShowSessionExpired(true);
  };

  const handleModalClose = () => {
    logout();
    setShowSessionExpired(false);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (recurringOption === '') {
      setMessage('Please select whether this budget is recurring monthly.');
      return;
    }

    if (category === '') {
      setMessage('Please select a category.');
      return;
    }

    if (category === 'Custom' && !customCategory.trim()) {
      setMessage('Please enter a custom category name.');
      return;
    }

    if (recurringOption === 'no' && !assignedMonth) {
      setMessage('Please assign a month for non-recurring budgets.');
      return;
    }

    if (isNaN(parseFloat(amount))) {
      setMessage('Please enter a valid amount.');
      return;
    }

    const selectedCategory = category === 'Custom' ? 'custom' : category.toLowerCase();

    const dateForBudget =
      recurringOption === 'no'
        ? `${assignedMonth}-15`
        : `${getCurrentMonth()}-15`;

    const data = {
      date: dateForBudget,
      amount: parseFloat(amount),
      category: selectedCategory,
      custom_category: category === 'Custom' ? customCategory : '',
      recurring_monthly: recurringOption,
    };

    try {
      const res = await authFetch(
        '/api/budget/add/',
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
        if (onSuccess) onSuccess();
        setTimeout(() => onClose(), 1500);
      } else {
        let errorMsg = 'Unknown error occurred';
        try {
          const errData = await res.json();
          errorMsg = errData.detail || JSON.stringify(errData);
        } catch {
          errorMsg = res.statusText;
        }
        setMessage(`Error: ${errorMsg}`);
      }
    } catch (error) {
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

