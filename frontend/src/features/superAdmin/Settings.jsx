import { useState, useEffect } from "react";
import { 
  Settings,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Package,
  Tag,
  FileText,
  Lock
} from "lucide-react";
import "../../styles/SuperAdmin/Settings.css";
import API_BASE_URL from "../../api/config";

export default function SystemConfiguration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // State for each configuration section
  const [assetCategories, setAssetCategories] = useState([]);
  const [globalStatuses, setGlobalStatuses] = useState([]);
  const [csvRules, setCsvRules] = useState({
    max_file_size_mb: 10,
    allowed_delimiters: [',', ';', '\t'],
    required_columns: [],
    date_formats: [],
    encoding: 'UTF-8'
  });
  const [passwordPolicies, setPasswordPolicies] = useState({
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: true,
    max_age_days: 90,
    prevent_reuse: 5,
    lockout_attempts: 5,
    lockout_duration_minutes: 30
  });

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [statusForm, setStatusForm] = useState({ name: '', description: '', color: '#3b82f6' });

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const response = await fetch("http://localhost:8000/api/super_admin/system-config", {
        method: "GET",
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`);
      }

      const data = await response.json();
      
      setAssetCategories(data.asset_categories || []);
      setGlobalStatuses(data.global_statuses || []);
      setCsvRules(data.csv_rules || csvRules);
      setPasswordPolicies(data.password_policies || passwordPolicies);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (section, data) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/super_admin/system-config", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ section, data })
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      setSuccess("Configuration saved successfully");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Asset Categories
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setError("Category name is required");
      return;
    }

    const newCategories = editingCategory
      ? assetCategories.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm } : c)
      : [...assetCategories, { id: Date.now(), ...categoryForm }];

    setAssetCategories(newCategories);
    await saveConfiguration('asset_categories', newCategories);
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const newCategories = assetCategories.filter(c => c.id !== id);
      setAssetCategories(newCategories);
      await saveConfiguration('asset_categories', newCategories);
    }
  };

  // Global Statuses
  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusForm({ name: '', description: '', color: '#3b82f6' });
    setShowStatusModal(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusForm({ name: status.name, description: status.description, color: status.color });
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name.trim()) {
      setError("Status name is required");
      return;
    }

    const newStatuses = editingStatus
      ? globalStatuses.map(s => s.id === editingStatus.id ? { ...s, ...statusForm } : s)
      : [...globalStatuses, { id: Date.now(), ...statusForm }];

    setGlobalStatuses(newStatuses);
    await saveConfiguration('global_statuses', newStatuses);
    setShowStatusModal(false);
  };

  const handleDeleteStatus = async (id) => {
    if (confirm("Are you sure you want to delete this status?")) {
      const newStatuses = globalStatuses.filter(s => s.id !== id);
      setGlobalStatuses(newStatuses);
      await saveConfiguration('global_statuses', newStatuses);
    }
  };

  // CSV Rules
  const handleCsvRuleChange = (field, value) => {
    const newRules = { ...csvRules, [field]: value };
    setCsvRules(newRules);
  };

  const saveCsvRules = async () => {
    await saveConfiguration('csv_rules', csvRules);
  };

  // Password Policies
  const handlePasswordPolicyChange = (field, value) => {
    const newPolicies = { ...passwordPolicies, [field]: value };
    setPasswordPolicies(newPolicies);
  };

  const savePasswordPolicies = async () => {
    await saveConfiguration('password_policies', passwordPolicies);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-config-container">
      {/* Header */}
      <div className="config-header">
        <div className="header-content">
          <Settings className="header-icon" size={32} />
          <div>
            <h1 className="header-title">System Configuration</h1>
            <p className="header-subtitle">Sharp tools for system management</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="alert-icon" size={20} />
          <p className="alert-text">{error}</p>
          <button onClick={() => setError("")} className="alert-close">
            <X size={20} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check className="alert-icon" size={20} />
          <p className="alert-text">{success}</p>
        </div>
      )}

      <div className="config-grid">
        {/* Asset Categories */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-title-wrapper">
              <Package className="config-card-icon" size={20} />
              <h2 className="config-card-title">Asset Categories</h2>
            </div>
            <button onClick={handleAddCategory} className="btn-primary">
              <Plus size={16} />
              Add
            </button>
          </div>
          
          <div className="config-list">
            {assetCategories.length > 0 ? (
              assetCategories.map((category) => (
                <div key={category.id} className="config-list-item">
                  <div className="list-item-content">
                    <p className="list-item-name">{category.name}</p>
                    {category.description && (
                      <p className="list-item-description">{category.description}</p>
                    )}
                  </div>
                  <div className="list-item-actions">
                    <button onClick={() => handleEditCategory(category)} className="action-btn edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="action-btn delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No categories defined</p>
            )}
          </div>
        </div>

        {/* Global Statuses */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-title-wrapper">
              <Tag className="config-card-icon icon-green" size={20} />
              <h2 className="config-card-title">Global Statuses</h2>
            </div>
            <button onClick={handleAddStatus} className="btn-primary btn-green">
              <Plus size={16} />
              Add
            </button>
          </div>
          
          <div className="config-list">
            {globalStatuses.length > 0 ? (
              globalStatuses.map((status) => (
                <div key={status.id} className="config-list-item">
                  <div className="list-item-content">
                    <div className="list-item-main">
                      <div className="status-color-dot" style={{ backgroundColor: status.color }} />
                      <div>
                        <p className="list-item-name">{status.name}</p>
                        {status.description && (
                          <p className="list-item-description">{status.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button onClick={() => handleEditStatus(status)} className="action-btn edit">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No statuses defined</p>
            )}
          </div>
        </div>

        {/* CSV Import Rules */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-title-wrapper">
              <FileText className="config-card-icon icon-purple" size={20} />
              <h2 className="config-card-title">CSV Import Rules</h2>
            </div>
            <button onClick={saveCsvRules} disabled={saving} className="btn-primary btn-purple">
              <Save size={16} />
              Save
            </button>
          </div>
          
          <div>
            <div className="form-section">
              <label className="form-label">Max File Size (MB)</label>
              <input
                type="number"
                value={csvRules.max_file_size_mb}
                onChange={(e) => handleCsvRuleChange('max_file_size_mb', parseInt(e.target.value))}
                className="config-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">File Encoding</label>
              <select
                value={csvRules.encoding}
                onChange={(e) => handleCsvRuleChange('encoding', e.target.value)}
                className="config-select"
              >
                <option value="UTF-8">UTF-8</option>
                <option value="ISO-8859-1">ISO-8859-1</option>
                <option value="ASCII">ASCII</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">Allowed Delimiters</label>
              <div className="checkbox-group">
                {[',', ';', '\t', '|'].map(delimiter => (
                  <label key={delimiter} className="config-checkbox-label delimiter-label">
                    <input
                      type="checkbox"
                      checked={csvRules.allowed_delimiters?.includes(delimiter)}
                      onChange={(e) => {
                        const delims = e.target.checked
                          ? [...(csvRules.allowed_delimiters || []), delimiter]
                          : csvRules.allowed_delimiters.filter(d => d !== delimiter);
                        handleCsvRuleChange('allowed_delimiters', delims);
                      }}
                      className="config-checkbox"
                    />
                    <span className="checkbox-text">
                      {delimiter === '\t' ? 'Tab' : delimiter === ',' ? 'Comma' : delimiter === ';' ? 'Semicolon' : 'Pipe'}
                      <code className="delimiter-code">
                        {delimiter === '\t' ? '\\t' : delimiter}
                      </code>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Password Policies */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-title-wrapper">
              <Lock className="config-card-icon icon-orange" size={20} />
              <h2 className="config-card-title">Password Policies</h2>
            </div>
            <button onClick={savePasswordPolicies} disabled={saving} className="btn-primary btn-orange">
              <Save size={16} />
              Save
            </button>
          </div>
          
          <div>
            <div className="form-section">
              <label className="form-label">Minimum Length</label>
              <input
                type="number"
                min="6"
                max="32"
                value={passwordPolicies.min_length}
                onChange={(e) => handlePasswordPolicyChange('min_length', parseInt(e.target.value))}
                className="config-input"
              />
            </div>

            <div className="form-section">
              <div className="checkbox-group">
                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={passwordPolicies.require_uppercase}
                    onChange={(e) => handlePasswordPolicyChange('require_uppercase', e.target.checked)}
                    className="config-checkbox"
                  />
                  <span className="checkbox-text">Require Uppercase Letters</span>
                </label>

                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={passwordPolicies.require_lowercase}
                    onChange={(e) => handlePasswordPolicyChange('require_lowercase', e.target.checked)}
                    className="config-checkbox"
                  />
                  <span className="checkbox-text">Require Lowercase Letters</span>
                </label>

                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={passwordPolicies.require_numbers}
                    onChange={(e) => handlePasswordPolicyChange('require_numbers', e.target.checked)}
                    className="config-checkbox"
                  />
                  <span className="checkbox-text">Require Numbers</span>
                </label>

                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={passwordPolicies.require_special}
                    onChange={(e) => handlePasswordPolicyChange('require_special', e.target.checked)}
                    className="config-checkbox"
                  />
                  <span className="checkbox-text">Require Special Characters</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Password Max Age (Days)</label>
              <input
                type="number"
                min="0"
                value={passwordPolicies.max_age_days}
                onChange={(e) => handlePasswordPolicyChange('max_age_days', parseInt(e.target.value))}
                className="config-input"
              />
              <p className="help-text">0 = never expires</p>
            </div>

            <div className="form-section">
              <label className="form-label">Lockout After Failed Attempts</label>
              <input
                type="number"
                min="3"
                max="10"
                value={passwordPolicies.lockout_attempts}
                onChange={(e) => handlePasswordPolicyChange('lockout_attempts', parseInt(e.target.value))}
                className="config-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Lockout Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                value={passwordPolicies.lockout_duration_minutes}
                onChange={(e) => handlePasswordPolicyChange('lockout_duration_minutes', parseInt(e.target.value))}
                className="config-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            
            <div>
              <div className="form-section">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="config-input"
                  placeholder="e.g., Laptops, Furniture"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="config-textarea"
                  placeholder="Brief description..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowCategoryModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveCategory} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {editingStatus ? 'Edit Status' : 'Add Status'}
            </h3>
            
            <div>
              <div className="form-section">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={statusForm.name}
                  onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                  className="config-input"
                  placeholder="e.g., Available, In Use"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Description</label>
                <textarea
                  value={statusForm.description}
                  onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                  className="config-textarea"
                  placeholder="Brief description..."
                />
              </div>

              <div className="form-section">
                <label className="form-label">Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="color-picker-input"
                  />
                  <input
                    type="text"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="config-input color-text-input"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowStatusModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveStatus} className="btn-primary btn-green">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}