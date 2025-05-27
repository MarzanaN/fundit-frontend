import { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../CSS/SignIn.css';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignIn({ onClose }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Unexpected response from server');
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        const message = data?.detail || 'Invalid credentials';
  
        if (message === 'Email not found.') {
          throw new Error('This email is not registered.');
        } else if (message === 'Incorrect password.') {
          throw new Error('The password you entered is incorrect.');
        } else if (message === 'Account is not activated. Please check your email.') {
          throw new Error('Sign in unsuccessful. Account needs to be activated.');
        } else {
          throw new Error(message);
        }
      }
  
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
  
      login({
        name: `${data.user.first_name} ${data.user.last_name}`,
        email: data.user.email,
        id: data.user.id,
      });
  
      setSuccess('Signed in successfully!');
      setTimeout(() => setSuccess(''), 5000);
  
      navigate('/dashboard');
      onClose();
  
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };
  

  const handleForgotPassword = () => {
    setFadeOut(true);
    setTimeout(() => {
      onClose(); 
      navigate('/forgot-password');
    }, 300); 
  };

  return (
    <div className={`signin-container ${fadeOut ? 'fade-out' : ''}`}>
      <form className="signin-box" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="public-input-group">
          <FaEnvelope className="public-input-icon" />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="public-input-group">
            <span className="public-input-icon"><FaLock /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <span
              className="toggle-password-icon"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer', marginLeft: '8px' }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

        <div className="forgot-password">
          <span onClick={handleForgotPassword} style={{ cursor: 'pointer', fontSize: '12px', color: '#007bff' }}>
            Forgot Password?
          </span>
        </div>

        <button type="submit" className="signin-button">Sign In</button>
      </form>
    </div>
  );
}
