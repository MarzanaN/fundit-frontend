import React, { useState, useEffect } from 'react';
import '../CSS/UpdateIncomeModal.css'; 
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const getAllMonths = () => {
  const months = [];
  const now = new Date();
  const year = now.getFullYear();
  for (let m = 1; m <= 12; m++) {
    months.push(`${year}-${String(m).padStart(2, '0')}`);
  }
  return months;
};

function UpdateIncomeModal({ onClose, onSuccess }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatedAmount, setUpdatedAmount] = useState('');
  const [confirmationId, setConfirmationId] = useState(null);
  const [message, setMessage] = useState('');
  const { currencySymbol } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { user, refreshToken } = useAuth();
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


  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);



  useEffect(() => {
    if (!selectedMonth) {
      setIncomeEntries([]);
      return;
    }
  
    const fetchIncome = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await authFetch(
          `/api/income/?month=${selectedMonth}`,
          { method: 'GET' },
          refreshToken,
          handleSessionExpired
        );
  
        if (res.ok) {
          const data = await res.json();
          setIncomeEntries(data);
        } else {
          const errData = await res.json();
          setMessage(`Failed to fetch income entries: ${errData.detail || 'Unknown error'}`);
          setIncomeEntries([]);
        }
      } catch (error) {
        setMessage('Network error while fetching income.');
        setIncomeEntries([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchIncome();
  }, [selectedMonth, refreshToken]);
  

  const handleEdit = (id, currentAmount) => {
    if (editingId === id) {
      setEditingId(null);
      setUpdatedAmount('');
    } else {
      setEditingId(id);
      setUpdatedAmount(currentAmount);
      setMessage('');
    }
  };

  const handleUpdate = async (id) => {
    if (updatedAmount === '' || isNaN(updatedAmount)) {
      setMessage('Please enter a valid amount.');
      return;
    }
  
    try {
      const res = await authFetch(
        `/api/income/${id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: parseFloat(updatedAmount) }),
        },
        refreshToken,
        handleSessionExpired
      );
  
      if (res.ok) {
        setMessage('Income updated successfully!');
        onSuccess();  
        setEditingId(null);
        setIncomeEntries((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, amount: parseFloat(updatedAmount) } : entry
          )
        );
      } else {
        const errData = await res.json();
        setMessage(`Error updating income: ${errData.detail || 'Unknown error'}`);
      }
    } catch {
      setMessage('Network error while updating income.');
    }
  };
  

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(
        `/api/income/${id}/`,
        {
          method: 'DELETE',
        },
        refreshToken,
        handleSessionExpired
      );
  
      if (res.ok) {
        setMessage('Income deleted successfully!');
        onSuccess();  
        setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));
        setConfirmationId(null);
      } else {
        const errData = await res.json();
        setMessage(`Error deleting income: ${errData.detail || 'Unknown error'}`);
      }
    } catch {
      setMessage('Network error while deleting income.');
    }
  };
  

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${selectedMonth ? 'expanded' : 'tall'}`}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Update Income Entry</h2>

        <label>Select Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">-- Select Month --</option>
          {getAllMonths().map((month) => (
            <option key={month} value={month}>
              {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>

        {loading && <p>Loading income entries...</p>}

        {selectedMonth && !loading && (
          <>
            {incomeEntries.length === 0 ? (
              <p>No income entries for this month.</p>
            ) : (
              <>
                <div className="entry-headers">
                  <span>Edit</span>
                  <span>Category</span>
                  <span>Amount</span>
                  <span>Delete</span>
                </div>

                <div className="income-list">
                  {incomeEntries.map((entry) => (
                    <div key={entry.id} className="income-entry">
                      <button
                        className="icon-btn-edit"
                        onClick={() => handleEdit(entry.id, entry.amount)}
                        title="Edit amount"
                      >
                        <FiEdit3 />
                      </button>

                      <div className="category-container">
                        <span className="category-label">
                          {entry.category === 'custom'
                            ? entry.custom_category.charAt(0).toUpperCase() + entry.custom_category.slice(1).toLowerCase()
                            : entry.category.charAt(0).toUpperCase() + entry.category.slice(1).toLowerCase()}
                        </span>
                        {entry.recurring_monthly === 'yes' && (
                          <span className="recurring-label" title="This income recurs monthly">
                            🔁 Recurring
                          </span>
                        )}
                      </div>

                      {editingId === entry.id ? (
                        <div className="edit-block">
                          <input
                            type="number"
                            value={updatedAmount}
                            onChange={(e) => setUpdatedAmount(e.target.value)}
                            className="edit-input"
                          />
                          <button
                            className="update-entry-btn"
                            onClick={() => handleUpdate(entry.id)}
                          >
                            Update
                          </button>
                        </div>
                      ) : (
                        <span className="amount-label">{currencySymbol}{entry.amount}</span>
                      )}

                      <button
                        className="icon-btn-trash"
                        onClick={() => setConfirmationId(entry.id)}
                        title="Delete entry"
                      >
                        <FiTrash2 />
                      </button>

                      {confirmationId === entry.id && (
                        <div className="confirmation-overlay">
                          <div className="confirmation-box">
                            <p>Are you sure you want to delete this entry?</p>
                            <div className="confirmation-buttons row">
                              <button onClick={() => handleDelete(entry.id)}>Yes</button>
                              <button onClick={() => setConfirmationId(null)}>No</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {message && <p className="status-message">{message}</p>}
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

export default UpdateIncomeModal;
