import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package,
  AlertTriangle,
  Wrench,
  BarChart3,
  RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import "../../styles/Analytics.css";
import API_BASE_URL from "../../api/config";

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444'
};

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Basic stats
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsInUse: 0,
    assetsInRepair: 0,
    totalUsers: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });

  // Analytics data
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  // API Base URLs
  const BACKEND_URL = "${API_BASE_URL}/api";
  const ANALYTICS_URL = "http://localhost:5001/api/analytics";

  useEffect(() => {
    if (!token || !institutionId) {
      navigate("/login");
      return;
    }
    fetchAllData();
  }, [token, institutionId, timeRange]);

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "X-Institution-ID": institutionId,
    "Content-Type": "application/json",
  });

  async function fetchAllData() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchBasicStats(),
        fetchAnalyticsDashboard()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBasicStats() {
    const headers = getHeaders();

    try {
      // Fetch assets
      const assetsRes = await fetch(
        `${BACKEND_URL}/assets?institution_id=${institutionId}`,
        { headers }
      );

      if (!assetsRes.ok) {
        if (assetsRes.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Failed to fetch assets");
      }

      const assetsData = await assetsRes.json();
      const assets = assetsData.assets || [];

      // Calculate basic stats from assets
      const inUse = assets.filter((a) => a.status === "on_loan").length;
      const inRepair = assets.filter((a) => a.status === "maintenance").length;

      // Fetch users count
      let userCount = 0;
      try {
        const usersRes = await fetch(
          `${BACKEND_URL}/users?institution_id=${institutionId}`,
          { headers }
        );
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          userCount = usersData.users?.length || 0;
        }
      } catch (err) {
        console.warn("Users data not available:", err);
      }

      // Calculate risk levels from dashboardData instead of separate endpoint
      let highRisk = 0, mediumRisk = 0, lowRisk = 0;
      
      // Try to get risk data from analytics service
      try {
        const riskRes = await fetch(
          `${ANALYTICS_URL}/dashboard/${institutionId}`
        );
        
        if (riskRes.ok) {
          const riskData = await riskRes.json();
          if (riskData.success && riskData.data?.risk_distribution) {
            const riskDist = riskData.data.risk_distribution;
            highRisk = riskDist.find(r => r.risk_level === 'HIGH')?.count || 0;
            mediumRisk = riskDist.find(r => r.risk_level === 'MEDIUM')?.count || 0;
            lowRisk = riskDist.find(r => r.risk_level === 'LOW')?.count || 0;
          }
        }
      } catch (err) {
        console.warn("Risk data not available from analytics service:", err);
        // Calculate basic risk estimates from asset conditions as fallback
        const poorCondition = assets.filter(a => a.condition === 'poor').length;
        const fairCondition = assets.filter(a => a.condition === 'fair').length;
        const goodCondition = assets.filter(a => a.condition === 'good').length;
        
        highRisk = poorCondition;
        mediumRisk = fairCondition;
        lowRisk = goodCondition;
      }

      setStats({
        totalAssets: assets.length,
        assetsInUse: inUse,
        assetsInRepair: inRepair,
        totalUsers: userCount,
        highRisk,
        mediumRisk,
        lowRisk,
      });
    } catch (err) {
      console.error("Error in fetchBasicStats:", err);
      throw err;
    }
  }

  async function fetchAnalyticsDashboard() {
    try {
      const response = await fetch(`${ANALYTICS_URL}/dashboard/${institutionId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        }
      } else {
        console.warn("Analytics dashboard returned:", response.status);
      }
    } catch (err) {
      console.warn("Analytics dashboard not available:", err);
    }
  }

  async function runPredictiveAnalysis() {
    setProcessing(true);
    setError("");
    
    try {
      // Extract features
      const featuresRes = await fetch(
        `${ANALYTICS_URL}/extract-features/${institutionId}`,
        { method: 'POST' }
      );
      
      if (!featuresRes.ok) {
        throw new Error(`Feature extraction failed: ${featuresRes.status}`);
      }
      
      const featuresData = await featuresRes.json();
      
      if (!featuresData.success) {
        throw new Error('Feature extraction failed');
      }

      // Calculate risks
      const risksRes = await fetch(
        `${ANALYTICS_URL}/calculate-risks/${institutionId}`,
        { method: 'POST' }
      );
      
      if (!risksRes.ok) {
        throw new Error(`Risk calculation failed: ${risksRes.status}`);
      }
      
      const risksData = await risksRes.json();
      
      if (!risksData.success) {
        throw new Error('Risk calculation failed');
      }

      alert(`Analysis complete! Processed ${risksData.risks_calculated} assets.`);
      
      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to run analysis: " + err.message);
      alert("Failed to run analysis: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function fetchAssetDetails(assetId) {
    try {
      const response = await fetch(`${ANALYTICS_URL}/asset-details/${assetId}`);
      const result = await response.json();
      
      if (result.success) {
        setAssetDetails(result.data);
        setSelectedAsset(assetId);
      }
    } catch (err) {
      console.error("Error fetching asset details:", err);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getRiskBadgeClass = (level) => {
    return `risk-badge risk-${level?.toLowerCase() || 'unknown'}`;
  };

  const statsCards = [
    {
      title: "Total Assets",
      value: stats.totalAssets,
      icon: <Package />,
      color: "#3b82f6",
    },
    {
      title: "Assets in Use",
      value: stats.assetsInUse,
      icon: <TrendingUp />,
      color: "#10b981",
    },
    {
      title: "High Risk Assets",
      value: stats.highRisk,
      icon: <AlertTriangle />,
      color: "#ef4444",
    },
    {
      title: "In Maintenance",
      value: stats.assetsInRepair,
      icon: <Wrench />,
      color: "#f59e0b",
    },
  ];

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Predictive Analytics Dashboard</h1>
        </div>
        <div className="header-actions">
          <button 
            onClick={runPredictiveAnalysis} 
            disabled={processing}
            className="btn-primary"
          >
            {processing ? (
              <>
                <RefreshCw className="spinning" size={16} />
                Processing...
              </>
            ) : (
              <>
                <BarChart3 size={16} />
                Run Analysis
              </>
            )}
          </button>
          <button onClick={fetchAllData} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchAllData}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        {statsCards.map((stat) => (
          <div 
            key={stat.title} 
            className="stat-card" 
            style={{ borderLeftColor: stat.color }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h2>{stat.value}</h2>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'risks' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('risks')}
        >
          Risk Analysis
        </button>
        <button
          className={activeTab === 'maintenance' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance Forecast
        </button>
        <button
          className={activeTab === 'usage' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('usage')}
        >
          Usage Patterns
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {dashboardData ? (
              <div className="charts-grid">
                {/* Risk Distribution Chart */}
                <div className="chart-card">
                  <h3>Risk Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.risk_distribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="risk_level" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6">
                        {dashboardData.risk_distribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk_level]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Condition Breakdown Chart */}
                <div className="chart-card">
                  <h3>Asset Condition</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.condition_breakdown || []}
                        dataKey="count"
                        nameKey="condition"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {dashboardData.condition_breakdown?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.condition === 'good' ? '#10b981' : 
                              entry.condition === 'fair' ? '#f59e0b' : 
                              '#ef4444'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="no-data-card">
                <p>No analytics data available. Run the predictive analysis to generate insights.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="risks-tab">
            <h2>High Risk Assets</h2>
            <p className="tab-description">
              Assets requiring immediate attention based on predictive analysis
            </p>
            
            <div className="asset-list">
              {dashboardData?.high_risk_assets?.length > 0 ? (
                dashboardData.high_risk_assets.map(asset => (
                  <div 
                    key={asset.id} 
                    className="asset-card"
                    onClick={() => fetchAssetDetails(asset.id)}
                  >
                    <div className="asset-header">
                      <div>
                        <h4>{asset.name}</h4>
                        <p className="asset-code">{asset.asset_code}</p>
                      </div>
                      <span className={getRiskBadgeClass(asset.risk_level)}>
                        {asset.risk_level}
                      </span>
                    </div>
                    <div className="asset-details">
                      <div className="detail-item">
                        <span className="label">Risk Score:</span>
                        <span className="value">{(asset.risk_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Department:</span>
                        <span className="value">{asset.department || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Condition:</span>
                        <span className={`value condition-${asset.condition}`}>
                          {asset.condition}
                        </span>
                      </div>
                      {asset.predicted_failure_date && (
                        <div className="detail-item">
                          <span className="label">Predicted Failure:</span>
                          <span className="value warning">
                            {formatDate(asset.predicted_failure_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No high-risk assets found. Run analysis to generate predictions.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-tab">
            <h2>Maintenance Forecast (Next 30 Days)</h2>
            <p className="tab-description">
              Assets predicted to require maintenance soon
            </p>
            
            <div className="forecast-list">
              {dashboardData?.maintenance_forecast?.length > 0 ? (
                dashboardData.maintenance_forecast.map(asset => (
                  <div key={asset.id} className="forecast-item">
                    <div className="forecast-date">
                      <div className="date-badge">
                        {formatDate(asset.predicted_failure_date)}
                      </div>
                    </div>
                    <div className="forecast-details">
                      <h4>{asset.name}</h4>
                      <p className="asset-code">{asset.asset_code}</p>
                      <div className="risk-indicator">
                        <span>Risk Score: {(asset.risk_score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="forecast-actions">
                      <button 
                        className="btn-sm btn-primary"
                        onClick={() => fetchAssetDetails(asset.id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No maintenance predicted in the next 30 days</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="usage-tab">
            <h2>Asset Usage Patterns</h2>
            <p className="tab-description">
              Most frequently used assets (last 90 days)
            </p>
            
            {dashboardData?.usage_patterns?.length > 0 ? (
              <>
                <div className="chart-card">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={dashboardData.usage_patterns} 
                      layout="horizontal"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="asset_code" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="usage_count" fill="#3b82f6" name="Usage Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="usage-list">
                  {dashboardData.usage_patterns.map(asset => (
                    <div key={asset.id} className="usage-item">
                      <div className="usage-info">
                        <h4>{asset.name}</h4>
                        <p className="asset-code">{asset.asset_code}</p>
                        <p className="asset-type">{asset.asset_type}</p>
                      </div>
                      <div className="usage-count">
                        <span className="count-number">{asset.usage_count}</span>
                        <span className="count-label">uses</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-data">No usage data available</p>
            )}
          </div>
        )}
      </div>

      {/* Asset Details Modal */}
      {selectedAsset && assetDetails && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Asset Analytics Details</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedAsset(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="asset-info-section">
                <h3>{assetDetails.asset?.name}</h3>
                <p className="asset-code">{assetDetails.asset?.asset_code}</p>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Risk Level:</span>
                    <span className={getRiskBadgeClass(assetDetails.asset?.risk_level)}>
                      {assetDetails.asset?.risk_level || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Risk Score:</span>
                    <span className="value">
                      {assetDetails.asset?.risk_score 
                        ? (assetDetails.asset.risk_score * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Age:</span>
                    <span className="value">
                      {assetDetails.asset?.asset_age_months || 0} months
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Usage (90d):</span>
                    <span className="value">
                      {assetDetails.asset?.usage_count || 0} times
                    </span>
                  </div>
                </div>
              </div>

              <div className="recommendations-section">
                <h4>Recommendations</h4>
                <ul className="recommendations-list">
                  {assetDetails.recommendations?.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              {assetDetails.usage_trend?.length > 0 && (
                <div className="trend-section">
                  <h4>Usage Trend (Last 30 Days)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={assetDetails.usage_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="feature_date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={(date) => formatDate(date)} />
                      <Line 
                        type="monotone" 
                        dataKey="usage_count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Usage Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}