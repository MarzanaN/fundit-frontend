import React, { useEffect } from 'react';
import { FaChartPie, FaWallet, FaBullseye } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../CSS/Features.css';

// Sample expense data with categories and their values
const expenseData = [
  { name: 'Mortgage', value: 800 },
  { name: 'Food', value: 300 },
  { name: 'Entertainment', value: 200 },
  { name: 'Utilities', value: 150 },
  { name: 'Transport', value: 100 }
];

// Colors used for the pie chart slices or labels
const COLORS = ['#8e66fc', '#ffffff', '#6c63ff', '#00bfff', '#483d8b'];

// Custom label renderer for pie chart slices
const renderCustomLabel = ({
    cx, cy, midAngle, outerRadius, index, name, value
  }) => {
    const RADIAN = Math.PI / 180; // Convert degrees to radians for trig functions
    const spacing = 35;           // Distance to offset label from pie slice edge
    const radius = outerRadius + spacing; // Radius for label position outside pie slice

    // Calculate label coordinates using trigonometry based on midAngle
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Select fill color for label based on slice index, cycling through COLORS array
    const fill = COLORS[index % COLORS.length];
  
    return (
      <text
        x={x}
        y={y}
        fill={fill}
        // Align text to start or end depending on position relative to center
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12px"
      >
        {/* Display category name above the value */}
        <tspan x={x} dy="-0.5em">{name}</tspan>
        {/* Display value with £ currency symbol below the name */}
        <tspan x={x} dy="1.2em">£{value}</tspan>
      </text>
    );
  };

// Sample budget data showing category budgets and current spend
const budgetData = [
  { category: 'Food', budget: 400, current: 300 },
  { category: 'Transport', budget: 150, current: 100 },
  { category: 'Entertainment', budget: 250, current: 200 },
];

// Features component initialization
function Features() {
  // Initialize Animate On Scroll (AOS) library with 1 second duration for animations
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  
  return (
    <div className="features-page">
      <section className="features-hero" data-aos="fade-up">
        <h1>Powerful Features for Smarter Finances</h1>
        <p>Fundit helps you budget better, track smarter, and reach your goals faster.</p>
      </section>

      <section className="feature-section" data-aos="fade-up">
        <div className="feature-text">
          <h2>Track Expenses & Income</h2>
          <p>Easily visualize where your money is going. Categories like mortgage, food, and entertainment are clearly shown for smarter decisions.</p>
        </div>

        <div className="feature-chart">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={renderCustomLabel}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `£${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="feature-section reverse" data-aos="fade-up">
        <div className="feature-info">
          <FaWallet className="feature-icon" />
          <h2>Budget by Category</h2>
          <p>Compare your set budgets with actual spending to stay on track.</p>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value}`} />
              <Bar dataKey="budget" fill="#8e66fc">
                <LabelList dataKey="budget" position="top" formatter={(v) => `£${v}`} />
              </Bar>
              <Bar dataKey="current" fill="#00bfff">
                <LabelList dataKey="current" position="top" formatter={(v) => `£${v}`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="feature-section financial-goals-section" data-aos="fade-up">
        <div className="feature-info">
          <FaBullseye className="feature-icon" />
          <h2>Financial Goals</h2>
          <p>Track your savings goals and monitor progress visually.</p>
          <h4 className="goal-heading">Savings Goal: £5,000</h4>
          <div className="goal-bar-container">
            <p>100% Target:</p>
            <div className="goal-bar">
              <div className="goal-fill full">£5,000</div>
            </div>
            <p>75% Current:</p>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: '75%' }}>£3,750</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Features;
