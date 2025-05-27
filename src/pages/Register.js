// src/pages/Register.js
import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import '../CSS/SignIn.css'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';


function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);


  async function registerUser(event) {
    event.preventDefault();
    setStatus('loading');
  
    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setStatus(`Registration successful. Please check your inbox to activate the account 
          (check spam / junk folder!)`);       
        setTimeout(() => setStatus(null), 5000);   
        console.log('User registered:', data);
      } else {
        console.error('Registration error:', data);
        const firstError = data.email?.[0] || data.password?.[0] || 'Registration failed. Please try again.';
        setStatus(firstError);
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (err) {
      setStatus('Registration failed due to network error.');
      setTimeout(() => setStatus(null), 5000);
      console.error('Registration failed:', err.message);
    }
  }
  
  return (
    <div className="signin-container">
      <div className="signin-box">
        <h2>Register</h2>
        <form onSubmit={registerUser}>
          <div className="public-input-group">
            <span className="public-input-icon"><FaUser /></span>
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>

          <div className="public-input-group">
            <span className="public-input-icon"><FaUser /></span>
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>

          <div className="public-input-group">
            <span className="public-input-icon"><FaEnvelope /></span>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
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

          <button type="submit" className="signin-button">Register</button>
        </form>

        {status && (
          <p
            style={{
              color:
                status.startsWith('Registration successful')
                  ? 'green'
                  : status === 'loading'
                  ? 'white'
                  : 'red',
            }}
          >
            {status === 'loading' ? 'Registering...' : status}
          </p>
        )}

      </div>
    </div>
  );
}

export default Register;