// ===========================
// TREATMENT SYSTEM - JAVASCRIPT LOGIC
// ===========================

// Storage key untuk localStorage
const STORAGE_KEY = 'treatment_data';

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format tanggal ke format Indonesia
 */
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('id-ID', options);
}

/**
 * Get all data dari localStorage
 */
function getAllData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Save data ke localStorage
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Validate form input
 */
function validateForm(formData) {
    const errors = {};

    // Validate Nama
    if (!formData.nama.trim()) {
        errors.nama = 'Nama tidak boleh kosong';
    } else if (formData.nama.length < 3) {
        errors.nama = 'Nama minimal 3 karakter';
    }

    // Validate NIM
    if (!formData.nim.trim()) {
        errors.nim = 'NIM tidak boleh kosong';
    } else if (!/^\d+$/.test(formData.nim)) {
        errors.nim = 'NIM hanya boleh berisi angka';
    } else {
        // Check duplikasi NIM
        const allData = getAllData();
        const isDuplicate = allData.some(item => item.nim === formData.nim);
        if (isDuplicate) {
            errors.nim = 'NIM sudah terdaftar';
        }
    }

    // Validate Jenis Layanan
    if (!formData.layanan) {
        errors.layanan = 'Jenis Layanan harus dipilih';
    }

    return errors;
}

/**
 * Clear error messages
 */
function clearErrors() {
    const errorMsgs = document.querySelectorAll('.error-msg');
    const formFields = document.querySelectorAll('.form-field');
    
    errorMsgs.forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none';
    });
    
    formFields.forEach(field => {
        field.classList.remove('error');
    });
}

/**
 * Show error messages
 */
function showErrors(errors) {
    clearErrors();
    
    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`error-${field}`);
        const formField = document.getElementById(field)?.parentElement;
        
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.style.display = 'block';
        }
        
        if (formField) {
            formField.classList.add('error');
        }
    });
}

// ===========================
// FORM HANDLING
// ===========================

/**
 * Handle form submit
 */
function handleFormSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('dataForm');
    const formData = {
        nama: document.getElementById('nama').value,
        nim: document.getElementById('nim').value,
        layanan: document.getElementById('layanan').value,
        keterangan: document.getElementById('keterangan').value
    };

    // Validate form
    const errors = validateForm(formData);
    
    if (Object.keys(errors).length > 0) {
        showErrors(errors);
        return;
    }

    // Clear errors if valid
    clearErrors();

    // Create data object with additional properties
    const dataObj = {
        id: generateId(),
        ...formData,
        tanggalInput: new Date().toISOString()
    };

    // Get existing data
    let allData = getAllData();

    // Add new data
    allData.push(dataObj);

    // Save to localStorage
    saveData(allData);

    // Show success message
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'block';
    }

    // Clear form
    form.reset();
    clearErrors();

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'data.html';
    }, 2000);
}

/**
 * Initialize form if on form page
 */
function initializeForm() {
    const form = document.getElementById('dataForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// ===========================
// DATA TABLE HANDLING
// ===========================

/**
 * Display data in table
 */
function displayData() {
    const allData = getAllData();
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    const dataBody = document.getElementById('dataBody');
    const totalDataSpan = document.getElementById('totalData');

    // Update total data count
    if (totalDataSpan) {
        totalDataSpan.textContent = `Total: ${allData.length} data`;
    }

    if (allData.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    // Show table and hide empty state
    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    // Clear table body
    if (dataBody) {
        dataBody.innerHTML = '';

        // Add rows
        allData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(item.nama)}</td>
                <td>${escapeHtml(item.nim)}</td>
                <td><span class="badge">${escapeHtml(item.layanan)}</span></td>
                <td>${item.keterangan ? escapeHtml(item.keterangan.substring(0, 50)) + '...' : '-'}</td>
                <td>${formatDate(item.tanggalInput)}</td>
                <td>
                    <button class="btn btn-delete" onclick="deleteData('${item.id}')">Hapus</button>
                </td>
            `;
            dataBody.appendChild(row);
        });
    }
}

/**
 * Delete data by ID
 */
function deleteData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        let allData = getAllData();
        allData = allData.filter(item => item.id !== id);
        saveData(allData);
        displayData();
    }
}

/**
 * Delete all data
 */
function deleteAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan.')) {
        localStorage.removeItem(STORAGE_KEY);
        displayData();
    }
}

/**
 * Export data to CSV
 */
function exportToCSV() {
    const allData = getAllData();

    if (allData.length === 0) {
        alert('Tidak ada data untuk di-export');
        return;
    }

    // Create CSV header
    const headers = ['No', 'Nama', 'NIM', 'Jenis Layanan', 'Keterangan', 'Tanggal Input'];
    const csv = [headers.join(',')];

    // Add data rows
    allData.forEach((item, index) => {
        const row = [
            index + 1,
            `"${item.nama}"`,
            item.nim,
            `"${item.layanan}"`,
            `"${item.keterangan || ''}"`,
            formatDate(item.tanggalInput)
        ];
        csv.push(row.join(','));
    });

    // Create blob
    const csvContent = csv.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `treatment_data_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Print data
 */
function printData() {
    const allData = getAllData();

    if (allData.length === 0) {
        alert('Tidak ada data untuk di-print');
        return;
    }

    window.print();
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===========================
// INITIALIZE ON PAGE LOAD
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form if on form page
    initializeForm();
});
