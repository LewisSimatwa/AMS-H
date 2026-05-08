import React, { useState, useEffect } from 'react';
import '../../styles/UserManagement.css';
import API_BASE_URL from "./config";
import API_BASE_URL from "../../api/config";


const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentUser, setCurrentUser] = useState({
    id: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role_id: '',
    is_active: true
  });

  // Fetch users, roles, and departments on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      const response = await fetch('http://localhost:8000/users.php?action=list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Users Response Status:', response.status);
      
      const text = await response.text();
      console.log('Users Raw Response:', text);
      
      const data = JSON.parse(text);
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Full error:', err);
      setError('Error fetching users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users.php?action=get_roles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Roles Response Status:', response.status);
      
      const text = await response.text();
      console.log('Roles Raw Response:', text);
      
      const data = JSON.parse(text);
      
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users.php?action=get_departments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Departments Response Status:', response.status);
      
      const text = await response.text();
      console.log('Departments Raw Response:', text);
      
      const data = JSON.parse(text);
      
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentUser({
      ...currentUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddUser = () => {
    setEditMode(false);
    setCurrentUser({
      id: '',
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role_id: '',
      is_active: true
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setCurrentUser({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      role_id: user.role_id,
      is_active: user.is_active
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentUser.username || !currentUser.email || !currentUser.first_name || 
        !currentUser.last_name || !currentUser.role_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (!editMode && !currentUser.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const action = editMode ? 'update' : 'create';
      const response = await fetch(`http://localhost:8000/users.php?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentUser)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editMode ? 'User updated successfully' : 'User created successfully');
        setShowModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Show detailed error message
        const errorMsg = data.error || data.message || 'Operation failed';
        setError(errorMsg);
        console.error('Server error details:', data);
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/users.php?action=delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('User deleted successfully');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user: ' + err.message);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/users.php?action=toggle_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id: userId, 
          is_active: !currentStatus 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('User status updated successfully');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Error updating status: ' + err.message);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || user.role_id === parseInt(filterRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={handleAddUser}>
          <i className="icon-plus"></i> Add New User
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role_name}`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn-icon ${user.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={currentUser.username}
                      onChange={handleInputChange}
                      required
                      disabled={editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={currentUser.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={currentUser.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={currentUser.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password {editMode ? '(leave blank to keep current)' : '*'}</label>
                    <input
                      type="password"
                      name="password"
                      value={currentUser.password}
                      onChange={handleInputChange}
                      required={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      name="role_id"
                      value={currentUser.role_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={currentUser.is_active}
                      onChange={handleInputChange}
                    />
                    Active Account
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;