import React, { useState} from 'react';
import '../CSS/AddIncomeModal.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  function AddIncomeModal({ onClose, onSuccess }) {
  const [date, setDate] = useState(getCurrentMonth());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth(); 
  const [isRecurring, setIsRecurring] = useState('')
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
  
    if (isRecurring === '') {
      setMessage('Please select whether this income is recurring monthly.');
      return;
    }
  
    const selectedCategory = category === 'Custom' ? 'custom' : category.toLowerCase();
  
    const data = {
      date: `${date}-15`,
      amount: parseFloat(amount),
      category: selectedCategory,
      custom_category: category === 'Custom' ? customCategory : '',
      recurring_monthly: isRecurring,
    };
  
    try {
      const res = await authFetch(
        '/api/income/add/',
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
        onSuccess();
  
        setTimeout(() => {
          onClose();
        }, 1500);
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
