import { useEffect, useState } from "react";
import "../../styles/AuditLogs.css";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const institutionId = localStorage.getItem("institutionId");
        
        if (!token) throw new Error("Not authenticated");
        if (!institutionId) throw new Error("No institution ID");

        // Use the API router endpoint
        const url = `http://localhost:8000/api/audit/logs?institution_id=${institutionId}`;
        console.log("Fetching from:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Institution-ID": institutionId,
          },
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("Data received:", data);
        
        if (data.error) {
          throw new Error(data.error);
        }

        setLogs(data.logs || []);
      } catch (err) {
        console.error("Full error:", err);
        setError(err.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  // Helper function to format JSON values
  const formatValue = (value) => {
    if (!value) return "-";
    
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  if (loading) return <p className="audit-loading">Loading audit logs…</p>;
  if (error) return (
    <div className="audit-error-container">
      <p className="audit-error">{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="audit-container">
      <div className="audit-header">
        <h1 className="audit-title">📋 Audit Logs</h1>
        <p className="audit-subtitle">Track all system activities and changes</p>
      </div>

      <div className="audit-stats">
        <div className="stat-box">
          <span className="stat-label">Total Logs</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Today</span>
          <span className="stat-value">
            {logs.filter(log => {
              const logDate = new Date(log.created_at);
              const today = new Date();
              return logDate.toDateString() === today.toDateString();
            }).length}
          </span>
        </div>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Performed By</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Institution</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">
                  No audit logs found
                </td>
              </tr>
            )}

            {logs.map((log) => (
              <tr key={log.id}>
                <td className="timestamp-cell">
                  {new Date(log.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="user-cell">{log.username}</td>
                <td className={`action-cell action-${log.action.toLowerCase()}`}>
                  <span className="action-badge">{log.action}</span>
                </td>
                <td className="entity-cell">{log.entity_type || "-"}</td>
                <td className="entity-id-cell">{log.entity_id || "-"}</td>
                <td className="value-cell old-value">
                  <pre>{formatValue(log.old_values)}</pre>
                </td>
                <td className="value-cell new-value">
                  <pre>{formatValue(log.new_values)}</pre>
                </td>
                <td className="institution-cell">{log.institution_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}