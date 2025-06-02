import React, { useState, useEffect, useRef } from 'react';
import '../CSS/Expenses.css';
import '../CSS/Income.css';
import AddExpenseModal from './AddExpenseModal';
import UpdateExpenseModal from './UpdateExpenseModal';
import CreateBudgetModal from './CreateBudgetModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  FaHome,
  FaCar,
  FaUtensils,
  FaHeartbeat,
  FaUser,
  FaFilm,
  FaUniversity,
  FaPiggyBank,
  FaEllipsisH,
  FaStar
} from 'react-icons/fa';

const categoryIcons = {
  housing: <FaHome />,
  transport: <FaCar />,
  food: <FaUtensils />,
  healthcare: <FaHeartbeat />,
  personal: <FaUser />,
  entertainment: <FaFilm />,
  debt: <FaUniversity />,
  savings: <FaPiggyBank />,
  miscellaneous: <FaEllipsisH />,
  custom: <FaStar />,
};

const toTitleCase = (str) =>
  str
    ? str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
    : '';


const categoryColors = ['#8e66fc', '#6c63ff', '#3c3c3c', '#b388ff', '#a1a1ff', '#7a7aff'];
const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const categoryOptions = ['Housing', 'Transport', 'Food', 'Healthcare', 'Personal', 'Entertainment', 'Debt', 'Savings', 'Miscellaneous', 'Custom'];

