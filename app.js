// --- Centralized State Management ---
const defaultState = {
    users: [
        { id: 'U1', name: 'Admin User', email: 'admin@nexgen.erp', role: 'System Admin', status: 'Active' }
    ],
    employees: [
        { id: 'EMP001', name: 'John Doe', department: 'Engineering', position: 'Senior Dev', salary: 4500, daysPresent: 20, totalDays: 22, status: 'Active' },
        { id: 'EMP002', name: 'Sarah Smith', department: 'Marketing', position: 'SEO Spec', salary: 3800, daysPresent: 22, totalDays: 22, status: 'Active' },
        { id: 'EMP003', name: 'Michael Johnson', department: 'Sales', position: 'Manager', salary: 4200, daysPresent: 18, totalDays: 22, status: 'Active' }
    ],
    inventory: [
        { sku: 'SKU001', name: 'Pro Laptop M2', category: 'Electronics', cost: 900, price: 1299, stock: 45 },
        { sku: 'SKU002', name: 'Wireless Mouse', category: 'Accessories', cost: 20, price: 49.99, stock: 120 },
        { sku: 'SKU003', name: 'Office Desk', category: 'Furniture', cost: 150, price: 299, stock: 5 }
    ],
    finance: {
        income: [
            { date: '2024-10-24', desc: 'Initial Capital', amount: 50000, status: 'Completed' }
        ],
        expenses: [
            { date: '2024-10-25', desc: 'Office Rent', category: 'Utilities', amount: 2000, status: 'Paid' }
        ],
        parties: [
            { id: 'PTY001', name: 'TechFix Solutions', type: 'Vendor (Payable)', email: 'contact@techfix.com', balance: -850, status: 'Active' },
            { id: 'PTY002', name: 'Alpha Corp', type: 'Client (Receivable)', email: 'finance@alphacorp.com', balance: 5400, status: 'Active' }
        ]
    },
    posCart: [],
    lastReceipt: null
};

let state = JSON.parse(localStorage.getItem('erp_state'));
if (!state) {
    state = JSON.parse(JSON.stringify(defaultState));
    saveState();
}

function saveState() {
    localStorage.setItem('erp_state', JSON.stringify(state));
}

window.resetSystemData = function () {
    if (confirm('Are you sure you want to factory reset all data? This cannot be undone.')) {
        localStorage.removeItem('erp_state');
        location.reload();
    }
}

let hrSearchQuery = '';
let invSearchQuery = '';

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------- UI UTILS ----------------

window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}" style="font-size: 20px;"></i> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.toggleTheme = function () {
    document.body.classList.toggle('light-mode');
    const icon = document.getElementById('theme-icon');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('erpTheme', 'light');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('erpTheme', 'dark');
    }
    initCharts();
}

let mainChartInstance = null;
let pieChartInstance = null;

function initCharts() {
    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#4b5563' : '#9ba1b9';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    const mainCtx = document.getElementById('mainChart');
    if (mainCtx) {
        if (mainChartInstance) mainChartInstance.destroy();

        let rev = state.finance.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        let exp = state.finance.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

        mainChartInstance = new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Total Revenue', 'Total Expenses'],
                datasets: [
                    {
                        label: 'Amount ($)',
                        data: [rev, exp],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: textColor,
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        if (pieChartInstance) pieChartInstance.destroy();

        let depts = {};
        state.employees.forEach(e => {
            depts[e.department] = (depts[e.department] || 0) + 1;
        });

        pieChartInstance = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(depts),
                datasets: [{
                    data: Object.values(depts),
                    backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: textColor,
                plugins: { legend: { position: 'right', labels: { color: textColor } } }
            }
        });
    }
}


// --- Navigation & Core App Setup ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('erpTheme') === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon')?.classList.replace('fa-moon', 'fa-sun');
    }

    const navLinks = document.querySelectorAll('.nav-links li');
    const contentSections = document.querySelectorAll('.content-section');

    function switchSection(targetId) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === targetId) link.classList.add('active');
        });

        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                setTimeout(() => section.classList.add('active'), 50);
            }
        });
        if (targetId === 'dashboard') {
            setTimeout(initCharts, 100);
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            if (target) switchSection(target);
        });
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            const parent = btn.closest('.module-content');

            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            parent.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === target) content.classList.add('active');
            });
        });
    });

    window.openModal = function (modalId) { document.getElementById(modalId).classList.add('active'); };
    window.closeModal = function (modalId) { document.getElementById(modalId).classList.remove('active'); };

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    renderAll();
    setTimeout(initCharts, 200);
});

