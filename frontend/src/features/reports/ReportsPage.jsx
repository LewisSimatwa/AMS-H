import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Reports.css";
import API_BASE_URL from "../../api/config";

export default function Reports() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "All",
    startDate: "",
    endDate: "",
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  useEffect(() => {
    if (!token || !institutionId) {
      navigate("/login");
      return;
    }

    fetchAuditLogs();
  }, [token, institutionId]);

  async function fetchAuditLogs() {
    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `${API_BASE_URL}/audit_logs.php`,
        { headers }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      const mappedLogs = (data.logs || []).map(log => ({
        id: log.id,
        action: log.action,
        details: formatLogDetails(log),
        username: log.username || "System",
        created_at: log.created_at,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        old_value: log.old_values,
        new_value: log.new_values,
        institution_name: log.institution_name
      }));

      setAuditLogs(mappedLogs);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  function formatLogDetails(log) {
    const parts = [];

    if (log.entity_type && log.entity_id) {
      parts.push(`${log.entity_type} #${log.entity_id}`);
    }

    if (log.old_value || log.new_value) {
      try {
        const oldVal = log.old_value ? JSON.parse(log.old_value) : null;
        const newVal = log.new_value ? JSON.parse(log.new_value) : null;

        if (oldVal && newVal) {
          const changes = Object.keys(newVal)
            .filter(key => oldVal[key] !== newVal[key])
            .map(key => `${key}: ${oldVal[key]} → ${newVal[key]}`)
            .join(", ");

          if (changes) parts.push(changes);
        } else if (newVal) {
          parts.push(JSON.stringify(newVal));
        }
      } catch {
        if (log.old_value && log.new_value) {
          parts.push(`${log.old_value} → ${log.new_value}`);
        } else if (log.new_value) {
          parts.push(log.new_value);
        }
      }
    }

    return parts.join(" | ") || "—";
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  const filteredLogs = auditLogs.filter(log => {
    const logDate = new Date(log.created_at);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    const statusMatch =
      filters.status === "All" ||
      (filters.status === "Movement" && log.action.toLowerCase().includes("move")) ||
      (filters.status === "Status" && log.action.toLowerCase().includes("status"));

    const dateMatch =
      (!startDate || logDate >= startDate) &&
      (!endDate || logDate <= endDate);

    return statusMatch && dateMatch;
  });

  async function generateReport() {
    setGenerating(true);

    if (!token) {
      alert("Authentication required");
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch('${API_BASE_URL}/generate_report.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Generate report error:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-spinner">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports & Audit Logs</h1>
          <p>View activity logs and generate reports</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="generate-btn"
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? "Generating..." : "📥 Generate PDF Report"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchAuditLogs}>Retry</button>
        </div>
      )}

      <div className="reports-filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="All">All Activities</option>
          <option value="Movement">Asset Movement</option>
          <option value="Status">Status Changes</option>
        </select>

        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />

        <button onClick={fetchAuditLogs} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="reports-summary">
        <p>
          Showing <strong>{filteredLogs.length}</strong> of{" "}
          <strong>{auditLogs.length}</strong> activities
        </p>
      </div>

      <table className="reports-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Details</th>
            <th>User</th>
            <th>Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No activities found
              </td>
            </tr>
          ) : (
            filteredLogs.map(log => (
              <tr key={log.id}>
                <td><span className="action-badge">{log.action}</span></td>
                <td>{log.details}</td>
                <td>{log.username}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}