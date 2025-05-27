import React, { useState } from 'react';
import '../CSS/AddIncomeModal.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // zero-padded
    return `${year}-${month}`;
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
    
      const data = {
        category: category.toLowerCase(), 
        goal_name: goalName,
        goal_amount: parseFloat(amount),
        current_amount: 0.00,
        deadline_ongoing: isOngoing, 
        deadline: isOngoing === 'no' ? `${date}-15` : null,
      };
    
      const token = localStorage.getItem('accessToken');
    
      if (!token) {
        setMessage('You must be signed in to add a goal.');
        return;
      }
    
      try {
        const res = await authFetch(
          '/api/repayments-goal/add/',
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
          setMessage('Repayment Goal added successfully!');
          setTimeout(() => onClose(), 1500);
          onSuccess();
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

