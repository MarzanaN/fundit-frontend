import React, { useState, useEffect } from 'react';
import '../CSS/Goals.css';
import SavingsGoalsModal from './SavingsGoalsModal';
import RepaymentGoalsModal from './RepaymentGoalsModal';
import CreateSavingsModal from './CreateSavingsModal';
import { FiEdit3, FiPlus, FiClock, FiTrash2, FiLoader } from "react-icons/fi";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import { useQueryClient, useQuery } from '@tanstack/react-query';


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


  const getCurrentMonth = () => {
  const now = new Date(); // Get current date and time
  const year = now.getFullYear(); // Extract current year (4 digits)
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Get current month (0-based), add 1, pad to 2 digits
  return `${year}-${month}`; // Return formatted string "YYYY-MM"
};
  

function calculateDuration(startDate) {
  // Convert the startDate string or value to a Date object
  const start = new Date(startDate);
  // Get the current date/time
  const now = new Date();

  // Calculate the difference in months between now and startDate
  // Calculate year difference in months + difference in months of the year
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();

  // Return formatted string with plural 'months' if not exactly 1
  return `${months} month${months !== 1 ? "s" : ""}`;
}


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
  const [setGoals] = useState([]);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [ setSavings] = useState([]);
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
  const [loadingLogHistory, setLoadingLogHistory] = React.useState(false);
  const queryClient = useQueryClient();



  useEffect(() => {
  // Call the protected API endpoint using authFetch with the provided refreshToken
  authFetch(`${API_BASE_URL}/protected`, {}, refreshToken, handleSessionExpired)
    // Parse the response as JSON
    .then(res => res.json())
    // Log the received data to the console
    .then(data => console.log(data));
}, []); // Empty dependency array means this runs once on component mount


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


/* ────────────────────────────────
      GENERAL SAVINGS FETCH DISPLAY 
   ──────────────────────────────── */

  const fetchSavings = async () => {
    // Retrieve access token from local storage for authentication
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No access token'); // Throw error if token missing

    // Make authenticated GET request to savings endpoint
    const res = await authFetch('/general-savings/', { method: 'GET' }, token, handleSessionExpired);
    if (!res.ok) throw new Error('Failed to fetch savings'); // Throw error if response not OK

    // Parse JSON response
    const data = await res.json();

    // Map raw data to formatted savings objects
    return data.map(entry => ({
      id: entry.id,                             // Unique savings entry ID
      name: entry.savings_name,                 // Savings name/title
      amount: parseFloat(entry.amount),        // Amount converted to float number
      date: entry.date,                         // Original date string
      duration: `${calculateDuration(entry.date)}`, // Calculate duration since date
    }));
  };

