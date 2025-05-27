import React, { useState, useEffect } from 'react';
import '../CSS/Goals.css';
import SavingsGoalsModal from './SavingsGoalsModal';
import RepaymentGoalsModal from './RepaymentGoalsModal';
import CreateSavingsModal from './CreateSavingsModal';
import { FiEdit3, FiPlus, FiClock, FiTrash2 } from "react-icons/fi";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const SavingsCategories = [
    { value: "", label: "Select Category" },
    { value: "emergency fund", label: "🛟 Emergency Fund" },
    { value: "travel / holiday", label: "✈️ Travel / Holiday" },
    { value: "new home", label: "🏡 New Home" },
    { value: "home renovation", label: "🛠️ Home Renovation" },
    { value: "car / vehicle", label: "🚗 Car / Vehicle" },
    { value: "education / courses", label: "🎓 Education / Courses" },
    { value: "eedding / event", label: "💍 Wedding / Event" },
    { value: "tech / gadgets", label: "💻 Tech / Gadgets" },
    { value: "christmas / gifts", label: "🎄 Christmas / Gifts" },
    { value: "special event", label: "🎉 Special Event" },
    { value: "gifts", label: "🎁 Gifts" },
    { value: "rainy day fund", label: "🌧️ Rainy Day Fund" },
    { value: "investment fund", label: "📈 Investment Fund" },
    { value: "luxury purchase", label: "🛍️ Luxury Purchase" },
    { value: "other", label: "🗂️ Other" },
  ];
  
  const RepaymentCategories = [
    { value: "", label: "Select Category" },
    { value: "credit card", label: "💳 Credit Card" },
    { value: "loan", label: "🏦 Loan" },
    { value: "student loan", label: "🎓 Student Loan" },
    { value: "mortgage", label: "🏠 Mortgage" },
    { value: "car finance", label: "🚗 Car Finance" },
    { value: "buy now pay later", label: "🛍️ Buy Now Pay Later" },
    { value: "medical bills", label: "💊 Medical Bills" },
    { value: "overdraft", label: "📉 Overdraft" },
    { value: "utility arrears", label: "💡 Utility Arrears" },
    { value: "tax debt", label: "📄 Tax Debt" },
    { value: "family or friend loan", label: "👪 Family or Friend Loan" },
    { value: "business loan", label: "💼 Business Loan" },
    { value: "other", label: "🗂️ Other" },
  ];

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    return `${year}-${month}`;
  };
  

function calculateDuration(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  return `${months} month${months !== 1 ? "s" : ""}`;
}


