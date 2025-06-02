import React, { useState, useEffect } from 'react';
import '../CSS/UpdateIncomeModal.css';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';


// Function to generate an array of all months for the current year in 'YYYY-MM' format
const getAllMonths = () => {
  const months = [];               // Initialize empty array to hold months
  const now = new Date();          // Get current date
  const year = now.getFullYear();  // Extract current year (e.g., 2025)

  // Loop through all 12 months (1 to 12)
  for (let m = 1; m <= 12; m++) {
    // Format month as 'YYYY-MM', padding month with leading zero if needed
    months.push(`${year}-${String(m).padStart(2, '0')}`);
  }

  return months;  // Return array of months like ['2025-01', '2025-02', ..., '2025-12']
};


// React component for selecting a month from a dropdown
const MonthSelector = ({ selectedMonth, onChange }) => {
  const months = getAllMonths(); // Get array of months for current year

  return (
    <select value={selectedMonth} onChange={onChange}>
      {/* Default option prompting user to select a month */}
      <option value="">-- Select Month --</option>

      {/* Map each month string to an option element */}
      {months.map((month) => (
        <option key={month} value={month}>
          {/* Display month in short format with year, e.g. 'Jan 2025' */}
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


    useEffect(() => {
      if (message) {
        const timer = setTimeout(() => setMessage(''), 3000);
        return () => clearTimeout(timer);
      }
    }, [message]);


  /* ────────────────────────────────
     FETCH BUDGET ENTRIES 
  ──────────────────────────────── */

  useEffect(() => {
    if (!selectedMonth || entryType !== 'budget') return;
  
    const fetchBudgetEntries = async () => {
      setLoading(true);
      setMessage('');
  
      try {
        const res = await authFetch(
          `/budgets/?month=${selectedMonth}`,
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
  

  /* ────────────────────────────────
     FETCH EXPENSE ENTRIES
  ──────────────────────────────── */

  useEffect(() => {
    if (!selectedMonth || entryType !== 'expense') return;
  
    const fetchExpenseEntries = async () => {
      setLoading(true);
      setMessage('');
  
      try {
        const res = await authFetch(
          `/expenses/?month=${selectedMonth}`,
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
  


  /* ────────────────────────────────
     EDIT AND UPDATE ENTRY AMOUNT
  ──────────────────────────────── */

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
      entryType === 'budget' ? `/budgets/${id}/` : `/expenses/${id}/`;

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


  /* ────────────────────────────────
    DELETE EXPENSE AND BUDGET LOGIC
   ──────────────────────────────── */

const handleDelete = async (id) => {
  try {
    const endpoint =
      entryType === 'budget' ? `/budgets/${id}/` : `/expenses/${id}/`;

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
