import { useState } from "react";
import "../../styles/MaintenanceForm.css";
import API_BASE_URL from "../../api/config";

export default function MaintenanceForm({ asset, onClose, onUpdate }) {
  const [status, setStatus] = useState(asset.status || "available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/assets/${asset.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Institution-ID": institutionId,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update asset status");
      }

      const data = await response.json();
      
      // Call the onUpdate callback to refresh the asset list
      if (onUpdate) {
        onUpdate();
      }
      
      onClose();
    } catch (err) {
      console.error("Update status error:", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Asset Status</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="asset-info">
              <p><strong>Asset Code:</strong> {asset.asset_code}</p>
              <p><strong>Name:</strong> {asset.name}</p>
              <p><strong>Current Status:</strong> 
                <span className={`status-badge ${asset.status}`}>
                  {asset.status?.replace("_", " ")}
                </span>
              </p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="status">New Status</label>
              <select 
                id="status"
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="available">Available</option>
                <option value="on_loan">On Loan</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}