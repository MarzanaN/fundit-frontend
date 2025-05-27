import React, { useState, useEffect } from 'react';
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

const categoryColors = ['#8e66fc', '#6c63ff', '#3c3c3c', '#b388ff', '#a1a1ff', '#7a7aff'];
const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const categoryOptions = ['Salary', 'Extra Income', 'Investments', 'Pension', 'Other', 'Custom'];

function Income() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Jan');
  const [selectedCategories, setSelectedCategories] = useState([...categoryOptions]); 
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedYearMonths, setSelectedYearMonths] = useState([...monthOptions]);
  const [showYearMonthDropdown, setShowYearMonthDropdown] = useState(false);
  const { refreshToken } = useAuth();
  const [incomeData, setIncomeData] = useState([]);
  const [monthlyBreakdownData, setMonthlyBreakdownData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { currencyCode, currencySymbol } = useAuth();
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
  

  const fetchAllIncome = async () => {
    setLoading(true);
    setMessage('');
  
    try {
      const res = await authFetch(
        '/api/income/',
        { method: 'GET' },
        refreshToken,
        handleSessionExpired
      );
  
      if (!res.ok) {
        if (res.status === 401) {
          return;
        }
        setMessage('Failed to fetch income data.');
        setIncomeData([]);
        setLoading(false);
        return;
      }
  
      const data = await res.json();
      setIncomeData(data);
    } catch (error) {
      console.error('Error fetching income:', error);
      setMessage('Network error while fetching income data.');
      setIncomeData([]);
    }
  
    setLoading(false);
  };
  

    useEffect(() => {
      fetchAllIncome();
    }, [refreshToken]);
    

  useEffect(() => {
    const breakdown = {};
  
    incomeData.forEach(entry => {
      const startDate = new Date(entry.date);
      const startMonthIndex = startDate.getMonth();
      const category = entry.category;
      const rawAmount = Number(entry.amount);
      if (isNaN(rawAmount)) return;
  
      const monthsToApply = entry.recurring_monthly === 'yes'
        ? monthOptions.slice(startMonthIndex) 
        : [monthOptions[startMonthIndex]];    
      monthsToApply.forEach(month => {
        if (!breakdown[month]) {
          breakdown[month] = { income: {}, total: 0, formattedTotal: '' };
        }
  
        if (!breakdown[month].income[category]) {
          breakdown[month].income[category] = 0;
        }
        breakdown[month].income[category] += rawAmount;
        breakdown[month].total += rawAmount;
      });
    });
  
    Object.keys(breakdown).forEach(month => {
      breakdown[month].formattedTotal = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currencyCode , 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(breakdown[month].total);
    });
  
    setMonthlyBreakdownData(breakdown);
  }, [incomeData]);
  

  const getChartData = () => {
    const selected = selectedCategories.map(cat => cat.toLowerCase());
    const data = monthlyBreakdownData[selectedMonth]?.income || {};
  
    if (selected.length === 0) return [];
  
    return Object.entries(data)
      .filter(([category]) => selected.includes(category.toLowerCase()))
      .map(([name, value]) => ({ name, value }));
  };
  

  const chartData = getChartData(); 
  
  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categoryOptions.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categoryOptions);
    }
  };
  

const handleCategoryChange = (e) => {
  const value = e.target.value;
  if (selectedCategories.includes(value)) {
    setSelectedCategories(selectedCategories.filter((cat) => cat !== value));
  } else {
    setSelectedCategories([...selectedCategories, value]);
  }
};


  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setShowMonthDropdown(false);
  };

  const handleYearMonthChange = (e) => {
    const value = e.target.value;
    setSelectedYearMonths((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleSelectAllYearMonths = (e) => {
    setSelectedYearMonths(e.target.checked ? [...monthOptions] : []);
  };

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);


  const getYearlyData = () => {
    if (!incomeData || incomeData.length === 0) return [];
  
    const monthlyTotals = {};
  
    incomeData.forEach(entry => {
      const startDate = new Date(entry.date);
      const startMonthIndex = startDate.getMonth();
  
      if (entry.recurring_monthly === 'yes') {
        for (let i = startMonthIndex; i < 12; i++) {
          const month = monthOptions[i];
  
          if (!monthlyTotals[month]) monthlyTotals[month] = 0;

          const amount = Number(entry.amount);
          if (!isNaN(amount)) {
            monthlyTotals[month] += amount;
          }
        }
      } else {
        const month = monthOptions[startMonthIndex];
        if (!monthlyTotals[month]) monthlyTotals[month] = 0;
  
        const amount = Number(entry.amount);
        if (!isNaN(amount)) {
          monthlyTotals[month] += amount;
        }
      }
    });
  
    return monthOptions
      .filter(month => selectedYearMonths.includes(month))
      .map(month => {
        const totalForMonth = monthlyTotals[month] || 0;
  
        return {
          month,
          total: totalForMonth,
          formatted: new Intl.NumberFormat(getLocaleFromCurrency(currencyCode), {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalForMonth),
          
        };
      });
  };
  
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
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${currencySymbol}${value}`, name]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="income-breakdown-labels">
              {chartData.map((entry, index) => (
                <div key={index} className="income-breakdown-label">
                  <span
                    className="label-color"
                    style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                  />
                  {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: {currencySymbol}{entry.value}
                </div>
              ))}
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
            onSuccess={fetchAllIncome}
          />
        )}

        {isUpdateModalOpen && (
          <UpdateIncomeModal
            onClose={() => setIsUpdateModalOpen(false)}
            onSuccess={fetchAllIncome}
          />
        )}
      </div>
    </>
  );
}

export default Income;
