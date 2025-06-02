import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import '../CSS/SignIn.css'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API_BASE_URL from '../api';


function Register() {
  // State to hold form input values for registration fields
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // State to track current status message (loading, error, success, etc.)
  const [status, setStatus] = useState(null);

  // State to toggle showing/hiding password input field
  const [showPassword, setShowPassword] = useState(false);

  async function registerUser(event) {
    event.preventDefault();       // Prevent default form submission behavior
    setStatus('loading');         // Set status to loading to indicate process started

    try {
      // Send POST request to registration endpoint with form data as JSON
      const response = await fetch(`${API_BASE_URL}/register/`, {
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

      const data = await response.json();  // Parse JSON response

      if (response.ok) {
        // If registration successful, show success message with instructions
        setStatus(`Registration successful. Please check your inbox to activate the account 
          (check spam / junk folder!)`);
        // Clear status message after 5 seconds
        setTimeout(() => setStatus(null), 5000);
      } else {
        // Log error details in console for debugging
        console.error('Registration error:', data);
        // Extract first error from email or password fields or show generic message
        const firstError = data.email?.[0] || data.password?.[0] || 'Registration failed. Please try again.';
        setStatus(firstError);              // Show error message to user
        setTimeout(() => setStatus(null), 5000); // Clear status after 5 seconds
      }
    } catch (err) {
      // Handle network or other fetch errors
      setStatus('Registration failed due to network error.');
      setTimeout(() => setStatus(null), 5000);  // Clear status after 5 seconds
      console.error('Registration failed:', err.message);  // Log error message for debugging
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