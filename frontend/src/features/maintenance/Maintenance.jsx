import React, { useState, useEffect } from 'react';
import '../../styles/Maintenance.css';
import API_BASE_URL from "../../api/config";

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    asset_id: '',
    maintenance_type: 'preventive',
    description: '',
    start_date: '',
    assigned_to: '',
    estimated_cost: ''
  });

  const [closeForm, setCloseForm] = useState({
    maintenance_id: '',
    actual_cost: '',
    completion_notes: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAllData();
    fetchUserRole();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMaintenanceRecords(),
        fetchAssets(),
        fetchUsers(),
        fetchRiskScores()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Maintenance records:', data);
      if (data.success) {
        setMaintenanceRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=get_assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Assets:', data);
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=get_users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Users:', data);
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRiskScores = async () => {
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=risk_scores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Risk scores:', data);
      if (data.success) {
        setRiskScores(data.scores);
      }
    } catch (error) {
      console.error('Error fetching risk scores:', error);
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Maintenance scheduled successfully!');
        setShowScheduleModal(false);
        resetScheduleForm();
        fetchMaintenanceRecords();
      } else {
        alert(data.error || 'Failed to schedule maintenance');
      }
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Error scheduling maintenance');
    }
  };

  const handleCloseMaintenance = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/maintenance.php?action=close', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(closeForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Maintenance closed successfully!');
        setShowCloseModal(false);
        resetCloseForm();
        fetchMaintenanceRecords();
      } else {
        alert(data.error || 'Failed to close maintenance');
      }
    } catch (error) {
      console.error('Error closing maintenance:', error);
      alert('Error closing maintenance');
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      asset_id: '',
      maintenance_type: 'preventive',
      description: '',
      start_date: '',
      assigned_to: '',
      estimated_cost: ''
    });
  };

  const resetCloseForm = () => {
    setCloseForm({
      maintenance_id: '',
      actual_cost: '',
      completion_notes: ''
    });
  };

  const openCloseModal = (record) => {
    setCloseForm({
      maintenance_id: record.id,
      actual_cost: record.estimated_cost || '',
      completion_notes: ''
    });
    setSelectedRecord(record);
    setShowCloseModal(true);
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    if (filters.status !== 'all' && record.status !== filters.status) return false;
    if (filters.type !== 'all' && record.maintenance_type !== filters.type) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        record.asset_name?.toLowerCase().includes(searchLower) ||
        record.asset_code?.toLowerCase().includes(searchLower) ||
        record.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const calculateStats = () => {
    const total = maintenanceRecords.length;
    const open = maintenanceRecords.filter(r => r.status === 'open').length;
    const inProgress = maintenanceRecords.filter(r => r.status === 'in_progress').length;
    const closed = maintenanceRecords.filter(r => r.status === 'closed').length;
    
    // Calculate costs in KSH
    const totalEstimatedCost = maintenanceRecords.reduce((sum, r) => sum + parseFloat(r.estimated_cost || 0), 0);
    const totalActualCost = maintenanceRecords.reduce((sum, r) => sum + parseFloat(r.actual_cost || 0), 0);
    const avgCost = closed > 0 ? totalActualCost / closed : 0;

    return { total, open, inProgress, closed, totalEstimatedCost, totalActualCost, avgCost };
  };

  const stats = calculateStats();

  const openScheduleModal = (assetId = '') => {
    setScheduleForm({
      ...scheduleForm,
      asset_id: assetId,
      estimated_cost: ''
    });
    setShowScheduleModal(true);
  };

  if (loading) {
    return (
      <div className="maintenance-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading maintenance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-container">
      {/* Header */}
      <div className="maintenance-header">
        <div>
          <h1 className="maintenance-title">🔧 Maintenance Management</h1>
          <p className="maintenance-subtitle">Schedule, track, and manage asset maintenance</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => openScheduleModal()}
        >
          <span className="icon">+</span>
          Schedule Maintenance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-card-yellow">
          <div className="stat-label">Open/In Progress</div>
          <div className="stat-value">{stats.open + stats.inProgress}</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.closed}</div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-label">Total Actual Cost (KSH)</div>
          <div className="stat-value">KSH {stats.totalActualCost.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab ${activeTab === 'schedule' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <span className="tab-icon">📅</span>
            Schedule Maintenance
          </button>
          <button
            className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <span className="tab-icon">📊</span>
            Maintenance Summary
          </button>
          <button
            className={`tab ${activeTab === 'predictive' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('predictive')}
          >
            <span className="tab-icon">🔮</span>
            Predictive Maintenance
          </button>
        </div>

        <div className="tabs-content">
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="tab-panel">
              {/* Filters */}
              <div className="filters-grid">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="🔍 Search by asset..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="input-field"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="predictive">Predictive</option>
                </select>
              </div>

              {/* Records Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Estimated Cost (KSH)</th>
                      <th>Actual Cost (KSH)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="asset-info">
                            <div className="asset-name">{record.asset_name}</div>
                            <div className="asset-code">{record.asset_code}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-type">
                            {record.maintenance_type}
                          </span>
                        </td>
                        <td className="description-cell">{record.description}</td>
                        <td>
                          <span className={`badge badge-${record.status}`}>
                            {record.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{record.start_date || 'Not started'}</td>
                        <td className="cost-cell">KSH {parseFloat(record.estimated_cost || 0).toLocaleString()}</td>
                        <td className="cost-cell">
                          {record.actual_cost ? `KSH ${parseFloat(record.actual_cost).toLocaleString()}` : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDetailsModal(true);
                              }}
                              title="View Details"
                            >
                              👁️
                            </button>
                            {record.status !== 'closed' && (userRole === 'ict' || userRole === 'admin') && (
                              <button
                                className="btn-icon"
                                onClick={() => openCloseModal(record)}
                                title="Close Maintenance"
                                style={{ backgroundColor: '#10b981', color: 'white' }}
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRecords.length === 0 && (
                  <div className="empty-state">
                    <p>No maintenance records found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="tab-panel">
              <div className="summary-grid">
                <div className="summary-card">
                  <h3 className="summary-title">By Status</h3>
                  <div className="summary-list">
                    <div className="summary-item">
                      <span className="summary-label">Open</span>
                      <span className="summary-value summary-value-yellow">{stats.open}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">In Progress</span>
                      <span className="summary-value summary-value-blue">{stats.inProgress}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Closed</span>
                      <span className="summary-value summary-value-green">{stats.closed}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <h3 className="summary-title">Cost Analysis (KSH)</h3>
                  <div className="summary-list">
                    <div className="summary-item">
                      <span className="summary-label">Total Estimated</span>
                      <span className="summary-value">KSH {stats.totalEstimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Actual</span>
                      <span className="summary-value">KSH {stats.totalActualCost.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Average Cost</span>
                      <span className="summary-value">KSH {stats.avgCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3 className="summary-title">Recent Activity</h3>
                <div className="activity-list">
                  {maintenanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="activity-item">
                      <div className="activity-icon">🔧</div>
                      <div className="activity-content">
                        <div className="activity-title">{record.asset_name}</div>
                        <div className="activity-description">{record.description}</div>
                        <div className="activity-meta">
                          {record.start_date} • {record.maintenance_type}
                          {record.actual_cost && ` • KSH ${parseFloat(record.actual_cost).toLocaleString()}`}
                        </div>
                      </div>
                      <span className={`badge badge-${record.status}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Predictive Tab */}
          {activeTab === 'predictive' && (
            <div className="tab-panel">
              <div className="predictive-header">
                <h2 className="predictive-title">Predictive Maintenance Insights</h2>
              </div>

              <div className="risk-list">
                {riskScores.map((score) => (
                  <div
                    key={score.id}
                    className={`risk-card risk-card-${score.risk_level.toLowerCase()}`}
                  >
                    <div className="risk-header">
                      <div className="risk-info">
                        <div className="risk-asset-name">
                          ⚠️ {score.asset_name}
                        </div>
                        <div className="risk-asset-code">{score.asset_code}</div>
                      </div>
                      <span className={`risk-badge risk-badge-${score.risk_level.toLowerCase()}`}>
                        {score.risk_level} RISK
                      </span>
                    </div>
                    <div className="risk-details">
                      <div className="risk-detail-item">
                        <span className="risk-detail-label">Risk Score:</span>
                        <span className="risk-detail-value">
                          {(score.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      {score.predicted_failure_date && (
                        <div className="risk-detail-item">
                          <span className="risk-detail-label">Predicted Failure:</span>
                          <span className="risk-detail-value">{score.predicted_failure_date}</span>
                        </div>
                      )}
                      <div className="risk-detail-item">
                        <span className="risk-detail-label">Model Version:</span>
                        <span className="risk-detail-value">{score.model_version}</span>
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => openScheduleModal(score.asset_id)}
                    >
                      Schedule Maintenance
                    </button>
                  </div>
                ))}
                {riskScores.length === 0 && (
                  <div className="empty-state">
                    <p>No risk predictions available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule Maintenance</h3>
              <button
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleScheduleMaintenance} className="modal-content">
              <div className="form-group">
                <label className="form-label">Asset * {assets.length > 0 && `(${assets.length} available)`}</label>
                <select
                  value={scheduleForm.asset_id}
                  onChange={(e) => setScheduleForm({...scheduleForm, asset_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select Asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance Type *</label>
                <select
                  value={scheduleForm.maintenance_type}
                  onChange={(e) => setScheduleForm({...scheduleForm, maintenance_type: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="predictive">Predictive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                  className="input-field textarea-field"
                  rows="3"
                  required
                  placeholder="Describe the maintenance work needed..."
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, start_date: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Cost (KSH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={scheduleForm.estimated_cost}
                  onChange={(e) => setScheduleForm({...scheduleForm, estimated_cost: e.target.value})}
                  className="input-field"
                  placeholder="0.00"
                />
                <small style={{color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                  Leave blank if cost is not yet determined
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To {users.length > 0 && `(${users.length} users)`}</label>
                <select
                  value={scheduleForm.assigned_to}
                  onChange={(e) => setScheduleForm({...scheduleForm, assigned_to: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select User (Optional)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Schedule
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {showCloseModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Close Maintenance</h3>
              <button
                className="modal-close"
                onClick={() => setShowCloseModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCloseMaintenance} className="modal-content">
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <span className="detail-label">Asset:</span>
                <span className="detail-value">{selectedRecord.asset_name} ({selectedRecord.asset_code})</span>
              </div>
              
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedRecord.description}</span>
              </div>

              <div className="detail-item" style={{ marginBottom: '24px' }}>
                <span className="detail-label">Estimated Cost:</span>
                <span className="detail-value">KSH {parseFloat(selectedRecord.estimated_cost || 0).toLocaleString()}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Actual Cost (KSH) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closeForm.actual_cost}
                  onChange={(e) => setCloseForm({...closeForm, actual_cost: e.target.value})}
                  className="input-field"
                  placeholder="Enter actual cost incurred"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Completion Notes</label>
                <textarea
                  value={closeForm.completion_notes}
                  onChange={(e) => setCloseForm({...closeForm, completion_notes: e.target.value})}
                  className="input-field textarea-field"
                  rows="4"
                  placeholder="Add any notes about the completed maintenance work..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Close Maintenance
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Maintenance Record Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Asset:</span>
                  <span className="detail-value">{selectedRecord.asset_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Asset Code:</span>
                  <span className="detail-value">{selectedRecord.asset_code}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedRecord.maintenance_type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`badge badge-${selectedRecord.status}`}>
                    {selectedRecord.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{selectedRecord.start_date || 'Not started'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{selectedRecord.end_date || 'In progress'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estimated Cost:</span>
                  <span className="detail-value">KSH {parseFloat(selectedRecord.estimated_cost || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Actual Cost:</span>
                  <span className="detail-value">
                    {selectedRecord.actual_cost ? `KSH ${parseFloat(selectedRecord.actual_cost).toLocaleString()}` : 'Not completed'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reported By:</span>
                  <span className="detail-value">{selectedRecord.reported_by_name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned To:</span>
                  <span className="detail-value">{selectedRecord.assigned_to_name || 'N/A'}</span>
                </div>
                {selectedRecord.closed_by_name && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Closed By:</span>
                      <span className="detail-value">{selectedRecord.closed_by_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Closed At:</span>
                      <span className="detail-value">{selectedRecord.closed_at}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Actual Completion:</span>
                      <span className="detail-value">{selectedRecord.actual_completion_date}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="detail-full">
                <span className="detail-label">Description:</span>
                <div className="detail-description">{selectedRecord.description}</div>
              </div>
              {selectedRecord.completion_notes && (
                <div className="detail-full">
                  <span className="detail-label">Completion Notes:</span>
                  <div className="detail-description">{selectedRecord.completion_notes}</div>
                </div>
              )}
              <button
                className="btn-secondary btn-full"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;