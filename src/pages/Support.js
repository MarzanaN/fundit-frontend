import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaTools } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../CSS/Support.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

function Support() {
  const { user, refreshToken, logout } = useAuth(); 
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');  
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

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


  useEffect(() => {
    // Whenever 'status' changes, check if it contains 'success' or 'fail'
    if (status.toLowerCase().includes('success') || status.toLowerCase().includes('fail')) {
      // Set a timer to clear the status message after 4 seconds
      const timer = setTimeout(() => {
        setStatus('');  // Clear the status message
      }, 4000);

      // Cleanup function to clear the timer if component unmounts or status changes
      return () => clearTimeout(timer);
    }
  }, [status]);  // Run this effect only when 'status' changes


  const handleSubmit = async () => {
    setStatus('Sending...');  // Show sending status immediately

    try {
      // Call the custom authFetch function to POST support message data
      const response = await authFetch(
        '/support/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send form data as JSON in the request body
          body: JSON.stringify({ name, email, issue_type: issueType, message }),
        },
        refreshToken,        // Pass refresh token for auth handling
        handleSessionExpired // Callback to handle expired sessions
      );

      if (response.ok) {
        // If response is OK, update status to success message
        setStatus('Message sent successfully!');
        // Clear the input fields after successful send
        setName('');
        setEmail(user?.email || '');  // Reset email to user email or empty
        setIssueType('');
        setMessage('');
      } else {
        // If response not OK, throw error to trigger catch block
        throw new Error('Failed to send');
      }
    } catch (error) {
      // Log the error for debugging
      console.error(error);
      // Set status to failure message
      setStatus('Failed to send message.');
    }
  };


    useEffect(() => {
    AOS.init({ duration: 1000 });
    if (user) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
    return () => {
      if (user) {
        document.body.style.margin = '';
        document.body.style.padding = '';
      }
    };
  }, [user]);


  return (
    <SupportForm
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      issueType={issueType}
      setIssueType={setIssueType}
      message={message}
      setMessage={setMessage}
      handleSubmit={handleSubmit}
      status={status}
      user={user}
      showSessionExpired={showSessionExpired}     
      handleModalClose={handleModalClose}
    />
  );
}

function SupportForm({
  name,
  setName,
  email,
  setEmail,
  issueType,
  setIssueType,
  message,
  setMessage,
  handleSubmit,
  status,
  user,
  showSessionExpired,
  handleModalClose,
}) {
  const dashboard = !!user;

  function getStatusClass(status) {
    if (status.toLowerCase().includes('sending')) return 'status-sending';
    if (status.toLowerCase().includes('success')) return 'status-success';
    if (status.toLowerCase().includes('fail')) return 'status-fail';
    return '';
  }

  return (
    <div className={dashboard ? 'support-container-dashboard' : 'support-container'}>
      <div className={dashboard ? 'support-box-dashboard' : 'support-box'} data-aos="fade-up">
        <h2>Contact Support</h2>
        <div className={dashboard ? 'support-input-group-dashboard' : 'support-input-group'}>
          <FaUser className={dashboard ? 'support-input-icon-dashboard' : 'support-input-icon'} />
          <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={dashboard ? 'support-input-group-dashboard' : 'support-input-group'}>
          <FaEnvelope className={dashboard ? 'support-input-icon-dashboard' : 'support-input-icon'} />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={dashboard ? 'support-input-group-dashboard' : 'support-input-group'}>
          <FaTools className={dashboard ? 'support-input-icon-dashboard' : 'support-input-icon'} />
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className={dashboard ? 'custom-select-dashboard' : 'custom-select'}
          >
            <option value="">Select Support Issue</option>
            <option value="login">Login Issues</option>
            <option value="feature">Feature Request</option>
            <option value="bug">Report a Bug</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className={dashboard ? 'support-input-group-dashboard' : 'support-input-group'}>
          <textarea
            className={dashboard ? 'message-box-dashboard' : 'message-box'}
            placeholder="Type your message here..."
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <button className={dashboard ? 'signin-button-dashboard' : 'signin-button'} onClick={handleSubmit}>
          Send
        </button>
        <p className={`support-status-message ${getStatusClass(status)}`}>{status}</p>
      </div>
      {showSessionExpired && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Session Expired</h3>
            <p className="expired">Your session has expired. Please log in again.</p>
            <button className="yes-button" onClick={handleModalClose}>
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Support;
