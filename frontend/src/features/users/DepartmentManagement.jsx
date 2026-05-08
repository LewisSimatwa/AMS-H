import React, { useState, useEffect } from 'react';
import '../../styles/UserManagement.css';
import API_BASE_URL from "../../api/config";


const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');

  const [currentDepartment, setCurrentDepartment] = useState({
    id:   '',
    name: '',
    code: '',
  });

  // Scoped to the logged-in admin's institution
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/departments.php?action=list&institution_id=${institutionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
          },
        }
      );

      const text = await response.text();
      console.log('Departments raw response:', text);
      const data = JSON.parse(text);

      if (data.success) {
        setDepartments(data.departments);
      } else {
        setError(data.message || data.error || 'Failed to fetch departments');
      }
    } catch (err) {
      setError('Error fetching departments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment({ ...currentDepartment, [name]: value });
  };

  const handleAdd = () => {
    setEditMode(false);
    setCurrentDepartment({ id: '', name: '', code: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleEdit = (dept) => {
    setEditMode(true);
    setCurrentDepartment({ id: dept.id, name: dept.name, code: dept.code || '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentDepartment.name.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      const token  = localStorage.getItem('token');
      const action = editMode ? 'update' : 'create';

      const response = await fetch(
        `${API_BASE_URL}/departments.php?action=${action}`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...currentDepartment,
            institution_id: institutionId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(editMode ? 'Department updated successfully' : 'Department created successfully');
        setShowModal(false);
        fetchDepartments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm('Delete this department? Assets assigned to it will be unlinked.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${API_BASE_URL}/departments.php?action=delete', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deptId, institution_id: institutionId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Department deleted successfully');
        fetchDepartments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || data.error || 'Failed to delete department');
      }
    } catch (err) {
      setError('Error deleting department: ' + err.message);
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.code && dept.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="user-management">
      <div className="page-header">
        <h1>Department Management</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Department
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading departments...</div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Assets</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No departments found</td>
                </tr>
              ) : (
                filtered.map(dept => (
                  <tr key={dept.id}>
                    <td>{dept.id}</td>
                    <td>
                      {dept.code
                        ? <span className="role-badge">{dept.code}</span>
                        : <span style={{ color: '#aaa' }}>—</span>
                      }
                    </td>
                    <td><strong>{dept.name}</strong></td>
                    <td>
                      <span className="role-badge">{dept.asset_count ?? 0}</span>
                    </td>
                    <td>
                      {dept.created_at
                        ? new Date(dept.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(dept)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(dept.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Department' : 'Add Department'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Department Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={currentDepartment.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Code{' '}
                      <span style={{ fontWeight: 400, color: '#888' }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={currentDepartment.code}
                      onChange={handleInputChange}
                      placeholder="e.g. CS"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;