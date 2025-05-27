import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currencyCode, setCurrencyCode] = useState('GBP');
  const [currencySymbol, setCurrencySymbol] = useState('£');
  const accessToken = localStorage.getItem('accessToken');

  const currencySymbols = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  };

  const updateCurrency = (code) => {
    if (code && currencySymbols[code]) {
      setCurrencyCode(code);
      setCurrencySymbol(currencySymbols[code]);
    } else {
      setCurrencyCode('GBP');
      setCurrencySymbol(currencySymbols['GBP']);
    }
  };


  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      updateCurrency('GBP'); 
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/', {
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

        const isGuest = JSON.parse(localStorage.getItem('user'))?.is_guest;

        setUser({
          ...data,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          is_guest: isGuest || false, 
        });
        

        updateCurrency(data.currency);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        updateCurrency('GBP'); 
      }
    };

    fetchUserData();
  }, [accessToken]);

  const login = (userData, tokens) => {
    setUser(userData);
    updateCurrency(userData.currency);

    if (tokens) {
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
    }

    localStorage.setItem('user', JSON.stringify(userData));
  };

  const loginAsGuest = async () => {
    try {
      const response = await fetch('/api/guest-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) throw new Error('Guest login failed');
  
      const data = await response.json();
  
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
  
      const guestUser = {
        ...data.user,
        name: 'Guest',
        is_guest: true, 
      };

      localStorage.removeItem('overlayDismissed');
  
      setUser(guestUser);
      updateCurrency(data.user.currency);
      localStorage.setItem('user', JSON.stringify(guestUser));
    } catch (error) {
      console.error('Guest login error:', error);
    }
  };
  

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    updateCurrency('GBP'); 
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
