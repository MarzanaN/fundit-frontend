import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../api';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stores authenticated user info
  const [currencyCode, setCurrencyCode] = useState('GBP'); // Default currency code
  const [currencySymbol, setCurrencySymbol] = useState('£'); // Default currency symbol
  const accessToken = localStorage.getItem('accessToken'); // Get access token from local storage

  // Map of supported currency codes to their symbols
  const currencySymbols = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  };

  // Updates currency state based on selected code
  const updateCurrency = (code) => {
    if (code && currencySymbols[code]) {
      setCurrencyCode(code);
      setCurrencySymbol(currencySymbols[code]);
    } else {
      // Fallback to GBP if code is invalid or missing
      setCurrencyCode('GBP');
      setCurrencySymbol(currencySymbols['GBP']);
    }
  };

  useEffect(() => {
    // If no access token, clear user state and reset currency
    if (!accessToken) {
      setUser(null);
      updateCurrency('GBP'); 
      return;
    }

    // Fetch user data using stored access token
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await res.json();

        // Check if the user was marked as guest in local storage
        const isGuest = JSON.parse(localStorage.getItem('user'))?.is_guest;

        // Set user info, including full name and guest flag
        setUser({
          ...data,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          is_guest: isGuest || false, 
        });

        // Update currency based on user's preference
        updateCurrency(data.currency);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        updateCurrency('GBP'); // Reset currency on error
      }
    };

    fetchUserData();
  }, [accessToken]); // Re-run effect if access token changes


// Function to fetch and update the current user data from the backend
const refreshUser = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/user/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`, // Use stored access token for auth
      },
    });

    if (!res.ok) throw new Error('Failed to fetch user');

    const data = await res.json();
    const isGuest = JSON.parse(localStorage.getItem('user'))?.is_guest; // Check guest status from local storage

    // Set user info with full name and guest flag
    setUser({
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      is_guest: isGuest || false,
    });

    updateCurrency(data.currency); // Update currency preference
  } catch (error) {
    console.error('Error refreshing user:', error);
    setUser(null); // Clear user on error
    updateCurrency('GBP'); // Reset currency to default
  }
};

// Function to log in a user, store their tokens and info in state and local storage
const login = (userData, tokens) => {
  setUser(userData); // Set user data in state
  updateCurrency(userData.currency); // Set currency based on user preference

  if (tokens) {
    // Store access and refresh tokens in local storage
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
  }

  // Save user data to local storage (e.g., for guest tracking)
  localStorage.setItem('user', JSON.stringify(userData));
};


// Function to log in as a guest user
const loginAsGuest = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/guest-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Set JSON headers
    });

    if (!response.ok) {
      // Log response errors in detail if request fails
      const text = await response.text();
      console.error('Guest login failed:', response.status, response.statusText);
      console.error('Response headers:', [...response.headers.entries()]);
      console.error('Response body:', text);
      throw new Error(`Guest login failed with status ${response.status}`);
    }

    let data;
    try {
      // Attempt to parse JSON response
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, log raw response text
      const text = await response.text();
      console.error('Failed to parse JSON from response:', text);
      throw new Error('Invalid JSON response from server');
    }

    // Store tokens for session management
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);

    // Construct guest user object with flag
    const guestUser = {
      ...data.user,
      name: 'Guest',
      is_guest: true,
    };

    // Ensure onboarding overlays are shown for new sessions
    localStorage.removeItem('overlayDismissed');

    // Set user state and currency
    setUser(guestUser);
    updateCurrency(data.user.currency);

    // Store guest user info locally
    localStorage.setItem('user', JSON.stringify(guestUser));
  } catch (error) {
    console.error('Guest login error:', error); // Catch-all error logging
  }
};

// Function to log out the current user
const logout = () => {
  setUser(null); // Clear user state
  localStorage.removeItem('user'); // Remove user info from local storage
  localStorage.removeItem('accessToken'); // Remove stored tokens
  localStorage.removeItem('refreshToken');
  updateCurrency('GBP'); // Reset currency to default
};


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsGuest,
        logout,
        currencyCode,
        currencySymbol,
        setCurrencyCode,
        setCurrencySymbol,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
