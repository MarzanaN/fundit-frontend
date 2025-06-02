import React, { useState, useEffect, useRef } from 'react';
import '../CSS/Income.css';
import AddIncomeModal from './AddIncomeModal';
import UpdateIncomeModal from './UpdateIncomeModal';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import { useQuery } from '@tanstack/react-query';

const categoryColors = ['#8e66fc', '#6c63ff', '#3c3c3c', '#b388ff', '#a1a1ff', '#7a7aff'];
const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const categoryOptions = ['Salary', 'Extra Income', 'Investments', 'Pension', 'Other', 'Custom'];

const toTitleCase = (str) =>
  str
    ? str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
    : '';


function Income() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const { refreshToken } = useAuth();
  const [monthlyBreakdownData, setMonthlyBreakdownData] = useState({});
  const { currencyCode, currencySymbol } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { logout} = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();


  /* ────────────────────────────────
     CACHE DROPDROWN SELECTION LOGIC
   ──────────────────────────────── */
  
  const STORAGE_KEYS = {
    selectedMonth: 'income_selectedMonth',
    selectedCategories: 'income_selectedCategories',
    selectedYearMonths: 'income_selectedYearMonths',
  };

  const defaultMonth = 'Jan';
  const defaultCategories = [...categoryOptions];
  const defaultYearMonths = [...monthOptions];

  // Choose storage based on user type
  const getStorage = () => (user?.is_guest ? sessionStorage : localStorage);

  // State initialized from storage or defaults
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return getStorage().getItem(STORAGE_KEYS.selectedMonth) || defaultMonth;
  });
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const stored = getStorage().getItem(STORAGE_KEYS.selectedCategories);
    return stored ? JSON.parse(stored) : defaultCategories;
  });
  const [selectedYearMonths, setSelectedYearMonths] = useState(() => {
    const stored = getStorage().getItem(STORAGE_KEYS.selectedYearMonths);
    return stored ? JSON.parse(stored) : defaultYearMonths;
  });

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showYearMonthDropdown, setShowYearMonthDropdown] = useState(false);

  // Track previous user to detect guest logout
  const prevUserRef = useRef(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    const isGuestLoggedOut = prevUser?.is_guest && !user;

    if (isGuestLoggedOut) {
      console.log("Guest logged out - resetting income state");

      // Remove guest session data
      sessionStorage.removeItem(STORAGE_KEYS.selectedMonth);
      sessionStorage.removeItem(STORAGE_KEYS.selectedCategories);
      sessionStorage.removeItem(STORAGE_KEYS.selectedYearMonths);

      // Reset React state to defaults
      setSelectedMonth(defaultMonth);
      setSelectedCategories(defaultCategories);
      setSelectedYearMonths(defaultYearMonths);
    }

    // Update ref after checking
    prevUserRef.current = user;
  }, [user]);


  // Save helper — saves to correct storage based on user type
  const saveState = (key, value) => {
    const storage = getStorage();
    if (typeof value === 'object') {
      storage.setItem(key, JSON.stringify(value));
    } else {
      storage.setItem(key, value);
    }
  };

  // Update handlers
  const updateSelectedMonth = (month) => {
    setSelectedMonth(month);
    saveState(STORAGE_KEYS.selectedMonth, month);
  };

  const updateSelectedCategories = (categories) => {
    setSelectedCategories(categories);
    saveState(STORAGE_KEYS.selectedCategories, categories);
  };

  const updateSelectedYearMonths = (months) => {
    setSelectedYearMonths(months);
    saveState(STORAGE_KEYS.selectedYearMonths, months);
  };

  // Handlers for UI events
  const handleMonthChange = (e) => {
    updateSelectedMonth(e.target.value);
    setShowMonthDropdown(false);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    let newCategories;
    if (selectedCategories.includes(value)) {
      newCategories = selectedCategories.filter((cat) => cat !== value);
    } else {
      newCategories = [...selectedCategories, value];
    }
    updateSelectedCategories(newCategories);
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categoryOptions.length) {
      updateSelectedCategories([]);
    } else {
      updateSelectedCategories(categoryOptions);
    }
  };

  const handleYearMonthChange = (e) => {
    const value = e.target.value;
    let newSelectedYearMonths;
    if (selectedYearMonths.includes(value)) {
      newSelectedYearMonths = selectedYearMonths.filter((item) => item !== value);
    } else {
      newSelectedYearMonths = [...selectedYearMonths, value];
    }
    updateSelectedYearMonths(newSelectedYearMonths);
  };

  const handleSelectAllYearMonths = (e) => {
    updateSelectedYearMonths(e.target.checked ? monthOptions : []);
  };


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


  const getLocaleFromCurrency = (currencyCode) => {
    switch (currencyCode) {
      case 'USD':
        return 'en-US';
      case 'EUR':
        return 'de-DE'; 
      case 'GBP':
      default:
        return 'en-GB';
    }
  };

  /* ────────────────────────────────
       FETCH INCOME DATAL
   ──────────────────────────────── */

  const { 
      data: incomeData = [], // Destructure data as incomeData, default to empty array
      isLoading,              // Loading state of the query
      isError,                // Error state of the query
      refetch                 // Function to manually refetch the data
    } = useQuery({
      queryKey: ['incomeData'], // Unique key to identify this query
      queryFn: async () => {     // Function to fetch the income data from API
        const res = await authFetch(
          '/income/',            // Endpoint to fetch income data
          { method: 'GET' },     // HTTP GET method
          refreshToken,          // Pass refreshToken for authentication
          handleSessionExpired   // Callback if session expires
        );

        // Throw error if response not OK (status not 2xx)
        if (!res.ok) {
          throw new Error('Failed to fetch income data');
        }

        return res.json();       // Parse and return JSON response body
      },
      staleTime: 1000 * 60 * 5,    // Cache the data for 5 minutes before refetching
      refetchOnWindowFocus: false, // Disable automatic refetch on window/tab focus
    });

    

  /* ────────────────────────────────
    INCOME MONTHLY BREAKDOWN LOGIC
   ──────────────────────────────── */

  useEffect(() => {
    const breakdown = {}; // Object to hold monthly income breakdown by category and totals

    // Loop through each income entry
    incomeData.forEach(entry => {
      const startDate = new Date(entry.date);
      const startMonthIndex = startDate.getMonth(); // Get month index (0-11) from entry date
      
      // Determine category; if 'custom', use custom_category trimmed and lowercase
      const category = entry.category === 'custom'
        ? entry.custom_category?.trim().toLowerCase()
        : entry.category.toLowerCase();
      
      const rawAmount = Number(entry.amount);
      if (isNaN(rawAmount)) return; // Skip entries with invalid amount

      // Determine which months this entry applies to based on recurring_monthly flag
      const monthsToApply = entry.recurring_monthly === 'yes'
        ? monthOptions.slice(startMonthIndex) // All months from start month onward
        : [monthOptions[startMonthIndex]];   // Only the start month

      // For each month to apply this income entry
      monthsToApply.forEach(month => {
        // Initialize month object if not already present
        if (!breakdown[month]) {
          breakdown[month] = { income: {}, total: 0, formattedTotal: '' };
        }

        // Initialize category amount if not present
        if (!breakdown[month].income[category]) {
          breakdown[month].income[category] = 0;
        }

        // Add amount to category and month total
        breakdown[month].income[category] += rawAmount;
        breakdown[month].total += rawAmount;
      });
    });

    // Format total income for each month as currency string
    Object.keys(breakdown).forEach(month => {
      breakdown[month].formattedTotal = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(breakdown[month].total);
    });

    // Update state with monthly income breakdown data
    setMonthlyBreakdownData(breakdown);
  }, [incomeData]);


  const getChartData = () => {
    // Lowercase selected categories for consistent comparison
    const selected = selectedCategories.map(cat => cat.toLowerCase());
    // Get income data for the selected month, or empty object if none
    const data = monthlyBreakdownData[selectedMonth]?.income || {};

    // If no categories selected, return empty array for chart data
    if (selected.length === 0) return [];

    // List of predefined standard categories
    const standardCategories = ['salary', 'extra income', 'investments', 'pension', 'other', 'custom'];

    // Filter and map income data according to selected categories
    return Object.entries(data)
      .filter(([category]) => {
        const catLower = category.toLowerCase();

        // Case 1: If only 'custom' is selected, show only non-standard (custom) categories
        if (selected.length === 1 && selected[0] === 'custom') {
          return !standardCategories.includes(catLower);
        }

        // Case 2: If both standard and 'custom' selected
        // Include categories that are either selected standard or custom non-standard
        const isCustom = selected.includes('custom') && !standardCategories.includes(catLower);
        const isStandardMatch = selected.includes(catLower);
        return isCustom || isStandardMatch;
      })
      .map(([name, value]) => ({ name, value })); // Map to objects suitable for chart consumption
  };

  const chartData = getChartData(); // Get filtered and formatted chart data based on selections

  

  /* ────────────────────────────────
      YEALY OVERVIEW INCOME LOGIC
   ──────────────────────────────── */

  const getYearlyData = () => {
    // Return empty array if no income data is available
    if (!incomeData || incomeData.length === 0) return [];

    const monthlyTotals = {}; // Object to accumulate total income per month

    // Loop through each income entry
    incomeData.forEach(entry => {
      const startDate = new Date(entry.date);
      const startMonthIndex = startDate.getMonth(); // Get month index (0-11) from entry date

      if (entry.recurring_monthly === 'yes') {
        // If recurring monthly, add amount to all months from start month to December
        for (let i = startMonthIndex; i < 12; i++) {
          const month = monthOptions[i];

          // Initialize month total if not present
          if (!monthlyTotals[month]) monthlyTotals[month] = 0;

          const amount = Number(entry.amount);
          // Add amount if valid number
          if (!isNaN(amount)) {
            monthlyTotals[month] += amount;
          }
        }
      } else {
        // For non-recurring income, add amount only to the start month
        const month = monthOptions[startMonthIndex];
        if (!monthlyTotals[month]) monthlyTotals[month] = 0;

        const amount = Number(entry.amount);
        if (!isNaN(amount)) {
          monthlyTotals[month] += amount;
        }
      }
    });

    // Return array of month data filtered by selectedYearMonths
    return monthOptions
      .filter(month => selectedYearMonths.includes(month)) // Only include selected months
      .map(month => {
        const totalForMonth = monthlyTotals[month] || 0; // Total income for this month or 0 if none

        return {
          month,
          total: totalForMonth,
          // Format total as currency string based on user's currency and locale
          formatted: new Intl.NumberFormat(getLocaleFromCurrency(currencyCode), {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalForMonth),
        };
      });
  };

    /* ────────────────────────────────
      YEALY OVERVIEW ICUSTOM TOOLTIP
   ──────────────────────────────── */

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { formatted } = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#222', color: '#fff', padding: '8px', borderRadius: '5px' }}>
          <p><strong>{label}</strong>: {formatted}</p>
        </div>
      );
    }
    return null;
  };
  

   useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);


  return (
    <>
      <div className="Income-container">
        <h1>Income</h1>

        <div className="add-income-wrapper">
          <div className="add-income-container">
            <p className="click-to-add-text">Click below to add a new income entry</p>
            <button className="add-income-button" onClick={() => setIsAddModalOpen(true)}>
              + Add Income
            </button>
          </div>

          <div className="add-income-container">
            <p className="click-to-add-text">Click below to update or delete an income entry</p>
            <button className="add-income-button" onClick={() => setIsUpdateModalOpen(true)}>
              🖊️ Update Entry
            </button>
          </div>
        </div>

        <div className="income-grid" data-aos="fade-up">        
        <section className="income-breakdown-section">
          <h3 className="income-breakdown-heading">Monthly Breakdown</h3>

          <div className="breakdown-dropdown-bar">
            <div className="breakdown-dropdown-button" onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
              Month: {selectedMonth} ▾
              {showMonthDropdown && (
                <div className="breakdown-dropdown-list">
                  {monthOptions.map((month, index) => (
                    <label key={index}>
                      <input
                        type="radio"
                        name="month"
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

            <div className="breakdown-dropdown-button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
              Select Category ▾
              {showCategoryDropdown && (
                <div className="breakdown-dropdown-list">
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


                <div className="scroll-wrapper-income">
                  <div className="income-breakdown-chart-wrapper">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={getChartData()}
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

                    <div className="income-breakdown-labels">
                      {chartData.map((entry, index) => (
                        <div key={index} className="income-breakdown-label">
                          <span
                            className="label-color"
                            style={{
                              backgroundColor: categoryColors[index % categoryColors.length],
                            }}
                          />
                          {toTitleCase(entry.name)}: {currencySymbol}
                          {entry.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>


        {/* Yearly Breakdown Section */}
        <section className="income-overview-section">
          <h3 className="income-overview-heading">Overview</h3>

          <div className="overview-dropdown-bar">
            <div className="overview-dropdown-button" onClick={() => setShowYearMonthDropdown(!showYearMonthDropdown)}>
              Filter by Month ▾
              {showYearMonthDropdown && (
                <div className="overview-dropdown-list">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedYearMonths.length === monthOptions.length}
                      onChange={handleSelectAllYearMonths}
                    />
                    Select All
                  </label>
                  {monthOptions.map((month, index) => (
                    <label key={index}>
                      <input
                        type="checkbox"
                        value={month}
                        checked={selectedYearMonths.includes(month)}
                        onChange={handleYearMonthChange}
                      />
                      {month}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="income-overview-chart-wrapper">
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={getYearlyData()}>
              <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomLineTooltip />} />
              <Line type="monotone" dataKey="total" stroke="#8e66fc" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
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

        {isAddModalOpen && (
          <AddIncomeModal
             onClose={() => setIsAddModalOpen(false)}
              onSuccess={() => {
                refetch(); // trigger refetch
                setIsAddModalOpen(false);
              }}
          />
        )}

        {isUpdateModalOpen && (
          <UpdateIncomeModal
            onClose={() => setIsUpdateModalOpen(false)}
              onSuccess={() => {
                refetch(); // trigger refetch
                setIsAddModalOpen(false);
              }}
          />
        )}
      </div>
    </>
  );
}

export default Income;
