const fs = require('fs');
const path = require('path');

const layout = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{TITLE}} — DFMIS</title>
  <link rel="stylesheet" href="../css/style.css" />
  <script src="../js/api.js"></script>
  <style>
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; }
    .modal.show { display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; padding: 20px; border-radius: 8px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
    .modal-close { cursor: pointer; font-size: 1.5rem; background: none; border: none; }
  </style>
</head>
<body>
<div class="dash-layout">
  <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main Navigation">
    <div class="sidebar-header">
      <div class="sidebar-logo">🔬</div>
      <div class="sidebar-brand">
        <h3>DFMIS Portal</h3>
        <p>Sri Lanka Gov. System</p>
      </div>
    </div>
    <div class="sidebar-user-card">
      <div class="user-avatar">🏥</div>
      <div class="user-info">
        <div class="name">Forensic Staff</div>
        <div class="role">Registration Officer</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main Menu</div>
      <a class="nav-item {{ACTIVE_dashboard}}" href="staff.html" id="nav-dashboard">
        <span class="nav-icon">🏠</span> Dashboard
      </a>
      <a class="nav-item {{ACTIVE_cases}}" href="staff-cases.html" id="nav-cases">
        <span class="nav-icon">📂</span> Case Monitoring
      </a>
      <a class="nav-item {{ACTIVE_mlef}}" href="staff-mlef.html" id="nav-mlef">
        <span class="nav-icon">📄</span> MLEF Monitoring
      </a>
      <a class="nav-item {{ACTIVE_examinations}}" href="staff-examinations.html" id="nav-examinations">
        <span class="nav-icon">🩺</span> Examinations
      </a>
      <a class="nav-item {{ACTIVE_laboratory}}" href="staff-laboratory.html" id="nav-laboratory">
        <span class="nav-icon">🔬</span> Laboratory
      </a>
      <a class="nav-item {{ACTIVE_appointments}}" href="staff-appointments.html" id="nav-appointments">
        <span class="nav-icon">📅</span> Appointments
      </a>
      <a class="nav-item {{ACTIVE_documents}}" href="staff-documents.html" id="nav-documents">
        <span class="nav-icon">📁</span> Documents
      </a>
      <a class="nav-item {{ACTIVE_search}}" href="staff-search.html" id="nav-search">
        <span class="nav-icon">🔍</span> Global Search
      </a>
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" onclick="logout()" id="btn-logout">
        <span>🚪</span> Logout
      </button>
    </div>
  </aside>

  <div class="dash-content">
    <div class="topbar">
      <div class="topbar-left">
        <div>
          <div class="topbar-title">{{TITLE}}</div>
          <div class="breadcrumb">
            <span>DFMIS</span><span class="breadcrumb-sep">›</span><span>{{TITLE}}</span>
          </div>
        </div>
      </div>
      <div class="topbar-right">
        <div class="topbar-time" id="dashClock"></div>
        <div class="topbar-badge" title="Notifications">🔔<span class="badge-dot"></span></div>
      </div>
    </div>

    <div class="dash-body">
      {{BODY}}
    </div>

    <footer class="dash-footer">
      <span>Department of Forensic Medicine &nbsp;|&nbsp; University of Peradeniya</span>
      <span>DFMIS v1.0 &nbsp;|&nbsp; &copy; 2026 Ministry of Health, Sri Lanka</span>
    </footer>
  </div>
</div>

<script>
  function tick() {
    const el = document.getElementById("dashClock");
    if (el) el.textContent = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  tick(); setInterval(tick, 1000);
  function logout() { sessionStorage.clear(); window.location.href = "../index.html"; }
</script>
{{SCRIPT}}
</body>
</html>`;

const pages = [
  {
    name: 'staff-cases.html',
    title: 'Case Monitoring',
    active: 'cases',
    body: `
      <div class="card">
        <div class="card-header">
          <h5>📂 Case Monitoring</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Case Number</th><th>Type</th><th>Station</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="timelineModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Case Timeline</h4>
            <button class="modal-close" onclick="closeTimeline()">×</button>
          </div>
          <div id="timelineContent"></div>
        </div>
      </div>
    `,
    script: `
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/cases');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><strong>\${d.case_number}</strong></td>
            <td>\${d.case_type}</td>
            <td>\${d.station_name}</td>
            <td><span class="badge badge-primary">\${d.status}</span></td>
            <td>\${new Date(d.date_reported).toLocaleDateString()}</td>
            <td><button class="btn btn-sm" onclick="viewTimeline('\${d.case_id}')">Timeline</button></td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  });

  async function viewTimeline(caseId) {
    document.getElementById('timelineModal').classList.add('show');
    const content = document.getElementById('timelineContent');
    content.innerHTML = '<p>Loading timeline...</p>';
    try {
      const data = await fetchAPI(\`/staff/cases/\${caseId}/timeline\`);
      if (data && data.length > 0) {
        content.innerHTML = '<ul style="list-style:none; padding:0;">' + data.map(t => \`
          <li style="margin-bottom: 15px; border-left: 2px solid #0F4C81; padding-left: 15px;">
            <div style="font-weight:bold;">\${t.stage}</div>
            <div style="font-size:0.9em; color:#666;">\${new Date(t.date).toLocaleString()}</div>
            <div style="margin-top:5px;">\${t.details}</div>
          </li>
        \`).join('') + '</ul>';
      } else {
        content.innerHTML = '<p>No timeline events found.</p>';
      }
    } catch (err) {
      content.innerHTML = \`<p style="color:red;">Error: \${err.message}</p>\`;
    }
  }

  function closeTimeline() {
    document.getElementById('timelineModal').classList.remove('show');
  }
</script>
    `
  },
  {
    name: 'staff-mlef.html',
    title: 'MLEF Monitoring',
    active: 'mlef',
    body: `
      <div class="card">
        <div class="card-header">
          <h5>📄 MLEF Monitoring</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>MLEF ID</th><th>Patient MRN</th><th>Hospital</th><th>Request Date</th><th>Status</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    script: `
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/mlef');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><strong>\${d.mlef_id}</strong></td>
            <td>\${d.medical_record_number}</td>
            <td>\${d.hospital_name}</td>
            <td>\${new Date(d.request_date).toLocaleDateString()}</td>
            <td><span class="badge badge-\${d.status === 'PENDING' ? 'warning' : 'success'}">\${d.status}</span></td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  });
</script>
    `
  },
  {
    name: 'staff-examinations.html',
    title: 'Examination Monitoring',
    active: 'examinations',
    body: `
      <div class="card">
        <div class="card-header">
          <h5>🩺 Examination Monitoring</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Exam ID</th><th>Date</th><th>JMO Reg.</th><th>MLEF ID</th><th>Status</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    script: `
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/examinations');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><strong>\${d.examination_id}</strong></td>
            <td>\${new Date(d.examination_date).toLocaleDateString()}</td>
            <td>\${d.jmo_reg}</td>
            <td>\${d.mlef_id}</td>
            <td><span class="badge badge-primary">\${d.status}</span></td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  });
</script>
    `
  },
  {
    name: 'staff-laboratory.html',
    title: 'Laboratory Monitoring',
    active: 'laboratory',
    body: `
      <div class="card">
        <div class="card-header">
          <h5>🔬 Laboratory Monitoring</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Request ID</th><th>Priority</th><th>Lab Name</th><th>Date</th><th>Status</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    script: `
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/laboratory/requests');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><strong>\${d.request_id}</strong></td>
            <td><span class="badge badge-\${d.priority === 'URGENT' ? 'danger' : 'secondary'}">\${d.priority}</span></td>
            <td>\${d.laboratory_name}</td>
            <td>\${new Date(d.request_date).toLocaleDateString()}</td>
            <td><span class="badge badge-warning">\${d.status}</span></td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  });
