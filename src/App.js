import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Support from './pages/Support';
import SignIn from './pages/SignIn';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Settings from './pages/Settings';

function AppWrapper() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isDashboardRoute = location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/income') ||
      location.pathname.startsWith('/expenses') ||
      location.pathname.startsWith('/goals') ||
      location.pathname.startsWith('/settings');

    document.body.style.margin = user && isDashboardRoute ? '0' : '';
  }, [user, location]);

  return (
    <div className="App">
      <NavBar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/support" element={<Support />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
