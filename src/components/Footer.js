import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import '../CSS/App.css';

function Footer() {
  const { user } = useAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  return (
    <footer className="site-footer">
      <h3>Fundit</h3>

      <ul className="footer-nav">
        {user ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/income">Income</Link></li>
            <li><Link to="/expenses">Expenses</Link></li>
            <li><Link to="/goals">Savings & Repayments</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/support">Support</Link></li>
          </>
        )}
      </ul>

      <div className="footer-links">
        <button onClick={() => setShowPrivacy(true)} className="footer-link">Privacy Policy</button>
        <button onClick={() => setShowTerms(true)} className="footer-link">Terms of Service</button>
        <button onClick={() => navigate('/support')} className="footer-link">Contact Us</button>
      </div>

      <p style={{ fontSize: "12px", marginTop: "20px" }}>
        © {new Date().getFullYear()} Fundit. All rights reserved.
      </p>

{showPrivacy && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>🔐 Privacy Policy for Fundit</h2>
      <div className="modal-scroll-wrapper">
        <div className="modal-scroll-content">
          <p className="modal-text"><strong>Effective Date:</strong> 27 May 2025</p>
          <p className="modal-text">
            At Fundit, your privacy matters. This Privacy Policy explains how we collect, use, and protect your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
          <p className="modal-text">
            <strong>1. Who We Are</strong><br />
            Fundit is a community-focused app based in the UK that enables users to share and support fundraising ideas and projects.<br />
            For privacy-related queries, contact us at:<br />
            Email: fundit.app.team@gmail.com
          </p>
          <p className="modal-text">
            <strong>2. What We Collect</strong><br />
            Identity Data: Name, username (if provided)<br />
            Contact Data: Email address<br />
            Usage Data: How you use the app, app features accessed<br />
            Technical Data: Device type, browser type, IP address (for security and analytics)
          </p>
          <p className="modal-text">
            <strong>3. Why We Collect It</strong><br />
            Provide and manage your user account<br />
            Improve and personalise your app experience<br />
            Respond to queries or support requests<br />
            Ensure platform security and reliability<br />
            Comply with legal requirements
          </p>
          <p className="modal-text">
            <strong>4. Legal Basis for Processing</strong><br />
            Your consent<br />
            Legitimate interests (e.g., app analytics and improvement)<br />
            Legal obligations
          </p>
          <p className="modal-text">
            <strong>5. Data Sharing</strong><br />
            We do not sell or rent your personal data. We may share it with trusted service providers (e.g., for analytics or hosting) who follow strict data protection agreements.
          </p>
          <p className="modal-text">
            <strong>6. Your Rights</strong><br />
            Access your personal data<br />
            Request correction or deletion<br />
            Object to or restrict processing<br />
            Withdraw consent at any time<br />
            You can also file a complaint with the Information Commissioner’s Office (ICO): <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{color: '#9b59b6'}}>ico.org.uk</a>
          </p>
          <p className="modal-text">
            <strong>7. Security</strong><br />
            We implement reasonable measures to protect your data from unauthorised access, disclosure, or destruction.
          </p>
          <p className="modal-text">
            <strong>8. Data Retention</strong><br />
            We keep your data only for as long as necessary for the purposes described above, unless a longer retention period is required by law.
          </p>
          <p className="modal-text">
            <strong>9. Updates to This Policy</strong><br />
            We may update this Privacy Policy to reflect changes in the app or legal obligations. We will notify you of any significant changes.
          </p>
          <p className="modal-text">
            <strong>📧 Contact Us</strong><br />
            If you have questions or want to exercise your data rights, email us at: <strong>fundit.app.team@gmail.com</strong>
          </p>
        </div>
      </div>
      <button className="close-button" onClick={() => setShowPrivacy(false)}>Close</button>
    </div>
  </div>
)}



{showTerms && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>📄 Terms of Service for Fundit</h2>
      <div className="modal-scroll-wrapper">
        <div className="modal-scroll-content">
          <p className="modal-text"><strong>Effective Date:</strong> 27 May 2025</p>
          <p className="modal-text">Welcome to Fundit! By accessing or using our app, you agree to the following terms. Please read them carefully.</p>
          <p className="modal-text"><strong>1. Eligibility</strong><br />
            To use Fundit, you must be at least 13 years old and reside in the UK. By using the app, you confirm that you meet these requirements.
          </p>
          <p className="modal-text"><strong>2. Your Account</strong><br />
            You are responsible for keeping your login information secure. Do not share your account with others. If you suspect unauthorised access, contact us immediately.
          </p>
          <p className="modal-text"><strong>3. Acceptable Use</strong><br />
            You agree not to:<br />
            - Use Fundit for any unlawful or harmful purpose<br />
            - Post offensive, misleading, or abusive content<br />
            - Interfere with the app’s operation or other users’ experience
          </p>
          <p className="modal-text"><strong>4. User Content</strong><br />
            You retain ownership of content you post but give us a non-exclusive right to display it within the app. You are solely responsible for the content you submit.
          </p>
          <p className="modal-text"><strong>5. Termination</strong><br />
            We may suspend or terminate your access to Fundit if you violate these terms or engage in behaviour that harms the community.
          </p>
          <p className="modal-text"><strong>6. Limitation of Liability</strong><br />
            We provide Fundit “as is.” We do not guarantee uninterrupted access or error-free operation. We are not responsible for any loss or damage arising from your use of the app.
          </p>
          <p className="modal-text"><strong>7. Changes to These Terms</strong><br />
            We may update these terms occasionally. Continued use of Fundit means you agree to the most recent version.
          </p>
          <p className="modal-text"><strong>8. Governing Law</strong><br />
            These terms are governed by the laws of England and Wales. Disputes will be resolved in UK courts.
          </p>
          <p className="modal-text"><strong>📧 Contact Us</strong><br />
            For questions about these terms, email: <strong>fundit.app.team@gmail.com</strong>
          </p>
        </div>
      </div>
      <button className="close-button" onClick={() => setShowTerms(false)}>Close</button>
    </div>
  </div>
)}

    </footer>
  );
}

export default Footer;