function Expenses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { refreshToken } = useAuth();
  const [combinedBudgetData, setCombinedBudgetData] = useState([]);
  const [showBudgetMonthDropdown, setShowBudgetMonthDropdown] = useState(false);
  const [showBudgetCategoryDropdown, setShowBudgetCategoryDropdown] = useState(false);
  const [monthlyBreakdownData, setMonthlyBreakdownData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { currencyCode, currencySymbol } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { logout} = useAuth();
  const { user } = useAuth();
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


// Keys used for saving and retrieving user selections in web storage
const EXPENSES_STORAGE_KEYS = {
  selectedMonth: 'expenses_selectedMonth',
  selectedCategories: 'expenses_selectedCategories',
  budgetSelectedMonth: 'expenses_budgetSelectedMonth',
  budgetSelectedCategories: 'expenses_budgetSelectedCategories',
};

// Default fallback values
const defaultMonth = 'Jan';
const defaultCategories = [...categoryOptions];

// Helper that returns the correct storage mechanism
// • Guests → sessionStorage (cleared when tab is closed)  
// • Signed-in users → localStorage (persists across sessions)
const getStorage = () => (user?.is_guest ? sessionStorage : localStorage);

/* ────────────────────────────────
   STATE INITIALISERS (lazy form) ─
   ──────────────────────────────── */

// Currently selected **month** for the “Expenses” view
const [selectedMonth, setSelectedMonth] = useState(() => {
  return getStorage().getItem(EXPENSES_STORAGE_KEYS.selectedMonth) || defaultMonth;
});

// Currently selected **categories** for the “Expenses” view
const [selectedCategories, setSelectedCategories] = useState(() => {
  const stored = getStorage().getItem(EXPENSES_STORAGE_KEYS.selectedCategories);
  return stored ? JSON.parse(stored) : defaultCategories;
});

// Currently selected **month** for the “Budget” view
const [budgetSelectedMonth, setBudgetSelectedMonth] = useState(() => {
  return getStorage().getItem(EXPENSES_STORAGE_KEYS.budgetSelectedMonth) || defaultMonth;
});

// Currently selected **categories** for the “Budget” view
const [budgetSelectedCategories, setBudgetSelectedCategories] = useState(() => {
  const stored = getStorage().getItem(EXPENSES_STORAGE_KEYS.budgetSelectedCategories);
  return stored ? JSON.parse(stored) : defaultCategories;
});

// Track the previous user object so we can detect when a guest logs out
const prevUserRef = useRef(user);

/* ──────────────────────────────────────────────────
   RESET STATE WHEN A GUEST USER LEAVES THE SESSION ─
   ────────────────────────────────────────────────── */
useEffect(() => {
  const prevUser = prevUserRef.current;
  const isGuestLoggedOut = prevUser?.is_guest && !user; // Guest became null → logged out

  if (isGuestLoggedOut) {
    console.log("Guest logged out - resetting expenses state");

    // Clear guest-specific state from **sessionStorage**
    sessionStorage.removeItem(EXPENSES_STORAGE_KEYS.selectedMonth);
    sessionStorage.removeItem(EXPENSES_STORAGE_KEYS.selectedCategories);
    sessionStorage.removeItem(EXPENSES_STORAGE_KEYS.budgetSelectedMonth);
    sessionStorage.removeItem(EXPENSES_STORAGE_KEYS.budgetSelectedCategories);

    // Reset React state back to defaults
    setSelectedMonth(defaultMonth);
    setSelectedCategories(defaultCategories);
    setBudgetSelectedMonth(defaultMonth);
    setBudgetSelectedCategories(defaultCategories);
  }

  // Store current user for the next render cycle
  prevUserRef.current = user;
}, [user]);

/* ──────────────────────────
   PERSIST STATE TO STORAGE ─
   ────────────────────────── */
// Utility to save a value (string or object) to the correct storage
const saveState = (key, value) => {
  const storage = getStorage();
  storage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
};

/* ───────────────────────────────────────
   UPDATE FUNCTIONS (state + persistence) ─
   ─────────────────────────────────────── */
const updateSelectedMonth = (month) => {
  setSelectedMonth(month);
  saveState(EXPENSES_STORAGE_KEYS.selectedMonth, month);
};

const updateSelectedCategories = (categories) => {
  setSelectedCategories(categories);
  saveState(EXPENSES_STORAGE_KEYS.selectedCategories, categories);
};

const updateBudgetSelectedMonth = (month) => {
  setBudgetSelectedMonth(month);
  saveState(EXPENSES_STORAGE_KEYS.budgetSelectedMonth, month);
};

const updateBudgetSelectedCategories = (categories) => {
  setBudgetSelectedCategories(categories);
  saveState(EXPENSES_STORAGE_KEYS.budgetSelectedCategories, categories);
};

/* ────────────────────────────────
   HANDLERS FOR USER INTERACTIONS ─
   ──────────────────────────────── */

// Expenses-month dropdown
const handleMonthChange = (e) => {
  updateSelectedMonth(e.target.value);
  setShowMonthDropdown(false);
};

// Expenses-category checkboxes
const handleCategoryChange = (e) => {
  const value = e.target.value;
  const newCategories = selectedCategories.includes(value)
    ? selectedCategories.filter((cat) => cat !== value)    // Remove if already selected
    : [...selectedCategories, value];                      // Add if not selected
  updateSelectedCategories(newCategories);
};

// “Select All” toggle for expenses categories
const handleSelectAllCategories = () => {
  const newCategories =
    selectedCategories.length === categoryOptions.length ? [] : [...categoryOptions];
  updateSelectedCategories(newCategories);
};

// Budget-month dropdown
const handleBudgetMonthChange = (e) => {
  updateBudgetSelectedMonth(e.target.value);
  setShowBudgetMonthDropdown(false);
};

// Budget-category checkboxes
const handleBudgetCategoryChange = (e) => {
  const value = e.target.value;
  const newCategories = budgetSelectedCategories.includes(value)
    ? budgetSelectedCategories.filter((cat) => cat !== value)
    : [...budgetSelectedCategories, value];
  updateBudgetSelectedCategories(newCategories);
};

// “Select All” toggle for budget categories
const handleSelectAllBudgetCategories = () => {
  const newCategories =
    budgetSelectedCategories.length === categoryOptions.length ? [] : [...categoryOptions];
  updateBudgetSelectedCategories(newCategories);
};


/* ────────────────────────────────
   MONTHLY BREAKDOWN SECTION LOGIC ─
   ──────────────────────────────── */

// Custom hook to fetch and manage expense data using React Query
const useExpensesData = (refreshToken, handleSessionExpired) => {
  return useQuery({
    queryKey: ['expensesData'], // Unique key for caching and refetching
    queryFn: async () => {
      // Fetch expenses from backend using an authenticated request
      const res = await authFetch(
        '/expenses/',                 // Endpoint for expense data
        { method: 'GET' },            // HTTP GET request
        refreshToken,                 // Token used to refresh session if needed
        handleSessionExpired          // Callback to handle session expiry
      );

      // Throw an error if the response is not OK (for React Query to catch)
      if (!res.ok) {
        throw new Error('Failed to fetch expense data');
      }

      // Parse and return JSON response
      return res.json();
    },
    staleTime: 1000 * 60 * 5,         // Keep data fresh for 5 minutes
    refetchOnWindowFocus: false,     // Do not refetch when window regains focus
  });
};

// Destructure the returned data and helpers from the custom hook
const {
  data: expenseData = [],  // Default to empty array if no data is returned
  isLoading,               // Boolean: true while data is being loaded
  isError,                 // Boolean: true if the fetch resulted in an error
  error,                   // The actual error object, if any
  refetch: refetchExpenses // Function to manually re-trigger the fetch
} = useExpensesData(refreshToken, handleSessionExpired);

  

useEffect(() => {
  const breakdown = {}; // Object to store expense breakdown per month

  expenseData.forEach(entry => {
    const startDate = new Date(entry.date);
    const startMonthIndex = startDate.getMonth(); // Get month index from date (0 = Jan)

    // Normalize category: use custom category name if type is 'custom', otherwise use standard category
    const category = entry.category === 'custom'
      ? entry.custom_category?.trim().toLowerCase()
      : entry.category.toLowerCase();

    const rawAmount = Number(entry.amount); // Convert amount to number
    if (isNaN(rawAmount)) return; // Skip invalid amounts

    // If recurring monthly, apply amount to all future months in the year; otherwise just current month
    const monthsToApply = entry.recurring_monthly === 'yes'
      ? monthOptions.slice(startMonthIndex)
      : [monthOptions[startMonthIndex]];

    // Distribute the amount across applicable months
    monthsToApply.forEach(month => {
      // Initialize the month entry if it doesn't exist
      if (!breakdown[month]) {
        breakdown[month] = { expense: {}, total: 0, formattedTotal: '' };
      }

      // Initialize the category amount if it doesn't exist
      if (!breakdown[month].expense[category]) {
        breakdown[month].expense[category] = 0;
      }

      // Add the amount to the category and total
      breakdown[month].expense[category] += rawAmount;
      breakdown[month].total += rawAmount;
    });
  });

  // Format the total expense for each month as currency
  Object.keys(breakdown).forEach(month => {
    breakdown[month].formattedTotal = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,         // Use selected or default currency code
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(breakdown[month].total);
  });

  // Update state with the computed monthly breakdown
  setMonthlyBreakdownData(breakdown);
}, [expenseData]); // Run effect whenever expenseData changes

// Convert category options to lowercase for consistent comparison/use
const lowerCaseOptions = categoryOptions.map(cat => cat.toLowerCase());



const getChartData = () => {
  // Convert selected categories to lowercase for consistent comparison
  const selected = selectedCategories.map(cat => cat.toLowerCase());

  // Get the expense data for the selected month, or an empty object if none
  const data = monthlyBreakdownData[selectedMonth]?.expense || {};

  // Check if all categories are selected
  const isSelectAll = selected.length === lowerCaseOptions.length;

  return Object.entries(data)
    .filter(([category]) => {
      const lowerCategory = category.toLowerCase();

      // If all categories are selected, include everything
      if (isSelectAll) return true;

      // If "custom" is selected, include custom categories and any unknown ones
      if (selected.includes('custom')) {
        return (
          lowerCategory.includes('custom') ||          // includes 'custom' keyword
          !lowerCaseOptions.includes(lowerCategory)    // not in predefined categories
        );
      }

      // Otherwise, only include categories that are explicitly selected
      return selected.includes(lowerCategory);
    })
    // Format the result as an array of { name, value } for chart use
    .map(([name, value]) => ({ name, value }));
};

// Get the filtered and formatted data to be used in the chart
const chartData = getChartData();


/* ────────────────────────────────
   TOP 5 RECURRING EXPENSES LOGIC ─
   ──────────────────────────────── */

const useTopRecurringExpenses = (expenseData) => {
  return useMemo(() => {
    // If there is no expense data, return an empty array
    if (!expenseData || expenseData.length === 0) return [];

    const recurringMap = {};

    // Iterate through each expense entry
    expenseData.forEach(entry => {
      // Only consider entries marked as recurring monthly
      if (entry.recurring_monthly === 'yes') {
        // Use custom category if available, otherwise use the default category
        const category = entry.custom_category || entry.category;

        // Convert the amount to a number
        const amount = Number(entry.amount);

        // Skip invalid amounts
        if (!isNaN(amount)) {
          // Accumulate total recurring amount per category
          recurringMap[category] = (recurringMap[category] || 0) + amount;
        }
      }
    });

    // Convert the recurring map to an array, sort by highest amount,
    // take the top 5 entries, and format each as an object with category and amount
    return Object.entries(recurringMap)
      .sort((a, b) => b[1] - a[1])           // Sort descending by amount
      .slice(0, 5)                           // Take top 5 recurring categories
      .map(([category, amount]) => ({ category, amount })); // Return as objects
  }, [expenseData]); // Only recompute when expenseData changes
};

// Call the custom hook to get the top recurring expenses
const topRecurringExpenses = useTopRecurringExpenses(expenseData);


/* ────────────────────────────────
   BUDGET TRACKER EXPENSE LOGIC ─
   ──────────────────────────────── */


// Custom hook to fetch budget data using React Query
const useBudgetData = (refreshToken, handleSessionExpired) => {
  return useQuery({
    queryKey: ['budgets'], // Unique key to identify this query
    queryFn: async () => {
      // Authenticated fetch request to get budget data
      const res = await authFetch(
        '/budgets/',
        { method: 'GET' },
        refreshToken,
        handleSessionExpired
      );

      // Throw error if response is not successful
      if (!res.ok) {
        throw new Error('Failed to fetch budgets');
      }

      // Return parsed JSON data
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache the data for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when window gains focus
  });
};

// Destructure the query result in the component
const {
  data: budgetData = [],           // Budget data (default to empty array)
  isLoading: budgetsLoading,       // Loading state
  isError: budgetsError,           // Error state flag
  error: budgetsFetchError,        // Actual error object
  refetch: refetchBudgets,         // Function to manually refetch budget data
} = useBudgetData(refreshToken, handleSessionExpired);

// Refetch expenses and budgets whenever the refresh token changes
useEffect(() => {
  refetchExpenses();
  refetchBudgets();
}, [refreshToken]);



useEffect(() => {
  // Exit early if budget or expense data is missing
  if (!budgetData || !expenseData) return;

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const expanded = [];

  // Loop through each budget entry
  for (const budget of budgetData) {
    const startMonth = new Date(budget.date).getMonth(); // Get index of start month
    const monthAbbr = new Date(budget.date).toLocaleString('default', { month: 'short' }); // e.g., "Jan"

    // Determine category (use custom if applicable)
    const category = budget.category.toLowerCase() === 'custom'
      ? budget.custom_category.toLowerCase()
      : budget.category.toLowerCase();

    // Determine applicable months for the budget (recurring vs non-recurring)
    const monthsToInclude = budget.recurring_monthly === 'yes'
      ? allMonths.slice(startMonth) // Apply to remaining months
      : [monthAbbr]; // Apply only to one specific month

    // Loop through each applicable month
    for (const month of monthsToInclude) {
      // Filter matching expenses for the same category and month
      const expenses = expenseData.filter(exp => {
        const expCategory = exp.category.toLowerCase() === 'custom'
          ? exp.custom_category?.toLowerCase()
          : exp.category.toLowerCase();

        const expMonthIndex = new Date(exp.date).getMonth();
        const expMonth = allMonths[expMonthIndex];

        if (expCategory !== category) return false;

        const isRecurring = exp.recurring_monthly === 'yes';

        if (isRecurring) {
          // Include if the budget month is the same or after the expense month
          const budgetMonthIndex = allMonths.indexOf(month);
          return budgetMonthIndex >= expMonthIndex;
        } else {
          // Only include non-recurring if the exact month matches
          return expMonth === month;
        }
      });

      // Calculate total expenses for this budget + month
      const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      // Push combined entry with actual and budgeted amounts
      expanded.push({
        ...budget,
        month,
        current: totalExpense,
        budget: Number(budget.amount),
        category,
      });
    }
  }

  // Set the expanded/computed budget data
  setCombinedBudgetData(expanded);
}, [budgetData, expenseData]);


// Filter combined data based on selected categories and month
const filteredCombinedData = combinedBudgetData.filter((item, i) => {
  // Log warning if category is missing
  if (!item.category) console.warn(`Missing category at index ${i}`, item);

  // Ensure month is defined by deriving it from the date if needed
  if (!item.month) {
    if (item.date) {
      item.month = new Date(item.date).toLocaleString('default', { month: 'short' });
    } else {
      item.month = 'unknown';
    }
  }

  // Normalize category and month for comparison
  const category = (item.category || '').toLowerCase();
  const selectedCategoriesLower = budgetSelectedCategories.map(cat => cat.toLowerCase());

  const month = (item.month || '').toLowerCase();
  const selectedMonth = (budgetSelectedMonth || '').toLowerCase();

  // Check if category and month match selected filters
  const categoryMatch = selectedCategoriesLower.length === 0 || selectedCategoriesLower.includes(category);
  const monthMatch = !budgetSelectedMonth || month === selectedMonth;

  return categoryMatch && monthMatch;
});


  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <div className="Income-container">
        <h1>Expenses</h1>
  
        <div className="add-income-wrapper">
          <div className="add-income-container">
            <p className="click-to-add-text">Click below to add a new expense entry</p>
            <button className="add-income-button" onClick={() => setIsAddModalOpen(true)}>
              + Add Expense
            </button>
          </div>
  
          <div className="add-income-container">
            <p className="click-to-add-text">Click below to update or delete an expense entry or a budget entry</p>
            <button className="add-income-button" onClick={() => setIsUpdateModalOpen(true)}>
              🖊️ Update Entry 
            </button>
          </div>
  
          <div className="add-income-container">
            <p className="click-to-add-text">Click below to create a budget for your expense categories</p>
            <button className="add-income-button" onClick={() => setIsCreateModalOpen(true)}>
              + Create Budget
            </button>
          </div>
        </div>
  
        <div className="expense-grid" data-aos="fade-up">
          <section className="expense-breakdown-section">
            <h3 className="expense-breakdown-heading">Monthly Breakdown</h3>
  
            <div className="expense-breakdown-dropdown-bar">
              {/* Month Dropdown */}
              <div
                className="expense-breakdown-dropdown-button"
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              >
                Month: {selectedMonth} ▾
                {showMonthDropdown && (
                  <div className="expense-breakdown-dropdown-list">
                    {monthOptions.map((month, index) => (
                      <label key={index}>
                        <input
                          type="radio"
                          name="breakdown-month"
                          value={month}
                          checked={selectedMonth === month}
                          onChange={handleMonthChange}
                        />
                        {month}
                      </label>
                    ))}
                  </div>
                )}
              </div>
  
              {/* Category Dropdown */}
              <div
                className="expense-breakdown-dropdown-button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                Select Category ▾
                {showCategoryDropdown && (
                  <div className="expense-breakdown-dropdown-list">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === categoryOptions.length}
                        onChange={handleSelectAllCategories}
                      />
                      Select All
                    </label>
                    {categoryOptions.map((cat, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          value={cat}
                          checked={selectedCategories.includes(cat)}
                          onChange={handleCategoryChange}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
  
            {/* Chart */}
              <div className="scroll-wrapper-expenses">
                <div className="expense-breakdown-chart-wrapper">
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={categoryColors[index % categoryColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip                           
                          formatter={(value, name) => [
                            `${currencySymbol}${value}`,
                            toTitleCase(name),
                          ]}
                          />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Labels */}
                  <div className="expense-breakdown-labels">
                    {chartData.map((entry, index) => (
                      <div key={index} className="expense-breakdown-label">
                        <span
                          className="label-color"
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        />
                        {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: {currencySymbol}{entry.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>


          {/* Recurring Expenses */}
          <section className="recurring-expenses-section">
            <h3 className="recurring-expenses-heading">
              Top 5: <br />Recurring Expenses
            </h3>
            <ul className="recurring-list">
              {topRecurringExpenses.map((item, index) => (
                <li key={index} className="recurring-item">
                  <div className="recurring-details">
                    <span className="icon">
                      {categoryIcons[item.category] || <FaEllipsisH />}
                    </span>
                    <span className="category-name">
                      {(item.category || 'Custom')
                        ?.split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </span>
                  </div>
                  <span className="amount">- {currencySymbol}{item.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>


          <section className="budget-tracker-section">
            <h3 className="budget-tracker-heading">Budget Tracker</h3>

            <div className="budget-dropdown-bar">
              <div
                className="budget-dropdown-button"
                onClick={() => setShowBudgetMonthDropdown(!showBudgetMonthDropdown)}
              >
                Month: {budgetSelectedMonth} ▾
                {showBudgetMonthDropdown && (
                  <div className="budget-dropdown-list">
                    {monthOptions.map((month, index) => (
                      <label key={index}>
                        <input
                          type="radio"
                          name="budget-month"
                          value={month}
                          checked={budgetSelectedMonth === month}
                          onChange={handleBudgetMonthChange}
                        />
                        {month}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="budget-dropdown-button"
                onClick={() => setShowBudgetCategoryDropdown(!showBudgetCategoryDropdown)}
              >
                Select Category ▾
                {showBudgetCategoryDropdown && (
                  <div className="budget-dropdown-list">
                    <label>
                      <input
                        type="checkbox"
                        checked={budgetSelectedCategories.length === categoryOptions.length}
                        onChange={handleSelectAllBudgetCategories}
                      />
                      Select All
                    </label>
                    {categoryOptions.map((cat, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          value={cat}
                          checked={budgetSelectedCategories.includes(cat)}
                          onChange={handleBudgetCategoryChange}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="scroll-wrapper-budget">
              <div className="budget-tracker-details scroll-content">
                {filteredCombinedData.length > 0 ? (
                  filteredCombinedData.map((item) => {
                    const percentage = (item.current / item.budget) * 100;
                    return (
                      <div className="budget-goal-group" key={item.id}>
                        <h4 className="budget-goal-heading">
                        {(item.category === 'custom' ? item.custom_category : item.category)
                          .replace(/\b\w/g, char => char.toUpperCase())}

                        </h4>
                        <h5 className="goal-budget">Budget: {currencySymbol}{item.budget.toLocaleString()}</h5>
                        <div className="budget-goal-bar-container">
                          <p>Current: {Math.round(percentage)}%</p>
                          <div className="budget-goal-bar">
                          <div className="budget-goal-fill"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: percentage >= 100 ? '#ff4d4f' : '#8e66fc'
                            }}
                        >
                          {currencySymbol}{item.current?.toLocaleString() || 0}
                        </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No budget data found for selected filters.</p>
                )}
              </div>
            </div>
          </section>

        </div>
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
  
      {isAddModalOpen && (
        <AddExpenseModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            refetchExpenses();
            refetchBudgets();
          }}
        />
      )}

      {isUpdateModalOpen && (
        <UpdateExpenseModal
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={() => {
            refetchExpenses();
            refetchBudgets();
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateBudgetModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            refetchExpenses();
            refetchBudgets();
          }}
        />
      )}

    </>
  );
  
}

export default Expenses;