/* ────────────────────────────────
        GOALS FETCH DISPLAY 
   ──────────────────────────────── */


  const fetchGoals = async () => {
    // Get access token from local storage for authentication
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No access token'); // Throw error if token missing

    // Debug log to confirm token presence when fetching goals
    console.log('Fetching savings goals and repayment goals with token:', token);

    // Fetch savings goals and repayment goals concurrently
    const [savingsRes, repaymentRes] = await Promise.all([
      authFetch('/savings-goals/', { method: 'GET' }, token, handleSessionExpired),
      authFetch('/repayment-goals/', { method: 'GET' }, token, handleSessionExpired),
    ]);
    
    // Check if both responses are OK; throw error if either failed
    if (!savingsRes.ok || !repaymentRes.ok) {
      throw new Error('Failed to fetch goals');
    }

    // Parse JSON responses concurrently
    const [savingsData, repaymentData] = await Promise.all([savingsRes.json(), repaymentRes.json()]);

    // Helper function to transform a single goal object into formatted display data
    const transformGoal = (goal) => {
      const isOngoing = goal.deadline_ongoing === 'yes'; // Check if deadline is ongoing

      // Initialize display values for deadline and time left
      let deadlineDisplay = 'Ongoing';
      let timeLeftDisplay = 'Ongoing';

      // If not ongoing and has a deadline date, calculate formatted deadline and time left
      if (!isOngoing && goal.deadline) {
        const dateObj = new Date(goal.deadline);
        // Format deadline as MM-YYYY
        const mmYYYY = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
        deadlineDisplay = mmYYYY;

        const now = new Date();
        const deadlineDate = new Date(goal.deadline);

        // Calculate months difference between now and deadline
        let monthsDiff = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
        const absMonths = Math.abs(monthsDiff);

        // Format time left string with pluralization and overdue status
        if (monthsDiff >= 0) {
          timeLeftDisplay = `${absMonths} month${absMonths !== 1 ? 's' : ''} remaining`;
        } else {
          timeLeftDisplay = `${absMonths} month${absMonths !== 1 ? 's' : ''} overdue`;
        }
      }

      // Return transformed goal object with formatted fields
      return {
        id: goal.id,
        goalName: goal.goal_name?.charAt(0).toUpperCase() + goal.goal_name?.slice(1), // Capitalize first letter
        category: goal.category,
        amount: Number(goal.goal_amount) || 0,
        current: Number(goal.current_amount) || 0,
        deadline: deadlineDisplay,
        timeLeft: isOngoing ? 'Ongoing' : timeLeftDisplay,
      };
    };

    // Return both savings and repayment goals mapped through the transform function
    return {
      savingsGoals: savingsData.map(transformGoal),
      repaymentGoals: repaymentData.map(transformGoal),
    };
  };


  const {
    data: savings,          // The fetched savings data
    isLoading: loadingSavings,  // Loading state for savings query
    error: errorSavings,        // Error state for savings query
  } = useQuery({
    queryKey: ['savings'],   // Unique key to identify the savings query cache
    queryFn: fetchSavings,   // Function to fetch savings data from API
    staleTime: 5 * 60 * 1000, // Cache duration: 5 minutes before refetch
    retry: 1,                // Retry failed fetch once before erroring out
  });

  const {
    data: goals,             // The fetched goals data
    isLoading: loadingGoals, // Loading state for goals query
    error: errorGoals,       // Error state for goals query
  } = useQuery({
    queryKey: ['goals'],     // Unique key to identify the goals query cache
    queryFn: fetchGoals,     // Function to fetch goals data from API
    staleTime: 5 * 60 * 1000, // Cache duration: 5 minutes before refetch
    retry: 1,                // Retry failed fetch once before erroring out
  });



  /* ────────────────────────────────
      FETCH SAVINGS AND GOALS DATA
  ──────────────────────────────── */
  
  useEffect(() => {
    // Exit early if no refreshToken is available
    if (!refreshToken) return; 

    // Create an AbortController to allow cancelling fetch requests if needed
    const controller = new AbortController();

    // Async function to fetch all goal-related data in parallel
    const fetchGoalsData = async () => {
      try {
        // Fetch savings, savings goals, and repayment goals concurrently
        const [savingsRes, savingsGoalsRes, repaymentGoalsRes] = await Promise.all([
          authFetch(`/general-savings/`, { signal: controller.signal }, refreshToken, handleSessionExpired),
          authFetch(`/savings-goals/`, { signal: controller.signal }, refreshToken, handleSessionExpired),
          authFetch(`/repayment-goals/`, { signal: controller.signal }, refreshToken, handleSessionExpired),
        ]);

        // Check if any of the responses failed
        if (!savingsRes.ok || !savingsGoalsRes.ok || !repaymentGoalsRes.ok) {
          throw new Error('Failed to fetch goals data');
        }

        // Parse all responses as JSON concurrently
        const [savingsData, savingsGoalsData, repaymentGoalsData] = await Promise.all([
          savingsRes.json(),
          savingsGoalsRes.json(),
          repaymentGoalsRes.json(),
        ]);

        // Update state with fetched data, tagging each with a 'type' property
        setSavings(savingsData.map(item => ({ ...item, type: 'savings' })));
        setSavingsGoals(savingsGoalsData.map(item => ({ ...item, type: 'savings-goal' })));
        setRepaymentGoals(repaymentGoalsData.map(item => ({ ...item, type: 'repayment-goal' })));
      } catch (error) {
        // Ignore abort errors, log others and reset states to empty arrays
        if (error.name !== 'AbortError') {
          console.error('Error fetching goals data:', error);
          setSavings([]);
          setSavingsGoals([]);
          setRepaymentGoals([]);
        }
      }
    };

    // Initiate the fetch operation
    fetchGoalsData();

    // Cleanup function to abort ongoing fetches if component unmounts or refreshToken changes
    return () => {
      controller.abort();
    };
  }, [refreshToken]);


  // When the 'goals' object changes, update savingsGoals and repaymentGoals state accordingly
  useEffect(() => {
    if (goals) {
      setSavingsGoals(goals.savingsGoals);
      setRepaymentGoals(goals.repaymentGoals);
    }
  }, [goals]);


  // When the 'savings' data changes, update the general savings state accordingly
  useEffect(() => {
    if (savings) {
      setGeneralSavings(savings); 
    }
  }, [savings]);


