// ==========================================
// PREMIUM ADMIN PANEL - 100% DESIGN INTACT & SUPABASE CONNECTED
// ==========================================

const SUPABASE_URL = 'https://tzgipesjqsrqtwxbwkye.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AYSEhxP9kZF03QOmQrSDrg_njl68RNf';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Management (Chat removed)
const adminState = {
    addMoneyRequests: [],
    kycRequests: [],
    usersList: []
};

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminDashboardStats();
    fetchPendingAddMoneyRequests();
    fetchPendingKYCRequests();
    fetchAllUsersManagement();
});

// ================= 1. STATS & COUNTERS =================
async function fetchAdminDashboardStats() {
    try {
        const { count: totalUsers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });
        if (document.getElementById('admin-total-users')) {
            document.getElementById('admin-total-users').textContent = totalUsers || 0;
        }

        const { data: usersData } = await supabaseClient.from('users').select('balance');
        if (usersData) {
            let online = 0, offline = 0;
            usersData.forEach(u => {
                if ((parseFloat(u.balance) || 0) > 2000) online++;
                else offline++;
            });
            if (document.getElementById('admin-online-users')) document.getElementById('admin-online-users').textContent = online;
            if (document.getElementById('admin-offline-users')) document.getElementById('admin-offline-users').textContent = offline;
        }

        const { count: addMoneyCount } = await supabaseClient
            .from('add_money_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');
        if (document.getElementById('admin-add-money-count')) {
            document.getElementById('admin-add-money-count').textContent = addMoneyCount || 0;
        }

        const { count: kycCount } = await supabaseClient
            .from('kyc')
            .select('*', { count: 'exact', head: true })
            .eq('kyc_status', 'pending');
        if (document.getElementById('admin-kyc-count')) {
            document.getElementById('admin-kyc-count').textContent = kycCount || 0;
        }
    } catch (err) {
        console.error("Stats error:", err.message);
    }
}

// ================= 2. CARD [1]: ADD MONEY REQUESTS MODAL =================
async function fetchPendingAddMoneyRequests() {
    try {
        const { data } = await supabaseClient
            .from('add_money_transactions')
            .select('*')
            .eq('status', 'Pending')
            .order('created_at', { ascending: false });

        adminState.addMoneyRequests = data || [];
        renderAddMoneyModalContent();
    } catch (err) {
        console.error("Add money fetch error:", err.message);
    }
}

