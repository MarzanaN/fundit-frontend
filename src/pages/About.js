// src/pages/About.js
import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaWallet, FaBullseye, FaThumbsUp, FaUserPlus, FaChartPie } from 'react-icons/fa';
import '../CSS/About.css';

function About() {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="about-page">
      <section className="about-hero" data-aos="fade-up">
        <h1>Why Fundit?</h1>
        <p>Your all-in-one budgeting and expense tracking solution, designed to empower your financial journey.</p>
      </section>

      <section className="about-stats" data-aos="zoom-in">
        <div className="stat-box">
          <FaWallet className="icon" />
          <h3>Smart Budgeting</h3>
          <p>Create, organize, and optimize your budgets with ease.</p>
        </div>
        <div className="stat-box" >
          <FaBullseye className="icon" />
          <h3>Goal Setting</h3>
          <p>Set financial goals and track your progress visually.</p>
        </div>
        <div className="stat-box">
          <FaThumbsUp className="icon" />
          <h3>Financial Wellness</h3>
          <p>Build better spending habits and stay in control.</p>
        </div>
      </section>

      <section className="about-mission" data-aos="fade-up">
        <h2>Our Mission</h2>
        <p>
          At Fundit, we believe budgeting should be simple, insightful, and empowering.
          Whether you're saving for a trip or managing monthly expenses, Fundit keeps
          you on track and in control.
        </p>
      </section>

      <section className="about-how-it-works" data-aos="fade-up">
        <div className="step">
          <FaUserPlus className="icon" />
          <h3>1. Sign Up</h3>
          <p>Create your free account in seconds.</p>
        </div>
        <div className="step">
          <FaWallet className="icon" />
          <h3>2. Add Budgets</h3>
          <p>Set spending limits and categories.</p>
        </div>
        <div className="step">
          <FaChartPie className="icon" />
          <h3>3. Track & Optimize</h3>
          <p>Monitor your expenses and improve habits.</p>
        </div>
      </section>

      <section className="about-cta" data-aos="fade-up">
        <h2>Ready to take control of your finances?</h2>
        <a href="/register">
          <button className="cta-button">Get Started</button>
        </a>
      </section>
    </div>
  );
}

export default About;


