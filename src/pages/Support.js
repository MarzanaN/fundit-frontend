import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaTools } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../CSS/Support.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    if (status.toLowerCase().includes('success') || status.toLowerCase().includes('fail')) {
      const timer = setTimeout(() => {
        setStatus('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async () => {
    setStatus('Sending...');
    try {
      const response = await authFetch(
        '/api/support/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, issue_type: issueType, message }),
        },
        refreshToken,
        handleSessionExpired
      );

      if (response.ok) {
        setStatus('Message sent successfully!');
        setName('');
        setEmail(user?.email || '');
        setIssueType('');
        setMessage('');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error(error);
      setStatus('Failed to send message.');
    }
  };

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
