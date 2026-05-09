import { useState } from "react";
import "../../styles/RetireAsset.css";
import API_BASE_URL from "../../api/config";

export default function RetireAsset({ asset, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [retirementReason, setRetirementReason] = useState("");

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  async function handleRetire() {
    // Validate confirmation text
    if (confirmText !== asset.asset_code) {
      setError("Asset code does not match");
      return;
    }

    // Validate retirement reason
    if (!retirementReason.trim()) {
      setError("Please provide a retirement reason");
      return;
    }

    if (retirementReason.trim().length < 10) {
      setError("Retirement reason must be at least 10 characters");
      return;
    }

    // Check authentication
    if (!token || !institutionId) {
      setError("Missing authentication credentials. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("=== RETIRE ASSET REQUEST START ===");
      console.log("Asset ID:", asset.id);
      console.log("Asset Code:", asset.asset_code);
      console.log("Retirement Reason:", retirementReason);
      
      const response = await fetch(
        '${API_BASE_URL}/retire_asset.php',
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-Institution-ID": institutionId,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            asset_id: asset.id,
            retirement_reason: retirementReason.trim()
          })
        }
      );

      console.log("Response status:", response.status);
      
      const rawText = await response.text();
      console.log("Raw response:", rawText);

      if (!rawText || rawText.trim().length === 0) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(rawText);
        console.log("Parsed data:", data);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Invalid server response: ${rawText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to retire asset");
      }

      console.log("=== RETIREMENT SUCCESS ===");
      
      alert(`✓ Asset "${asset.name}" (${asset.asset_code}) has been retired successfully`);
      
      onConfirm();
      
    } catch (err) {
      console.error("=== RETIREMENT ERROR ===");
      console.error("Error:", err);
      setError(err.message || "Failed to retire asset. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container retire-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="retire-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <h2>Retire Asset</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="info-message">
            <p><strong>Note:</strong> This will mark the asset as retired and make it read-only.</p>
            <p>Retired assets:</p>
            <ul>
              <li>Cannot be checked out or checked in</li>
              <li>Will be marked with retirement date and reason</li>
              <li>Will still appear in reports and audit logs</li>
              <li>Can only be modified by administrators</li>
            </ul>
          </div>

          <div className="asset-info">
            <div className="info-row">
              <span className="label">Asset Code:</span>
              <span className="value">{asset.asset_code}</span>
            </div>
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{asset.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Category:</span>
              <span className="value">{asset.category || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Current Status:</span>
              <span className={`status-badge ${asset.status}`}>
                {asset.status?.replace("_", " ")}
              </span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <div className="retirement-reason-input">
            <label htmlFor="retirementReason">
              <strong>Retirement Reason *</strong>
              <span className="label-hint">Explain why this asset is being retired</span>
            </label>
            <textarea
              id="retirementReason"
              rows="4"
              placeholder="e.g., End of useful life, irreparable damage, obsolete technology, replaced by newer model..."
              value={retirementReason}
              onChange={(e) => {
                setRetirementReason(e.target.value);
                setError("");
              }}
              disabled={loading}
              maxLength={500}
            />
            <small className="char-count">
              {retirementReason.length}/500 characters
              {retirementReason.length < 10 && retirementReason.length > 0 && 
                " (minimum 10 characters)"}
            </small>
          </div>

          <div className="confirmation-input">
            <label htmlFor="confirmText">
              To confirm retirement, type the asset code <strong>{asset.asset_code}</strong>
            </label>
            <input
              id="confirmText"
              type="text"
              placeholder="Enter asset code"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              disabled={loading}
              autoComplete="off"
            />
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
            type="button"
            onClick={handleRetire}
            disabled={loading || confirmText !== asset.asset_code || !retirementReason.trim()}
            className="btn-retire-confirm"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Retiring...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                Retire Asset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}