/* ────────────────────────────────
   ADD OR REMOVE CURRENT AMOUNT LOGIC ─
   FOR GENERAL SAVINGS, SAVINGS GOALS
   & REPAYMENT GOALS
   ──────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setMessage(""); // Clear any previous messages

    // Validate selected savings and amount inputs
    if (!selectedSavings || !amount || isNaN(amount)) {
      setMessage("Please enter a valid amount"); // Show error if invalid
      return;
    }

    // Extract id and type from selected savings entry
    const id = selectedSavings.id;
    const type = selectedSavings.type;
    console.log("Entry type:", type, "ID:", id);

    // Define API endpoint URLs based on entry type
    const urls = {
      savings: `/general-savings/${id}/update_amount/`,
      "savings-goal": `/savings-goals/${id}/update_amount/`,
      "repayment-goal": `/repayment-goals/${id}/update_amount/`,
    };

    // Check if the entry type matches one of the expected URL keys
    if (!urls[type]) {
      console.log("Invalid entry type:", type);
      setMessage("Invalid entry type"); // Show error if type is invalid
      return;
    }

    try {
      // Make authenticated POST request to update amount endpoint
      const response = await authFetch(
        urls[type],
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,           // 'add' or 'remove' action
            amount: parseFloat(amount),   // Amount to add or remove
            date: date,                   // Date for the update
          }),
        },
        refreshToken,
        handleSessionExpired
      );

      // If response is not OK, parse and display error message
      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to update amount");
        return;
      }

      // Calculate delta: positive for add, negative for remove
      const parsedAmount = parseFloat(amount);
      const delta = actionType === "add" ? parsedAmount : -parsedAmount;

      // Update local state depending on entry type to reflect new amount
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

      // Show success message and mark success state
      setMessage(
        `Amount ${actionType === "add" ? "added" : "removed"} successfully.`
      );
      setIsSuccess(true);

      // Function to refresh relevant cached queries after update
      const refreshAllGoals = async () => {
        await queryClient.invalidateQueries(['savings']); // Refresh savings data
        await queryClient.invalidateQueries(['goals']);   // Refresh goals data
      };

      await refreshAllGoals(); // Wait for cache refresh

      // Close modal after a short delay (1.5 seconds)
      setTimeout(() => setShowAmountModal(false), 1500);
    } catch (err) {
      // Log network errors and show user-friendly message
      console.error("Network error:", err);
      setMessage("An error occurred. Please try again.");
      setIsSuccess(false);
    }
  };


  /* ────────────────────────────────
   HISTORY LOG LOGIC FOR ENTRIES ─
   FOR GENERAL SAVINGS, SAVINGS GOALS
   & REPAYMENT GOALS
   ──────────────────────────────── */

  const handleLogHistory = async (entry) => {
    if (!entry) return; // Exit early if no entry provided

    setSelectedSavings(entry); // Set the currently selected entry for history view
    setShowHistoryModal(true); // Open the history modal
    setLoadingLogHistory(true); // Indicate loading state for fetching history

    try {
      let response;

      // Fetch history data based on the type of entry
      if (entry.type === 'savings') {
        response = await authFetch(
          `/general-savings/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else if (entry.type === 'savings-goal') {
        response = await authFetch(
          `/savings-goals/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else if (entry.type === 'repayment-goal') {
        response = await authFetch(
          `/repayment-goals/${entry.id}/history/`,
          { headers: { 'Content-Type': 'application/json' } },
          refreshToken,
          handleSessionExpired
        );
      } else {
        // If type is unrecognized, clear history and stop loading
        setLogHistory([]);
        setLoadingLogHistory(false);
        return;
      }

      // If response is not OK, clear history and stop loading
      if (!response.ok) {
        setLogHistory([]);
        setLoadingLogHistory(false);
        return;
      }

      // Parse the JSON data from the response
      const data = await response.json();

      // Handle different formats of returned data:
      // - array of history entries
      // - object with history array property
      // - single object representing one history record
      // - fallback to empty array if unrecognized
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
      // On error, clear history data
      setLogHistory([]);
    } finally {
      setLoadingLogHistory(false); // Loading complete regardless of success or failure
    }
  };


  /* ────────────────────────────────
      DELETE ENTRIES LOGIC ─
      FOR GENERAL SAVINGS, SAVINGS GOALS
      & REPAYMENT GOALS
   ──────────────────────────────── */
  
  const handleDelete = async (entry) => {
    console.log('Attempting to delete entry:', entry); // Log entry to delete for debugging

    try {
      let endpoint = '';

      // Determine the API endpoint based on entry type
      switch (entry.type) {
        case 'savings':
          endpoint = `/general-savings/${entry.id}/`;
          break;
        case 'savings-goal':
          endpoint = `/savings-goals/${entry.id}/`;
          break;
        case 'repayment-goal':
          endpoint = `/repayment-goals/${entry.id}/`;
          break;
        default:
          // Handle invalid entry type
          setDeleteMessage('Invalid entry type for deletion.');
          return;
      }

      // Send DELETE request to the appropriate endpoint
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

      // If deletion failed, attempt to extract and display error message
      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch (e) {
          // Ignore JSON parse errors
        }
        setDeleteMessage(`Error deleting entry: ${errData.detail || 'Unknown error'}`);
        return;
      }

      // Show success message on successful deletion
      setDeleteMessage('Entry deleted successfully!');

      // Remove deleted entry from local state arrays based on type
      if (entry.type === 'savings') {
        setSavingsEntries(prev => prev.filter(e => e.id !== entry.id));
      } else if (entry.type === 'savings-goal') {
        setSavingsGoals(prev => prev.filter(e => e.id !== entry.id));
      } else if (entry.type === 'repayment-goal') {
        setRepaymentGoals(prev => prev.filter(e => e.id !== entry.id));
      }

      // Refresh cached queries to keep UI data in sync
      await queryClient.invalidateQueries(['savings']);
      await queryClient.invalidateQueries(['goals']);

      // Clear delete message and reset item to delete after 2 seconds
      setTimeout(() => {
        setItemToDelete(null);
        setDeleteMessage('');
      }, 2000);

    } catch (error) {
      // Handle network or unexpected errors
      setDeleteMessage('Network error while deleting entry.');
    }
  };



/* ────────────────────────────────
        EDIT GOAL ENTRY LOGIC ─
        FOR SAVINGS GOALS
        & REPAYMENT GOALS
   ──────────────────────────────── */

  const handleAmountModal = (entry) => {
    // Check if entry has a valid type, otherwise log error and return
    if (!entry.type) {
      console.error("Invalid entry type:", entry.type);
      return;
    }
    setSelectedSavings(entry);  // Store the selected entry for updating amount
    setAmount("");              // Reset amount input field to empty
    setActionType("add");       // Default action type to "add" (could be add or remove)
    setDate(getCurrentMonth()); // Initialize date to current month (for amount update)
    setShowAmountModal(true);   // Show the modal for adding/removing amount
    setMessage("");             // Clear any previous messages
  };

  const handleEdit = (entry) => {
    setEditingGoal(entry); // Store the goal entry to be edited

    // Determine goal type based on category matching savings categories
    if (entry.category && SavingsCategories.some(cat => cat.value === entry.category)) {
      setGoalType('savings');  // Mark goal type as savings if category matches
    } else {
      setGoalType('repayment'); // Otherwise mark as repayment goal
    }

    // Populate form data with existing goal details for editing
    setFormData({
      goalName: entry.goalName,
      category: entry.category,
      amount: entry.amount,
      current: entry.current,
      deadline: entry.deadline,
      amendDeadline: 'no',   // Default: not amending deadline initially
      selectedMonth: ''      // Clear any selected month for deadline amendment
    });
    setIsOngoing('yes');        // Set ongoing status (this might be a default/reset)
    setDate(getCurrentMonth()); // Set date input to current month for form
    setShowDeadlineSelect(false); // Hide the deadline select UI element initially
    setMessage('');             // Clear any form message or error
  };

  const handleChange = (field, value) => {
    // Update the form data state for the given field with new value
    setFormData(prev => ({ ...prev, [field]: value }));

    // Show or hide the deadline select UI based on amendDeadline field's value
    if (field === 'amendDeadline') {
      setShowDeadlineSelect(value === 'yes');
    }
  };


  const handleUpdate = async () => {
    // Ensure there is an editingGoal to update; if not, log warning and exit
    if (!editingGoal) {
      console.warn('No editingGoal set');
      return;
    }

    // Simple helper to check if a string is non-empty (not just spaces)
    const isNonEmptyString = (str) => typeof str === 'string' && str.trim().length > 0;
    // Helper to check if a number is valid (not NaN and non-negative)
    const isValidNumber = (num) => !isNaN(num) && num >= 0;

    // Validate mandatory form fields: goalName, category, amount, and current must be valid
    if (
      !isNonEmptyString(formData.goalName) ||
      !isNonEmptyString(formData.category) ||
      !isValidNumber(Number(formData.amount)) ||
      !isValidNumber(Number(formData.current))
    ) {
      // Show error message and confirmation popup for 3 seconds, then exit
      setMessage('Error: Please fill in all mandatory fields correctly.');
      setShowConfirmationPopup(true);
      setTimeout(() => setShowConfirmationPopup(false), 3000);
      return;
    }

    // Additional validation if deadline is being amended and goal is not ongoing
    if (formData.amendDeadline === 'yes' && isOngoing === 'no') {
      // Validate date format YYYY-MM using regex
      if (!date || !/^\d{4}-\d{2}$/.test(date)) {
        setMessage('Error: Please provide a valid deadline date.');
        setShowConfirmationPopup(true);
        setTimeout(() => setShowConfirmationPopup(false), 3000);
        return;
      }
    }

    // Get goal ID, supporting both 'id' and '_id' keys
    const goalId = editingGoal.id || editingGoal._id;

    // Determine the API endpoint based on goal type (savings or repayment)
    const url =
      goalType === 'savings'
        ? `/savings-goals/${goalId}/`
        : `/repayment-goals/${goalId}/`;

    // Prepare payload object with updated goal data
    const payload = {
      goal_name: formData.goalName,
      category: formData.category.toLowerCase(),
      goal_amount: Number(formData.amount),
      current_amount: Number(formData.current),
    };

    // Include deadline fields if user chose to amend deadline
    if (formData.amendDeadline === 'yes') {
      payload.deadline_ongoing = isOngoing;
      if (isOngoing === 'no') {
        // Set deadline to the 15th of selected month (format YYYY-MM-15)
        payload.deadline = `${date}-15`;
      } else {
        payload.deadline = null; // No deadline if ongoing
      }
    }

    // Get access token from local storage for authorization
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setMessage('Error: You must be logged in to update goals.');
      setShowConfirmationPopup(true);
      setTimeout(() => setShowConfirmationPopup(false), 3000);
      return;
    }

    try {
      // Send PATCH request to update the goal using the authFetch helper
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

      // If response is not OK, extract error message and throw to catch block
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update goal');
      }

      // Parse the updated goal data from the response
      const updatedGoal = await response.json();

      setEditingGoal(null);                 // Clear editing state
      setMessage('Goal updated successfully!'); // Show success message
      setShowConfirmationPopup(true);      // Show confirmation popup

      // Refresh queries to update local cached data (React Query)
      await queryClient.invalidateQueries(['savings']);
      await queryClient.invalidateQueries(['goals']);

      // Hide confirmation popup after 1.5 seconds
      setTimeout(() => setShowConfirmationPopup(false), 1500);
    } catch (error) {
      // On error, show error message and confirmation popup for 3 seconds
      setMessage(`Error: ${error.message}`);
      setShowConfirmationPopup(true);
      setTimeout(() => setShowConfirmationPopup(false), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);         // Clear any goal currently being edited
    setFormData({});              // Reset form data to empty
    setShowDeadlineSelect(false); // Hide the deadline selector UI
    setIsOngoing('yes');          // Reset ongoing status to default "yes"
    setDate(getCurrentMonth());   // Reset date field to current month
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
      queryClient.invalidateQueries(['savings']);
      queryClient.invalidateQueries(['goals']);
      }}
    />
  )}
  {isRepaymentModalOpen && (
    <RepaymentGoalsModal 
      onClose={() => setIsRepaymentModalOpen(false)} 
      onSuccess={() => {
        setIsRepaymentModalOpen(false);
      queryClient.invalidateQueries(['savings']);
      queryClient.invalidateQueries(['goals']);
      }}
    />
  )}
  {isGeneralModalOpen && (
    <CreateSavingsModal 
      onClose={() => setIsGeneralModalOpen(false)} 
      onSuccess={() => {
        setIsGeneralModalOpen(false);
      queryClient.invalidateQueries(['savings']);
      queryClient.invalidateQueries(['goals']);
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
                {loadingSavings ? (
                  <p className="loading-message">
                    <FiLoader className="spin" /> Loading...
                  </p>
                ) : savings.length === 0 ? (
                  <p className="no-data-message">No Saving Entries found</p>
                ) : (
                  savings.map((entry, index) => (
                    <div className="savings-goal-group" key={entry.id || index}>
                      <h4 className="savings-goal-heading">
                        {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
                      </h4>
                      <h5 className="savings-goal-amount">
                        Saved Amount: {currencySymbol}{entry.amount.toLocaleString()}
                      </h5>
                      <h5 className="savings-details-general">Duration: {entry.duration}</h5>
                      <div className="update-action">
                        <button
                          className="update-icon-btn"
                          onClick={() => handleAmountModal({ ...entry, type: "savings" })}
                        >
                          <FiPlus />
                        </button>
                        <button
                          className="update-icon-btn"
                          onClick={() => handleLogHistory({ ...entry, type: "savings" })}
                        >
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
                  ))
                )}

              </div>
            </div>
          </section>


            <section className="saving-goals-section">
              <span className="emoji-icon">💰</span>
              <h3 className="saving-goals-heading">Savings Goals</h3>
              <div className="scroll-wrapper">
                <div className="savings-tracker-details scroll-content">
                  {loadingGoals ? (
                    <p className="loading-message">
                      <FiLoader className="spin" /> Loading...
                    </p>
                  ) : savingsGoals.length === 0 ? (
                    <p className="no-data-message">No Savings goals found</p>
                  ) : (
                    savingsGoals.map((item, index) => {
                      const parseCurrency = (value) => {
                        if (!value) return 0;
                        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
                      };

                      const amount = parseCurrency(item.amount);
                      const current = parseCurrency(item.current);
                      const percentage = amount === 0 ? 0 : (current / amount) * 100;
                      const outstandingAmount = amount - current;

                      return (
                        <div className="savings-goal-group" key={index}>
                          <h4 className="savings-goal-heading">
                            {getSavingsEmoji(item.category)}{" "}
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </h4>
                          <h4 className="savings-goal-name">
                            {item.goalName.charAt(0).toUpperCase() + item.goalName.slice(1)}
                          </h4>
                          <h5 className="savings-goal-amount">
                            Target Amount: {currencySymbol}
                            {amount.toLocaleString()}
                          </h5>
                          <div className="savings-goal-bar-container">
                            <p>Current Amount: {Math.round(percentage)}%</p>
                            <div className="savings-goal-bar">
                              <div
                                className="savings-goal-fill"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: percentage >= 100 ? "#ff4d4f" : "#8e66fc",
                                }}
                              >
                                {currencySymbol}
                                {current.toLocaleString()}
                              </div>
                            </div>
                            <h5 className="savings-details">
                              Outstanding Amount: {currencySymbol}
                              {outstandingAmount.toLocaleString()}
                            </h5>
                            <h5 className="savings-details">Deadline: {item.deadline}</h5>
                            <h5 className="savings-details">
                              {item.timeLeft === "Ongoing" ? "Ongoing" : `${item.timeLeft}`}
                            </h5>
                          </div>
                          <div className="update-action">
                            <button
                              className="update-icon-btn"
                              onClick={() => handleAmountModal({ ...item, type: "savings-goal" })}
                            >
                              <FiPlus />
                            </button>
                            <button
                              className="update-icon-btn"
                              onClick={() => handleLogHistory({ ...item, type: "savings-goal" })}
                            >
                              <FiClock />
                            </button>
                            <button className="update-icon-btn" onClick={() => handleEdit(item)}>
                              <FiEdit3 />
                            </button>
                            <button
                              className="update-icon-btn"
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
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="repayment-goals-section">
              <span className="emoji-icon">💸</span>
              <h3 className="repayment-goals-heading">Repayment Goals</h3>
              <div className="scroll-wrapper">
                <div className="savings-tracker-details scroll-content">
                  {loadingGoals ? (
                    <p className="loading-message">
                      <FiLoader className="spin" /> Loading...
                    </p>
                  ) : repaymentGoals.length === 0 ? (
                    <p className="no-data-message">No Repayment goals found</p>
                  ) : (
                    repaymentGoals.map((item, index) => {
                      const parseCurrency = (value) => {
                        if (!value) return 0;
                        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
                      };

                      const amount = parseCurrency(item.amount);
                      const current = parseCurrency(item.current);
                      const percentage = amount === 0 ? 0 : (current / amount) * 100;
                      const outstandingAmount = amount - current;

                      return (
                        <div className="savings-goal-group" key={index}>
                          <h4 className="savings-goal-heading">
                            {getRepaymentEmoji(item.category)}{" "}
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </h4>
                          <h4 className="savings-goal-name">{item.goalName}</h4>
                          <h5 className="savings-goal-amount">
                            Repayment Amount: {currencySymbol}
                            {amount.toLocaleString()}
                          </h5>
                          <div className="savings-goal-bar-container">
                            <p>Amount Paid: {Math.round(percentage)}%</p>
                            <div className="savings-goal-bar">
                              <div
                                className="savings-goal-fill"
                                style={{
                                  width: `${percentage}%`,
                                  minWidth: "10px",
                                  backgroundColor: percentage >= 100 ? "#ff4d4f" : "#8e66fc",
                                }}
                              >
                                {currencySymbol}
                                {current.toLocaleString()}
                              </div>
                            </div>
                            <h5 className="savings-details">
                              Outstanding Amount: {currencySymbol}
                              {outstandingAmount.toLocaleString()}
                            </h5>
                            <h5 className="savings-details">Deadline: {item.deadline}</h5>
                            <h5 className="savings-details">
                              {item.timeLeft === "Ongoing" ? "Ongoing" : `${item.timeLeft}`}
                            </h5>
                          </div>
                          <div className="update-action">
                            <button
                              className="update-icon-btn"
                              onClick={() => handleAmountModal({ ...item, type: "repayment-goal" })}
                            >
                              <FiPlus />
                            </button>
                            <button
                              className="update-icon-btn"
                              onClick={() => handleLogHistory({ ...item, type: "repayment-goal" })}
                            >
                              <FiClock />
                            </button>
                            <button className="update-icon-btn" onClick={() => handleEdit(item)}>
                              <FiEdit3 />
                            </button>
                            <button
                              className="update-icon-btn"
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
                    })
                  )}
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
                    <div className="modal-content-history">
                      <h2>Log History</h2>
                      <div className="form-group-custom">
                        <h4>{selectedSavings?.goalName || selectedSavings?.name}</h4>
                      </div>
                      <div className="log-history-headers">
                        <strong>Date</strong>
                        <strong>Amount</strong>
                      </div>
                        <div className="log-history-entries">
                          {loadingLogHistory ? (
                            <p className="loading-message">
                              <FiLoader className="spinner" /> Loading...
                            </p>
                          ) : !Array.isArray(logHistory) || logHistory.length === 0 ? (
                            <p>No log history found.</p>
                          ) : (
                            logHistory.map((log) => {
                              const dateObj = new Date(log.date);
                              const formattedDate = `${(dateObj.getMonth() + 1)
                                .toString()
                                .padStart(2, '0')}-${dateObj.getFullYear()}`;

                              const sign = log.action === 'add' ? '+' : log.action === 'remove' ? '-' : '';

                              const amountStyle = {
                                color: log.action === 'add' ? 'green' : log.action === 'remove' ? 'red' : 'inherit',
                              };

                              return (
                                <div key={log.id} className="log-entry">
                                  <span>{formattedDate}</span>
                                  <span style={amountStyle}>
                                    {sign} {currencySymbol}
                                    {log.amount ? Number(log.amount).toFixed(2) : '0.00'}
                                  </span>
                                </div>
                              );
                            })
                          )}
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


