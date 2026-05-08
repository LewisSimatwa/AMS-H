import { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  X,
  Archive
} from "lucide-react";
import '../../styles/SuperAdmin/Assets.css'
import API_BASE_URL from "../../api/config";

export default function GlobalAssetOversight() {
  const [assets, setAssets] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireReason, setRetireReason] = useState("");

  useEffect(() => {
    fetchAssets();
    fetchInstitutions();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("${API_BASE_URL}/api/super_admin/assets", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("${API_BASE_URL}/api/super_admin/institutions", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      setInstitutions(data.institutions || []);
    } catch (error) {
      console.error("Failed to fetch institutions:", error);
    }
  };

  const handleViewDetails = async (asset) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/super_admin/asset-history?asset_id=${asset.id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setSelectedAsset({
        ...asset,
        history: data.history || []
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to fetch asset history:", error);
      setSelectedAsset({
        ...asset,
        history: []
      });
      setShowDetailModal(true);
    }
  };

  const handleForceRetire = (asset) => {
    setSelectedAsset(asset);
    setRetireReason("");
    setShowRetireModal(true);
  };

  const handleSubmitRetire = async () => {
    if (!retireReason.trim()) {
      alert("Please provide a reason for retirement");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("${API_BASE_URL}/api/super_admin/force-retire", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asset_id: selectedAsset.id,
          reason: retireReason
        })
      });

      if (response.ok) {
        setShowRetireModal(false);
        fetchAssets();
        alert("Asset retired successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to retire asset: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to retire asset:", error);
      alert("Failed to retire asset");
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstitution = !filterInstitution || asset.institution_id == filterInstitution;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    return matchesSearch && matchesInstitution && matchesStatus;
  });

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'available': return 'available';
      case 'on_loan': 
      case 'in_use': return 'on-loan';
      case 'maintenance': return 'maintenance';
      case 'retired': return 'retired';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="global-asset-oversight">
      <div className="asset-header">
        <h1>Global Asset Oversight</h1>
        <p>View and monitor all assets across institutions</p>
      </div>

      <div className="filter-section">
        <div className="filter-grid">
          <div className="filter-input-wrapper">
            <Search className="filter-icon" size={20} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-input-wrapper">
            <Building2 className="filter-icon" size={20} />
            <select
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="filter-select"
            >
              <option value="">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-input-wrapper">
            <Filter className="filter-icon" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Assets</p>
          <p className="stat-value">{filteredAssets.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Available</p>
          <p className="stat-value green">
            {filteredAssets.filter(a => a.status === 'available').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In Use</p>
          <p className="stat-value blue">
            {filteredAssets.filter(a => a.status === 'in_use').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Retired</p>
          <p className="stat-value red">
            {filteredAssets.filter(a => a.status === 'retired').length}
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Institution</th>
              <th>Category</th>
              <th>Status</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-cell">
                      <div className="asset-icon">
                        <Package size={20} />
                      </div>
                      <div className="asset-details">
                        <h4>{asset.name}</h4>
                        <p>{asset.serial_number || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td>{asset.institution_name}</td>
                  <td>{asset.category_name}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    <div className="value-cell">
                      <DollarSign size={14} />
                      {parseFloat(asset.purchase_price || 0).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewDetails(asset)}
                        className="btn-action view"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {asset.status !== 'retired' && (
                        <button
                          onClick={() => handleForceRetire(asset)}
                          className="btn-action retire"
                          title="Force Retire"
                        >
                          <Archive size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state-table">
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Asset Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-grid">
                <div className="detail-item">
                  <p>Asset Name</p>
                  <p>{selectedAsset.name}</p>
                </div>
                <div className="detail-item">
                  <p>Serial Number</p>
                  <p>{selectedAsset.serial_number || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <p>Institution</p>
                  <p>{selectedAsset.institution_name}</p>
                </div>
                <div className="detail-item">
                  <p>Category</p>
                  <p>{selectedAsset.category_name}</p>
                </div>
                <div className="detail-item">
                  <p>Status</p>
                  <span className={`status-badge ${getStatusClass(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div className="detail-item">
                  <p>Purchase Price</p>
                  <p>${parseFloat(selectedAsset.purchase_price || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="history-section">
                <h3>Asset History</h3>
                <div className="history-timeline">
                  {selectedAsset.history && selectedAsset.history.length > 0 ? (
                    selectedAsset.history.map((entry, index) => (
                      <div key={index} className="history-item">
                        <Calendar className="history-icon" size={16} />
                        <div className="history-details">
                          <p className="history-action">{entry.action}</p>
                          <p className="history-description">{entry.description}</p>
                          <p className="history-timestamp">
                            {new Date(entry.timestamp).toLocaleString()} by {entry.user_name}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{color: '#6b7280', fontSize: '0.875rem'}}>No history available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRetireModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowRetireModal(false)}>
          <div className="retire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <AlertCircle color="#dc2626" size={24} />
                <h2>Force Retire Asset</h2>
              </div>
              <button onClick={() => setShowRetireModal(false)} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <div className="retire-form">
              <div className="warning-box">
                <p>
                  <strong>Warning:</strong> This action will retire the asset "{selectedAsset.name}". This is a high-risk operation and will be logged.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Retirement</label>
                <textarea
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  className="form-textarea"
                  rows="4"
                  placeholder="Provide a detailed reason for retiring this asset..."
                />
              </div>
              <div className="form-actions">
                <button
                  onClick={() => setShowRetireModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRetire}
                  className="btn-retire"
                >
                  <Archive size={18} />
                  <span>Retire Asset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}