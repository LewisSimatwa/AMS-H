import { useState } from "react";
import { Mail } from "lucide-react";
//import { sendResetLink } from "../../api/auth"; 
import "../../styles/AuthPages.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendResetLink(email);
      setSuccess("Reset link sent! Check your email.");
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="bg-decoration">
          <div className="bg-circle bg-circle-1"></div>
          <div className="bg-circle bg-circle-2"></div>
        </div>
        <div className="brand-content">
          <div className="logo-wrapper">
            <div className="logo-glow"></div>
            <div className="logo-container">
              <img src="frontend\public\miams_logo.svg" alt="MIAMS Logo" className="logo-image" />
            </div>
          </div>
          <div className="brand-text">
            <h2 className="brand-title">MIAMS</h2>
            <p className="brand-subtitle">Multi-institutional Asset Management System</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="form-wrapper">
          <div className="login-card">
            <div className="card-header">
              <h1 className="card-title">Forgot Password</h1>
              <p className="card-subtitle">Enter your email to receive reset instructions</p>
            </div>

            {error && <div className="error-message"><p>{error}</p></div>}
            {success && <div className="success-message"><p>{success}</p></div>}

            <div className="form-content">
              <div className="form-field">
                <label className="field-label">Email Address</label>
                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading} className="submit-button">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>

            <div className="divider"><span className="divider-text">Remembered your password?</span></div>

            <div className="signup-section">
              <a href="/" className="signup-text">Sign in here</a>
            </div>
          </div>

          <p className="footer-text">Protected by industry-standard encryption</p>
        </div>
      </div>
    </div>
  );
}
