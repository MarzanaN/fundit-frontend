import React, { useState, useEffect } from 'react';
import '../CSS/Expenses.css';
import '../CSS/Income.css';
import AddExpenseModal from './AddExpenseModal';
import UpdateExpenseModal from './UpdateExpenseModal';
import CreateBudgetModal from './CreateBudgetModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const categoryColors = ['#8e66fc', '#6c63ff', '#3c3c3c', '#b388ff', '#a1a1ff', '#7a7aff'];
const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const categoryOptions = ['Housing', 'Transport', 'Food', 'Healthcare', 'Personal', 'Entertainment', 'Debt', 'Savings', 'Miscellaneous', 'Custom'];

function Expenses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedCategories, setSelectedCategories] = useState([...categoryOptions]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { refreshToken } = useAuth();
  const [expenseData, setExpenseData] = useState([]);
  const [topRecurringExpenses, setTopRecurringExpenses] = useState([]);
  const [combinedBudgetData, setCombinedBudgetData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [budgetSelectedCategories, setBudgetSelectedCategories] = useState([...categoryOptions]);
  const [budgetSelectedMonth, setBudgetSelectedMonth] = useState("Jan");
  const [showBudgetMonthDropdown, setShowBudgetMonthDropdown] = useState(false);
  const [showBudgetCategoryDropdown, setShowBudgetCategoryDropdown] = useState(false);
  const [monthlyBreakdownData, setMonthlyBreakdownData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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


  const fetchAllExpenses = async () => {
    setLoading(true);
    setMessage('');
  
    try {
      const res = await authFetch(
        '/api/expenses/',
        { method: 'GET' },
        refreshToken,
        handleSessionExpired
      );
  
      if (!res.ok) {
        if (res.status === 401) {
          return;
        }
        setMessage('Failed to fetch expense data.');
        setExpenseData([]);
        return;
      }
  
      const data = await res.json();
      setExpenseData(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMessage('Network error while fetching expense data.');
      setExpenseData([]);
    }
  
    setLoading(false);
  };
  

  useEffect(() => {
      const breakdown = {};
    
      expenseData.forEach(entry => {
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
            breakdown[month] = { expense: {}, total: 0, formattedTotal: '' };
          }
    
          if (!breakdown[month].expense[category]) {
            breakdown[month].expense[category] = 0;
          }
          breakdown[month].expense[category] += rawAmount;
          breakdown[month].total += rawAmount;
        });
      });
    
      setMonthlyBreakdownData(breakdown);
    }, [expenseData]);
  
  
const getChartData = () => {
      const selected = selectedCategories.map(cat => cat.toLowerCase());
      const data = monthlyBreakdownData[selectedMonth]?.expense || {};

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


useEffect(() => {
  if (!expenseData || expenseData.length === 0) {
    setTopRecurringExpenses([]);
    return;
  }

  const recurringMap = {};

  expenseData.forEach(entry => {
    if (entry.recurring_monthly === 'yes') {
      const category = entry.custom_category || entry.category;
      const amount = Number(entry.amount);
      if (!isNaN(amount)) {
        recurringMap[category] = (recurringMap[category] || 0) + amount;
      }
    }
  });

  const sorted = Object.entries(recurringMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount
    }));

  setTopRecurringExpenses(sorted);
}, [expenseData]);


const fetchAllBudgets = async () => {
  setMessage('');

  try {
    const res = await authFetch(
      '/api/budgets/',
      { method: 'GET' },
      refreshToken,
      handleSessionExpired
    );

    if (!res.ok) {
      if (res.status === 401) {
        return;
      }
      setMessage('Failed to fetch budget data.');
      setBudgetData([]);
      return;
    }

    const data = await res.json();
    setBudgetData(data);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    setMessage('Network error while fetching budget data.');
    setBudgetData([]);
  }
};

useEffect(() => {
  fetchAllExpenses();
  fetchAllBudgets();
}, [refreshToken]);


useEffect(() => {
  if (!budgetData || !expenseData) return;

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const expanded = [];

  for (const budget of budgetData) {
    const startMonth = new Date(budget.date).getMonth(); 
    const monthAbbr = new Date(budget.date).toLocaleString('default', { month: 'short' });

    const category = budget.category.toLowerCase() === 'custom'
      ? budget.custom_category.toLowerCase()
      : budget.category.toLowerCase();

    const monthsToInclude = budget.recurring_monthly === 'yes'
      ? allMonths.slice(startMonth)
      : [monthAbbr];

    for (const month of monthsToInclude) {
      const expenses = expenseData.filter(exp => {
        const expCategory = exp.category.toLowerCase() === 'custom'
          ? exp.custom_category.toLowerCase()
          : exp.category.toLowerCase();
        const expMonth = new Date(exp.date).toLocaleString('default', { month: 'short' });

        return expCategory === category && expMonth === month;
      });

      const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      expanded.push({
        ...budget,
        month,
        current: totalExpense,
        budget: Number(budget.amount),
        category,
      });
    }
  }

  setCombinedBudgetData(expanded);
}, [budgetData, expenseData]);



const filteredCombinedData = combinedBudgetData.filter((item, i) => {
  if (!item.category) console.warn(`Missing category at index ${i}`, item);
  
  if (!item.month) {
    if (item.date) {
      item.month = new Date(item.date).toLocaleString('default', { month: 'short' });
    } else {
      item.month = 'unknown';
    }
  }

  const category = (item.category || '').toLowerCase();
  const selectedCategoriesLower = budgetSelectedCategories.map(cat => cat.toLowerCase());

  const month = (item.month || '').toLowerCase();
  const selectedMonth = (budgetSelectedMonth || '').toLowerCase();

  const categoryMatch = selectedCategoriesLower.length === 0 || selectedCategoriesLower.includes(category);
  const monthMatch = !budgetSelectedMonth || month === selectedMonth;

  return categoryMatch && monthMatch;
});


  const handleBudgetMonthChange = (e) => {
    setBudgetSelectedMonth(e.target.value);
    setShowBudgetMonthDropdown(false);
  };

  const handleBudgetCategoryChange = (e) => {
    const value = e.target.value;
    setBudgetSelectedCategories(prev =>
      prev.includes(value)
        ? prev.filter(cat => cat !== value)
        : [...prev, value]
    );
  };

  const handleSelectAllBudgetCategories = () => {
    if (budgetSelectedCategories.length === categoryOptions.length) {
      setBudgetSelectedCategories([]);
    } else {
      setBudgetSelectedCategories([...categoryOptions]);
    }
  };
  

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
            <div className="scroll-wrapper-expense">
              <div className="scroll-wrapper-expense scroll-content">
            <div className="expense-breakdown-chart-wrapper">
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
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${currencySymbol}${value}`, name]} />
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
            fetchAllExpenses();
            fetchAllBudgets(); 
          }}
        />
      )}

      {isUpdateModalOpen && (
        <UpdateExpenseModal
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={() => {
            fetchAllExpenses();
            fetchAllBudgets();
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateBudgetModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchAllBudgets(); 
          }}
        />
      )}

    </>
  );
  
}

export default Expenses;
