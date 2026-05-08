import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AssetsTable.css";
import "../../styles/Barcode.css";
import API_BASE_URL from "../../api/config";

export default function AssetTable({ onView, onRetire, refreshTrigger }) {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, retired
  const [userRole, setUserRole] = useState("");
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const token = localStorage.getItem("token");
  const institutionId = localStorage.getItem("institutionId");

  useEffect(() => {
    if (!token || !institutionId) {
      navigate("/login");
      return;
    }

    // Get user role from token (decode JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role || "");
    } catch (e) {
      console.error("Failed to decode token:", e);
    }

    fetchAssets();
  }, [token, institutionId, refreshTrigger]);

  async function fetchAssets() {
    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Institution-ID": institutionId,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/assets?institution_id=${institutionId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Fetch assets error:", err);
      setError(err.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  // Handle viewing barcode
  const handleViewBarcode = (asset) => {
    console.log("Opening barcode for asset:", asset);
    console.log("Barcode URL:", getBarcodeUrl(asset));
    setSelectedAsset(asset);
    setShowBarcodeModal(true);
  };

  // Get barcode URL with authentication parameters
  const getBarcodeUrl = (asset) => {
    // Include token in URL since img tags can't send Authorization headers
    const url = `${API_BASE_URL}/api/barcode?asset_id=${asset.id}&institution_id=${institutionId}&token=${token}`;
    console.log("Generated barcode URL:", url);
    return url;
  };

  const handleDownloadBarcode = async (asset) => {
    try {
      const response = await fetch(getBarcodeUrl(asset), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch barcode");

      const svgText = await response.text();
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `barcode_${asset.asset_code}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download barcode. Please try again.");
    }
  };

  // Filter assets based on status and search term
  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = 
      filter === "all" ? true :
      filter === "active" ? asset.status !== "retired" :
      filter === "retired" ? asset.status === "retired" :
      true;

    const matchesSearch = 
      searchTerm === "" ||
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeCount = assets.filter(a => a.status !== "retired").length;
  const retiredCount = assets.filter(a => a.status === "retired").length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchAssets}>Retry</button>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="empty-state">
        <p>No assets registered yet.</p>
      </div>
    );
  }

  return (
    <div className="asset-table">
      <div className="table-header">
        <h2>Registered Assets ({assets.length})</h2>
        
        <div className="table-controls">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All ({assets.length})
            </button>
            <button
              className={filter === "active" ? "active" : ""}
              onClick={() => setFilter("active")}
            >
              Active ({activeCount})
            </button>
            <button
              className={filter === "retired" ? "active" : ""}
              onClick={() => setFilter("retired")}
            >
              Retired ({retiredCount})
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAssets.map((asset) => {
              const isRetired = asset.status === "retired";
              
              return (
                <tr key={asset.id} className={isRetired ? "retired-row" : ""}>
                  <td>
                    <strong>{asset.asset_code}</strong>
                    {isRetired && (
                      <span className="retired-badge">RETIRED</span>
                    )}
                  </td>
                  <td>{asset.name}</td>
                  <td>{asset.category || "—"}</td>
                  <td>{asset.location || "—"}</td>
                  <td>{asset.assigned_to || "—"}</td>
                  <td>
                    <span className={`status-badge ${asset.status}`}>
                      {asset.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleViewBarcode(asset)} 
                      className="btn-view"
                      title="View barcode"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M0 2h2v12H0V2zm3 0h1v12H3V2zm2 0h1v12H5V2zm2 0h2v12H7V2zm3 0h1v12h-1V2zm2 0h2v12h-2V2zm3 0h1v12h-1V2z"/>
                      </svg>
                      Barcode
                    </button>

                    {userRole === "admin" && !isRetired && (
                      <button 
                        onClick={() => onRetire(asset)} 
                        className="btn-retire"
                        title="Retire this asset"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        Retire
                      </button>
                    )}

                    {isRetired && (
                      <span className="retired-text">
                        {asset.date_retired 
                          ? `Retired: ${new Date(asset.date_retired).toLocaleDateString()}`
                          : "Retired"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAssets.length === 0 && searchTerm && (
        <p className="no-results">No assets found matching "{searchTerm}"</p>
      )}

      {/* Barcode Modal */}
      {showBarcodeModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowBarcodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asset Barcode</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowBarcodeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="barcode-info">
                <p><strong>Asset:</strong> {selectedAsset.name}</p>
                <p><strong>Asset Code:</strong> {selectedAsset.asset_code}</p>
                <p>
                  <strong>Barcode Data:</strong> {selectedAsset.serial_number || selectedAsset.asset_code}
                </p>
              </div>
              <div className="barcode-container">
                <img 
                  src={getBarcodeUrl(selectedAsset)}
                  alt={`Barcode for ${selectedAsset.asset_code}`}
                  style={{ width: '100%', maxWidth: '400px', margin: '20px auto', display: 'block' }}
                  onLoad={() => console.log('Barcode loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load barcode image');
                    console.error('Image src:', e.target.src);
                    console.error('Error event:', e);
                    
                    // Try to fetch the URL to see what error we get
                    fetch(getBarcodeUrl(selectedAsset))
                      .then(response => {
                        console.log('Fetch response status:', response.status);
                        console.log('Fetch response headers:', response.headers);
                        return response.text();
                      })
                      .then(text => {
                        console.log('Response body:', text);
                      })
                      .catch(err => {
                        console.error('Fetch error:', err);
                      });
                    
                    e.target.alt = 'Error loading barcode - check console';
                  }}
                />
              </div>
              <div className="barcode-actions">
                <button
                  onClick={() => handleDownloadBarcode(selectedAsset)}
                  className="btn-download"
                >
                  Download Barcode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}