function renderAddMoneyModalContent() {
    const modalBody = document.querySelector('#admin-add-money-modal .overflow-y-auto');
    if (!modalBody) return;

    if (adminState.addMoneyRequests.length === 0) {
        modalBody.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">No pending add money requests found.</p>`;
        return;
    }

    modalBody.innerHTML = '';
    adminState.addMoneyRequests.forEach(req => {
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3";
        div.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 gap-2">
                <div class="flex items-center gap-2">
                    <span class="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded">${req.payment_method || 'Binance (USDT)'}</span>
                    <span class="text-xs font-bold text-gray-800">User: ${req.user_name || req.user_email}</span>
                </div>
                <span class="text-xs text-gray-400">${req.date || new Date(req.created_at).toLocaleString()}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                <p><strong>USDT Amount:</strong> <span class="text-blue-600 font-bold">$${req.usdt_amount || 0}</span></p>
                <p><strong>Converted BDT:</strong> <span class="text-emerald-600 font-bold">৳${req.bdt_amount || 0}</span></p>
                <p class="md:col-span-2"><strong>TrxID:</strong> <span class="text-pink-600 font-medium">${req.trx_id}</span></p>
            </div>

            <div class="border-t pt-3">
                <p class="text-xs font-bold text-gray-800 mb-2">Payment Screenshot:</p>
                <div class="border rounded-lg p-2 bg-gray-50 text-center max-w-xs">
                    <img src="${req.screenshot_url || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=300'}" alt="Payment SS" class="w-full h-36 object-cover rounded border cursor-pointer hover:opacity-90" onclick="window.open(this.src)">
                </div>
            </div>

            <div class="flex items-center justify-end gap-2 border-t pt-3">
                <button onclick="processAddMoneyAction('${req.id}', 'Rejected', '${req.user_email}', 0)" class="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
                <button onclick="processAddMoneyAction('${req.id}', 'Approved', '${req.user_email}', ${req.bdt_amount || 0})" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-check"></i> Accept
                </button>
            </div>
        `;
        modalBody.appendChild(div);
    });
}

async function processAddMoneyAction(id, status, email, amount) {
    try {
        await supabaseClient.from('add_money_transactions').update({ status: status }).eq('id', id);

        if (status === 'Approved' && email) {
            const { data: user } = await supabaseClient.from('users').select('balance').eq('email', email).single();
            if (user) {
                const newBal = (parseFloat(user.balance) || 0) + parseFloat(amount);
                await supabaseClient.from('users').update({ balance: newBal }).eq('email', email);
            }
        }

        alert(`Request ${status} successfully!`);
        fetchPendingAddMoneyRequests();
        fetchAdminDashboardStats();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ================= 3. CARD [2]: KYC VERIFY MODAL =================
async function fetchPendingKYCRequests() {
    try {
        const { data } = await supabaseClient.from('kyc').select('*').eq('kyc_status', 'pending');
        adminState.kycRequests = data || [];
        renderKYCModalContent();
    } catch (err) {
        console.error("KYC fetch error:", err.message);
    }
}

function renderKYCModalContent() {
    const modalBody = document.querySelector('#admin-kyc-modal .overflow-y-auto');
    if (!modalBody) return;

    if (adminState.kycRequests.length === 0) {
        modalBody.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">No pending KYC requests found.</p>`;
        return;
    }

    modalBody.innerHTML = '';
    adminState.kycRequests.forEach(kyc => {
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl border border-rose-100 shadow-sm space-y-3";
        div.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 gap-2">
                <div>
                    <span class="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded">KYC Pending</span>
                    <h4 class="text-sm font-bold text-gray-800 mt-1">${kyc.full_name || kyc.user_name || 'User'}</h4>
                </div>
                <span class="text-xs text-gray-400">Email: ${kyc.user_email}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                <p><strong>DOB:</strong> ${kyc.dob || 'N/A'}</p>
                <p><strong>Gender:</strong> ${kyc.gender || 'N/A'}</p>
                <p><strong>Nationality:</strong> ${kyc.nationality || 'N/A'}</p>
                <p><strong>Phone:</strong> ${kyc.phone || 'N/A'}</p>
                <p><strong>Telegram:</strong> ${kyc.telegram || 'N/A'}</p>
                <p class="md:col-span-2"><strong>Address:</strong> ${kyc.address || 'N/A'}</p>
            </div>

            <div class="border-t pt-3">
                <p class="text-xs font-bold text-gray-800 mb-2">Submitted NID & Selfie Documents:</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="border rounded-lg p-2 bg-gray-50 text-center">
                        <span class="text-[10px] font-semibold text-gray-600 block mb-1">NID Front</span>
                        <img src="${kyc.nid_front || '#'}" class="w-full h-28 object-cover rounded border cursor-pointer" onclick="window.open(this.src)">
                    </div>
                    <div class="border rounded-lg p-2 bg-gray-50 text-center">
                        <span class="text-[10px] font-semibold text-gray-600 block mb-1">NID Back</span>
                        <img src="${kyc.nid_back || '#'}" class="w-full h-28 object-cover rounded border cursor-pointer" onclick="window.open(this.src)">
                    </div>
                    <div class="border rounded-lg p-2 bg-gray-50 text-center">
                        <span class="text-[10px] font-semibold text-gray-600 block mb-1">Selfie</span>
                        <img src="${kyc.nid_selfie || '#'}" class="w-full h-28 object-cover rounded border cursor-pointer" onclick="window.open(this.src)">
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-end gap-2 border-t pt-3">
                <button onclick="processKYCAction('${kyc.user_email}', 'rejected')" class="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
                <button onclick="processKYCAction('${kyc.user_email}', 'approved')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-check"></i> Approve KYC
                </button>
            </div>
        `;
        modalBody.appendChild(div);
    });
}

async function processKYCAction(email, status) {
    try {
        await supabaseClient.from('kyc').update({ kyc_status: status }).eq('user_email', email);
        await supabaseClient.from('users').update({ kyc: status }).eq('email', email);
        alert(`KYC ${status} successfully!`);
        fetchPendingKYCRequests();
        fetchAdminDashboardStats();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ================= 4. CARD [3]: USER MANAGEMENT MODAL =================
async function fetchAllUsersManagement() {
    try {
        const { data } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
        adminState.usersList = data || [];
        renderUserManageModalContent();
    } catch (err) {
        console.error("Users fetch error:", err.message);
    }
}

function renderUserManageModalContent() {
    const modalBody = document.querySelector('#admin-user-manage-modal .overflow-y-auto.space-y-3');
    if (!modalBody) return;

    if (adminState.usersList.length === 0) {
        modalBody.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">No users found.</p>`;
        return;
    }

    modalBody.innerHTML = '';
    adminState.usersList.forEach((user, index) => {
        const div = document.createElement('div');
        div.className = "bg-white p-3 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between gap-3";
        const isBlocked = user.status === 'Blocked';

        div.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold shrink-0">
                    ${(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0">
                    <h4 class="text-xs md:text-sm font-bold text-gray-800 truncate">${user.full_name || 'User'}</h4>
                    <p class="text-[10px] md:text-xs text-gray-500 truncate">${user.email}</p>
                </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
                <div class="bg-pink-50 border border-pink-200 px-3 py-1 rounded-lg text-right">
                    <span class="text-[9px] text-gray-500 block">Balance</span>
                    <span class="text-xs md:text-sm font-bold text-pink-600">৳${user.balance || 0}</span>
                </div>

                <button onclick="openUserHistoryModal('${user.full_name || user.email}', '${user.email}')" title="Transaction History" class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-pink-100 text-gray-600 hover:text-pink-600 flex items-center justify-center transition cursor-pointer">
                    <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                </button>

                <div class="flex flex-col items-center">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${!isBlocked ? 'checked' : ''} onchange="toggleUserBlockStatus(this, 'status-text-${index}', '${user.email}')" class="sr-only peer">
                        <div class="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                    <span id="status-text-${index}" class="text-[9px] font-semibold ${!isBlocked ? 'text-emerald-600' : 'text-rose-500'} mt-0.5">${!isBlocked ? 'Active' : 'Blocked'}</span>
                </div>
            </div>
        `;
        modalBody.appendChild(div);
    });
}

async function toggleUserBlockStatus(checkbox, statusTextId, email) {
    const statusSpan = document.getElementById(statusTextId);
    const newStatus = checkbox.checked ? 'Active' : 'Blocked';
    try {
        await supabaseClient.from('users').update({ status: newStatus }).eq('email', email);
        if (checkbox.checked) {
            statusSpan.textContent = "Active";
            statusSpan.className = "text-[9px] font-semibold text-emerald-600 mt-0.5";
        } else {
            statusSpan.textContent = "Blocked";
            statusSpan.className = "text-[9px] font-semibold text-rose-500 mt-0.5";
        }
    } catch (err) {
        console.error("Status update error:", err.message);
    }
}

// ================= TRANSACTION HISTORY MODAL =================
async function openUserHistoryModal(userName, userEmail) {
    document.getElementById('history-modal-title').innerHTML = `<i class="fa-solid fa-clock-rotate-left text-pink-600"></i> History: ${userName}`;
    document.getElementById('user-history-modal').classList.remove('hidden');

    if (userEmail) {
        try {
            const { data: addMoneyData } = await supabaseClient.from('add_money_transactions').select('*').eq('user_email', userEmail);
            const { data: depWithData } = await supabaseClient.from('deposit_withdraw_history').select('*').eq('user_email', userEmail);

            const addMoneyContainer = document.getElementById('content-tab-addmoney');
            if (addMoneyContainer && addMoneyData) {
                addMoneyContainer.innerHTML = addMoneyData.length > 0 ? addMoneyData.map(item => `
                    <div class="bg-white p-3 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between text-xs">
                        <div>
                            <span class="font-bold text-gray-800 block">Method: ${item.payment_method || 'Binance'}</span>
                            <span class="text-[10px] text-gray-400">TrxID: ${item.trx_id} | ${item.date || 'N/A'}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-bold text-emerald-600 block">+ ৳${item.bdt_amount || 0}</span>
                            <span class="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">${item.status}</span>
                        </div>
                    </div>
                `).join('') : `<p class="text-xs text-gray-500 text-center py-4">No add money history.</p>`;
            }

            const depWithContainer = document.getElementById('content-tab-depwith');
            if (depWithContainer && depWithData) {
                depWithContainer.innerHTML = depWithData.length > 0 ? depWithData.map(item => `
                    <div class="bg-white p-3 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between text-xs">
                        <div>
                            <span class="font-bold ${item.type === 'deposit' ? 'text-rose-600' : 'text-emerald-600'} block">[${item.type.toUpperCase()}] ${item.provider}</span>
                            <span class="text-[10px] text-gray-500 block">Account: ${item.account_number}</span>
                            <span class="text-[10px] text-pink-600 font-semibold block">TrxID: ${item.trx_id || 'N/A'}</span>
                            <span class="text-[9px] text-gray-400">${item.date || 'N/A'}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-bold ${item.type === 'deposit' ? 'text-rose-600' : 'text-emerald-600'} block">৳${item.amount}</span>
                            <span class="text-[9px] bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">${item.status}</span>
                        </div>
                    </div>
                `).join('') : `<p class="text-xs text-gray-500 text-center py-4">No deposit/withdraw history.</p>`;
            }
        } catch (err) {
            console.error("History load error:", err.message);
        }
    }
}

// ================= MODAL TRIGGER CONTROLLERS =================
function openAdminAddMoneyModal() {
    document.getElementById('admin-add-money-modal').classList.remove('hidden');
    fetchPendingAddMoneyRequests();
}
function closeAdminAddMoneyModal() {
    document.getElementById('admin-add-money-modal').classList.add('hidden');
}

function openAdminKYCModal() {
    document.getElementById('admin-kyc-modal').classList.remove('hidden');
    fetchPendingKYCRequests();
}
function closeAdminKYCModal() {
    document.getElementById('admin-kyc-modal').classList.add('hidden');
}

function openAdminUserManageModal() {
    document.getElementById('admin-user-manage-modal').classList.remove('hidden');
    fetchAllUsersManagement();
}
function closeAdminUserManageModal() {
    document.getElementById('admin-user-manage-modal').classList.add('hidden');
}

function closeUserHistoryModal() {
    document.getElementById('user-history-modal').classList.add('hidden');
}

function switchHistoryTab(tabName) {
    const btnAddMoney = document.getElementById('btn-tab-addmoney');
    const btnDepWith = document.getElementById('btn-tab-depwith');
    const contentAddMoney = document.getElementById('content-tab-addmoney');
    const contentDepWith = document.getElementById('content-tab-depwith');

    if (tabName === 'addmoney') {
        btnAddMoney.className = "flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-pink-600 text-white transition shadow-sm cursor-pointer";
        btnDepWith.className = "flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-white text-gray-700 hover:bg-pink-100 transition border border-gray-200 cursor-pointer";
        contentAddMoney.classList.remove('hidden');
        contentDepWith.classList.add('hidden');
    } else {
        btnDepWith.className = "flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-pink-600 text-white transition shadow-sm cursor-pointer";
        btnAddMoney.className = "flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-white text-gray-700 hover:bg-pink-100 transition border border-gray-200 cursor-pointer";
        contentDepWith.classList.remove('hidden');
        contentAddMoney.classList.add('hidden');
    }
}

function openDepositModal() { document.getElementById('deposit-modal').classList.remove('hidden'); }
function closeDepositModal() { document.getElementById('deposit-modal').classList.add('hidden'); }
function openWithdrawModal() { document.getElementById('withdraw-modal').classList.remove('hidden'); }
function closeWithdrawModal() { document.getElementById('withdraw-modal').classList.add('hidden'); }

// Background Real-time Polling Sync (Stats only)
setInterval(() => {
    fetchAdminDashboardStats();
}, 5000);
