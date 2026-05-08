import { useState, useEffect } from "react";
import { 
  Building2, 
  Package, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Activity
} from "lucide-react";
import "../../styles/SuperAdmin/Dashboard.css";
import API_BASE_URL from "../../api/config";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    activeInstitutions: 0,
    totalAssets: 0,
    activeAssets: 0,
    retiredAssets: 0,
    totalUsers: 0,
    assetsPerInstitution: []
  });
  const [recentActions, setRecentActions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const statsResponse = await fetch("${API_BASE_URL}/api/super_admin/stats", {
        method: "GET",
        headers
      });

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        throw new Error(`Failed to fetch stats: ${statsResponse.status} - ${errorText}`);
      }

      const statsData = await statsResponse.json();

      const actionsResponse = await fetch("${API_BASE_URL}/api/super_admin/recent-actions", {
        method: "GET",
        headers
      });

      let actionsData = { actions: [] };
      if (actionsResponse.ok) {
        actionsData = await actionsResponse.json();
      }

      setStats(statsData);
      setRecentActions(actionsData.actions || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-subtitle"></div>
        </div>

        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-value"></div>
                  <div className="skeleton skeleton-subtext"></div>
                </div>
                <div className="skeleton skeleton-icon"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div className="skeleton skeleton-card-title"></div>
            </div>
            <div className="skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-list-item">
                  <div className="skeleton skeleton-circle"></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text-small"></div>
                  </div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div className="skeleton skeleton-card-title"></div>
            </div>
            <div className="skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-list-item">
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text-small"></div>
                  </div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{color: '#991b1b'}}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">System Overview</h1>
        <p className="dashboard-subtitle">Monitor system-wide activity and health</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <p className="stat-card-label">Total Institutions</p>
              <p className="stat-card-value">{stats.totalInstitutions}</p>
              <p className="stat-card-subtext">{stats.activeInstitutions} active</p>
            </div>
            <div className="stat-card-icon">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <p className="stat-card-label">Total Assets</p>
              <p className="stat-card-value">{stats.totalAssets}</p>
              <p className="stat-card-subtext">{stats.activeAssets} active</p>
            </div>
            <div className="stat-card-icon icon-green">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <p className="stat-card-label">Retired Assets</p>
              <p className="stat-card-value">{stats.retiredAssets}</p>
              <p className="stat-card-subtext" style={{color: '#6b7280'}}>Out of service</p>
            </div>
            <div className="stat-card-icon icon-orange">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <p className="stat-card-label">Total Users</p>
              <p className="stat-card-value">{stats.totalUsers}</p>
              <p className="stat-card-subtext" style={{color: '#6b7280'}}>Across all institutions</p>
            </div>
            <div className="stat-card-icon icon-purple">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <TrendingUp className="card-header-icon" size={20} />
            <h2 className="card-title">Assets Per Institution</h2>
          </div>
          <div className="risk-list">
            {stats.assetsPerInstitution.length > 0 ? (
              stats.assetsPerInstitution.map((inst, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 color="#2563eb" size={18} />
                    </div>
                    <div>
                      <p style={{fontWeight: 500, color: '#111827'}}>{inst.name}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{inst.asset_count} assets</p>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {inst.active_assets} active
                    </span>
                    <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                      {inst.retired_assets} retired
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Package className="empty-state-icon" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <AlertTriangle className="card-header-icon" size={20} style={{color: '#f59e0b'}} />
            <h2 className="card-title">Recent High-Risk Actions</h2>
          </div>
          <div className="risk-list">
            {recentActions.length > 0 ? (
              recentActions.map((action, i) => (
                <div key={i} className="risk-item">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{flex: 1}}>
                      <p className="risk-item-title">{action.action_type || action.action}</p>
                      <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                        {action.description || 'No description'}
                      </p>
                      <p style={{fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem'}}>
                        {action.user_name ? `By ${action.user_name}` : 'Unknown user'}
                        {action.institution_name ? ` at ${action.institution_name}` : ''}
                      </p>
                    </div>
                    <span className="risk-badge">
                      {action.timestamp ? new Date(action.timestamp).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <AlertTriangle className="empty-state-icon" />
                <p>No recent actions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}