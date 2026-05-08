import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/loginUser";
import "../../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    email: "", 
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Detect if email is super admin
  function handleEmailChange(e) {
    const email = e.target.value;
    setForm({ ...form, email });
    
    // Check if this looks like a super admin email
    if (email.includes('super@') || email === 'super@miams.system') {
      setIsSuperAdmin(true);
    } else {
      setIsSuperAdmin(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", {
        email: form.email
      });

      // Call login API - domain will be extracted from email on backend
      const response = await loginUser(
        form.email, 
        form.password
      );
      
      console.log("Login response:", response);
      
      // Store data in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      if (response.user.institution_id) {
        localStorage.setItem("institutionId", response.user.institution_id);
      }
      
      // Store institution name if available
      if (response.institution_name) {
        localStorage.setItem("institutionName", response.institution_name);
      } else if (response.user.institution_name) {
        localStorage.setItem("institutionName", response.user.institution_name);
      }
      
      // Route based on user role
      const userRole = response.user.role?.toLowerCase();
      console.log("User role:", userRole);
      
      if (userRole === 'super_admin') {
        console.log("Navigating to super admin dashboard");
        navigate("/super-admin/dashboard");
      } else if (userRole === 'admin') {
        console.log("Navigating to admin dashboard");
        navigate("/dashboard");
      } else {
        console.log("Navigating to default dashboard");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
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
              <img src="/amslogo.png" alt="MIAMS Logo" className="logo-image" />
            </div>
          </div>
          <div className="brand-text">
            <h2 className="brand-title">AMS</h2>
            <p className="brand-subtitle">
              Asset Management System
            </p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="form-wrapper" >
          <div className="login-card" style={{ transform: "translateY(-60px)" }} >
            <div className="card-header">
              <h1 className="card-title">Welcome Back</h1>
              <p className="card-subtitle">Sign in to access your account</p>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <form className="form-content" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="field-label">Email Address</label>
                <div className="input-group">
                  <Mail className="input-icon" size={20} strokeWidth={2} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    placeholder="you@institution.ac.tz"
                    className="input-field"
                    required
                  />
                </div>
                <small style={{ 
                  display: 'block', 
                  marginTop: '0.5rem', 
                  color: '#6b7280', 
                  fontSize: '0.875rem' 
                }}>
                  Use your institutional email address
                </small>
              </div>

              {isSuperAdmin && (
                <div className="form-field">
                  <p style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    ✓ Super Admin login detected
                  </p>
                </div>
              )}

              <div className="form-field">
                <label className="field-label">Password</label>
                <div className="input-group">
                  <Lock className="input-icon" size={20} strokeWidth={2} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input-field input-field-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <span>Signing in</span>
                    <span className="loading-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn className="button-icon" size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span className="divider-text">New to MIAMS?</span>
            </div>

            <div className="signup-section">
              <Link to="/create-account" className="signup-text">
                Don't have an account? <span className="signup-link">Create one now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}