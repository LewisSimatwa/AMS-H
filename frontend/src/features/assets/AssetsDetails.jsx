import { useState } from "react";
import AssetTable from "./AssetsTable";
import AssetDetail from "./AssetsDetails";
import AssetRegistrationForm from "./AssetsRegistrationForm";
import RetireAsset from "./RetireAsset";
import "../../styles/Assets.css";
import API_BASE_URL from "../../api/config";

export default function AssetsDetails() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role"); // Get user role

  function openModal(type, asset) {
    setSelectedAsset(asset);
    setActiveModal(type);
  }

  function closeModal() {
    setSelectedAsset(null);
    setActiveModal(null);
  }

  function handleRetireComplete() {
    // Trigger refresh after retirement
    setRefreshTrigger((prev) => prev + 1);
    closeModal();
  }

  function handleAssetRegistered() {
    // Trigger refresh after new asset is registered
    setRefreshTrigger((prev) => prev + 1);
  }

  async function exportAssetsCSV() {
    setExportingCSV(true);

    if (!token) {
      alert("Authentication required");
      setExportingCSV(false);
      return;
    }

    try {
      const response = await fetch('${API_BASE_URL}/export_assets.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export assets');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Assets exported successfully!');
    } catch (error) {
      console.error('Export assets error:', error);
      alert('Failed to export assets: ' + error.message);
    } finally {
      setExportingCSV(false);
    }
  }

  return (
    <div className="assets-page">
      <div className="assets-header">
        <div>
          <h1>Asset Management</h1>
          <p>Register, track, assign, and maintain institutional assets</p>
        </div>
      </div>

      <AssetRegistrationForm onAssetRegistered={handleAssetRegistered} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          className="export-csv-btn"
          onClick={exportAssetsCSV}
          disabled={exportingCSV}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: exportingCSV ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: exportingCSV ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (!exportingCSV) e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseOut={(e) => {
            if (!exportingCSV) e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          <span>{exportingCSV ? "⏳" : "📊"}</span>
          {exportingCSV ? "Exporting..." : "Export Assets CSV"}
        </button>
      </div>

      <AssetTable
        onView={(asset) => openModal("detail", asset)}
        onRetire={(asset) => openModal("retire", asset)}
        refreshTrigger={refreshTrigger}
      />

      {/* Modals */}
      {activeModal === "detail" && selectedAsset && (
        <AssetDetail asset={selectedAsset} onClose={closeModal} />
      )}

      {activeModal === "retire" && selectedAsset && (
        <RetireAsset
          asset={selectedAsset}
          onClose={closeModal}
          onConfirm={handleRetireComplete}
        />
      )}
    </div>
  );
}