// --- RENDER FUNCTIONS --- //

function renderAll() {
    renderDashboard();
    renderUsers();
    renderHR();
    renderInventory();
    renderFinance();
    renderPOS();
    renderPayroll();
    renderParties();
    renderReports();
}

function renderDashboard() {
    document.getElementById('stat-employees').innerHTML = `${state.employees.length} <i class="fa-solid fa-users"></i>`;
    let rev = state.finance.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    document.getElementById('stat-revenue').innerHTML = `$${rev.toLocaleString()} <i class="fa-solid fa-arrow-trend-up"></i>`;
    let lowStock = state.inventory.filter(i => i.stock < 10).length;
    document.getElementById('stat-low-stock').innerHTML = `${lowStock} <i class="fa-solid fa-triangle-exclamation"></i>`;
    let exp = state.finance.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    document.getElementById('stat-expenses').innerHTML = `$${exp.toLocaleString()} <i class="fa-solid fa-money-bill-transfer"></i>`;
}

function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';
    state.users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="status-badge status-pending" style="background: rgba(59,130,246,0.2); color: #3b82f6;">${u.role}</span></td>
                <td><span class="status-badge status-active">${u.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="showToast('Edit feature coming soon', 'warning')"><i class="fa-solid fa-pen"></i></button>
                    ${u.id !== 'U1' ? `<button class="btn btn-secondary btn-sm" onclick="deleteUser('${u.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    });
}

function renderHR() {
    const tbody = document.getElementById('hr-tbody');
    tbody.innerHTML = '';
    let filtered = state.employees.filter(e => e.name.toLowerCase().includes(hrSearchQuery) || e.id.toLowerCase().includes(hrSearchQuery) || e.department.toLowerCase().includes(hrSearchQuery));

    filtered.forEach(emp => {
        let attStatus = emp.daysPresent === emp.totalDays ?
            `<span class="text-success">${emp.daysPresent}/${emp.totalDays}</span>` :
            `<span class="text-danger">${emp.daysPresent}/${emp.totalDays}</span>`;

        tbody.innerHTML += `
            <tr>
                <td>#${emp.id}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.department}</td>
                <td>${emp.position}</td>
                <td>${attStatus} Days</td>
                <td><span class="status-badge status-active">${emp.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openLeaveModal('${emp.id}', '${emp.name}')" style="margin-right: 5px;">
                        <i class="fa-solid fa-user-xmark"></i> Absent
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteEmployee('${emp.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    const stockSelect = document.getElementById('stockProdSelect');
    if (stockSelect) stockSelect.innerHTML = '';

    let filtered = state.inventory.filter(i => i.name.toLowerCase().includes(invSearchQuery) || i.sku.toLowerCase().includes(invSearchQuery) || i.category.toLowerCase().includes(invSearchQuery));

    filtered.forEach(item => {
        if (stockSelect) stockSelect.innerHTML += `<option value="${item.sku}">${item.name} (${item.sku})</option>`;
        let stockClass = item.stock < 10 ? 'status-danger' : 'status-active';
        let stockLabel = item.stock < 10 ? 'Low Stock' : 'In Stock';
        tbody.innerHTML += `
            <tr>
                <td>#${item.sku}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>$${item.cost.toFixed(2)}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td><strong>${item.stock} Units</strong></td>
                <td><span class="status-badge ${stockClass}">${stockLabel}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="deleteProduct('${item.sku}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderFinance() {
    const incBody = document.getElementById('revenue-tbody');
    incBody.innerHTML = '';
    let totalIncome = 0;
    state.finance.income.forEach((inc, idx) => {
        totalIncome += parseFloat(inc.amount);
        incBody.innerHTML += `
            <tr>
                <td>${inc.date}</td>
                <td>${inc.desc}</td>
                <td class="text-success">+$${parseFloat(inc.amount).toFixed(2)}</td>
                <td><span class="status-badge status-active">${inc.status}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="deleteIncome(${idx})" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });

    const expBody = document.getElementById('expenses-tbody');
    expBody.innerHTML = '';
    let totalExpenses = 0;
    state.finance.expenses.forEach((exp, idx) => {
        totalExpenses += parseFloat(exp.amount);
        expBody.innerHTML += `
            <tr>
                <td>${exp.date}</td>
                <td>${exp.desc}</td>
                <td>${exp.category}</td>
                <td class="text-danger">-$${parseFloat(exp.amount).toFixed(2)}</td>
                <td><span class="status-badge status-active">${exp.status}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="deleteExpense(${idx})" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });

    document.getElementById('ledger-revenue').innerText = `$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('ledger-expenses').innerText = `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    let bal = totalIncome - totalExpenses;
    document.getElementById('ledger-balance').innerText = `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (bal < 0) document.getElementById('ledger-balance').classList.add('text-danger');
    else document.getElementById('ledger-balance').classList.remove('text-danger');

    if (mainChartInstance) {
        mainChartInstance.data.datasets[0].data = [totalIncome, totalExpenses];
        mainChartInstance.update();
    }
}

function renderPOS() {
    const posContainer = document.getElementById('pos-products-container');
    posContainer.innerHTML = '';
    state.inventory.forEach(item => {
        const inStock = item.stock > 0;
        const opacity = inStock ? 1 : 0.5;

        let icon = 'fa-box';
        if (item.category === 'Electronics') icon = 'fa-laptop';
        if (item.category === 'Furniture') icon = 'fa-chair';

        posContainer.innerHTML += `
            <div class="product-card" style="opacity: ${opacity}" ${inStock ? `onclick="addToCart('${item.sku}')"` : ''}>
                <div class="product-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">$${item.price.toFixed(2)}</div>
                <small style="color:var(--text-secondary)">${item.stock} in stock</small>
            </div>
        `;
    });

    const cartContainer = document.getElementById('cart-items-container');
    cartContainer.innerHTML = '';
    let subtotal = 0;

    state.posCart.forEach((cartItem, index) => {
        let itemTotal = cartItem.price * cartItem.qty;
        subtotal += itemTotal;
        cartContainer.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${cartItem.name}</strong><br>
                    <small style="color:var(--text-secondary)">${cartItem.qty} x $${cartItem.price.toFixed(2)}</small>
                </div>
                <div style="text-align:right">
                    <strong>$${itemTotal.toFixed(2)}</strong><br>
                    <i class="fa-solid fa-trash" style="color: #ef4444; cursor: pointer; font-size: 12px; margin-top:5px" onclick="removeFromCart(${index})"></i>
                </div>
            </div>
        `;
    });

    let tax = subtotal * 0.10;
    let total = subtotal + tax;

    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').innerText = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;

    const printBtn = document.getElementById('printReceiptBtn');
    if (state.lastReceipt) {
        printBtn.disabled = false;
        printBtn.style.color = '#fff';
    } else {
        printBtn.disabled = true;
    }
}

function renderPayroll() {
    const tbody = document.getElementById('payroll-tbody');
    tbody.innerHTML = '';
    state.employees.forEach(emp => {
        let missingDays = emp.totalDays - emp.daysPresent;
        let perDayRate = emp.salary / emp.totalDays;
        let deductions = missingDays * perDayRate;
        let netPay = emp.salary - deductions;

        tbody.innerHTML += `
            <tr>
                <td>#${emp.id}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.daysPresent}/${emp.totalDays} Days</td>
                <td>$${emp.salary.toFixed(2)}</td>
                <td class="${deductions > 0 ? 'text-danger' : ''}">-$${deductions.toFixed(2)}</td>
                <td style="font-size: 16px;"><strong>$${netPay.toFixed(2)}</strong></td>
                <td><span class="status-badge status-pending">Unpaid</span></td>
            </tr>
        `;
    });
}

function renderParties() {
    const tbody = document.getElementById('parties-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    state.finance.parties.forEach(party => {
        let balColor = party.balance < 0 ? 'text-danger' : (party.balance > 0 ? 'text-success' : '');
        tbody.innerHTML += `
            <tr>
                <td>#${party.id}</td>
                <td><strong>${party.name}</strong></td>
                <td>${party.type}</td>
                <td>${party.email || '-'}</td>
                <td class="${balColor}"><strong>$${party.balance.toFixed(2)}</strong></td>
                <td><span class="status-badge status-active">${party.status}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="deleteParty('${party.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
}

// --- REPORTS VIEW LOGIC --- //

function renderReports() {
    // 1. HR Report
    const hrBody = document.getElementById('rep-hr-tbody');
    if (!hrBody) return;
    hrBody.innerHTML = '';

    let depts = {};
    state.employees.forEach(emp => {
        if (!depts[emp.department]) depts[emp.department] = { count: 0, perfect: 0, salary: 0 };
        depts[emp.department].count++;
        if (emp.daysPresent === emp.totalDays) depts[emp.department].perfect++;
        depts[emp.department].salary += emp.salary;
    });

    for (let d in depts) {
        hrBody.innerHTML += `
            <tr>
                <td><strong>${d}</strong></td>
                <td>${depts[d].count} Employees</td>
                <td><span class="text-success">${depts[d].perfect} Employees</span></td>
                <td>$${depts[d].salary.toFixed(2)}</td>
            </tr>
        `;
    }

    // 2. Inventory Report
    const invBody = document.getElementById('rep-inv-tbody');
    invBody.innerHTML = '';

    let cats = {};
    state.inventory.forEach(item => {
        if (!cats[item.category]) cats[item.category] = { skus: 0, units: 0, value: 0 };
        cats[item.category].skus++;
        cats[item.category].units += item.stock;
        cats[item.category].value += (item.stock * item.cost);
    });

    for (let c in cats) {
        invBody.innerHTML += `
            <tr>
                <td><strong>${c}</strong></td>
                <td>${cats[c].skus} SKUs</td>
                <td>${cats[c].units} Units</td>
                <td><strong>$${cats[c].value.toFixed(2)}</strong></td>
            </tr>
        `;
    }

    // 3. Finance Report
    const finBody = document.getElementById('rep-fin-tbody');
    finBody.innerHTML = '';

    let totalInc = state.finance.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    let totalExp = state.finance.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    let net = totalInc - totalExp;

    finBody.innerHTML += `
        <tr><td><strong>Total Revenue (Income)</strong></td><td>${state.finance.income.length} Transactions</td><td class="text-success">+$${totalInc.toFixed(2)}</td></tr>
        <tr><td><strong>Total Expenses</strong></td><td>${state.finance.expenses.length} Transactions</td><td class="text-danger">-$${totalExp.toFixed(2)}</td></tr>
        <tr><td><strong>Net Profit/Loss</strong></td><td>-</td><td class="${net >= 0 ? 'text-success' : 'text-danger'}" style="font-size: 16px;"><strong>$${net.toFixed(2)}</strong></td></tr>
    `;
}

window.printReport = function () {
    const activeTabObj = document.querySelector('#reports .tab-content.active');
    if (!activeTabObj) return showToast('No active report to print', 'warning');

    const tableHTML = activeTabObj.querySelector('.table-responsive').innerHTML;
    const title = activeTabObj.querySelector('h3').innerText;

    let html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; text-align: left; padding: 20px;">
            <h1 style="text-align:center;">NexGen ERP System</h1>
            <h2 style="text-align:center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">${title}</h2>
            <p style="text-align:right; font-size:12px; color: #666;">Generated on: ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px;">
                ${tableHTML}
            </div>
            <p style="text-align:center; margin-top:40px; font-size:12px; border-top: 1px solid #ccc; padding-top: 10px;">End of Report</p>
        </div>
    `;

    const printDiv = document.getElementById('print-receipt');
    printDiv.innerHTML = html;

    const tables = printDiv.querySelectorAll('table');
    tables.forEach(t => {
        t.style.width = '100%';
        t.style.borderCollapse = 'collapse';
        t.style.textAlign = 'left';
        t.style.color = '#000';
    });

    printDiv.querySelectorAll('th, td').forEach(c => {
        c.style.border = '1px solid #ccc';
        c.style.padding = '8px';
    });

    showToast('Generating report document...', 'success');
    setTimeout(() => {
        window.print();
    }, 500);
}

// --- ACTION FUNCTIONS (With Persistent Storage Context) --- //

window.addUser = function () {
    const name = document.getElementById('usrName').value;
    const email = document.getElementById('usrEmail').value;
    const role = document.getElementById('usrRole').value;

    if (!name || !email) return showToast('Name and Email required', 'warning');

    state.users.push({
        id: 'U' + (Date.now()),
        name, email, role, status: 'Active'
    });

    closeModal('addUserModal');
    document.getElementById('addUserForm').reset();
    saveState();
    showToast('User created successfully');
    renderAll();
}

window.deleteUser = function (id) {
    if (confirm('Are you sure you want to delete this user?')) {
        state.users = state.users.filter(u => u.id !== id);
        saveState();
        showToast('User deleted', 'error');
        renderAll();
    }
}

window.addEmployee = function () {
    const name = document.getElementById('empName').value;
    const dept = document.getElementById('empDept').value;
    const pos = document.getElementById('empPos').value;
    const salary = parseFloat(document.getElementById('empSalary').value);

    if (!name || !salary) return showToast("Fill required fields", 'warning');

    state.employees.push({
        id: 'EMP' + String(state.employees.length + 1).padStart(3, '0'),
        name, department: dept, position: pos, salary: salary, daysPresent: 22, totalDays: 22, status: 'Active'
    });

    closeModal('addEmployeeModal');
    document.getElementById('addEmployeeForm').reset();
    saveState();
    showToast('Employee added successfully');
    renderAll();
}

window.deleteEmployee = function (id) {
    if (confirm('Delete employee?')) {
        state.employees = state.employees.filter(e => e.id !== id);
        saveState();
        showToast('Employee deleted', 'error');
        renderAll();
    }
}

window.openLeaveModal = function (id, name) {
    document.getElementById('leaveEmpName').innerText = name;
    document.getElementById('leaveEmpId').value = id;
    openModal('markLeaveModal');
}

window.confirmLeave = function () {
    const id = document.getElementById('leaveEmpId').value;
    const emp = state.employees.find(e => e.id === id);
    if (emp && emp.daysPresent > 0) {
        emp.daysPresent -= 1;
    }
    closeModal('markLeaveModal');
    saveState();
    showToast(`Leave recorded for ${emp.name}`, 'warning');
    renderAll();
}

window.markAllPresent = function () {
    state.employees.forEach(emp => {
        emp.daysPresent = emp.totalDays;
    });
    saveState();
    showToast('All employees marked present', 'success');
    renderAll();
}

window.addExpense = function () {
    const desc = document.getElementById('expDesc').value;
    const cat = document.getElementById('expCat').value;
    const amt = parseFloat(document.getElementById('expAmt').value);

    if (!desc || !amt) return showToast('Description and Amount required', 'warning');

    state.finance.expenses.push({
        date: getTodayDate(), desc, category: cat, amount: amt, status: 'Paid'
    });

    closeModal('addExpenseModal');
    document.getElementById('addExpenseForm').reset();
    saveState();
    showToast('Expense logged successfully');
    renderAll();
}

window.deleteExpense = function (index) {
    if (confirm('Delete this expense?')) {
        state.finance.expenses.splice(index, 1);
        saveState();
        showToast('Expense deleted', 'error');
        renderAll();
    }
}

window.deleteIncome = function (index) {
    if (confirm('Delete this income record?')) {
        state.finance.income.splice(index, 1);
        saveState();
        showToast('Income record deleted', 'error');
        renderAll();
    }
}


window.addProduct = function () {
    const name = document.getElementById('prodName').value;
    const cat = document.getElementById('prodCat').value;
    const cost = parseFloat(document.getElementById('prodCost').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);

    if (!name || isNaN(cost) || isNaN(price) || isNaN(stock)) return showToast('Fill required fields correctly', 'warning');

    const sku = 'SKU' + String(state.inventory.length + 1).padStart(3, '0');

    state.inventory.push({ sku, name, category: cat, cost, price, stock });

    if (stock > 0 && cost > 0) {
        state.finance.expenses.push({
            date: getTodayDate(),
            desc: `Inventory Purchase: ${name} (${stock} units)`,
            category: 'Assets & Supply',
            amount: cost * stock,
            status: 'Paid'
        });
    }

    closeModal('addProductModal');
    document.getElementById('addProductForm').reset();
    saveState();
    showToast(`Product added. $${(cost * stock).toFixed(2)} expense logged.`);
    renderAll();
}

window.deleteProduct = function (sku) {
    if (confirm('Delete this product?')) {
        state.inventory = state.inventory.filter(i => i.sku !== sku);
        saveState();
        showToast('Product deleted', 'error');
        renderAll();
    }
}

window.addToCart = function (sku) {
    const item = state.inventory.find(i => i.sku === sku);
    if (!item) return;

    const cartItem = state.posCart.find(i => i.sku === sku);
    const currentQtyInCart = cartItem ? cartItem.qty : 0;

    if (currentQtyInCart + 1 > item.stock) {
        return showToast('Not enough stock available!', 'error');
    }

    if (cartItem) {
        cartItem.qty += 1;
    } else {
        state.posCart.push({ sku: item.sku, name: item.name, price: item.price, qty: 1 });
    }
    saveState();
    renderPOS();
}

window.removeFromCart = function (index) {
    state.posCart.splice(index, 1);
    saveState();
    renderPOS();
}

window.checkoutCart = function () {
    if (state.posCart.length === 0) return showToast('Cart is empty.', 'warning');

    let subtotal = 0;

    // Create Receipt Object
    const receiptLines = [];

    state.posCart.forEach(cartItem => {
        let invItem = state.inventory.find(i => i.sku === cartItem.sku);
        if (invItem) {
            invItem.stock -= cartItem.qty;
        }
        subtotal += (cartItem.price * cartItem.qty);
        receiptLines.push(`${cartItem.name} (${cartItem.qty}x) - $${(cartItem.price * cartItem.qty).toFixed(2)}`);
    });

    let tax = subtotal * 0.10;
    let totalRevenue = subtotal + tax;

    state.finance.income.push({
        date: getTodayDate(),
        desc: `POS Retail Sales (Order #${Math.floor(Math.random() * 10000)})`,
        amount: totalRevenue,
        status: 'Completed'
    });

    // Store receipt data
    state.lastReceipt = {
        date: new Date().toLocaleString(),
        lines: receiptLines,
        subtotal: subtotal,
        tax: tax,
        total: totalRevenue
    };

    state.posCart = [];
    saveState();

    showToast(`Payment Processed! Revenue added to Finance.`);
    renderAll();
}

window.printReceipt = function () {
    if (!state.lastReceipt) return showToast('No recent receipt to print.', 'warning');

    let html = `
        <div style="font-family: monospace; width: 300px; margin: 0 auto; text-align: left; padding: 20px;">
            <h2 style="text-align:center;">NexGen ERP</h2>
            <p style="text-align:center; font-size:12px;">Retail POS System<br>${state.lastReceipt.date}</p>
            <hr>
            <table style="width: 100%; font-size: 14px;">
    `;

    state.lastReceipt.lines.forEach(l => {
        let parts = l.split(" - ");
        html += `<tr><td>${parts[0]}</td><td style="text-align:right;">${parts[1]}</td></tr>`;
    });

    html += `
            </table>
            <hr>
            <div style="text-align: right; font-size: 14px;">
                <p>Subtotal: $${state.lastReceipt.subtotal.toFixed(2)}</p>
                <p>Tax (10%): $${state.lastReceipt.tax.toFixed(2)}</p>
                <h3 style="margin-top: 10px;">Total: $${state.lastReceipt.total.toFixed(2)}</h3>
            </div>
            <p style="text-align:center; margin-top:20px; font-size:12px;">Thank you for your purchase!</p>
        </div>
    `;

    const printDiv = document.getElementById('print-receipt');
    printDiv.innerHTML = html;

    showToast('Opening print dialog...', 'success');
    setTimeout(() => {
        window.print();
    }, 500);
}

window.processPayroll = function () {
    if (state.employees.length === 0) return showToast('No employees to run payroll for.', 'warning');

    let totalPayrollExpense = 0;

    state.employees.forEach(emp => {
        let missingDays = emp.totalDays - emp.daysPresent;
        let perDayRate = emp.salary / emp.totalDays;
        let netPay = emp.salary - (missingDays * perDayRate);
        totalPayrollExpense += netPay;
    });

    if (confirm(`Confirm processing payroll for total $${totalPayrollExpense.toFixed(2)}? This will register as a Company Expense.`)) {
        state.finance.expenses.push({
            date: getTodayDate(),
            desc: `Monthly Employee Payroll Disbursement`,
            category: 'Salary & Allowances',
            amount: totalPayrollExpense,
            status: 'Paid'
        });

        const badges = document.querySelectorAll('#payroll-tbody .status-badge');
        badges.forEach(b => {
            b.classList.remove('status-pending');
            b.classList.add('status-active');
            b.innerText = 'Paid';
        });

        saveState();
        showToast(`Payroll processed! Expense of $${totalPayrollExpense.toFixed(2)} logged.`);

        setTimeout(() => renderAll(), 2000);
    }
}

window.searchHR = function () {
    hrSearchQuery = document.getElementById('hrSearch').value.toLowerCase();
    renderHR();
}

window.searchInventory = function () {
    invSearchQuery = document.getElementById('invSearch').value.toLowerCase();
    renderInventory();
}

window.addParty = function () {
    const name = document.getElementById('partyName').value;
    const type = document.getElementById('partyType').value;
    const email = document.getElementById('partyEmail').value;
    const bal = parseFloat(document.getElementById('partyBal').value);

    if (!name || isNaN(bal)) return showToast("Name and Opening Balance required!", 'warning');

    state.finance.parties.push({
        id: 'PTY' + String(state.finance.parties.length + 1).padStart(3, '0'),
        name, type, email, balance: bal, status: 'Active'
    });

    closeModal('addPartyModal');
    document.getElementById('addPartyForm').reset();
    saveState();
    showToast('Party added to ledger');
    renderAll();
}

window.deleteParty = function (id) {
    if (confirm('Delete this party?')) {
        state.finance.parties = state.finance.parties.filter(p => p.id !== id);
        saveState();
        showToast('Party deleted', 'error');
        renderAll();
    }
}

window.purchaseStock = function () {
    const sku = document.getElementById('stockProdSelect').value;
    const qty = parseInt(document.getElementById('purchaseQty').value);

    if (!sku || isNaN(qty) || qty <= 0) return showToast("Select product and valid quantity!", "warning");

    const item = state.inventory.find(i => i.sku === sku);
    if (item) {
        item.stock += qty;
        let cost = item.cost * qty;

        state.finance.expenses.push({
            date: getTodayDate(),
            desc: `Inventory Restock: ${item.name} (${qty} units)`,
            category: 'Assets & Supply',
            amount: cost,
            status: 'Paid'
        });

        closeModal('addStockModal');
        document.getElementById('addStockForm').reset();
        saveState();
        showToast(`Purchased ${qty} units of ${item.name}. Expense logged.`);
        renderAll();
    }
}
