// CRM Dashboard JavaScript
const ADMIN_PASSWORD = 'eufo2024'; // Change this to your desired password
const LEADS_STORAGE_KEY = 'eufotech_crm_leads';
const LOGIN_TOKEN = 'eufotech_admin_token';

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const passwordInput = document.getElementById('password');
const leadsBody = document.getElementById('leadsBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const leadsModal = document.getElementById('leadsModal');
const closeModalBtn = document.getElementById('closeModalBtn');

let allLeads = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadLeads();
    setupEventListeners();
});

function checkLogin() {
    const token = localStorage.getItem(LOGIN_TOKEN);
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
}

function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
}

// Login Handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = passwordInput.value;

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem(LOGIN_TOKEN, 'true');
        passwordInput.value = '';
        showDashboard();
    } else {
        alert('Invalid password');
        passwordInput.value = '';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(LOGIN_TOKEN);
    showLogin();
});

function setupEventListeners() {
    searchInput.addEventListener('input', filterAndRenderLeads);
    statusFilter.addEventListener('change', filterAndRenderLeads);
    exportBtn.addEventListener('click', exportToCSV);
    deleteAllBtn.addEventListener('click', deleteAllLeads);
    closeModalBtn.addEventListener('click', () => leadsModal.classList.remove('active'));
    leadsModal.addEventListener('click', (e) => {
        if (e.target === leadsModal) leadsModal.classList.remove('active');
    });
}

// Load leads from localStorage
function loadLeads() {
    const stored = localStorage.getItem(LEADS_STORAGE_KEY);
    allLeads = stored ? JSON.parse(stored) : [];
    updateStats();
    renderLeads(allLeads);
}

// Save leads to localStorage
function saveLeads() {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(allLeads));
    updateStats();
}

// Update statistics
function updateStats() {
    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter(l => l.status === 'new').length;
    const contactedLeads = allLeads.filter(l => l.status === 'contacted').length;
    const convertedLeads = allLeads.filter(l => l.status === 'converted').length;

    document.getElementById('totalLeads').textContent = totalLeads;
    document.getElementById('newLeads').textContent = newLeads;
    document.getElementById('contactedLeads').textContent = contactedLeads;
    document.getElementById('convertedLeads').textContent = convertedLeads;
}

// Filter and render leads
function filterAndRenderLeads() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    let filtered = allLeads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchTerm) ||
            lead.email.toLowerCase().includes(searchTerm) ||
            lead.service.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusValue || lead.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    renderLeads(filtered);
}

// Render leads in table
function renderLeads(leads) {
    if (leads.length === 0) {
        leadsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94979E; padding: 40px;">No leads found</td></tr>';
        return;
    }

    leadsBody.innerHTML = leads.map(lead => `
        <tr>
            <td>${formatDate(lead.date)}</td>
            <td><strong>${lead.name || 'Unknown'}</strong></td>
            <td>${lead.email}</td>
            <td>${lead.service}</td>
            <td><span class="status-badge status-${lead.status}">${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewLead('${lead.id}')">View</button>
                    <button class="action-btn" onclick="toggleStatus('${lead.id}')">Mark ${lead.status === 'new' ? 'Contacted' : lead.status === 'contacted' ? 'Converted' : 'New'}</button>
                    <button class="action-btn delete" onclick="deleteLead('${lead.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// View lead details
function viewLead(id) {
    const lead = allLeads.find(l => l.id === id);
    if (!lead) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-field">
            <label>Name</label>
            <span>${lead.name || 'Not provided'}</span>
        </div>
        <div class="modal-field">
            <label>Email</label>
            <span><a href="mailto:${lead.email}" style="color: #D4AF37; text-decoration: none;">${lead.email}</a></span>
        </div>
        <div class="modal-field">
            <label>Service Interested In</label>
            <span>${lead.service}</span>
        </div>
        <div class="modal-field">
            <label>Needs / Description</label>
            <span>${lead.needs || 'Not provided'}</span>
        </div>
        <div class="modal-field">
            <label>Job Position</label>
            <span>${lead.job || 'Not provided'}</span>
        </div>
        <div class="modal-field">
            <label>Preferred Contact Day</label>
            <span>${lead.day || 'Not provided'}</span>
        </div>
        <div class="modal-field">
            <label>Preferred Contact Time</label>
            <span>${lead.time || 'Not provided'}</span>
        </div>
        <div class="modal-field">
            <label>Status</label>
            <span style="text-transform: capitalize;">${lead.status}</span>
        </div>
        <div class="modal-field">
            <label>Submitted</label>
            <span>${formatDate(lead.date)}</span>
        </div>
    `;
    leadsModal.classList.add('active');
}

// Toggle lead status
function toggleStatus(id) {
    const lead = allLeads.find(l => l.id === id);
    if (!lead) return;

    const statusCycle = ['new', 'contacted', 'converted'];
    const currentIndex = statusCycle.indexOf(lead.status);
    lead.status = statusCycle[(currentIndex + 1) % statusCycle.length];

    saveLeads();
    filterAndRenderLeads();
}

// Delete single lead
function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        allLeads = allLeads.filter(l => l.id !== id);
        saveLeads();
        filterAndRenderLeads();
    }
}

// Delete all leads
function deleteAllLeads() {
    if (confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) {
        allLeads = [];
        saveLeads();
        filterAndRenderLeads();
    }
}

// Export to CSV
function exportToCSV() {
    if (allLeads.length === 0) {
        alert('No leads to export');
        return;
    }

    const headers = ['Date', 'Name', 'Email', 'Service', 'Needs', 'Job Position', 'Day', 'Time', 'Status'];
    const csvContent = [
        headers.join(','),
        ...allLeads.map(lead => [
            formatDate(lead.date),
            `"${lead.name || ''}"`,
            lead.email,
            `"${lead.service || ''}"`,
            `"${(lead.needs || '').replace(/"/g, '""')}"`,
            `"${(lead.job || '').replace(/"/g, '""')}"`,
            lead.day || '',
            lead.time || '',
            lead.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eufotech-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Note: window.addLeadToManualCRM is now defined in chatbot.js
// so it's available before admin-dashboard.js loads