</script>
    `
  },
  {
    name: 'staff-appointments.html',
    title: 'Appointments Management',
    active: 'appointments',
    body: `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h5>📅 Appointments Management</h5>
          <button class="btn" onclick="openAddModal()">+ Add Appointment</button>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Date & Time</th><th>Patient</th><th>JMO</th><th>Status</th><th>Remarks</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="addModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Schedule Appointment</h4>
            <button class="modal-close" onclick="closeAddModal()">×</button>
          </div>
          <form id="addForm" onsubmit="addAppointment(event)">
            <div style="margin-bottom:15px;">
              <label>Patient ID</label>
              <input type="text" id="patientId" required style="width:100%; padding:8px;" />
            </div>
            <div style="margin-bottom:15px;">
              <label>JMO ID</label>
              <input type="text" id="jmoId" required style="width:100%; padding:8px;" />
            </div>
            <div style="margin-bottom:15px;">
              <label>Date & Time</label>
              <input type="datetime-local" id="apptDate" required style="width:100%; padding:8px;" />
            </div>
            <div style="margin-bottom:15px;">
              <label>Remarks</label>
              <input type="text" id="remarks" style="width:100%; padding:8px;" />
            </div>
            <button type="submit" class="btn" style="width:100%">Schedule</button>
          </form>
        </div>
      </div>
    `,
    script: `
