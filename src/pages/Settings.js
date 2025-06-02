import React, { useState, useEffect } from 'react';
import '../CSS/Settings.css';
import { FaUpload, FaStar, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import API_BASE_URL from '../api';

function Settings() {
  const { user, login, refreshToken} = useAuth();
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [showChangePasswordOverlay, setShowChangePasswordOverlay] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteMessageType, setDeleteMessageType] = useState(''); 
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState(''); 
  const [message, setMessage] = useState('');
  const { logout} = useAuth();
  const navigate = useNavigate();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { refreshUser } = useAuth();

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


  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    sex: '',
    dob: '',
    currency: 'GBP',
  });


    /* ────────────────────────────────
     FETCH USER DATA FOR SETTINGS PAGE
   ──────────────────────────────── */

  useEffect(() => {
    // Define async function to fetch user data from API
    const fetchUserData = async () => {
      try {
        // Make authenticated GET request to fetch user details
        const res = await authFetch(
          '/user/',
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
          refreshToken,           // Token used for refreshing authentication
          handleSessionExpired    // Callback to handle session expiration
        );

        // Check if response is not successful, throw error to trigger catch block
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }

        // Parse response JSON data
        const data = await res.json();

        // Format date of birth by removing time part (ISO string to YYYY-MM-DD)
        const formattedDob = data.dob ? data.dob.split('T')[0] : '';

        // Update form data state with fetched user information, use defaults if missing
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          password: '',           // Password left empty for security
          sex: data.sex || '',
          dob: formattedDob,      // Formatted date of birth
          currency: data.currency || 'GBP', // Default currency is GBP
        });
      } catch (error) {
        // Log error if fetching user data fails
        console.error('Error fetching user data:', error);
      }
    };

    // Call the async fetchUserData function once when refreshToken changes
    fetchUserData();
  }, [refreshToken]);


  /* ────────────────────────────────
     UPDATE AND SUBMIT LOGIC
   ──────────────────────────────── */

  useEffect(() => {
    if (user) {
      // Format date of birth to YYYY-MM-DD or empty string if no DOB
      const formattedDob = user.dob ? user.dob.split('T')[0] : '';

      // Format sex field to standardized values or keep original if unknown
      let formattedSex = '';
      if (user.sex) {
        const lowerSex = user.sex.toLowerCase();
        if (lowerSex === 'male' || lowerSex === 'm') formattedSex = 'Male';
        else if (lowerSex === 'female' || lowerSex === 'f') formattedSex = 'Female';
        else formattedSex = user.sex;
      }

      // Format currency code to uppercase or default to 'GBP'
      const formattedCurrency = user.currency ? user.currency.toUpperCase() : 'GBP';

      // Set formData state with user's profile information or sensible defaults
      setFormData({
        firstName: user.first_name || (user.name ? user.name.split(' ')[0] : ''),
        lastName: user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        email: user.email || '',
        password: '',   // Clear password field by default
        sex: formattedSex,
        dob: formattedDob,
        currency: formattedCurrency,
      });
    }
  }, [user]);


  const handleUpdatePassword = async () => {
    // Validate that current and new password fields are filled
    if (!currentPassword || !newPassword) {
      setPasswordUpdateMessage('Please complete all required fields.');
      setPasswordMessageType('error');
      // Clear message after 4 seconds
      setTimeout(() => {
        setPasswordUpdateMessage('');
        setPasswordMessageType('');
      }, 4000);
      return;
    }

    // Validate new password length is at least 8 characters
    if (newPassword.length < 8) {
      setPasswordUpdateMessage('New password must be at least 8 characters.');
      setPasswordMessageType('error');
      // Clear message after 4 seconds
      setTimeout(() => {
        setPasswordUpdateMessage('');
        setPasswordMessageType('');
      }, 4000);
      return;
    }

    try {
      // Make authenticated POST request to change password endpoint
      const response = await authFetch(
        '/settings/change-password/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
        refreshToken,
        handleSessionExpired
      );

      // Handle error response and display error message
      if (!response.ok) {
        const errorData = await response.json();
        setPasswordUpdateMessage(
          errorData.current_password || errorData.detail || 'Password update failed.'
        );
        setPasswordMessageType('error');
        setTimeout(() => {
          setPasswordUpdateMessage('');
          setPasswordMessageType('');
        }, 4000);
        return;
      }

      // On success, show success message and clear password inputs
      setPasswordUpdateMessage('Password updated successfully!');
      setPasswordMessageType('success');
      setCurrentPassword('');
      setNewPassword('');

      // Hide success message and overlay after 2 seconds
      setTimeout(() => {
        setPasswordUpdateMessage('');
        setPasswordMessageType('');
        setShowChangePasswordOverlay(false);
      }, 2000);
    } catch (error) {
      // Handle network or unexpected errors
      setPasswordUpdateMessage('An error occurred while updating password.');
      setPasswordMessageType('error');
      setTimeout(() => {
        setPasswordUpdateMessage('');
        setPasswordMessageType('');
      }, 4000);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update formData state dynamically for changed input field
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleUpdate = () => {
    // Show confirmation message for 3 seconds
    setShowConfirmationMessage(true);
    setTimeout(() => setShowConfirmationMessage(false), 3000);
  };

    const handleSubmit = async (e) => {
      e.preventDefault(); // Prevent default form submission behavior

      try {
        // Make authenticated PATCH request to update user settings
        const response = await authFetch(
          '/settings/update/',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Send updated user data from formData state
            body: JSON.stringify({
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              sex: formData.sex,
              dob: formData.dob || null,    // Use null if dob is empty
              currency: formData.currency,
            }),
          },
          refreshToken,          // Token to refresh authentication if needed
          handleSessionExpired   // Callback for handling expired session
        );

        // If response is not ok, show alert with error detail
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Update failed: ${errorData.detail || 'Unknown error'}`);
          return; // Exit early on failure
        }

        await response.json();   // Parse response JSON (not used here)
        await refreshUser();     // Refresh user data after successful update

        // Show confirmation message on successful update
        setShowConfirmationMessage(true);
        // Hide confirmation message after 3 seconds
        setTimeout(() => setShowConfirmationMessage(false), 3000);

      } catch (error) {
        // Log and alert on any network or unexpected errors
        console.error('Error updating profile:', error);
        alert('An error occurred while updating profile.');
      }
    };

  
  /* ────────────────────────────────
     DELETE ACCOUNT LOGIC
   ──────────────────────────────── */

  const handleDeleteAccount = async () => {
    // Check if "Other" is selected as delete reason and if otherReason input is empty
    const isOtherReasonSelected = deleteReason === "Other";
    const isOtherReasonEmpty = isOtherReasonSelected && otherReason.trim() === "";

    // Check if any required field is incomplete: reason, confirmation, or rating
    const isIncomplete =
      !deleteReason ||
      isOtherReasonEmpty ||
      !confirmDelete ||
      rating === 0;

    // If incomplete, show error message and clear it after 2 seconds
    if (isIncomplete) {
      setDeleteMessage("Please complete all required fields.");
      setDeleteMessageType("error");

      setTimeout(() => {
        setDeleteMessage("");
        setDeleteMessageType("");
      }, 2000);
      return;
    }

    // Prepare payload with form data to send to backend
    const payload = {
      delete_reason: deleteReason,
      other_reason: otherReason,
      comments,
      rating,
      confirm: confirmDelete,
    };

    // Debug log the payload being sent
    console.log("Sending payload:", payload);

    try {
      // Make authenticated POST request to delete account endpoint
      const response = await authFetch(
        '/delete-account/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        refreshToken,
        handleSessionExpired
      );

      // Parse response JSON data
      const data = await response.json();

      // If deletion successful, show success message, log out, and redirect after 2 seconds
      if (response.ok) {
        setDeleteMessage("Your account has been successfully deleted.");
        setDeleteMessageType("success");

        setTimeout(() => {
          setDeleteMessage("");
          setDeleteMessageType("");
          setShowDeleteOverlay(false);

          logout();

          navigate('/');
        }, 2000);
      } else {
        // If response not OK, throw error with message from backend or generic message
        throw new Error(data.error || "Failed to delete account");
      }
    } catch (error) {
      // Handle errors, display error message, and clear it after 2 seconds
      console.error("Delete account error:", error.message);
      setDeleteMessage(error.message || "Failed to delete account.");
      setDeleteMessageType("error");

      setTimeout(() => {
        setDeleteMessage("");
        setDeleteMessageType("");
      }, 2000);
    }
  };

  
  return (
    <div className="settings-container">
      <div className="account-container">
        <h2>Account Settings</h2>
  
        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="input-pair">
            <div className="form-group">
              <label>First name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
  
          <div className="input-pair">
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value="********" readOnly />
              <div
                className="password-link"
                onClick={() => setShowChangePasswordOverlay(true)}
              >
                Change password
              </div>
            </div>
          </div>
  
          <div className="input-pair">
            <div className="form-group">
              <div className="preferences-section">
                <label>Sex (optional)</label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
  
            <div className="form-group">
              <div className="preferences-section">
                <label>Date of birth (optional)</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
  
          <h3>Localization Settings</h3>
          <div className="input-pair">
            <div className="form-group-currency">
              <label>Account currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="GBP">British Pound (£)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
  
          <div className="button-wrapper">
            <button type="submit" className="update-btn-settings">
              Update my settings
            </button>
          </div>
        </form>
  
        <div
          className="delete-link"
          onClick={() => {
            setShowDeleteOverlay(true);
            setDeleteReason('');
            setOtherReason('');
            setComments('');
            setConfirmDelete(false);
            setRating(0);
            setDeleteMessage('');
          }}
        >
          Delete account
        </div>
      </div>

      {showConfirmationMessage && (
        <div className="overlay-message">
          <div className="overlay-content-message">
            <p className="success-update-message">
              Settings updated successfully!
            </p>
          </div>
        </div>
      )}

      {showDeleteOverlay && (
        <div className="overlay-delete">
          <div className="overlay-content-delete">
            <h3>Confirm Account Deletion</h3>

            <label>Reason for Leaving <span style={{ color: 'red' }}>*</span></label>
            <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
              <option value="">Select a reason</option>
              <option>I no longer need the service</option>
              <option>I had technical issues</option>
              <option>Concerned about privacy/security</option>
              <option>Found a better alternative</option>
              <option>Just taking a break</option>
              <option>Other</option>
            </select>

            {deleteReason === 'Other' && (
              <input
                type="text"
                placeholder="Please specify"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            )}

            <label>Optional Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us more..."
            />

            <label>How satisfied were you overall?</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(num => (
                <FaStar
                  key={num}
                  onClick={() => setRating(num)}
                  className={num <= rating ? 'active' : ''}
                />
              ))}
            </div>

            <label>
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={() => setConfirmDelete(!confirmDelete)}
              />{' '}
              I understand this will permanently delete my account and data.
            </label>

            <div className="button-group">
              <button className="delete-btn" onClick={handleDeleteAccount}>Delete my account</button>
              <button
                className="cancel-btn"
                onClick={() => {
                    setShowDeleteOverlay(false);
                    setDeleteReason('');
                    setOtherReason('');
                    setComments('');
                    setConfirmDelete(false);
                    setRating(0);
                    setDeleteMessage('');
                }}
                >
                Cancel
                </button>
            </div>
            {deleteMessage && (
                <p className={`delete-feedback ${deleteMessageType}`}>
                    {deleteMessage}
                </p>
            )}
          </div>
        </div>
      )}

      {showChangePasswordOverlay && (
        <div className="overlay-password">
          <div className="overlay-content-password">
            <h3>Change Password</h3>
            <div className="form-group password-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                    <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    />
                    <span onClick={() => setShowCurrentPassword(prev => !prev)} className="eye-icon">
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                </div>

                <div className="form-group password-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                    <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    />
                    <span onClick={() => setShowNewPassword(prev => !prev)} className="eye-icon">
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                </div>
            <div className="button-group-password">
            <button
                className="update-btn-password"
                onClick={handleUpdatePassword}
                >
                Update Password
                </button>
              <button className="cancel-btn-password" onClick={() => setShowChangePasswordOverlay(false)}>Cancel</button>
            </div>
            {passwordUpdateMessage && (
                <p className={`password-feedback ${passwordMessageType}`}>
                    {passwordUpdateMessage}
                </p>
            )}
          </div>
        </div>
      )}
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

export default Settings;
