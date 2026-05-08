import { useState, useEffect } from "react";
import { 
  Building2, Plus, Search, Edit2, Users, Package, X, Save, UserPlus, Shield, Key, UserX, Phone, Mail, Globe
} from "lucide-react";
import API_BASE_URL from "../../api/config";

const API_BASE = "${API_BASE_URL}/api/super_admin";

const INSTITUTION_TYPES = [
  'University',
  'College',
  'School',
  'Research Center',
  'Training Institute',
  'Government Agency',
  'NGO',
  'Other'
];

export default function InstitutionManagement() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modals, setModals] = useState({
    institution: false,
    admin: false,
    manageAdmins: false,
    deactivate: false
  });
  const [modalMode, setModalMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    domain: "",
    phone_number: "",
    institution_type: "",
    address: "", 
    contact_email: "" 
  });
  const [adminForm, setAdminForm] = useState({ first_name: "", last_name: "", email: "", username: "", password: "" });

  const token = localStorage.getItem("token");
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { fetchInstitutions(); }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await fetch(`${API_BASE}/institutions`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setInstitutions(data.institutions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, mode = "create", item = null) => {
    setModalMode(mode);
    setSelected(item);
    if (type === "institution" && item) {
      setFormData({ 
        name: item.name, 
        code: item.code || "", 
        domain: item.domain || "",
        phone_number: item.phone_number || "",
        institution_type: item.institution_type || "",
        address: item.address || "", 
        contact_email: item.contact_email || "" 
      });
    } else if (type === "institution") {
      setFormData({ 
        name: "", 
        code: "", 
        domain: "",
        phone_number: "",
        institution_type: "",
        address: "", 
        contact_email: "" 
      });
    }
    if (type === "admin") setAdminForm({ first_name: "", last_name: "", email: "", username: "", password: "" });
    if (type === "manageAdmins") fetchAdmins(item.id);
    setModals({ ...modals, [type]: true });
  };

  const closeModal = (type) => setModals({ ...modals, [type]: false });

  // Auto-suggest domain from contact email
  const handleContactEmailChange = (email) => {
    setFormData({...formData, contact_email: email});
    
    // Only auto-fill if domain field is empty and email has @
    if (email.includes('@') && !formData.domain) {
      const domain = email.split('@')[1];
      setFormData(prev => ({...prev, domain: domain}));
    }
  };

  const handleSubmitInstitution = async () => {
    if (!formData.name.trim()) return alert("Institution name is required");
    if (!formData.domain.trim()) return alert("Domain is required");
    
    const url = modalMode === "create" ? `${API_BASE}/institutions` : `${API_BASE}/institutions?id=${selected.id}`;
    const method = modalMode === "create" ? "POST" : "PUT";
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok) {
        closeModal("institution");
        fetchInstitutions();
        alert(`Institution ${modalMode}d successfully`);
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (err) {
      alert("Failed to save institution");
    }
  };

  const handleSubmitAdmin = async () => {
    if (!adminForm.first_name || !adminForm.last_name || !adminForm.email || !adminForm.username || !adminForm.password) 
      return alert("All fields are required");
    if (adminForm.password.length < 6) return alert("Password must be at least 6 characters");
    try {
      const res = await fetch(`${API_BASE}/create-admin`, { 
        method: "POST", headers, body: JSON.stringify({ ...adminForm, institution_id: selected.id }) 
      });
      if (res.ok) {
        closeModal("admin");
        alert("Admin created successfully");
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (err) {
      alert("Failed to create admin");
    }
  };

  const fetchAdmins = async (instId) => {
    try {
      const res = await fetch(`${API_BASE}/institution-admins?institution_id=${instId}`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeAdmin = async (userId) => {
    if (!confirm("Revoke admin rights?")) return;
    try {
      const res = await fetch(`${API_BASE}/revoke-admin?user_id=${userId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        alert("Admin revoked");
        fetchAdmins(selected.id);
      }
    } catch (err) {
      alert("Failed to revoke admin");
    }
  };

  const handleResetPassword = async (userId) => {
    const newPass = prompt("Enter new password (min 6 characters):");
    if (!newPass || newPass.length < 6) return alert("Invalid password");
    try {
      const res = await fetch(`${API_BASE}/reset-admin-password`, { 
        method: "POST", headers, body: JSON.stringify({ user_id: userId, new_password: newPass }) 
      });
      if (res.ok) alert("Password reset successfully");
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  const handleDeactivate = async () => {
    try {
      const res = await fetch(`${API_BASE}/deactivate-institution?id=${selected.id}`, { 
        method: "PUT", headers, body: JSON.stringify({ is_active: false }) 
      });
      if (res.ok) {
        closeModal("deactivate");
        fetchInstitutions();
        alert("Institution deactivated");
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate");
    }
  };

  const handleReactivate = async (inst) => {
    if (!confirm(`Reactivate ${inst.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/deactivate-institution?id=${inst.id}`, { 
        method: "PUT", headers, body: JSON.stringify({ is_active: true }) 
      });
      if (res.ok) {
        fetchInstitutions();
        alert("Institution reactivated");
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reactivate");
    }
  };

  const filtered = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Institution Management</h1>
          <p style={{ color: '#6b7280' }}>Manage all institutions</p>
        </div>
        <button onClick={() => openModal("institution")} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer'
        }}>
          <Plus size={20} /> Create Institution
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
        <input type="text" placeholder="Search institutions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((inst) => (
          <div key={inst.id} style={{
            background: inst.is_active ? 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%)',
            border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', opacity: inst.is_active ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: inst.is_active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                color: 'white'
              }}>
                <Building2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {inst.name}
                  {!inst.is_active && <span style={{
                    padding: '0.25rem 0.5rem', background: '#fed7d7', color: '#c53030',
                    borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600'
                  }}>INACTIVE</span>}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{inst.code}</p>
                {inst.institution_type && (
                  <span style={{ 
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    padding: '0.125rem 0.5rem', 
                    background: '#e0e7ff', 
                    color: '#4338ca',
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    fontWeight: '500'
                  }}>
                    {inst.institution_type}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              {inst.domain && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', marginBottom: '0.375rem' }}>
                  <Globe size={14} /> <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>@{inst.domain}</span>
                </div>
              )}
              {inst.contact_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', marginBottom: '0.375rem' }}>
                  <Mail size={14} /> <span style={{ fontSize: '0.8125rem' }}>{inst.contact_email}</span>
                </div>
              )}
              {inst.phone_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
                  <Phone size={14} /> <span>{inst.phone_number}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#78350f', fontWeight: '500' }}>
                <Users size={16} /> {inst.user_count || 0} Users
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#78350f', fontWeight: '500' }}>
                <Package size={16} /> {inst.asset_count || 0} Assets
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Btn onClick={() => openModal("institution", "edit", inst)} disabled={!inst.is_active} bg="#3b82f6">
                <Edit2 size={16} /> Edit
              </Btn>
              <IconBtn onClick={() => openModal("manageAdmins", null, inst)} disabled={!inst.is_active} bg="#667eea" title="Manage Admins">
                <Shield size={16} />
              </IconBtn>
              <IconBtn onClick={() => openModal("admin", null, inst)} disabled={!inst.is_active} bg="#10b981" title="Create Admin">
                <UserPlus size={16} />
              </IconBtn>
              {inst.is_active ? (
                <IconBtn onClick={() => openModal("deactivate", null, inst)} bg="#f56565" title="Deactivate">
                  <X size={16} />
                </IconBtn>
              ) : (
                <IconBtn onClick={() => handleReactivate(inst)} bg="#48bb78" title="Reactivate">
                  <UserPlus size={16} />
                </IconBtn>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
          <Building2 size={48} style={{ margin: '0 auto 1rem' }} />
          <h3>No institutions found</h3>
        </div>
      )}

      {/* Institution Modal */}
      {modals.institution && (
        <Modal onClose={() => closeModal("institution")} title={`${modalMode === "create" ? "Create" : "Edit"} Institution`}>
          <Input label="Institution Name *" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Code" value={formData.code} onChange={(v) => setFormData({...formData, code: v})} />
            <Select 
              label="Institution Type" 
              value={formData.institution_type} 
              onChange={(v) => setFormData({...formData, institution_type: v})}
              options={INSTITUTION_TYPES}
            />
          </div>

          <Input 
            label="Contact Email" 
            type="email" 
            value={formData.contact_email} 
            onChange={handleContactEmailChange}
          />
          
          <Input 
            label="Domain (for user logins) *" 
            value={formData.domain} 
            onChange={(v) => setFormData({...formData, domain: v})}
            placeholder="e.g., dsp.ac.tz, nuni.ac.ke"
            helperText="Users with email addresses @[this domain] will be assigned to this institution"
          />

          <Input 
            label="Phone Number" 
            type="tel" 
            value={formData.phone_number} 
            onChange={(v) => setFormData({...formData, phone_number: v})}
            placeholder="+255 XXX XXX XXX"
          />

          <Input label="Address" value={formData.address} onChange={(v) => setFormData({...formData, address: v})} textarea />
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <CancelBtn onClick={() => closeModal("institution")} />
            <Btn onClick={handleSubmitInstitution} bg="#667eea"><Save size={18} /> Save</Btn>
          </div>
        </Modal>
      )}

      {/* Admin Modal */}
      {modals.admin && (
        <Modal onClose={() => closeModal("admin")} title={`Create Admin for ${selected?.name}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="First Name *" value={adminForm.first_name} onChange={(v) => setAdminForm({...adminForm, first_name: v})} />
            <Input label="Last Name *" value={adminForm.last_name} onChange={(v) => setAdminForm({...adminForm, last_name: v})} />
          </div>
          <Input label="Email *" type="email" value={adminForm.email} onChange={(v) => setAdminForm({...adminForm, email: v})} />
          <Input label="Username *" value={adminForm.username} onChange={(v) => setAdminForm({...adminForm, username: v})} />
          <Input label="Password *" type="password" value={adminForm.password} onChange={(v) => setAdminForm({...adminForm, password: v})} />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <CancelBtn onClick={() => closeModal("admin")} />
            <Btn onClick={handleSubmitAdmin} bg="#10b981"><UserPlus size={18} /> Create Admin</Btn>
          </div>
        </Modal>
      )}

      {/* Manage Admins Modal */}
      {modals.manageAdmins && (
        <Modal onClose={() => closeModal("manageAdmins")} title={`Manage Admins - ${selected?.name}`} large>
          {admins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Shield size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
              <h3>No admins found</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {admins.map((admin) => (
                <div key={admin.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem',
                  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', borderRadius: '0.75rem', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '600' }}>{admin.first_name} {admin.last_name}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#718096' }}>{admin.email}</p>
                      <span style={{ fontSize: '0.75rem', color: '#a0aec0', fontFamily: 'monospace' }}>@{admin.username}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <IconBtn onClick={() => handleResetPassword(admin.id)} bg="white" color="#4a5568" border title="Reset Password">
                      <Key size={16} />
                    </IconBtn>
                    <IconBtn onClick={() => handleRevokeAdmin(admin.id)} bg="white" color="#e53e3e" border title="Revoke">
                      <UserX size={16} />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Deactivate Modal */}
      {modals.deactivate && (
        <Modal onClose={() => closeModal("deactivate")} title="Deactivate Institution">
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <X size={48} style={{ color: '#ed8936', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Deactivate Institution?</h3>
            <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
              You are about to deactivate <strong>{selected?.name}</strong>.
            </p>
            <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: '0.5rem', padding: '1rem', textAlign: 'left' }}>
              <h4 style={{ color: '#744210', marginBottom: '0.75rem' }}>What happens:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#744210' }}>
                <li>Institution will no longer be accessible</li>
                <li>All admins will lose access</li>
                <li>Asset operations will be disabled</li>
                <li>Data preserved and can be reactivated</li>
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <CancelBtn onClick={() => closeModal("deactivate")} />
            <Btn onClick={handleDeactivate} bg="#f56565"><X size={18} /> Deactivate</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable Components
const Modal = ({ onClose, title, children, large }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }} onClick={onClose}>
    <div style={{
      background: 'white', borderRadius: '1rem', padding: '2rem', width: '90%',
      maxWidth: large ? '800px' : '500px', maxHeight: '90vh', overflowY: 'auto'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, helperText, textarea }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>{label}</label>
    {textarea ? (
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '80px', fontFamily: 'inherit' }} 
      />
    ) : (
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} 
      />
    )}
    {helperText && (
      <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
        {helperText}
      </small>
    )}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white' }}
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Btn = ({ onClick, children, bg, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
    background: `linear-gradient(135deg, ${bg} 0%, ${bg} 100%)`, color: 'white',
    border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1
  }}>
    {children}
  </button>
);

const IconBtn = ({ onClick, children, bg, color = 'white', disabled, border, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1rem',
    background: bg, color, border: border ? '1px solid #e2e8f0' : 'none', borderRadius: '0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1
  }}>
    {children}
  </button>
);

const CancelBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer'
  }}>
    Cancel
  </button>
);