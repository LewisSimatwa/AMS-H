import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import "../../styles/SuperAdmin/ReportsAndAudit.css";
import API_BASE_URL from "../../api/config";

export default function ReportsAndAudit() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Analytics State with proper defaults
  const [analytics, setAnalytics] = useState({
    totalAssets: 0,
    activeAssets: 0,
    retiredAssets: 0,
    totalUsers: 0,
    totalInstitutions: 0,
    statusStats: {
      available: 0,
      on_loan: 0,
      maintenance: 0,
      retired: 0
    },
    institutionComparison: [],
    adminActivity: [],
    assetTypeDistribution: [],
    recentActivities: []
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    institution_id: "",
    user_id: "",
    action_type: "",
    entity_type: "",
    date_from: "",
    date_to: "",
    search: ""
  });

  // Users and Institutions for filters
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchAuditLogs();
    fetchUsers();
    fetchInstitutions();
  }, []);

  // Fetch Analytics
  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:8000/api/super_admin/analytics", { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      
      // Set analytics with proper defaults and validation
      setAnalytics({
        totalAssets: Number(data.totalAssets) || 0,
        activeAssets: Number(data.activeAssets) || 0,
        retiredAssets: Number(data.retiredAssets) || 0,
        totalUsers: Number(data.totalUsers) || 0,
        totalInstitutions: Number(data.totalInstitutions) || 0,
        statusStats: {
          available: Number(data.statusStats?.available) || 0,
          on_loan: Number(data.statusStats?.on_loan) || 0,
          maintenance: Number(data.statusStats?.maintenance) || 0,
          retired: Number(data.statusStats?.retired) || 0
        },
        institutionComparison: Array.isArray(data.institutionComparison) 
          ? data.institutionComparison 
          : [],
        adminActivity: Array.isArray(data.adminActivity) 
          ? data.adminActivity 
          : [],
        assetTypeDistribution: Array.isArray(data.assetTypeDistribution) 
          ? data.assetTypeDistribution 
          : [],
        recentActivities: Array.isArray(data.recentActivities) 
          ? data.recentActivities 
          : []
      });
      
    } catch (err) {
      console.error("Fetch analytics error:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
      setLoading(false);
    }
  }

  // Fetch Audit Logs
  async function fetchAuditLogs(page = 1) {
    setLoading(true);
    setError("");

    try {
      // Build params - remove institution_id filter to get ALL activities
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50"
      });

      // Only add filters if they have values
      if (auditFilters.user_id) params.append('user_id', auditFilters.user_id);
      if (auditFilters.action_type) params.append('action_type', auditFilters.action_type);
      if (auditFilters.entity_type) params.append('entity_type', auditFilters.entity_type);
      if (auditFilters.date_from) params.append('date_from', auditFilters.date_from);
      if (auditFilters.date_to) params.append('date_to', auditFilters.date_to);
      if (auditFilters.search) params.append('search', auditFilters.search);
      // Allow filtering by institution if selected, but don't require it
      if (auditFilters.institution_id) params.append('institution_id', auditFilters.institution_id);

      const response = await fetch(
        `http://localhost:8000/api/super_admin/audit-logs?${params}`,
        { headers }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch audit logs");
      }

      const data = await response.json();
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
      setAuditPage(page);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  // Fetch Users
  async function fetchUsers() {
    try {
      const response = await fetch("http://localhost:8000/api/super_admin/admins", { headers });

      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      setUsers(data.admins || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  }

  // Fetch Institutions
  async function fetchInstitutions() {
    try {
      const response = await fetch("http://localhost:8000/api/super_admin/institutions", { headers });

      if (!response.ok) throw new Error("Failed to fetch institutions");
      
      const data = await response.json();
      setInstitutions(data.institutions || []);
    } catch (err) {
      console.error("Fetch institutions error:", err);
    }
  }

  // Export Analytics
  async function exportAnalytics() {
    try {
      const response = await fetch("http://localhost:8000/api/super_admin/analytics-export", { headers });

      if (!response.ok) throw new Error("Failed to export analytics");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export analytics error:", err);
      alert("Failed to export analytics: " + err.message);
    }
  }

  // Export Audit Logs
  async function exportAuditLogs() {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(auditFilters).filter(([_, v]) => v !== "")
        )
      );

      const response = await fetch(
        `http://localhost:8000/api/super_admin/audit-logs-export?${params}`,
        { headers }
      );

      if (!response.ok) throw new Error("Failed to export audit logs");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export audit logs error:", err);
      alert("Failed to export audit logs: " + err.message);
    }
  }

  // Handle filter change
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setAuditFilters(prev => ({ ...prev, [name]: value }));
  }

  // Apply filters
  function applyFilters() {
    fetchAuditLogs(1);
  }

  // Clear filters
  function clearFilters() {
    setAuditFilters({
      institution_id: "",
      user_id: "",
      action_type: "",
      entity_type: "",
      date_from: "",
      date_to: "",
      search: ""
    });
    fetchAuditLogs(1);
  }

  // Chart data preparation
  const pieChartData = [
    { 
      name: "Available", 
      value: analytics.statusStats?.available || 0, 
      color: "#10b981" 
    },
    { 
      name: "On Loan", 
      value: analytics.statusStats?.on_loan || 0, 
      color: "#f59e0b" 
    },
    { 
      name: "Maintenance", 
      value: analytics.statusStats?.maintenance || 0, 
      color: "#ef4444" 
    },
    { 
      name: "Retired", 
      value: analytics.statusStats?.retired || 0, 
      color: "#6b7280" 
    }
  ];

  const barChartData = analytics.institutionComparison.map(inst => ({
    name: inst.name,
    total: inst.total_assets || 0,
    active: inst.active_assets || 0,
    retired: inst.retired_assets || 0
  }));

  if (loading && activeTab === "analytics") {
    return (
      <div className="reports-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📊 Reports & Analytics</h1>
        <p>System-wide insights and audit trails</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "analytics" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={activeTab === "audit" ? "tab active" : "tab"}
          onClick={() => setActiveTab("audit")}
        >
          Audit Logs
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="analytics-section">
          <div className="analytics-actions">
            <button onClick={fetchAnalytics} className="refresh-btn">
              🔄 Refresh
            </button>
            <button onClick={exportAnalytics} className="export-btn">
              📥 Export CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>{analytics.totalAssets}</h3>
              <p>Total Assets</p>
            </div>
            <div className="summary-card">
              <h3>{analytics.activeAssets}</h3>
              <p>Active Assets</p>
            </div>
            <div className="summary-card">
              <h3>{analytics.retiredAssets}</h3>
              <p>Retired Assets</p>
            </div>
            <div className="summary-card">
              <h3>{analytics.totalInstitutions}</h3>
              <p>Institutions</p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Asset Status Pie Chart */}
            <div className="chart-card">
              <h3>Asset Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Institution Comparison Bar Chart */}
            <div className="chart-card">
              <h3>Assets by Institution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#10b981" name="Active" />
                  <Bar dataKey="retired" fill="#6b7280" name="Retired" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Admin Activity Table */}
          <div className="activity-section">
            <h3>Top Admin Activity</h3>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Institution</th>
                  <th>Actions</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {analytics.adminActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No activity data available
                    </td>
                  </tr>
                ) : (
                  analytics.adminActivity.map((admin, idx) => (
                    <tr key={idx}>
                      <td>{admin.username}</td>
                      <td>{admin.email}</td>
                      <td>{admin.institution_name}</td>
                      <td>{admin.action_count}</td>
                      <td>
                        {admin.last_action
                          ? new Date(admin.last_action).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="audit-section">
          <div className="audit-actions">
            <button onClick={() => fetchAuditLogs(auditPage)} className="refresh-btn">
              🔄 Refresh
            </button>
            <button onClick={exportAuditLogs} className="export-btn">
              📥 Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="audit-filters">
            <select
              name="institution_id"
              value={auditFilters.institution_id}
              onChange={handleFilterChange}
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>

            <select
              name="user_id"
              value={auditFilters.user_id}
              onChange={handleFilterChange}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <select
              name="action_type"
              value={auditFilters.action_type}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="CHECK_OUT">Check Out</option>
              <option value="CHECK_IN">Check In</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RETIRE">Retire</option>
              <option value="EXPORT_CSV">Export CSV</option>
              <option value="CSV_IMPORT">CSV Import</option>
            </select>

            <select
              name="entity_type"
              value={auditFilters.entity_type}
              onChange={handleFilterChange}
            >
              <option value="">All Entity Types</option>
              <option value="assets">Assets</option>
              <option value="users">Users</option>
              <option value="institutions">Institutions</option>
              <option value="transactions">Transactions</option>
              <option value="maintenance_records">Maintenance</option>
              <option value="auth">Authentication</option>
            </select>

            <input
              type="text"
              name="search"
              placeholder="Search..."
              value={auditFilters.search}
              onChange={handleFilterChange}
            />

            <input
              type="date"
              name="date_from"
              placeholder="From Date"
              value={auditFilters.date_from}
              onChange={handleFilterChange}
            />

            <input
              type="date"
              name="date_to"
              placeholder="To Date"
              value={auditFilters.date_to}
              onChange={handleFilterChange}
            />

            <button onClick={applyFilters} className="apply-btn">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="clear-btn">
              Clear All
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="audit-logs-table">
            <p>
              Showing {auditLogs.length} of {auditTotal} activities across all institutions
            </p>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Institution</th>
                  <th>Description</th>
                  <th>Action Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "3rem" }}>
                      <div className="empty-state">
                        No audit logs found
                      </div>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {log.user_full_name || log.username || "System"}
                          </div>
                          {log.user_role && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                              {log.user_role}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="institution-badge">
                          {log.institution_name || "System"}
                        </span>
                      </td>
                      <td>
                        <span className="log-description">
                          {log.description}
                        </span>
                      </td>
                      <td>
                        <span className="action-badge">{log.action}</span>
                      </td>
                      <td>
                        {(log.details || log.old_values || log.new_values) ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary>View</summary>
                            <pre>
                              {JSON.stringify({
                                details: log.details,
                                old: log.old_values,
                                new: log.new_values
                              }, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => fetchAuditLogs(auditPage - 1)}
                disabled={auditPage === 1}
              >
                Previous
              </button>
              <span>
                Page {auditPage} of {Math.ceil(auditTotal / 50)}
              </span>
              <button
                onClick={() => fetchAuditLogs(auditPage + 1)}
                disabled={auditPage >= Math.ceil(auditTotal / 50)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}