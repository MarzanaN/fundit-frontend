import React, { useEffect, useState } from 'react';
import '../CSS/Dashboard.css';
import { useAuth} from '../context/AuthContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaTrophy } from 'react-icons/fa';
import { FaList, FaChartPie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const overviewColors = ['#8e66fc', '#000000', '#6c63ff'];

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

const barColors = ['#6c63ff', '#8e66fc', '#4d4cb3', '#000000', '#7266e0', '#4a47a3', '#8c52ff', '#000000', '#7b68ee', '#a088ff'];


function Dashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [overviewData, setOverviewData] = useState([]);
  const [netData, setNetData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedBreakdownType, setSelectedBreakdownType] = useState('income');
  const [breakdownView, setBreakdownView] = useState('pie');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGuestOverlay, setShowGuestOverlay] = useState(false);
  const [total, setTotal] = useState(0);
  const allYears = [currentYear, previousYear];
  const [incomeData, setIncomeData] = useState({});
  const [expenseData, setExpenseData] = useState({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [breakdownData, setBreakdownData] = useState([]);  
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [breakdownError, setBreakdownError] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(months);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [netIncomeError, setNetIncomeError] = useState('');
  const [goalsError, setGoalsError] = useState('');
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
  


const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState(() => {
  return `${currentYear}-01`; 
});


const CustomTooltip = ({ active, label }) => {
  if (active && label) {
    const monthData = netData.find((entry) => entry.month === label);

    if (!monthData) return null;

    const { income, expenses } = monthData;
    const net = income - expenses;

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
        <p>Income: {currencySymbol}{income}</p>
        <p>Expenses: {currencySymbol}{expenses}</p>
        <p>Net Balance: {currencySymbol}{net}</p>
      </div>
    );
  }
  return null;
};

  
useEffect(() => {
  const fetchData = async () => {
    setOverviewLoading(true);
    setOverviewError('');

    try {
      const yearParam = `?year=${selectedYear}`;

      const [incomeRes, expenseRes, generalSavingsRes] = await Promise.all([
        authFetch(`/api/income/${yearParam}`, {}, refreshToken, handleSessionExpired),
        authFetch(`/api/expenses/${yearParam}`, {}, refreshToken, handleSessionExpired),
        authFetch(`/api/general-savings/${yearParam}`, {}, refreshToken, handleSessionExpired),
      ]);

      if (!incomeRes.ok || !expenseRes.ok || !generalSavingsRes.ok) {
        setOverviewError('Failed to load data.');
        setOverviewData([]);
        setOverviewLoading(false);
        return;
      }

      const incomeData = await incomeRes.json();
      const expenseData = await expenseRes.json();
      const savingsData = await generalSavingsRes.json();

      const incomeTotal = incomeData.reduce((acc, item) => acc + parseFloat(item.amount), 0);
      const expenseTotal = expenseData.reduce((acc, item) => acc + parseFloat(item.amount), 0);
      const savingsTotal = savingsData.reduce((acc, item) => acc + parseFloat(item.amount), 0);

      const totalValue = incomeTotal + expenseTotal + savingsTotal;
      setTotal(totalValue);

      if (totalValue === 0) {
        setOverviewData([]);
      } else {
        setOverviewData([
          { name: 'Income', value: incomeTotal },
          { name: 'Expenses', value: expenseTotal },
          { name: 'General Savings', value: savingsTotal },
        ]);
      }
    } catch (error) {
      console.error('Overview fetch error:', error);
      setOverviewError('Network error occurred while loading data.');
    } finally {
      setOverviewLoading(false);
    }
  };

  fetchData();
}, [selectedYear]);

  
useEffect(() => {
  const fetchMonthlyBreakdown = async () => {
    setBreakdownLoading(true);
    setBreakdownError('');

    try {
      const monthParam = `?month=${selectedBreakdownMonth}`;

      const [incomeRes, expenseRes] = await Promise.all([
        authFetch(`/api/income/${monthParam}`, {}, refreshToken, handleSessionExpired),
        authFetch(`/api/expenses/${monthParam}`, {}, refreshToken, handleSessionExpired),
      ]);

      if (!incomeRes.ok || !expenseRes.ok) {
        setBreakdownError('Failed to load monthly breakdown data.');
        setBreakdownLoading(false);
        return;
      }

      const incomeDataRaw = await incomeRes.json();
      const expenseDataRaw = await expenseRes.json();

      const incomeByCat = {};
      incomeDataRaw.forEach(item => {
        incomeByCat[item.category] = (incomeByCat[item.category] || 0) + parseFloat(item.amount);
      });

      const expenseByCat = {};
      expenseDataRaw.forEach(item => {
        expenseByCat[item.category] = (expenseByCat[item.category] || 0) + parseFloat(item.amount);
      });

      const totalInc = Object.values(incomeByCat).reduce((a, b) => a + b, 0);
      const totalExp = Object.values(expenseByCat).reduce((a, b) => a + b, 0);

      setIncomeData(incomeByCat);
      setExpenseData(expenseByCat);
      setTotalIncome(totalInc);
      setTotalExpense(totalExp);
      setNetBalance(totalInc - totalExp);

      const dataToSet = selectedBreakdownType === 'income' ? incomeByCat : expenseByCat;
      setBreakdownData(
        Object.entries(dataToSet).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        }))
      );
    } catch (err) {
      setBreakdownError('Failed to load monthly breakdown data.');
    } finally {
      setBreakdownLoading(false);
    }
  };

  fetchMonthlyBreakdown();
}, [selectedBreakdownMonth, selectedBreakdownType]);

  
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
  
  useEffect(() => {
    const fetchNetIncomeData = async () => {
      if (selectedMonths.length === 0) return;
  
      setNetData([]);
      setNetIncomeError('');
  
      try {
        const monthlyData = [];
  
        for (const month of selectedMonths) {
          const monthNumber = monthMap[month] || month;
          const apiMonth = `${currentYear}-${monthNumber}`;
  
          const [incomeRes, expenseRes] = await Promise.all([
            authFetch(`/api/income/?month=${apiMonth}`, {}, refreshToken, handleSessionExpired),
            authFetch(`/api/expenses/?month=${apiMonth}`, {}, refreshToken, handleSessionExpired),
          ]);
  
          if (!incomeRes.ok || !expenseRes.ok) {
            throw new Error('One of the requests failed.');
          }
  
          const incomeData = await incomeRes.json();
          const expenseData = await expenseRes.json();
  
          const incomeTotal = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
          const expenseTotal = expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
          const net = incomeTotal - expenseTotal;
  
          monthlyData.push({
            month,
            income: incomeTotal,
            expenses: expenseTotal,
            net,
          });
        }
  
        setNetData(monthlyData);
      } catch (err) {
        setNetIncomeError('Failed to fetch net income data.');
        console.error('Failed to fetch net income data:', err);
      }
    };
  
    fetchNetIncomeData();
  }, [selectedMonths]);
  
  
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);


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


  const filteredData = netData
    .filter(item => selectedMonths.includes(item.month))
    .map(item => ({
      ...item,
      net: item.income - item.expenses
    }));

    const currentIncomeData = incomeData || {};
    const currentExpenseData = expenseData || {};
    
    const currentTotalIncome = Object.values(currentIncomeData).reduce((sum, val) => sum + val, 0);
    const currentTotalExpense = Object.values(currentExpenseData).reduce((sum, val) => sum + val, 0);
    const currentNetBalance = currentTotalIncome - currentTotalExpense;
    
    const currentBreakdownData = Object.entries(
      selectedBreakdownType === 'income' ? currentIncomeData : currentExpenseData
    ).map(([name, value]) => ({ name, value }));
    

      const toggleBreakdownView = (view) => {
        setBreakdownView(view);
      };

      
      useEffect(() => {
        const fetchGoals = async () => {
          setGoalsError('');
      
          try {
            const savingsRes = await authFetch(
              "/api/savings-goals/",
              {},
              refreshToken,
              handleSessionExpired
            );
      
            if (!savingsRes.ok) {
              if (savingsRes.status === 401) {
                setGoalsError('Session has expired. Please sign in again.');
                return;
              }
              throw new Error("Failed to fetch savings goals");
            }
      
            const savingsData = await savingsRes.json();
      
            if (!savingsData || savingsData.length === 0) {
              setGoalsError('No savings goals have been made.');
              setSavingsGoals([]);
              return;
            }
      
            const topTwoGoals = savingsData
              .sort((a, b) => Number(b.goal_amount) - Number(a.goal_amount))
              .slice(0, 2);
      
            const transformGoal = (goal) => ({
              id: goal.id,
              goalName: goal.goal_name?.charAt(0).toUpperCase() + goal.goal_name?.slice(1),
              category: goal.category,
              amount: Number(goal.goal_amount) || 0,
              current: Number(goal.current_amount) || 0,
            });
      
            setSavingsGoals(topTwoGoals.map(transformGoal));
          } catch (error) {
            setGoalsError('Failed to load savings goals.');
            console.error("Error fetching goals:", error);
          }
        };
      
        fetchGoals();
      }, []);
      
      
  return (

    <div className="dashboard-container">
            {showGuestOverlay && (
        <div className="guest-overlay">
          <div className="guest-overlay-content">
            <h2 className='welcome-message'>Welcome to Fundit!</h2>
            <p className='welcome-text'>
              We've provided some sample data to help you explore and visualise Fundit's features.
              Feel free to play around and see how it works! 🎉<br /><br />
              <span>Please note that once the session expires or you log out, any new data will not be saved.</span>
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
  <section className="dashboard-overview-section" data-aos="fade-up">
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
          <section className="dashboard-monthly-breakdown-section" data-aos="fade-up">
            <h3 className="dashboard-overview-heading">Monthly Breakdown</h3>

            <div className="dashboard-breakdown-controls">
            <select
                value={selectedBreakdownMonth}
                onChange={e => setSelectedBreakdownMonth(e.target.value)}
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
                    onClick={() => toggleBreakdownView('list')}
                    >
                    <FaList className="icon" />
                    List View
                </button>
                <button
                    className={`breakdown-view-btn ${breakdownView === 'pie' ? 'selected' : ''}`}
                    onClick={() => toggleBreakdownView('pie')}
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
                  Filter by Month
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu-net">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedMonths.length === months.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMonths(months);
                          } else {
                            setSelectedMonths([]);
                          }
                        }}
                      />
                      Select All
                    </label>
                    {months.map((month) => (
                      <label key={month}>
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMonths((prev) => [...prev, month]);
                            } else {
                              setSelectedMonths((prev) =>
                                prev.filter((m) => m !== month)
                              );
                            }
                          }}
                        />
                        {month}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <ResponsiveContainer width="100%" height={460}>
                <BarChart data={filteredData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${currencySymbol}${value}`} />
                    <YAxis type="category" dataKey="month" />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Inject hidden data for tooltip access */}
                    <Bar dataKey="income" fill="transparent" hide />
                    <Bar dataKey="expenses" fill="transparent" hide />

                    {/* Visible bar for net balance */}
                    <Bar dataKey="net" isAnimationActive animationBegin={0} animationDuration={1000}>
                    {filteredData.map((entry, index) => (
                        <Cell
                        key={`bar-${index}`}
                        fill={barColors[index % barColors.length]}
                    />
                ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
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

