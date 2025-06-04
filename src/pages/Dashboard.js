import React, { useRef, useState, useEffect } from 'react';
import '../CSS/Dashboard.css';
import { useAuth} from '../context/AuthContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaList, FaChartPie, FaSpinner, FaTrophy} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import { useQuery } from '@tanstack/react-query';


const quarterMap = {
  Q1: ['Jan', 'Feb', 'Mar'],
  Q2: ['Apr', 'May', 'Jun'],
  Q3: ['Jul', 'Aug', 'Sept'],
  Q4: ['Oct', 'Nov', 'Dec'],
};


const monthMap = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sept: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12'
};


const overviewColors = ['#8e66fc', '#000000', '#6c63ff'];

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

const barColors = ['#6c63ff', '#8e66fc', '#4d4cb3', '#000000', '#7266e0', '#4a47a3', '#8c52ff', '#000000', '#7b68ee', '#a088ff'];

const barColorsFiltered = ['#6c63ff', '#8e66fc', '#4d4cb3', '#7266e0', '#4a47a3', '#8c52ff', '#7b68ee', '#a088ff'];

function Dashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBreakdownType, setSelectedBreakdownType] = useState('income');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGuestOverlay, setShowGuestOverlay] = useState(false);
  const allYears = [currentYear, previousYear];
  const [selectedMonths, setSelectedMonths] = useState(months);
  const [ setError] = useState('');
  const [incomeData, setIncomeData] = useState({});
  const [expenseData, setExpenseData] = useState({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [breakdownData, setBreakdownData] = useState([]);
  const [netIncomeError, setNetIncomeError] = useState('');
  const [setNetData] = React.useState([]);

  const { currencySymbol } = useAuth();
  const { refreshToken } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { logout} = useAuth();
  const navigate = useNavigate();


/****** 
 Caching state for the dropdown options so they maintain states while user navigates to 
 another page. 
 This should reset once the guest logs out or session expires: 
 
 ********/

const STORAGE_KEYS = {
  // Key for storing the selected month in localStorage
  selectedMonth: 'dashboard_selectedBreakdownMonth',
  // Key for storing the current breakdown view (e.g., monthly/quarterly) in localStorage
  view: 'dashboard_breakdownView',
  // Key for storing the selected quarter in localStorage
  selectedQuarter: 'dashboard_selectedQuarter',
};

// Default month string for initial state or fallback (January of current year)
const defaultMonth = `${currentYear}-01`;
// Default quarter string for initial state or fallback (first quarter)
const defaultQuarter = 'Q1';


/******* Helper to get storage based on user type *********/
const getStorage = () => (user?.is_guest ? sessionStorage : localStorage);

// Initialize state from proper storage, parse if needed
const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState(() => {
  return getStorage().getItem(STORAGE_KEYS.selectedMonth) || defaultMonth;
});
const [breakdownView, setBreakdownView] = useState(() => {
  return getStorage().getItem(STORAGE_KEYS.view) || 'pie';
});
const [selectedQuarter, setSelectedQuarter] = useState(() => {
  return getStorage().getItem(STORAGE_KEYS.selectedQuarter) || defaultQuarter;
});

const [dropdownOpen, setDropdownOpen] = useState(false);

// Save state helper
const saveState = (key, value) => {
  getStorage().setItem(key, value);
};

const updateSelectedBreakdownMonth = (month) => {
  setSelectedBreakdownMonth(month);
  saveState(STORAGE_KEYS.selectedMonth, month);
};

const updateBreakdownView = (view) => {
  setBreakdownView(view);
  saveState(STORAGE_KEYS.view, view);
};

const updateSelectedQuarter = (quarter) => {
  setSelectedQuarter(quarter);
  saveState(STORAGE_KEYS.selectedQuarter, quarter);
  setDropdownOpen(false);
};

// Reset guest session states on logout only
const prevUserRef = useRef(user);

useEffect(() => {
  const prevUser = prevUserRef.current;
  const isGuestLoggedOut = prevUser?.is_guest && !user;

  if (isGuestLoggedOut) {
    console.log("Guest logged out - resetting dashboard state");

    // Remove guest sessionStorage items
    sessionStorage.removeItem(STORAGE_KEYS.selectedMonth);
    sessionStorage.removeItem(STORAGE_KEYS.view);
    sessionStorage.removeItem(STORAGE_KEYS.selectedQuarter);

    // Reset React state to defaults
    setSelectedBreakdownMonth(defaultMonth);
    setBreakdownView('pie');
    setSelectedQuarter(defaultQuarter);
  }

  prevUserRef.current = user;
}, [user]);

  
  /**** Helper function to make authenticated fetch requests with token refresh handling ****/
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
  

/*** Overview Section Logic: Displays yearly data for income, expenses and general savings ***/
  
const useOverviewData = (selectedYear, refreshToken, handleSessionExpired) => {
  // Custom hook using React Query to fetch overview data (income, expenses, savings) for a given year
  return useQuery({
    queryKey: ['overviewData', selectedYear], // Cache key includes selected year for data caching per year
    queryFn: async () => {
      const yearParam = `?year=${selectedYear}`; // Query parameter for API calls

      // Fetch income, expenses, and general savings concurrently with authentication and session handling
      const [incomeRes, expenseRes, generalSavingsRes] = await Promise.all([
        authFetch(`/income/${yearParam}`, {}, refreshToken, handleSessionExpired),
        authFetch(`/expenses/${yearParam}`, {}, refreshToken, handleSessionExpired),
        authFetch(`/general-savings/${yearParam}`, {}, refreshToken, handleSessionExpired),
      ]);

      // Throw error if any of the API responses are not successful
      if (!incomeRes.ok || !expenseRes.ok || !generalSavingsRes.ok) {
        throw new Error('Failed to load data.');
      }

      // Parse JSON responses from all three endpoints
      const incomeData = await incomeRes.json();
      const expenseData = await expenseRes.json();
      const savingsData = await generalSavingsRes.json();

      // Calculate totals by summing amounts from each data array
      const incomeTotal = incomeData.reduce((acc, item) => acc + parseFloat(item.amount), 0);
      const expenseTotal = expenseData.reduce((acc, item) => acc + parseFloat(item.amount), 0);
      const savingsTotal = savingsData.reduce((acc, item) => acc + parseFloat(item.amount), 0);

      // Sum all categories to get the overall total
      const total = incomeTotal + expenseTotal + savingsTotal;

      // Prepare overview data array only if total is non-zero, else empty array
      const overviewData = total === 0 ? [] : [
        { name: 'Income', value: incomeTotal },
        { name: 'Expenses', value: expenseTotal },
        { name: 'General Savings', value: savingsTotal },
      ];

      return { overviewData, total }; // Return aggregated overview data and total
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    refetchOnWindowFocus: false, // Disable refetching on window focus for better performance
  });
};

// Destructure query result and status flags from the custom hook
const {
  data,
  isLoading: overviewLoading,
  isError: overviewError,
  error: overviewErrorObject,
} = useOverviewData(selectedYear, refreshToken, handleSessionExpired);

// Extract overview data and total, or use defaults if data is undefined
const overviewData = data?.overviewData || [];
const total = data?.total || 0;


// Months Names for Monthly Breakdown Section
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


/***** 
 Shared fetch function to get income and expense data for the Monthly Breakdown
 Section and Net income Section:
 Fetches the income and expense entries for each month.
 ******/

const fetchIncomeAndExpenses = async (monthParam) => {
  // Fetch income and expenses data concurrently for the given month
  const [incomeRes, expenseRes] = await Promise.all([
    authFetch(`/income/?month=${monthParam}`, {}, refreshToken, handleSessionExpired),
    authFetch(`/expenses/?month=${monthParam}`, {}, refreshToken, handleSessionExpired),
  ]);

  // Throw error if either fetch response is not ok
  if (!incomeRes.ok || !expenseRes.ok) {
    throw new Error('Failed to fetch income or expenses');
  }

  // Parse JSON responses for income and expenses
  const incomeData = await incomeRes.json();
  const expenseData = await expenseRes.json();

  // Return both datasets as an object
  return { incomeData, expenseData };
};

// Use React Query to fetch income and expenses data for the selected month
const {
  data: breakdownQueryData,      // fetched data (income and expenses)
  isLoading: breakdownLoading,   // loading state
  isError: breakdownError,       // error state
  error,                         // error details
} = useQuery({
  queryKey: ['income-expenses', selectedBreakdownMonth], // cache key based on selected month
  queryFn: () => fetchIncomeAndExpenses(selectedBreakdownMonth), // fetch function
});


/*****
 Logic for Monthly breakdown section:
  Aggregates income and expense amount by category for the selected category dropdown.
  Totals income, expense amount and calculates the net income amount. 
  This will be used in the Custom Tool Tip for the Net income Tracker also.
 *****/

useEffect(() => {
  // Exit early if breakdownQueryData is not available
  if (!breakdownQueryData) return;

  // Destructure incomeData and expenseData from the fetched query data
  const { incomeData, expenseData } = breakdownQueryData;

  // Aggregate income amounts by category
  const incomeByCat = {};
  incomeData.forEach(item => {
    incomeByCat[item.category] = (incomeByCat[item.category] || 0) + parseFloat(item.amount);
  });

  // Aggregate expense amounts by category
  const expenseByCat = {};
  expenseData.forEach(item => {
    expenseByCat[item.category] = (expenseByCat[item.category] || 0) + parseFloat(item.amount);
  });

  // Calculate total income by summing all category values
  const totalInc = Object.values(incomeByCat).reduce((a, b) => a + b, 0);

  // Calculate total expenses by summing all category values
  const totalExp = Object.values(expenseByCat).reduce((a, b) => a + b, 0);

  // Update state with aggregated income data by category
  setIncomeData(incomeByCat);

  // Update state with aggregated expense data by category
  setExpenseData(expenseByCat);

  // Update state with total income amount
  setTotalIncome(totalInc);

  // Update state with total expense amount
  setTotalExpense(totalExp);

  // Calculate net balance (income minus expenses) and update state
  setNetBalance(totalInc - totalExp);

  // Prepare data for breakdown chart depending on selected type (income or expense)
  const dataToSet = selectedBreakdownType === 'income' ? incomeByCat : expenseByCat;

  // Format breakdown data into an array of objects with capitalized category names and values
  setBreakdownData(
    Object.entries(dataToSet).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  );
}, [breakdownQueryData, selectedBreakdownType]);




/*****
 Savings Goals section:
 Fetches the top 2 savings goals with the highest goal amount to display.
 *****/

// useQuery hook to fetch and cache savings goals data
const {
  data: savingsGoals = [],           // Fetched and transformed savings goals data (default to empty array)
  isLoading: goalsLoading,           // Loading state for the query
  isError: goalsError,               // Error state flag
  error: goalsFetchError,            // Error object if the query fails
} = useQuery({
  queryKey: ['savings-goals'],       // Unique key for caching this query
  queryFn: async () => {
    // Authenticated fetch request to retrieve savings goals
    const savingsRes = await authFetch(
      '/savings-goals/',
      {},
      refreshToken,
      handleSessionExpired
    );

    // Handle failed response
    if (!savingsRes.ok) {
      // Specific handling for expired session
      if (savingsRes.status === 401) {
        throw new Error('Session has expired. Please sign in again.');
      }
      // General fetch failure
      throw new Error('Failed to fetch savings goals');
    }

    // Parse response JSON
    const savingsData = await savingsRes.json();

    // Return empty array if no data found
    if (!savingsData || savingsData.length === 0) {
      return [];
    }

    // Sort goals by goal amount (descending) and take the top two
    const topTwoGoals = savingsData
      .sort((a, b) => Number(b.goal_amount) - Number(a.goal_amount))
      .slice(0, 2);

    // Transform each goal to desired structure
    const transformGoal = (goal) => ({
      id: goal.id,
      goalName: goal.goal_name?.charAt(0).toUpperCase() + goal.goal_name?.slice(1), // Capitalize goal name
      category: goal.category,
      amount: Number(goal.goal_amount) || 0,
      current: Number(goal.current_amount) || 0,
    });

    // Return transformed top two goals
    return topTwoGoals.map(transformGoal);
  },
});

// Ref to cache previous goal-related values if needed (e.g., for comparison or updates)
const cacheRef = useRef({});


/**
 Net Income Section logic:
 To display the Net income per quarter.
 **/

const {
  data: netData = [],             // Fetched net income data (default to empty array)
  isLoading: netLoading,          // Loading state for the query
  isError,                        // Flag indicating if there was an error
  error: queryError,              // Error object if the query fails
  refetch,                        // Refetch function to manually re-trigger the query
} = useQuery({
  // Unique query key based on quarter and year to enable caching per selection
  queryKey: ['quarterly-net-income', selectedQuarter, currentYear],

  // Function to fetch and process income/expense data for each month in the quarter
  queryFn: async () => {
    // Get list of months in the selected quarter (e.g., ['Jan', 'Feb', 'Mar'])
    const monthsInQuarter = quarterMap[selectedQuarter];

    // Filter out months that are already cached
    const monthsToFetch = monthsInQuarter.filter(month => !(month in cacheRef.current));

    // Fetch income and expense data for uncached months
    const results = await Promise.all(
      monthsToFetch.map(month => {
        const monthNumber = monthMap[month] || month;         // Convert month name to number (e.g., 'Jan' → '01')
        const apiMonth = `${currentYear}-${monthNumber}`;     // Format as 'YYYY-MM'
        return fetchIncomeAndExpenses(apiMonth);              // Fetch data for that month
      })
    );

    // Store fetched results in cache for future reference
    monthsToFetch.forEach((month, i) => {
      cacheRef.current[month] = results[i];
    });

    // Build and return final structured data for all months in the quarter
    return monthsInQuarter.map(month => {
      // Return default values if data is still missing
      if (!cacheRef.current[month]) {
        return { month, income: 0, expenses: 0, net: 0 };
      }

      // Destructure income and expense data from cache
      const { incomeData, expenseData } = cacheRef.current[month];

      // Calculate total income and expenses for the month
      const incomeTotal = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const expenseTotal = expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // Return structured data for the month including net balance
      return {
        month,
        income: incomeTotal,
        expenses: expenseTotal,
        net: incomeTotal - expenseTotal,
      };
    });
  },

  // Handle any errors during query execution
  onError: (err) => {
    setNetIncomeError('Failed to fetch net income data.');
    console.error(err); // Log error to console for debugging
  },
});


// Filter netData to include only selected months and recalculate net for each
  const filteredData = netData
    .filter(item => selectedMonths.includes(item.month)) // Keep only data for selected months
    .map(item => ({
      ...item,
      net: item.income - item.expenses, // Recalculate net in case it's outdated
    }));

  // Use current income and expense data or fallback to empty object
  const currentIncomeData = incomeData || {};
  const currentExpenseData = expenseData || {};

  // Calculate total income and expenses by summing all category values
  const currentTotalIncome = Object.values(currentIncomeData).reduce((sum, val) => sum + val, 0);
  const currentTotalExpense = Object.values(currentExpenseData).reduce((sum, val) => sum + val, 0);

  // Calculate current net balance
  const currentNetBalance = currentTotalIncome - currentTotalExpense;

  // Generate breakdown data (either income or expense) as array of name/value objects
  const currentBreakdownData = Object.entries(
    selectedBreakdownType === 'income' ? currentIncomeData : currentExpenseData
  ).map(([name, value]) => ({ name, value }));

  // Function to toggle the current breakdown view type (e.g., 'income' or 'expenses')
  const toggleBreakdownView = (view) => {
    setBreakdownView(view);
  };


// Custom Tool Tip with styling for the Net Income Tracker section
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; 
    
    const income = data.income !== undefined ? data.income : null;
    const expenses = data.expenses !== undefined ? data.expenses : null;
    const net = data.net !== undefined ? data.net : null;

    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #8e66fc',
        borderRadius: '8px',
        padding: '8px',
        fontSize: '0.8rem',
        fontFamily: 'Russo One, sans-serif',
      }}>
        <p><strong>{label}</strong></p>
        {income !== null && <p>Income: {currencySymbol}{income.toFixed(2)}</p>}
        {expenses !== null && <p>Expenses: {currencySymbol}{expenses.toFixed(2)}</p>}
        {net !== null && <p>Net Balance: {currencySymbol}{net.toFixed(2)}</p>}
      </div>
    );
  }
  return null;
};


  useEffect(() => {
    AOS.init({ duration: 50 });
  }, []);


  /***
   If the user is logged in as guest user then the Guest Overlay modal will 
   appear everytime they are logged in to explain the dummy data.
   ***/

  useEffect(() => {
  
    if (user?.is_guest && !localStorage.getItem('overlayDismissed')) {
      setShowGuestOverlay(true);
    } else {
      setShowGuestOverlay(false);
    }
  }, [user]);
  
  
  const handleCloseOverlay = () => {
    localStorage.setItem('overlayDismissed', 'true');
    setShowGuestOverlay(false); 
  };

      
  return (

    <div className="dashboard-container">
            {showGuestOverlay && (
        <div className="guest-overlay">
          <div className="guest-overlay-content">
            <h2 className='welcome-message'>Welcome to Fundit!</h2>
            <p className='welcome-text'>
              We've provided some sample data to help you explore and visualise Fundit's features.
              Feel free to play around and see how it works before committing to register! 🎉<br /><br />
              <span>Therefore, please note that once the session expires or you log out, any new data will not be saved.</span>
            </p>
            <button onClick={handleCloseOverlay}>Okay</button>
          </div>
        </div>
      )}

      <h1 className="dashboard-header">
        <span>Dashboard</span>
        <span className="welcome-msg">
          Welcome, <strong>{user?.name ? user.name.split(' ')[0] : 'Guest'}!</strong>
        </span>
      </h1>

      <div className="dashboard-grid">
        {/* Overview Section */}
        <div className="dashboard-overview-area">
          <section className="dashboard-overview-section">
            <h3 className="dashboard-overview-heading">Yearly Overview</h3>

            <div className="year-dropdown">
              <button className="year-button" onClick={() => setShowDropdown(!showDropdown)}>
                {selectedYear} ▼
              </button>
              {showDropdown && (
                <ul className="dropdown-menu">
                  {allYears.map((year) => (
                    <li key={year} onClick={() => {
                      setSelectedYear(year);
                      setShowDropdown(false);
                    }}>
                      {year}
                    </li>
                  ))}
                </ul>
              )}
            </div>

    {overviewLoading ? (
      <p>Loading chart...</p>
    ) : overviewError ? (
      <p className="error-message">{overviewError}</p>
    ) : overviewData.length === 0 ? (
      <p>No data available for {selectedYear}.</p>
        ) : (
          <div className="dashboard-overview-chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={overviewData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {overviewData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={overviewColors[index % overviewColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => {
                  const percentage = ((value / total) * 100).toFixed(1);
                  return [`${currencySymbol}${value} (${percentage}%)`, name];
                }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="dashboard-overview-labels">
              {overviewData.map((entry, index) => (
                <div key={index} className="dashboard-overview-label">
                  <span
                    className="dashboard-label-color"
                    style={{ backgroundColor: overviewColors[index] }}
                  />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>


        {/* Monthly Breakdown Section */}
        <div className="dashboard-breakdown-area">
          <section className="dashboard-monthly-breakdown-section">
            <h3 className="dashboard-overview-heading">Monthly Breakdown</h3>

            <div className="dashboard-breakdown-controls">
              <select
                value={selectedBreakdownMonth}
                onChange={e => updateSelectedBreakdownMonth(e.target.value)}
              >
                {monthNames.map((monthName, index) => {
                  const monthValue = `${currentYear}-${(index + 1).toString().padStart(2, "0")}`;
                  return (
                    <option key={monthValue} value={monthValue}>
                      {monthName}
                    </option>
                  );
                })}
              </select>

              <div className="dashboard-view-toggle">
                <button
                  className={`breakdown-view-btn ${breakdownView === 'list' ? 'selected' : ''}`}
                  onClick={() => updateBreakdownView('list')}
                >
                  <FaList className="icon" />
                  List View
                </button>
                <button
                  className={`breakdown-view-btn ${breakdownView === 'pie' ? 'selected' : ''}`}
                  onClick={() => updateBreakdownView('pie')}
                >
                  <FaChartPie className="icon" />
                  Pie Chart
                </button>
              </div>
              </div>


            {breakdownView === 'list' && (
              <div className="dashboard-list-view">
                <div className="dashboard-list-wrapper">
                  {/* Income */}
                  <div className="list-income-section">
                    <h4>Income</h4>
                    <div className="scroll-wrapper">
                    <div className="list-area">
                    {Object.entries(incomeData).map(([cat, amt], idx) => (
                        <div className="list-row" key={idx}>
                        <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                        <span>{currencySymbol}{amt}</span>
                        </div>  
                    ))}
                    </div>
                    </div>
                    <div className="list-total"><strong>Total:</strong><span>{currencySymbol}{totalIncome}</span></div>
                  </div>

                  {/* Expense */}
                  <div className="list-expense-section">
                    <h4>Expenses</h4>
                    <div className="scroll-wrapper">
                    <div className="list-area">
                    {Object.entries(expenseData).map(([cat, amt], idx) => (
                      <div className="list-row" key={idx}>
                        <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                        <span>{currencySymbol}{amt}</span>
                    </div>                    
                    ))}
                    </div>
                    </div>
                    <div className="list-total"><strong>Total:</strong><span>{currencySymbol}{totalExpense}</span></div>
                  </div>

                  {/* Net Balance */}
                  <div className="list-netbalance-section">
                    <h4>Remaining Balance</h4>
                    <p className="net-balance-display">{currencySymbol}{netBalance}</p>
                  </div>
                </div>
              </div>
            )}

        {breakdownView === 'pie' && (
            <div className="dashboard-monthly-gauge-wrapper">
            <div className="dashboard-category-toggle">
                <button
                  className={`dashboard-category-btn ${selectedBreakdownType === 'income' ? 'selected' : ''}`}
                  onClick={() => setSelectedBreakdownType('income')}
                >
                  Income
                </button>
                <button
                  className={`dashboard-category-btn ${selectedBreakdownType === 'expense' ? 'selected' : ''}`}
                  onClick={() => setSelectedBreakdownType('expense')}
                >
                  Expense
                </button>
              </div>
              <ResponsiveContainer width="100%" height={145}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${currencySymbol}${value}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard-monthly-breakdown-labels">
              {breakdownData.map((entry, index) => (
                <div key={index} className="monthly-breakdown-label">
                  <span className="label-color" style={{ backgroundColor: barColors[index % barColors.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
            </div>
                        )}

          </section>
        </div>

        {/* Bottom Row: Goals + Net Income */}
        <div className="dashboard-bottom-row">
        {/* Goals Section */}
        <div className="dashboard-goals-area">
          <section className="dashboard-overview-section goals-section">
            <h3 className="dashboard-overview-heading">Goals Tracker</h3>
            <FaTrophy className="trophy-icon" />
            <h3 className="goals-heading">Savings Goals</h3>

            {goalsError ? (
              <div className="goals-error-message">{goalsError}</div>
            ) : (
              savingsGoals.map((item, index) => {
                const parseCurrency = (value) => {
                  if (!value) return 0;
                  return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
                };

                const amount = parseCurrency(item.amount);
                const current = parseCurrency(item.current);
                const percentage = amount === 0 ? 0 : (current / amount) * 100;

                return (
                  <div className="dashboard-goal-group" key={index}>
                    <h4 className="dashboard-goal-heading">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </h4>
                    <h4 className="dashboard-goal-name">
                      {item.goalName.charAt(0).toUpperCase() + item.goalName.slice(1)}
                    </h4>
                    <h5 className="dashboard-goal-amount">
                      Target Amount: {currencySymbol}{amount.toLocaleString()}
                    </h5>
                    <div className="dashboard-goal-bar-container">
                      <p>Current Amount: {Math.round(percentage)}%</p>
                      <div className="dashboard-goal-bar">
                        <div
                          className="dashboard-goal-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 100 ? "#ff4d4f" : "#8e66fc",
                          }}
                        >
                          {currencySymbol}{current.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

          <div className="dashboard-net-area">
            <section className="dashboard-overview-section net-income-section">
              <h3 className="dashboard-overview-heading">Net Income Tracker</h3>

                    <div className="dashboard-dropdown">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="dashboard-dropdown-toggle"
                        >
                          Select Quarter
                        </button>
                        {dropdownOpen && (
                          <div className="dropdown-menu-net">
                            {Object.entries(quarterMap).map(([q, months]) => (
                              <label key={q}>
                                <input
                                  type="radio"
                                  name="quarter"
                                  value={q}
                                  checked={selectedQuarter === q}
                                  onChange={() => updateSelectedQuarter(q)}
                                />
                                {`${q} (${months.join(', ')})`}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                {netLoading ? (
                  <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={460}>
                    <AreaChart data={netData} margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          {barColorsFiltered.map((color, idx) => (
                            <stop
                              key={color}
                              offset={`${(idx / (barColorsFiltered.length - 1)) * 100}%`}
                              stopColor={color}
                              stopOpacity={0.8 - idx * (0.8 / barColorsFiltered.length)} 
                            />
                          ))}
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${currencySymbol}${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke={overviewColors[0]}
                        fillOpacity={1}
                        fill="url(#colorNet)"
                        isAnimationActive={true}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </section>
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
      </div>
    </div> 
  );
}

export default Dashboard;

