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
        date: `${date}-15`,
        amount: parseFloat(amount),
        savings_name: SavingsName,
      };
    
      try {
        const res = await authFetch(
          '/api/general-savings/add/',
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
          setTimeout(() => {
            setMessage('');
            onSuccess();
            onClose();
          }, 1000);
        } else {
          let errorMsg = 'Failed to add savings entry.';
          try {
            const errData = await res.json();
            errorMsg = errData.detail || errorMsg;
          } catch {
          }
          setMessage(`Error: ${errorMsg}`);
        }
      } catch (error) {
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
