import React from 'react';
import mockup from '../Fundit mockup.jpg';
import '../CSS/Home.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import phone from '../Fundit-phone.png';

function Home() {
  const { loginAsGuest } = useAuth();  
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    await loginAsGuest();  
    navigate('/dashboard');
  };
  

  return (
    <section className="header-content-home">
      <div className="header-text-home">
        <h1>Budget it.<br /> Fundit.<br /> Live it.</h1>
        <h2>Your Personal Budget<br />and Expense Tracker.</h2>
        <button className="guest-button" onClick={handleGuestLogin}>Explore as Guest</button>
      </div>

      <div className="mockup-image">
        <img src={mockup} alt="Fundit App Mockup" />
      </div>

      <div className="phone-image">
        <h2>Your Personal Budget<br />and Expense Tracker.</h2>
        <img src={phone} alt="Fundit App Mockup" />
      </div>

    </section>
  );
}

export default Home;

