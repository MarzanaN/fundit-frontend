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

const MonthSelector = ({ selectedMonth, onChange }) => {
  const months = getAllMonths();
  return (
    <select value={selectedMonth} onChange={onChange}>
      <option value="">-- Select Month --</option>
      {months.map((month) => (
        <option key={month} value={month}>
          {new Date(`${month}-01`).toLocaleString('default', {
            month: 'short',
            year: 'numeric',
          })}
        </option>
      ))}
    </select>
  );
};

function UpdateExpenseModal({ onClose, onSuccess }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatedAmount, setUpdatedAmount] = useState('');
  const [confirmationId, setConfirmationId] = useState(null);
  const [message, setMessage] = useState('');
  const [entryType, setEntryType] = useState('expense'); 
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
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  useEffect(() => {
    if (!selectedMonth || entryType !== 'budget') return;
  
    const fetchBudgetEntries = async () => {
      setLoading(true);
      setMessage('');
  
      try {
        const res = await authFetch(
          `/api/budgets/?month=${selectedMonth}`,
          { method: 'GET' },
          refreshToken,
          handleSessionExpired
        );
  
        if (res.ok) {
          const data = await res.json();
          setExpenseEntries(data);
        } else {
          setMessage('Failed to fetch budget entries.');
          setExpenseEntries([]);
        }
      } catch {
        setMessage('Network error while fetching budget entries.');
        setExpenseEntries([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchBudgetEntries();
  }, [selectedMonth, entryType, refreshToken]);
  

  useEffect(() => {
    if (!selectedMonth || entryType !== 'expense') return;
  
    const fetchExpenseEntries = async () => {
      setLoading(true);
      setMessage('');
  
      try {
        const res = await authFetch(
          `/api/expenses/?month=${selectedMonth}`,
          { method: 'GET' },
          refreshToken,
          handleSessionExpired
        );
  
        if (res.ok) {
          const data = await res.json();
          setExpenseEntries(data);
        } else {
          setMessage('Failed to fetch expense entries.');
          setExpenseEntries([]);
        }
      } catch {
        setMessage('Network error while fetching expense entries.');
        setExpenseEntries([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchExpenseEntries();
  }, [selectedMonth, entryType, refreshToken]);
  


const handleEdit = (id, currentAmount) => {
  if (editingId === id) {
    setEditingId(null);
    setUpdatedAmount('');
  } else {
    setEditingId(id);
    setUpdatedAmount(currentAmount != null ? String(currentAmount) : '');
    setMessage('');
  }
};


const handleUpdate = async (id) => {
  if (updatedAmount === '' || isNaN(updatedAmount)) {
    setMessage('Please enter a valid amount.');
    return;
  }

  try {
    const endpoint =
      entryType === 'budget' ? `/api/budgets/${id}/` : `/api/expenses/${id}/`;

    const res = await authFetch(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify({
          amount: parseFloat(updatedAmount),
        }),
      },
      refreshToken,
      handleSessionExpired
    );

    if (res.ok) {
      setMessage('Expense updated successfully!');
      if (onSuccess) onSuccess();
      setEditingId(null);
      setExpenseEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, amount: parseFloat(updatedAmount) }
            : entry
        )
      );
    } else {
      const errData = await res.json();
      setMessage(`Error updating expense: ${errData.detail || 'Unknown error'}`);
    }
  } catch {
    setMessage('Network error while updating expense.');
  }
};


const handleDelete = async (id) => {
  try {
    const endpoint =
      entryType === 'budget' ? `/api/budgets/${id}/` : `/api/expenses/${id}/`;

    const res = await authFetch(
      endpoint,
      {
        method: 'DELETE',
      },
      refreshToken,
      handleSessionExpired
    );

    if (res.ok) {
      setMessage('Expense deleted successfully!');
      if (onSuccess) onSuccess();
      setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));
      setConfirmationId(null);
    } else {
      const errData = await res.json();
      setMessage(`Error deleting expense: ${errData.detail || 'Unknown error'}`);
    }
  } catch {
    setMessage('Network error while deleting expense.');
  }
};


  return (
    <div className="modal-overlay">
      <div className={`modal-content ${selectedMonth ? 'expanded' : 'tall'}`}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Update Entry</h2>

        <label>Entry Type:</label>
        <select
          value={entryType}
          onChange={(e) => {
            setEntryType(e.target.value);
            setSelectedMonth('');
            setExpenseEntries([]);
            setEditingId(null);
            setMessage('');
          }}
        >
          <option value="">-- Select Entry Type --</option>
          <option value="expense">Expense</option>
          <option value="budget">Budget</option>
        </select>

        {entryType && (
          <>
            <label>Select Month:</label>
            <MonthSelector
              selectedMonth={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setEditingId(null);
                setMessage('');
              }}
            />
          </>
        )}

        {loading && <p>Loading entries...</p>}

        {selectedMonth && !loading && (
          <>
            <div className="entry-headers">
              <span>Edit</span>
              <span>Category</span>
              <span>{entryType === 'budget' ? 'Budget Amount' : 'Amount'}</span>
              <span>Delete</span>
            </div>

            <div className="income-list">
            {expenseEntries.length === 0 && <p>No entries found for this month.</p>}

            {expenseEntries.map((entry) => (
              <div key={entry.id} className="income-entry">
                <button
                  className="icon-btn-edit"
                  onClick={() => handleEdit(entry.id, entry.amount)}
                >
                  <FiEdit3 />
                </button>

                <span className="category-label">
                  {(entry.custom_category || entry.category || entry.category_name)
                    ?.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>

                {editingId === entry.id ? (
                  <div className="edit-block">
                    <input
                      type="number"
                      value={updatedAmount ?? ''}
                      onChange={(e) => setUpdatedAmount(e.target.value)}
                      className="edit-input"
                    />

                    <button className="update-entry-btn" onClick={() => handleUpdate(entry.id)}>
                      Update
                    </button>
                  </div>
                ) : (
                  <span className="amount-label">
                    {currencySymbol}{entry.amount}
                  </span>
                )}

                <button className="icon-btn-trash" onClick={() => setConfirmationId(entry.id)}>
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

export default UpdateExpenseModal;
