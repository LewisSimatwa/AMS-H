import { useState, useEffect } from "react";
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileText, Building2 } from "lucide-react";
import "../../styles/SuperAdmin/CSVImport.css";
import API_BASE_URL from "../../api/config";

export default function CSVImport() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [importStats, setImportStats] = useState(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/super_admin/institutions", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch institutions");
      const data = await response.json();
      setInstitutions(data.institutions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Asset Code,Name,Serial Number,Category,Acquisition Date,Acquisition Cost,Condition,Status,Location,Description
DEMO-001,Demo Laptop,SN123456,Laptop,2024-01-15,1200.00,good,available,Lab 1,Sample laptop for testing
DEMO-002,Demo Printer,SN789012,Printer,2024-02-20,800.00,excellent,available,Office,Sample printer`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setPreview([]);
    setValidationErrors([]);
    setError("");

    // Read and preview file
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      await validateAndPreview(text);
    };
    reader.readAsText(selectedFile);
  };

  const validateAndPreview = async (csvText) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/super_admin/csv/validate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          csv_data: csvText,
          institution_id: selectedInstitution
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setPreview(data.preview || []);
      setValidationErrors(data.errors || []);
      setImportStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedInstitution) {
      setError("Please select institution and file");
      return;
    }

    if (validationErrors.length > 0) {
      setError("Please fix validation errors before importing");
      return;
    }

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvText = event.target.result;
        
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/api/super_admin/csv/import", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            csv_data: csvText,
            institution_id: selectedInstitution
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Import failed");
        }

        setSuccess(`Successfully imported ${data.imported_count} assets`);
        setFile(null);
        setPreview([]);
        setValidationErrors([]);
        setImportStats(null);
        
        // Reset file input
        document.getElementById("csv-file-input").value = "";
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="csv-import-container">
      <div className="csv-import-header">
        <h1 className="csv-import-title">
          <Upload size={28} />
          Bulk Asset Import
        </h1>
        <p className="csv-import-subtitle">Import multiple assets from CSV file</p>
      </div>

      {/* Instructions Card */}
      <div className="import-card import-instructions">
        <div className="card-header">
          <FileText size={20} />
          <h2 className="card-title">Import Instructions</h2>
        </div>
        <div className="instruction-list">
          <div className="instruction-item">
            <CheckCircle size={16} className="instruction-icon" />
            <span>Download the CSV template below</span>
          </div>
          <div className="instruction-item">
            <CheckCircle size={16} className="instruction-icon" />
            <span>Fill in your asset data (max 500 rows per import)</span>
          </div>
          <div className="instruction-item">
            <CheckCircle size={16} className="instruction-icon" />
            <span>Select the target institution</span>
          </div>
          <div className="instruction-item">
            <CheckCircle size={16} className="instruction-icon" />
            <span>Upload and preview before confirming</span>
          </div>
        </div>
        <button onClick={downloadTemplate} className="template-button">
          <Download size={18} />
          Download CSV Template
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-box message-error">
          <XCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="message-box message-success">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Upload Form */}
      <div className="import-card">
        <div className="card-header">
          <Building2 size={20} />
          <h2 className="card-title">Select Institution & Upload File</h2>
        </div>

        <div className="upload-form">
          <div className="form-group">
            <label className="form-label">Target Institution *</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="form-select"
              disabled={importing}
            >
              <option value="">Select institution...</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">CSV File *</label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="form-file-input"
              disabled={!selectedInstitution || importing}
            />
            {file && (
              <p className="file-info">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="import-card validation-errors">
          <div className="card-header">
            <AlertTriangle size={20} />
            <h2 className="card-title">Validation Errors ({validationErrors.length})</h2>
          </div>
          <div className="error-list">
            {validationErrors.map((err, idx) => (
              <div key={idx} className="error-item">
                <XCircle size={16} className="error-icon" />
                <span>Row {err.row}: {err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Stats */}
      {importStats && (
        <div className="import-stats">
          <div className="stat-item">
            <span className="stat-label">Total Rows:</span>
            <span className="stat-value">{importStats.total_rows}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Valid Rows:</span>
            <span className="stat-value stat-success">{importStats.valid_rows}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Duplicates Found:</span>
            <span className="stat-value stat-warning">{importStats.duplicates}</span>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="import-card">
          <div className="card-header">
            <FileText size={20} />
            <h2 className="card-title">Preview (First {preview.length} rows)</h2>
          </div>
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Asset Code</th>
                  <th>Name</th>
                  <th>Serial Number</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className={row.has_error ? "row-error" : ""}>
                    <td>{idx + 1}</td>
                    <td>{row.asset_code}</td>
                    <td>{row.name}</td>
                    <td>{row.serial_number || "-"}</td>
                    <td>{row.category || "-"}</td>
                    <td>{row.acquisition_cost || "-"}</td>
                    <td>
                      <span className={`status-badge status-${row.status}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="import-actions">
            <button
              onClick={handleImport}
              disabled={importing || validationErrors.length > 0 || loading}
              className="import-button"
            >
              {importing ? (
                <>
                  <div className="button-spinner"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Confirm Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Validating CSV file...</p>
        </div>
      )}
    </div>
  );
}