<script>
  async function loadAppointments() {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/appointments');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td>\${new Date(d.appointment_date).toLocaleString()}</td>
            <td>\${d.patient_first_name} \${d.patient_last_name}</td>
            <td>Dr. \${d.jmo_first_name} \${d.jmo_last_name}</td>
            <td><span class="badge badge-\${d.status === 'SCHEDULED' ? 'warning' : 'success'}">\${d.status}</span></td>
            <td>\${d.remarks || '-'}</td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  }

  document.addEventListener("DOMContentLoaded", loadAppointments);

  function openAddModal() { document.getElementById('addModal').classList.add('show'); }
  function closeAddModal() { document.getElementById('addModal').classList.remove('show'); }

  async function addAppointment(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Scheduling...';
    try {
      await fetchAPI('/staff/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: document.getElementById('patientId').value,
          jmo_id: document.getElementById('jmoId').value,
          appointment_date: document.getElementById('apptDate').value,
          remarks: document.getElementById('remarks').value
        })
      });
      closeAddModal();
      loadAppointments();
      e.target.reset();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Schedule';
    }
  }
</script>
    `
  },
  {
    name: 'staff-documents.html',
    title: 'Document Management',
    active: 'documents',
    body: `
      <div class="card">
        <div class="card-header">
          <h5>📁 Document Management</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Document Name</th><th>Type</th><th>Created At</th><th>Action</th></tr></thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    script: `
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI('/staff/documents');
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><strong>\${d.document_name}</strong></td>
            <td>\${d.document_type}</td>
            <td>\${new Date(d.created_at).toLocaleDateString()}</td>
            <td><button class="btn btn-sm" onclick="alert('Viewing document is available in the full version.')">View</button></td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  });
</script>
    `
  },
  {
    name: 'staff-search.html',
    title: 'Global Search',
    active: 'search',
    body: `
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-body">
          <div style="display:flex; gap:10px;">
            <input type="text" id="searchInput" placeholder="Search by case number, patient name, NIC, MLEF ID..." style="flex:1; padding:10px; font-size:1rem; border:1px solid #ccc; border-radius:4px;" />
            <button class="btn" onclick="doSearch()">Search</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5>🔍 Search Results</h5>
        </div>
        <div class="card-body">
          <div class="table-wrap" id="dataContainer">
            <table class="dash-table">
              <thead><tr><th>Entity Type</th><th>ID / Number</th><th>Details</th></tr></thead>
              <tbody id="dataTableBody">
                <tr><td colspan="3" style="text-align:center;">Enter a search term above.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    script: `
<script>
  async function doSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;

    setTableLoading('dataContainer', true);
    try {
      const data = await fetchAPI(\`/staff/search?q=\${encodeURIComponent(q)}\`);
      const tbody = document.getElementById('dataTableBody');
      if (data && data.length > 0) {
        tbody.innerHTML = data.map(d => \`
          <tr>
            <td><span class="badge badge-primary">\${d.entity_type}</span></td>
            <td><strong>\${d.case_number}</strong></td>
            <td>\${d.details}</td>
          </tr>
        \`).join('');
      } else {
        setTableEmpty('dataContainer', 'No results found for "' + q + '"');
      }
    } catch (err) {
      setTableError('dataContainer', err.message);
    } finally {
      setTableLoading('dataContainer', false);
    }
  }

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
</script>
    `
  }
];

pages.forEach(p => {
  let content = layout
    .replace(/\{\{TITLE\}\}/g, p.title)
    .replace(/\{\{BODY\}\}/g, p.body)
    .replace(/\{\{SCRIPT\}\}/g, p.script);
  
  ['dashboard', 'cases', 'mlef', 'examinations', 'laboratory', 'appointments', 'documents', 'search'].forEach(nav => {
    content = content.replace(new RegExp('\\{\\{ACTIVE_' + nav + '\\}\\}', 'g'), nav === p.active ? 'active' : '');
  });

  fs.writeFileSync(path.join(__dirname, p.name), content);
});
console.log('Pages generated.');
