import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard.css";
import API_BASE_URL from "../../api/config";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssets: 0,
    availableAssets: 0,
    onLoanAssets: 0,
    maintenanceAssets: 0,
    highRiskAssets: 0,
  });
  const [riskAssets, setRiskAssets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const institutionId = localStorage.getItem("institutionId");
  const institutionName = localStorage.getItem("institutionName") || "Your Institution";

  useEffect(() => {
    if (!token || !institutionId) {
      //navigate("/login");
      //return;
    }

    fetchDashboardData();
  }, [token, institutionId]);

  async function fetchDashboardData() {
    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Institution-ID": institutionId,
      };

      // Fetch asset stats
      const assetsRes = await fetch(
        `${API_BASE_URL}/api/assets?institution_id=${institutionId}`,
        { headers }
      );

      if (!assetsRes.ok) {
        throw new Error(`Assets error: ${assetsRes.status}`);
      }

      const assetsData = await assetsRes.json();
      const assets = assetsData.assets || [];

      // Count assets by status
      const available = assets.filter((a) => a.status === "available").length;
      const onLoan = assets.filter((a) => a.status === "on_loan").length;
      const maintenance = assets.filter((a) => a.status === "maintenance").length;

      // Fetch risk scores
      let highRisk = 0;
      let topRiskAssets = [];

      try {
        const riskRes = await fetch(
          `${API_BASE_URL}/api/analytics/risk-scores?institution_id=${institutionId}`,
          { headers }
        );

        if (riskRes.ok) {
          const riskData = await riskRes.json();
          const allRiskAssets = riskData.scores || [];
          highRisk = allRiskAssets.filter((a) => a.risk_level === "HIGH").length;
          topRiskAssets = allRiskAssets
            .filter((a) => a.risk_level !== "LOW")
            .slice(0, 5);
        }
      } catch (err) {
        console.warn("Risk scores not available yet");
      }

      // Fetch audit logs for recent activity
      let recentLogs = [];

      try {
        console.log("Fetching audit logs from:", `${API_BASE_URL}/api/audit/logs?institution_id=${institutionId}`);
        
        const auditRes = await fetch(
          `${API_BASE_URL}/api/audit/logs?institution_id=${institutionId}`,
          { headers }
        );

        console.log("Audit response status:", auditRes.status);
        console.log("Audit response content-type:", auditRes.headers.get("content-type"));

        if (auditRes.ok) {
          // Get raw text first to inspect it
          const rawText = await auditRes.text();
          console.log("=== RAW RESPONSE START ===");
          console.log(rawText.substring(0, 1000)); // First 1000 chars
          console.log("=== RAW RESPONSE END ===");

          // Try to parse as JSON
          let auditData;
          try {
            auditData = JSON.parse(rawText);
          } catch (parseError) {
            console.error("JSON parse failed:", parseError.message);
            console.error("Response starts with:", rawText.substring(0, 100));
            throw new Error("Server returned invalid JSON");
          }
          console.log("Full audit response:", auditData);
          
          // Try different possible response structures
          const logs = auditData.logs || auditData.data || auditData || [];
          console.log("Extracted logs:", logs);
          console.log("Logs is array:", Array.isArray(logs));
          console.log("Logs length:", logs.length);
          
          // Ensure it's an array and get latest 5
          if (Array.isArray(logs)) {
            // Sort by created_at descending (most recent first)
            recentLogs = logs
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5);
            console.log("Recent logs after sort/slice:", recentLogs);
          } else {
            console.warn("Logs is not an array:", typeof logs);
          }
        } else {
          console.warn("Audit response not OK:", auditRes.status);
          const errorText = await auditRes.text();
          console.error("Error response body:", errorText.substring(0, 500));
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        console.error("Error details:", err.message);
      }

      // Update state
      setStats({
        totalAssets: assets.length,
        availableAssets: available,
        onLoanAssets: onLoan,
        maintenanceAssets: maintenance,
        highRiskAssets: highRisk,
      });

      setRiskAssets(topRiskAssets);
      setRecentActivity(recentLogs);
      
      console.log("Final recentActivity state:", recentLogs);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user.email || "User"}</p>
        </div>
        <div style={{ 
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#2563eb',
          margin: '0.5rem 0',
          textAlign: 'center'
        }}>
          {institutionName}
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalAssets}</div>
          <div className="stat-label">Total Assets</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: "#4CAF50" }}>
            {stats.availableAssets}
          </div>
          <div className="stat-label">Available</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: "#FF9800" }}>
            {stats.onLoanAssets}
          </div>
          <div className="stat-label">On Loan</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: "#F44336" }}>
            {stats.maintenanceAssets}
          </div>
          <div className="stat-label">In Maintenance</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: "#E91E63" }}>
            {stats.highRiskAssets}
          </div>
          <div className="stat-label">High Risk</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Left: High Risk Assets */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>High Risk Assets</h2>
            <span className="badge">{riskAssets.length}</span>
          </div>

          {riskAssets.length === 0 ? (
            <p className="empty-message">No high-risk assets detected</p>
          ) : (
            <div className="risk-list">
              {riskAssets.map((asset) => (
                <div key={asset.id} className="risk-item">
                  <div className="risk-info">
                    <div className="risk-code">{asset.asset_code}</div>
                    <div className="risk-name">{asset.name}</div>
                  </div>
                  <div
                    className={`risk-badge ${asset.risk_level?.toLowerCase() || "low"}`}
                  >
                    {asset.risk_level || "N/A"}
                  </div>
                  <div className="risk-score">
                    {((asset.risk_score || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href="/analytics" className="view-all-link">
            View All Risk Scores →
          </a>
        </div>

        {/* Right: Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <span className="badge">{recentActivity.length}</span>
          </div>

          {recentActivity.length === 0 ? (
            <p className="empty-message">No recent activity</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((log, index) => (
                <div key={log.id || index} className="activity-item">
                  <div className="activity-icon">
                    {log.action ? log.action.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="activity-details">
                    <div className="activity-action">
                      {log.action || "Unknown Action"}
                    </div>
                    <div className="activity-time">
                      {log.created_at 
                        ? new Date(log.created_at).toLocaleString()
                        : "Unknown time"}
                    </div>
                  </div>
                  <div className="activity-user">
                    {log.username || log.user_email || "System"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href="/audit" className="view-all-link">
            View All Logs →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="action-btn"
            onClick={() => navigate("/checkout")}
          >
            Check In/Out
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/assets")}
          >
            View Assets
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/maintenance")}
          >
            Schedule Maintenance
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/analytics")}
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}