function Goals() {
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [goalType, setGoalType] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({});
  const [showDeadlineSelect, setShowDeadlineSelect] = useState(false);
  const [isOngoing, setIsOngoing] = useState('yes');
  const [date, setDate] = useState(getCurrentMonth());
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false); 
  const [selectedSavings, setSelectedSavings] = useState(null);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [actionType, setActionType] = useState("add");
  const [goals, setGoals] = useState([]);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [savings, setSavings] = useState([]);
  const { refreshToken } = useAuth();
  const [generalSavings, setGeneralSavings] = useState([]);
  const [savingsEntries, setSavingsEntries] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [repaymentGoals, setRepaymentGoals] = useState([]);
  const [logHistory, setLogHistory] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const { currencySymbol } = useAuth();
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
  
  

  useEffect(() => {
    authFetch('/api/protected', {}, refreshToken, handleSessionExpired)
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
  
    if (!selectedSavings || !amount || isNaN(amount)) {
      setMessage("Please enter a valid amount");
      return;
    }
  
    const id = selectedSavings.id;
    const type = selectedSavings.type;
    console.log("Entry type:", type, "ID:", id);
  
    const urls = {
      savings: `/api/general-savings/${id}/update_amount/`,
      "savings-goal": `/api/savings-goals/${id}/update_amount/`,
      "repayment-goal": `/api/repayment-goals/${id}/update_amount/`,
    };
  
    if (!urls[type]) {
      console.log("Invalid entry type:", type);
      setMessage("Invalid entry type");
      return;
    }
  
    try {
      const response = await authFetch(
        urls[type],
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,
            amount: parseFloat(amount),
            date: date,
          }),
        },
        refreshToken,
        handleSessionExpired
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to update amount");
        return;
      }
  
      const parsedAmount = parseFloat(amount);
      const delta = actionType === "add" ? parsedAmount : -parsedAmount;
  
      if (type === "savings") {
        setGeneralSavings((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, amount: item.amount + delta } : item
          )
        );
      } else if (type === "savings-goal") {
        setSavingsGoals((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, current_amount: item.current_amount + delta }
              : item
          )
        );
      } else if (type === "repayment-goal") {
        setRepaymentGoals((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, current_amount: item.current_amount + delta }
              : item
          )
        );
      }
  
      setMessage(
        `Amount ${actionType === "add" ? "added" : "removed"} successfully.`
      );
      setIsSuccess(true);
  
      const refreshAllGoals = async () => {
        await fetchSavings();
        await fetchGoals();
      };
  
      await refreshAllGoals();
  
      setTimeout(() => setShowAmountModal(false), 1500);
    } catch (err) {
      console.error("Network error:", err);
      setMessage("An error occurred. Please try again.");
      setIsSuccess(false);
    }
  };
  


  const handleLogHistory = async (entry) => {
    if (!entry) return;
  
    setSelectedSavings(entry);
    setShowHistoryModal(true);
  
    try {
      let response;
  
      if (entry.type === 'savings') {
        response = await authFetch(
          `/api/general-savings/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else if (entry.type === 'savings-goal') {
        response = await authFetch(
          `/api/savings-goals/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else if (entry.type === 'repayment-goal') {
        response = await authFetch(
          `/api/repayment-goals/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else {
        setLogHistory([]);
        return;
      }
  
      if (!response.ok) {
        setLogHistory([]);
        return;
      }
  
      const data = await response.json();
  
      if (Array.isArray(data)) {
        setLogHistory(data);
      } else if (data.history && Array.isArray(data.history)) {
        setLogHistory(data.history);
      } else if (typeof data === 'object') {
        setLogHistory([data]);
      } else {
        setLogHistory([]);
      }
    } catch {
      setLogHistory([]);
    }
  };
  

  const handleDelete = async (entry) => {
    try {
      let endpoint = '';
  
      switch (entry.type) {
        case 'savings':
          endpoint = `/api/general-savings/${entry.id}/`;
          break;
        case 'savings-goal':
          endpoint = `/api/savings-goals/${entry.id}/`;
          break;
        case 'repayment-goal':
          endpoint = `/api/repayment-goals/${entry.id}/`;
          break;
        default:
          setDeleteMessage('Invalid entry type for deletion.');
          return;
      }
  
      const res = await authFetch(
        endpoint,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        refreshToken,
        handleSessionExpired
      );
  
      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch (e) {
        }
        setDeleteMessage(`Error deleting entry: ${errData.detail || 'Unknown error'}`);
        return;
      }
  
      setDeleteMessage('Entry deleted successfully!');
  
      if (entry.type === 'savings') {
        setSavingsEntries(prev => prev.filter(e => e.id !== entry.id));
      } else if (entry.type === 'savings-goal') {
        setSavingsGoals(prev => prev.filter(e => e.id !== entry.id));
      } else if (entry.type === 'repayment-goal') {
        setRepaymentGoals(prev => prev.filter(e => e.id !== entry.id));
      }
  
      await fetchSavings();
      await fetchGoals();
  
      setTimeout(() => {
        setItemToDelete(null);
        setDeleteMessage('');
      }, 2000);
  
    } catch (error) {
      setDeleteMessage('Network error while deleting entry.');
    }
  };
  
  
  useEffect(() => {
    if (!refreshToken) return; 
  
    const controller = new AbortController();
  
    const fetchGoalsData = async () => {
      try {
        const [savingsRes, savingsGoalsRes, repaymentGoalsRes] = await Promise.all([
          authFetch('/api/general-savings/', { signal: controller.signal }, refreshToken, handleSessionExpired),
          authFetch('/api/savings-goals/', { signal: controller.signal }, refreshToken, handleSessionExpired),
          authFetch('/api/repayment-goals/', { signal: controller.signal }, refreshToken, handleSessionExpired),
        ]);
  
        if (!savingsRes.ok || !savingsGoalsRes.ok || !repaymentGoalsRes.ok) {
          throw new Error('Failed to fetch goals data');
        }
  
        const [savingsData, savingsGoalsData, repaymentGoalsData] = await Promise.all([
          savingsRes.json(),
          savingsGoalsRes.json(),
          repaymentGoalsRes.json(),
        ]);
  
        setSavings(savingsData.map(item => ({ ...item, type: 'savings' })));
        setSavingsGoals(savingsGoalsData.map(item => ({ ...item, type: 'savings-goal' })));
        setRepaymentGoals(repaymentGoalsData.map(item => ({ ...item, type: 'repayment-goal' })));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching goals data:', error);
          setSavings([]);
          setSavingsGoals([]);
          setRepaymentGoals([]);
        }
      }
    };
  
    fetchGoalsData();
  
    return () => {
      controller.abort();
    };
  }, [refreshToken]);
  
  
  const handleAmountModal = (entry) => {
    if (!entry.type) {
      console.error("Invalid entry type:", entry.type);
      return;
    }
    setSelectedSavings(entry);
    setAmount("");
    setActionType("add");
    setDate(getCurrentMonth());
    setShowAmountModal(true);
    setMessage("");
  };
  

  const handleEdit = (entry) => {
    setEditingGoal(entry);
  
    if (entry.category && SavingsCategories.some(cat => cat.value === entry.category)) {
      setGoalType('savings'); 
    } else {
      setGoalType('repayment');
    }
  
    setFormData({
      goalName: entry.goalName,
      category: entry.category,
      amount: entry.amount,
      current: entry.current,
      deadline: entry.deadline,
      amendDeadline: 'no',
      selectedMonth: ''
    });
    setIsOngoing('yes');
    setDate(getCurrentMonth());
    setShowDeadlineSelect(false);
    setMessage('');
  };
  

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'amendDeadline') {
      setShowDeadlineSelect(value === 'yes');
    }
  };


  const handleUpdate = async () => {
    if (!editingGoal) {
      console.warn('No editingGoal set');
      return;
    }
  
    const goalId = editingGoal.id || editingGoal._id;
  
    const url =
      goalType === 'savings'
        ? `/api/savings-goals/${goalId}/`
        : `/api/repayment-goals/${goalId}/`;
  
    const payload = {
      goal_name: formData.goalName,
      category: formData.category.toLowerCase(),
      goal_amount: Number(formData.amount),
      current_amount: Number(formData.current),
    };
  
    if (formData.amendDeadline === 'yes') {
      payload.deadline_ongoing = isOngoing;
      if (isOngoing === 'no') {
        payload.deadline = `${date}-15`;
      } else {
        payload.deadline = null;
      }
    }
  
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setMessage('Error: You must be logged in to update goals.');
      setShowConfirmationPopup(true);
      setTimeout(() => setShowConfirmationPopup(false), 3000);
      return;
    }
  
    try {
      const response = await authFetch(
        url,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        accessToken, 
        handleSessionExpired
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update goal');
      }
  
      const updatedGoal = await response.json();
      setEditingGoal(null);
      setMessage('Goal updated successfully!');
      setShowConfirmationPopup(true);
  
      await fetchSavings();
      await fetchGoals();
  
      setTimeout(() => setShowConfirmationPopup(false), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setShowConfirmationPopup(true);
      setTimeout(() => setShowConfirmationPopup(false), 3000);
    }
  };
  
  
  const handleCancelEdit = () => {
    setEditingGoal(null);
    setFormData({});
    setShowDeadlineSelect(false);
    setIsOngoing('yes');
    setDate(getCurrentMonth());
  };


  const fetchSavings = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
  
    try {
      
      const res = await authFetch('/api/general-savings/', { method: 'GET' }, token, handleSessionExpired);
  
      if (!res.ok) throw new Error('Failed to fetch savings');
  
      const data = await res.json();
  
      const processed = data.map(entry => ({
        id: entry.id,
        name: entry.savings_name,
        amount: parseFloat(entry.amount),
        date: entry.date,
        duration: `${calculateDuration(entry.date)}`,
      }));
  
      setSavings(processed);
    } catch (error) {
      console.error('Error fetching savings:', error);
    }
  };
  

    const fetchGoals = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return; 
    
      try {
        const [savingsRes, repaymentRes] = await Promise.all([
          authFetch("/api/savings-goals/", { method: 'GET' }, token, handleSessionExpired),
          authFetch("/api/repayment-goals/", { method: 'GET' }, token, handleSessionExpired),
        ]);
    
        if (!savingsRes.ok || !repaymentRes.ok) {
          throw new Error("One or both API requests failed");
        }
    
        const [savingsData, repaymentData] = await Promise.all([
          savingsRes.json(),
          repaymentRes.json(),
        ]);
    
        const transformGoal = (goal) => {
          const isOngoing = goal.deadline_ongoing === "yes";
        
          let deadlineDisplay = "Ongoing";
          let timeLeftDisplay = "Ongoing";
        
          if (!isOngoing && goal.deadline) {
            const dateObj = new Date(goal.deadline);
            const mmYYYY = `${String(dateObj.getMonth() + 1).padStart(2, "0")}-${dateObj.getFullYear()}`;
            deadlineDisplay = mmYYYY;
        
            const now = new Date();
            const deadlineDate = new Date(goal.deadline);

            let monthsDiff = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
        
            const absMonths = Math.abs(monthsDiff);
        
            if (monthsDiff >= 0) {
              timeLeftDisplay = `${absMonths} month${absMonths !== 1 ? "s" : ""} remaining`;
            } else {
              timeLeftDisplay = `${absMonths} month${absMonths !== 1 ? "s" : ""} overdue`;
            }
          }
        
          return {
            id: goal.id,
            goalName: goal.goal_name?.charAt(0).toUpperCase() + goal.goal_name?.slice(1),
            category: goal.category,
            amount: Number(goal.goal_amount) || 0,
            current: Number(goal.current_amount) || 0,
            deadline: deadlineDisplay,
            timeLeft: isOngoing ? "Ongoing" : timeLeftDisplay,
          };
        };
        
        setSavingsGoals(savingsData.map(transformGoal));
        setRepaymentGoals(repaymentData.map(transformGoal));
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };
    
    useEffect(() => {
      fetchSavings();
      fetchGoals();
    }, [refreshToken]);
    

  const getSavingsEmoji = (category) => {
    switch (category) {
        case 'Emergency fund': return '🛟';
        case 'travel / holiday': return '✈️';
        case 'new home': return '🏡';
        case 'home renovation': return '🛠️';
        case 'car / vehicle': return '🚗';
        case 'education / courses': return '🎓';
        case 'wedding / event': return '💍';
        case 'tech / gadgets': return '💻';
        case 'christmas / gifts': return '🎄';
        case 'special event': return '🎉';
        case 'gifts': return '🎁';
        case 'rainy day fund': return '🌧️';
        case 'investment fund': return '📈';
        case 'luxury purchase': return '🛍️';
        case 'other': return '🗂️';
    }
  };

  const getRepaymentEmoji = (category) => {
    switch (category) {
      case 'credit card': return '💳';
      case 'loan': return '🏦';
      case 'student loan': return '🎓';
      case 'mortgage': return '🏠';
      case 'car finance': return '🚗';
      case 'buy now pay later': return '🛍️';
      case 'medical bills': return '💊';
      case 'overdraft': return '📉';
      case 'utility arrears': return '💡';
      case 'tax debt': return '📄';
      case 'family or friend loan': return '👪';
      case 'business loan': return '💼';
      case 'other': return '🗂️';
      
      default: return '💰';
    }
  };
  
  
  return (
    <div className="Goals-container">
      <h1>Savings & Repayments</h1>

      <div className="create-goal-container">
            <div className="add-goal-container">
                <p className="click-to-add-text">
                Click below to create a general savings entry
                </p>
                <button className="add-goal-button" onClick={() => setIsGeneralModalOpen(true)}>
                + General Savings Entry
                </button>
            </div>

            <div className="add-goal-container">
                <p className="click-to-add-text">Click below to create a savings goal</p>
                <button className="add-goal-button" onClick={() => setIsSavingsModalOpen(true)}>
                + Create Savings Goal
                </button>
            </div>

            <div className="add-goal-container">
                <p className="click-to-add-text">Click below to create a repayment goal</p>
                <button className="add-goal-button" onClick={() => setIsRepaymentModalOpen(true)}>
                + Create Repayment Goal
                </button>
            </div>
        </div>


  {isSavingsModalOpen && (
    <SavingsGoalsModal 
      onClose={() => setIsSavingsModalOpen(false)} 
      onSuccess={() => {
        setIsSavingsModalOpen(false);
        fetchSavings();
        fetchGoals();
      }}
    />
  )}
  {isRepaymentModalOpen && (
    <RepaymentGoalsModal 
      onClose={() => setIsRepaymentModalOpen(false)} 
      onSuccess={() => {
        setIsRepaymentModalOpen(false);
        fetchSavings();
        fetchGoals(); 
      }}
    />
  )}
  {isGeneralModalOpen && (
    <CreateSavingsModal 
      onClose={() => setIsGeneralModalOpen(false)} 
      onSuccess={() => {
        setIsGeneralModalOpen(false);
        fetchSavings();
        fetchGoals(); 
      }}
    />
  )}

{showSessionExpired && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Session Expired</h3>
      <p className='expired'>Your session has expired. Please log in again.</p>
      <button className='yes-button'onClick={handleModalClose}>Okay</button>
    </div>
  </div>
)}

      <div className="goals-grid">

      <section className="general-savings-section">
      <span className="emoji-icon">💷</span>
      <h3 className="repayment-goals-heading">General Savings</h3>
      <div className="scroll-wrapper">
        <div className="savings-tracker-details scroll-content">
        {savings.length === 0 && <p className="no-data-message">No Saving Entries found</p>}
          {savings.map((entry, index) => (
            <div className="savings-goal-group" key={entry.id || index}>
              <h4 className="savings-goal-heading">{entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}</h4>
              <h5 className="savings-goal-amount">Saved Amount: {currencySymbol}{entry.amount.toLocaleString()}</h5>
              <h5 className="savings-details-general">Duration: {entry.duration}</h5>
              <div className="update-action">
                <button className="update-icon-btn" 
                      onClick={() => handleAmountModal({ ...entry, type: "savings" })}
                      >
                  <FiPlus />
                </button>
                <button className="update-icon-btn" onClick={() => handleLogHistory({ ...entry, type: "savings" })}>
                  <FiClock />
                </button>
                <button
                  className="update-icon-btn"
                  onClick={() => {
                    setDeleteMessage('');
                    setItemToDelete({ ...entry, type: "savings" }); 
                  }}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>


<section className="saving-goals-section">
  <span className="emoji-icon">💰</span>
  <h3 className="saving-goals-heading">Savings Goals</h3>
  <div className="scroll-wrapper">
    <div className="savings-tracker-details scroll-content">
    {savingsGoals.length === 0 && <p className="no-data-message">No Savings goals found</p>}
      {savingsGoals.map((item, index) => {
                  const parseCurrency = (value) => {
                    if (!value) return 0;
                    return Number(String(value).replace(/[^0-9.-]+/g,"")) || 0;
                  };
          
                  const amount = parseCurrency(item.amount);
                  const current = parseCurrency(item.current);
                  const percentage = amount === 0 ? 0 : (current / amount) * 100;
                  const outstandingAmount = amount - current;
                  return (
                    <div className="savings-goal-group" key={index}>
                      <h4 className="savings-goal-heading">{getSavingsEmoji(item.category)} {item.category.charAt(0).toUpperCase() + item.category.slice(1)}</h4>
                      <h4 className="savings-goal-name">{item.goalName.charAt(0).toUpperCase() + item.goalName.slice(1)}</h4>
                      <h5 className="savings-goal-amount">Target Amount: {currencySymbol}{amount.toLocaleString()}</h5>
                      <div className="savings-goal-bar-container">
                        <p>Current Amount: {Math.round(percentage)}%</p>
                        <div className="savings-goal-bar">
                          <div
                            className="savings-goal-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: percentage >= 100 ? '#ff4d4f' : '#8e66fc',
                            }}
                          >
                            {currencySymbol}{current.toLocaleString()}
                          </div>
                        </div>
                        <h5 className="savings-details">Outstanding Amount: {currencySymbol}{outstandingAmount.toLocaleString()}</h5>
                        <h5 className="savings-details">Deadline: {item.deadline}</h5>
                        <h5 className="savings-details">
                          {item.timeLeft === "Ongoing"
                            ? "Ongoing"
                            : `${item.timeLeft}`}
                        </h5>
                      </div>
                      <div className="update-action">
                        <button className="update-icon-btn"
                              onClick={() => handleAmountModal({ ...item, type: "savings-goal" })}
                            >
                          <FiPlus />
                        </button>
                        <button className="update-icon-btn" onClick={() => handleLogHistory({ ...item, type: "savings-goal" })}>
                          <FiClock />
                        </button>
                        <button className="update-icon-btn" onClick={() => handleEdit(item)}>
                          <FiEdit3 />
                        </button>
                        <button className="update-icon-btn"
                          onClick={() => {
                            setDeleteMessage(""); 
                            setItemToDelete({ ...item, type: "savings-goal" });
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="repayment-goals-section">
            <span className="emoji-icon">💸</span>
            <h3 className="repayment-goals-heading">Repayment Goals</h3>
            <div className="scroll-wrapper">
              <div className="savings-tracker-details scroll-content">
              {repaymentGoals.length === 0 && <p className="no-data-message">No Repayment goals found</p>}
                {repaymentGoals.map((item, index) => {

                  const parseCurrency = (value) => {
                    if (!value) return 0;
                    return Number(String(value).replace(/[^0-9.-]+/g,"")) || 0;
                  };

                  const amount = parseCurrency(item.amount);
                  const current = parseCurrency(item.current);
                  const percentage = amount === 0 ? 0 : (current / amount) * 100;
                  const outstandingAmount = amount - current;

                  return (
                    <div className="savings-goal-group" key={index}>
                      <h4 className="savings-goal-heading">{getRepaymentEmoji(item.category)} {item.category.charAt(0).toUpperCase() + item.category.slice(1)}</h4>
                      <h4 className="savings-goal-name">{item.goalName}</h4>
                      <h5 className="savings-goal-amount">Repayment Amount: {currencySymbol}{amount.toLocaleString()}</h5>
                      <div className="savings-goal-bar-container">
                        <p>Amount Paid: {Math.round(percentage)}%</p>
                        <div className="savings-goal-bar">
                          <div
                            className="savings-goal-fill"
                            style={{
                              width: `${percentage}%`,
                              minWidth: '10px',
                              backgroundColor: percentage >= 100 ? '#ff4d4f' : '#8e66fc',
                            }}
                          >
                            {currencySymbol}{current.toLocaleString()}
                          </div>
                        </div>
                        <h5 className="savings-details">Outstanding Amount: {currencySymbol}{outstandingAmount.toLocaleString()}</h5>
                        <h5 className="savings-details">Deadline: {item.deadline}</h5>
                        <h5 className="savings-details">
                          {item.timeLeft === "Ongoing"
                            ? "Ongoing"
                            : `${item.timeLeft}`}
                        </h5>
                      </div>
                      <div className="update-action">
                        <button className="update-icon-btn" onClick={() => handleAmountModal({ ...item, type: "repayment-goal" })}>
                          <FiPlus />
                        </button>
                        <button className="update-icon-btn"       
                        onClick={() => handleLogHistory({ ...item, type: "repayment-goal" })}
                        >
                          <FiClock />
                        </button>
                        <button className="update-icon-btn" onClick={() => handleEdit(item)}>
                          <FiEdit3 />
                        </button>
                        <button className="update-icon-btn"
                          onClick={() => {
                            setDeleteMessage("");
                            setItemToDelete({ ...item, type: "repayment-goal" });
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>


          {editingGoal && (
          <div className="edit-overlay">
            <div className="edit-box">
              <div className="edit-section-scrollable">
                <h3>Edit Goal</h3>

                <label>Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {(goalType === 'savings' ? SavingsCategories : RepaymentCategories).map((cat, idx) => (
                    <option key={idx} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.goalName}
                  onChange={(e) => handleChange('goalName', e.target.value)}
                />

                <label>Goal Amount ({currencySymbol})</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseInt(e.target.value))}
                />

                <label>Amount Paid ({currencySymbol})</label>
                <input
                  type="number"
                  value={formData.current}
                  onChange={(e) => handleChange('current', parseInt(e.target.value))}
                />

                <label>Would you like to amend the deadline?</label>
                <select
                  value={formData.amendDeadline}
                  onChange={(e) => handleChange('amendDeadline', e.target.value)}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>

                {showDeadlineSelect && (
                  <>
                    <label>Is this goal deadline ongoing?</label>
                    <select className="deadline-select"
                      value={isOngoing}
                      onChange={(e) => setIsOngoing(e.target.value)}
                      required
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No I want to set a deadline</option>
                    </select>
                  </>
                )}

                {isOngoing === 'no' && (
                  <div className="form-group-deadline">
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

                <div className="confirmation-buttons column">
                  <button onClick={handleUpdate}>Save Update</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}


          {itemToDelete && (
            <div className="delete-confirmation-overlay">
              <div className="delete-confirmation-box">
                <p>
                  Are you sure you want to delete the{" "}
                  <strong>
                    {itemToDelete.goalName || itemToDelete.name || itemToDelete.savingsName}
                  </strong>{" "}
                  entry?
                </p>

                <div className="confirmation-buttons">
                  <button className="yes-button" onClick={() => handleDelete(itemToDelete)}>
                    Yes
                  </button>
                  <button className="no-button" onClick={() => setItemToDelete(null)}>
                    No
                  </button>
                </div>

                {deleteMessage && <div className="delete-done">{deleteMessage}</div>}
              </div>
            </div>
          )}

                {showAmountModal && (
                  <div className="modal-overlay-add">
                    <div className="modal-content-add">
                      <h2>Add or Remove Amount</h2>
                      <form onSubmit={handleSubmit}>
                        <div className="form-group-custom">
                          <h4>{selectedSavings?.goalName || selectedSavings?.name}</h4>
                        </div>

                        <div className="form-group-adding">
                          <label>Date</label>
                          <input
                              type="month"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              onClick={(e) => e.target.showPicker && e.target.showPicker()}
                              required
                              />
                        </div>

                        <div className="form-group-adding">
                          <label>Add or remove amount?</label>
                          <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                            <option value="add">Add</option>
                            <option value="remove">Remove</option>
                          </select>
                        </div>

                        <div className="form-group-adds">
                          <label>{actionType === "add" ? `Add Amount (${currencySymbol})` : `Remove Amount (${currencySymbol})`}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                        </div>

                        <div className="modal-button-add">
                          <button type="submit">{actionType === "add" ? "Add Amount" : "Remove Amount"}</button>
                          <button type="button" onClick={() => setShowAmountModal(false)}>Cancel</button>
                        </div>
                      </form>
                      {message && (
                        <div className={`update-message ${isSuccess ? "success" : "error"}`}>
                          {message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showHistoryModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h2>Log History</h2>
                      <div className="form-group-custom">
                        <h4>{selectedSavings?.goalName || selectedSavings?.name}</h4>
                      </div>
                      <div className="log-history-headers">
                        <strong>Date</strong>
                        <strong>Amount</strong>
                      </div>
                      <div className="scroll-wrapper">
                      <div className="log-history-entries scroll-content">
                        {(!Array.isArray(logHistory) || logHistory.length === 0) && <p>No log history found.</p>}
                        {Array.isArray(logHistory) && logHistory.map((log) => {
                          const dateObj = new Date(log.date);
                          const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

                          const sign = log.action === 'add' ? '+' : log.action === 'remove' ? '-' : '';

                          const amountStyle = {
                            color: log.action === 'add' ? 'green' : log.action === 'remove' ? 'red' : 'inherit'
                          };

                          return (
                            <div key={log.id} className="log-entry">
                              <span>{formattedDate}</span>
                              <span style={amountStyle}>
                                {sign} {currencySymbol}{log.amount ? Number(log.amount).toFixed(2) : '0.00'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      </div>

                      <div className="modal-buttons">
                        <button
                          type="button"
                          onClick={() => setShowHistoryModal(false)}
                          aria-label="Close log history modal"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}


                        {showConfirmationPopup && (
                          <div className="confirmation-overlay">
                            <div className="confirmation-box">
                              <p>{message}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                }

export default Goals;


