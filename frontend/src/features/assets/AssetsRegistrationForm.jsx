import { useState } from "react";
import "../../styles/AssetRegistrationForm.css";
import API_BASE_URL from "../../api/config";

export default function AssetRegistrationForm({ onAssetAdded }) {
  const [form, setForm] = useState({
    name: "",
    asset_code: "",
    category: "",
    purchase_date: "",
    purchase_cost: "",
    status: "available",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Institution-ID": institutionId,
      };

      const payload = {
        name: form.name,
        asset_code: form.asset_code,
        category: form.category || null,
        purchase_date: form.purchase_date || null,
        purchase_cost: parseFloat(form.purchase_cost) || 0,
        status: form.status,
        description: form.description || null,
        serial_number: null,
      };

      console.log("Sending asset registration:", payload);

      const response = await fetch("http://localhost:8000/api/assets", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON parse error:", e);
        throw new Error(`Invalid response: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to register asset");
      }

      setSuccess("Asset registered successfully!");
      
      // Reset form
      setForm({
        name: "",
        asset_code: "",
        category: "",
        purchase_date: "",
        purchase_cost: "",
        status: "available",
        description: "",
      });

      // Collapse form after success
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess("");
      }, 2000);

      // Notify parent
      if (onAssetAdded) {
        onAssetAdded(data.asset);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register asset");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm({
      name: "",
      asset_code: "",
      category: "",
      purchase_date: "",
      purchase_cost: "",
      status: "available",
      description: "",
    });
    setError("");
    setSuccess("");
  }

  return (
    <div className="registration-section">
      <div className="registration-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <div className="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <div>
            <h2>Register New Asset</h2>
            <p>Add a new asset to your institution's inventory</p>
          </div>
        </div>
        <button 
          type="button" 
          className={`toggle-btn ${isExpanded ? 'expanded' : ''}`}
          aria-label="Toggle form"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <form className="asset-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {success}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                Asset Name <span className="required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Dell Latitude 5520"
                value={form.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="asset_code">
                Asset Code <span className="required">*</span>
              </label>
              <input
                id="asset_code"
                name="asset_code"
                type="text"
                placeholder="e.g., NUNI-LAP-001"
                value={form.asset_code}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Computer">Computer</option>
                <option value="Laptop">Laptop</option>
                <option value="Printer">Printer</option>
                <option value="Projector">Projector</option>
                <option value="Server">Server</option>
                <option value="Network Equipment">Network Equipment</option>
                <option value="Camera">Camera</option>
                <option value="Tools">Tools</option>
                <option value="Machinery">Machinery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="available">Available</option>
                <option value="on_loan">On Loan</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="purchase_date">Purchase Date</label>
              <input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="purchase_cost">Purchase Cost</label>
              <div className="input-with-prefix">
                <span className="prefix"></span>
                <input
                  id="purchase_cost"
                  name="purchase_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.purchase_cost}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Additional details about the asset..."
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="btn-reset"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
                  </svg>
                  Register Asset
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}