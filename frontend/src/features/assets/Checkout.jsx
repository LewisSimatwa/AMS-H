import React, { useState, useEffect } from "react";
import "../../styles/checkout.css";

// ddnwifewi
export default function CheckoutModule() {
  const [activeTab, setActiveTab] = useState("checkout");
  const [assets, setAssets] = useState([]);
  const [checkedOutAssets, setCheckedOutAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locations, setLocations] = useState([]);

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    assetId: "",
    toUserId: "",
    locationId: "",
    remarks: ""
  }); 
  
  // Checkin form state
  const [checkinForm, setCheckinForm] = useState({
    assetId: "",
    condition: "",
    remarks: ""
  });
  
  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    assetId: "",
    toDepartmentId: "",
    locationId: "",
    remarks: ""
  });

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('Token retrieved:', token ? 'exists' : 'missing');
    return token;
  };


    useEffect(() => {
    if (activeTab === "checkout") {
      fetchAvailableAssets();
      fetchUsers();
      fetchLocations();
    } else if (activeTab === "checkin") {
      fetchCheckedOutAssets();
    } else if (activeTab === "transfer") {
      fetchAvailableAssets();
      fetchDepartments();
      fetchLocations();
    }
  }, [activeTab]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === "checkout") {
      fetchAvailableAssets();
      fetchUsers();
    } else if (activeTab === "checkin") {
      fetchCheckedOutAssets();
    } else if (activeTab === "transfer") {
      fetchAvailableAssets();
      fetchDepartments();
    }
  }, [activeTab]);

  // Fetch available assets
  const fetchAvailableAssets = async () => {
    setLoading(true);
    setError("");
    const token = getToken();
    
    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/available.php", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log('Available assets response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Available assets data:', data);
      
      if (data.error) {
        setError(data.error);
        setAssets([]);
      } else {
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load assets:", err);
      setError("Failed to load assets: " + err.message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchLocations = async () => {
  const token = getToken();
  
  if (!token) {
    console.error("No token found when fetching locations");
    setLocations([]);
    return;
  }

  console.log('Fetching locations with token...');
  
  try {
    const url = "http://localhost:8000/locations.php";
    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log('Locations response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Locations fetch failed. Status:", res.status, "Response:", errorText);
      setLocations([]);
      return;
    }
    
    const data = await res.json();
    console.log('Locations response data:', data);
    
    if (data.success && Array.isArray(data.locations)) {
      console.log(`Loaded ${data.locations.length} locations`);
      setLocations(data.locations);
    } else if (data.error) {
      console.error("Error from API:", data.error);
      setLocations([]);
    } else {
      console.error("Unexpected data format:", data);
      setLocations([]);
    }
  } catch (err) {
    console.error("Failed to load locations:", err);
    setLocations([]);
  }
};

  // Fetch checked out assets
  const fetchCheckedOutAssets = async () => {
    setLoading(true);
    setError("");
    const token = getToken();
    
    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/checked_out_assets.php", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log('Checked out assets response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Checked out assets data:', data);
      
      if (data.error) {
        setError(data.error);
        setCheckedOutAssets([]);
      } else {
        setCheckedOutAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load checked out assets:", err);
      setError("Failed to load checked out assets: " + err.message);
      setCheckedOutAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    const token = getToken();
    
    if (!token) {
      console.error("No token found when fetching users");
      setError("No authentication token found. Please log in.");
      setUsers([]);
      return;
    }

    console.log('Fetching users with token...');
    
    try {
      const url = "http://localhost:8000/user_list.php";
      console.log('Fetching from URL:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log('Users response status:', res.status);
      console.log('Users response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Users fetch failed. Status:", res.status, "Response:", errorText);
        setError(`Failed to load users (HTTP ${res.status})`);
        setUsers([]);
        return;
      }
      
      const data = await res.json();
      console.log('Users response data:', data);
      
      // Check the response structure
      if (data.success && Array.isArray(data.users)) {
        console.log(`Loaded ${data.users.length} users`);
        setUsers(data.users);
      } else if (data.error) {
        console.error("Error from API:", data.error);
        setError(data.error);
        setUsers([]);
      } else {
        console.error("Unexpected data format:", data);
        setError("Unexpected response format from server");
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users: " + err.message);
      setUsers([]);
    }
  };

  // Fetch departments - Updated to use new departments.php endpoint
  const fetchDepartments = async () => {
    const token = getToken();
    
    if (!token) {
      console.error("No token found when fetching departments");
      setError("No authentication token found. Please log in.");
      setDepartments([]);
      return;
    }
    
    console.log('Fetching departments with token...');
    
    try {
      const url = "http://localhost:8000/departments.php";
      console.log('Fetching from URL:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log('Departments response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Departments fetch failed. Status:", res.status, "Response:", errorText);
        setError(`Failed to load departments (HTTP ${res.status})`);
        setDepartments([]);
        return;
      }
      
      const data = await res.json();
      console.log('Departments response data:', data);
      
      // Check the response structure
      if (data.success && Array.isArray(data.departments)) {
        console.log(`Loaded ${data.departments.length} departments`);
        setDepartments(data.departments);
      } else if (data.error) {
        console.error("Error from API:", data.error);
        setError(data.error);
        setDepartments([]);
      } else {
        console.error("Unexpected data format:", data);
        setError("Unexpected response format from server");
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError("Failed to load departments: " + err.message);
      setDepartments([]);
    }
  };

  // Handle Checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const token = getToken();

    try {
      const res = await fetch("http://localhost:8000/checkout.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(checkoutForm)
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Asset checked out successfully!");
        setCheckoutForm({
          assetId: "",
          toUserId: "",
          location: "",
          remarks: ""
        });
        fetchAvailableAssets();
      }
    } catch (err) {
      setError("Failed to checkout asset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Checkin
  const handleCheckin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const token = getToken();

    try {
      const res = await fetch("http://localhost:8000/checkin.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(checkinForm)
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Asset checked in successfully!");
        setCheckinForm({
          assetId: "",
          condition: "good",
          remarks: ""
        });
        fetchCheckedOutAssets();
      }
    } catch (err) {
      setError("Failed to checkin asset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const token = getToken();

    try {
      const res = await fetch("http://localhost:8000/transfer.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(transferForm)
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Asset transferred successfully!");
        setTransferForm({
          assetId: "",
          toDepartmentId: "",
          location: "",
          remarks: ""
        });
        fetchAvailableAssets();
      }
    } catch (err) {
      setError("Failed to transfer asset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-module">
      <h2>Asset Movement Management</h2>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === "checkout" ? "tab active" : "tab"}
          onClick={() => setActiveTab("checkout")}
        >
          Check Out
        </button>
        <button 
          className={activeTab === "checkin" ? "tab active" : "tab"}
          onClick={() => setActiveTab("checkin")}
        >
          Check In
        </button>
        <button 
          className={activeTab === "transfer" ? "tab active" : "tab"}
          onClick={() => setActiveTab("transfer")}
        >
          Transfer
        </button>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Checkout Tab */}
      {activeTab === "checkout" && (
        <div className="tab-content">
          <h3>Check Out Asset</h3>
          <form onSubmit={handleCheckout} className="checkout-form">
            <div className="form-group">
              <label>Select Asset *</label>
              <select
                value={checkoutForm.assetId}
                onChange={(e) => setCheckoutForm({...checkoutForm, assetId: e.target.value})}
                required
              >
                <option value="">-- Select Asset --</option>
                {assets.filter(a => a.status === 'available').map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.name} ({asset.department_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assign To User *</label>
              <select
                value={checkoutForm.toUserId}
                onChange={(e) => setCheckoutForm({...checkoutForm, toUserId: e.target.value})}
                required
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <select
                value={checkoutForm.locationId}
                onChange={(e) => setCheckoutForm({...checkoutForm, locationId: e.target.value})}
                required
              >
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.building && ` - ${loc.building}`}
                    {loc.floor && `, Floor ${loc.floor}`}
                    {loc.room && `, Room ${loc.room}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                value={checkoutForm.remarks}
                onChange={(e) => setCheckoutForm({...checkoutForm, remarks: e.target.value})}
                placeholder="Additional notes..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Check Out Asset"}
            </button>
          </form>
        </div>
      )}

      {/* Checkin Tab */}
      {activeTab === "checkin" && (
        <div className="tab-content">
          <h3>Check In Asset</h3>
          <form onSubmit={handleCheckin} className="checkin-form">
            <div className="form-group">
              <label>Select Asset to Return *</label>
              <select
                value={checkinForm.assetId}
                onChange={(e) => setCheckinForm({...checkinForm, assetId: e.target.value})}
                required
              >
                <option value="">-- Select Asset --</option>
                {checkedOutAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.name} (Held by: {asset.holder_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select
                value={checkinForm.condition}
                onChange={(e) => setCheckinForm({...checkinForm, condition: e.target.value})}
                required
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                value={checkinForm.remarks}
                onChange={(e) => setCheckinForm({...checkinForm, remarks: e.target.value})}
                placeholder="Condition notes, any issues found..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Check In Asset"}
            </button>
          </form>

          {/* Display checked out assets */}
          <div className="checked-out-list">
            <h4>Currently Checked Out Assets</h4>
            {checkedOutAssets.length === 0 ? (
              <p>No assets currently checked out</p>
            ) : (
              <table className="assets-table">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Name</th>
                    <th>Holder</th>
                    <th>Checked Out</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedOutAssets.map(asset => (
                    <tr key={asset.id}>
                      <td>{asset.asset_code}</td>
                      <td>{asset.name}</td>
                      <td>{asset.holder_name}</td>
                      <td>{new Date(asset.checked_out_at).toLocaleDateString()}</td>
                      <td>{asset.location || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transfer Tab */}
      {activeTab === "transfer" && (
        <div className="tab-content">
          <h3>Transfer Asset Between Departments</h3>
          <form onSubmit={handleTransfer} className="transfer-form">
            <div className="form-group">
              <label>Select Asset *</label>
              <select
                value={transferForm.assetId}
                onChange={(e) => setTransferForm({...transferForm, assetId: e.target.value})}
                required
              >
                <option value="">-- Select Asset --</option>
                {assets.filter(a => a.status === 'available').map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.name} (Current: {asset.department_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Transfer To Department *</label>
              <select
                value={transferForm.toDepartmentId}
                onChange={(e) => setTransferForm({...transferForm, toDepartmentId: e.target.value})}
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>New Location *</label>
              <select
                value={transferForm.locationId}
                onChange={(e) => setTransferForm({...transferForm, locationId: e.target.value})}
                required
              >
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.building && ` - ${loc.building}`}
                    {loc.floor && `, Floor ${loc.floor}`}
                    {loc.room && `, Room ${loc.room}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                value={transferForm.remarks}
                onChange={(e) => setTransferForm({...transferForm, remarks: e.target.value})}
                placeholder="Reason for transfer..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Transfer Asset"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}