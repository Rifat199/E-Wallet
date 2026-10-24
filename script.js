// ==========================================
// VIP WALLET - MASTER SCRIPT (100% SECURE & CLEANED - PIPELINE ENABLED)
// ==========================================

const SUPABASE_URL = 'https://tzgipesjqsrqtwxbwkye.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AYSEhxP9kZF03QOmQrSDrg_njl68RNf';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    isLoggedIn: false,
    kycApproved: false,
    kycStatus: 'none',
    balance: 0.00,
    totalEarnings: 0.00,
    systemOnline: false,
    user: {
        name: "",
        email: "",
        phone: ""
    },
    incomingRequests: [],
    transactions: [],
    depositHistory: [],
    bankHistory: []
};

const authSection = document.getElementById('auth-section-1');
const dashboardSection = document.getElementById('dashboard-section-23');
const loginForm = document.getElementById('login-form-4');
const registerForm = document.getElementById('register-form-11');
const loginTabBtn = document.getElementById('login-tab-btn-2');
const registerTabBtn = document.getElementById('register-tab-btn-3');

const dateLabel = document.getElementById('current-date-label');
if (dateLabel) dateLabel.textContent = `(${new Date().toLocaleDateString()})`;

// ================= AUTH & TABS =================
function switchAuthTab(tab) {
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
    }
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-menu-drawer');
    if (drawer) {
        drawer.classList.toggle('open');
    }
}

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    if (input) input.type = input.type === "password" ? "text" : "password";
}

// ================= SYSTEM ONLINE / OFFLINE TOGGLE & BALANCE AUTO-CHECK =================
function handleSystemToggle(checkbox) {
    const statusDot = document.getElementById('system-status-dot');
    const statusLabel = document.getElementById('system-status-label');

    if (state.kycStatus !== 'approved' && !state.kycApproved) {
        checkbox.checked = false;
        state.systemOnline = false;
        showToast("Error: KYC must be verified by admin before turning on the system!", "error");
        return;
    }

    if (state.balance <= 2000) {
        checkbox.checked = false;
        state.systemOnline = false;
        showToast("Error: Wallet balance must be greater than ৳2,000 to turn on the system!", "error");
        return;
    }

    state.systemOnline = checkbox.checked;
    if (state.systemOnline) {
        if (statusDot) statusDot.style.backgroundColor = "#10b981";
        if (statusLabel) statusLabel.textContent = "System Online";
        showToast("System is now Online", "success");
    } else {
        if (statusDot) statusDot.style.backgroundColor = "#f43f5e";
        if (statusLabel) statusLabel.textContent = "System Offline";
        showToast("System is now Offline", "info");
    }
}

function checkSystemBalanceLimit() {
    if (state.systemOnline && state.balance <= 2000) {
        state.systemOnline = false;
        const systemCheckbox = document.getElementById('system-status-toggle');
        if (systemCheckbox) systemCheckbox.checked = false;
        
        const statusDot = document.getElementById('system-status-dot');
        const statusLabel = document.getElementById('system-status-label');
        if (statusDot) statusDot.style.backgroundColor = "#f43f5e";
        if (statusLabel) statusLabel.textContent = "System Offline";
        
        showToast("Warning: System automatically turned offline because wallet balance dropped to or below ৳2,000!", "error");
    }
}

// ================= TRIGGER OTP WITH 5s DATABASE CHECK =================
async function triggerOTP(formType) {
    const emailInput = formType === 'login' ? document.getElementById('login-id-5') : document.getElementById('reg-email-13');
    const phoneInput = formType === 'register' ? document.getElementById('reg-phone-14') : null;
    const passwordInput = formType === 'login' ? document.getElementById('login-password-6') : document.getElementById('reg-password-15');
    const nameInput = formType === 'register' ? document.getElementById('reg-name-12') : null;
    const confirmPasswordInput = formType === 'register' ? document.getElementById('reg-confirm-password-16') : null;
    
    const btnId = formType === 'login' ? 'login-otp-btn-6' : 'reg-otp-btn-21';
    const btn = document.getElementById(btnId);

    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (formType === 'register') {
        if (!name || !email || !phone || !password || !confirmPassword) {
            showToast("Error: Please fill in all registration fields first!", "error");
            return;
        }
        if (password !== confirmPassword) {
            showToast("Error: Passwords do not match!", "error");
            return;
        }
    }

    if (formType === 'login') {
        if (!email) {
            showToast("Please enter your email address first!", "error");
            return;
        }
        if (!password) {
            showToast("Please enter your password first!", "error");
            return;
        }
    }

    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Checking...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (formType === 'register') {
            const { data: existingUser, error: checkError } = await supabaseClient
                .from('users')
                .select('*')
                .or(`email.eq.${email},phone.eq.${phone}`)
                .maybeSingle();

            if (existingUser) {
                throw new Error("This email or phone number is already registered!");
            }
        } else {
            const { data: existingUser, error: checkError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();

            if (checkError || !existingUser) {
                throw new Error("Incorrect email or password! Please check your credentials.");
            }
        }

        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: { shouldCreateUser: formType === 'register' }
        });

        if (error) throw error;
        showToast("Verification OTP sent to your email successfully!", "success");

        let countdown = 90;
        const timer = setInterval(() => {
            btn.innerHTML = `<span>Resend in ${countdown}s</span>`;
            countdown--;
            if (countdown < 0) {
                clearInterval(timer);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 1000);
    } catch (err) {
        showToast(err.message || "Failed to process OTP request", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function updateFileLabel(input, labelId) {
    if (input.files && input.files[0]) {
        const label = document.getElementById(labelId);
        if (label) label.innerHTML = `<span style="color: #10b981;">✓ ${input.files[0].name}</span>`;
    }
}

// ================= LOGIN SUBMIT =================
async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-id-5').value.trim();
    const password = document.getElementById('login-password-6').value;
    const otpToken = document.getElementById('login-otp-7').value.trim();
    const submitBtn = document.getElementById('login-submit-btn-10');
    
    if (!email || !password || !otpToken) {
        showToast("Validation Error: Please fill in all fields.", "error");
        return;
    }

    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Verifying Login...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const authResult = await supabaseClient.auth.verifyOtp({
            email: email,
            token: otpToken,
            type: 'email'
        });

        if (authResult.error) {
            throw new Error("Invalid or expired OTP verification code.");
        }

        const { data: userData, error: profileError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .maybeSingle();

        if (profileError || !userData) {
            throw new Error("Incorrect email or password matching in user records.");
        }

        const { data: kycData } = await supabaseClient
            .from('kyc')
            .select('*')
            .eq('user_email', email)
            .maybeSingle();

        state.isLoggedIn = true;
        state.user.email = userData.email;
        state.user.name = userData.full_name || "User";
        state.user.phone = userData.phone || "";
        state.balance = userData.balance || 0.00;
        
        state.kycStatus = kycData ? kycData.kyc_status : (userData.kyc || 'none');
        state.kycApproved = (state.kycStatus === 'approved');

        state.systemOnline = false;
        const systemCheckbox = document.getElementById('system-status-toggle');
        if (systemCheckbox) systemCheckbox.checked = false;
        const statusDot = document.getElementById('system-status-dot');
        const statusLabel = document.getElementById('system-status-label');
        if (statusDot) statusDot.style.backgroundColor = "#f43f5e";
        if (statusLabel) statusLabel.textContent = "System Offline";

        renderUserData();
        fetchIncomingRequestsFromSupabase();
        renderTodayTransactions();
        
        startLivePipeline();

        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        showToast("Successfully logged into dashboard!", "success");
    } catch (err) {
        showToast(err.message || "Login failed or credentials mismatch.", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// ================= REGISTER SUBMIT =================
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name-12').value.trim();
    const email = document.getElementById('reg-email-13').value.trim();
    const phone = document.getElementById('reg-phone-14').value.trim();
    const password = document.getElementById('reg-password-15').value;
    const confirmPassword = document.getElementById('reg-confirm-password-16').value;
    const otpToken = document.getElementById('reg-otp-20').value.trim();
    const submitBtn = document.getElementById('reg-submit-btn-22');

    if (!name || !email || !phone || !password || !confirmPassword || !otpToken) {
        showToast("Validation Error: Please fill in all registration fields.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
    }

    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving User Data...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const verifyResult = await supabaseClient.auth.verifyOtp({
            email: email,
            token: otpToken,
            type: 'email'
        });

        if (verifyResult.error) {
            throw new Error("Invalid or expired OTP verification code.");
        }

        let userId = verifyResult.data?.user?.id;

        if (!userId) {
            const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name, phone: phone } }
            });
            if (signUpError) throw signUpError;
            userId = signUpData?.user?.id;
        }

        const { error: userInsertError } = await supabaseClient.from('users').upsert([
            { id: userId, full_name: name, email: email, phone: phone, password: password, balance: 0.00, income: 0.00, kyc: 'none' }
        ], { onConflict: 'email' });

        if (userInsertError) throw userInsertError;

        const { error: kycInsertError } = await supabaseClient.from('kyc').upsert([
            { user_email: email, user_name: name, kyc_status: 'none' }
        ], { onConflict: 'user_email' });

        if (kycInsertError) throw kycInsertError;

        state.isLoggedIn = true;
        state.user = { name, email, phone };
        state.kycStatus = 'none';
        state.kycApproved = false;
        state.systemOnline = false;

        renderUserData();
        
        startLivePipeline();

        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        showToast("Registration completed successfully!", "success");
    } catch (err) {
        showToast(err.message || "Registration failed", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// ================= FORGET PASSWORD =================
let forgotTargetEmail = "";

function openForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('forgot-step-1-form').classList.remove('hidden');
        document.getElementById('forgot-step-2-form').classList.add('hidden');
        document.getElementById('forgot-email').value = '';
        document.getElementById('forgot-otp').value = '';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) modal.classList.add('hidden');
}

async function triggerForgotPasswordOTP() {
    const emailInput = document.getElementById('forgot-email');
    const btn = document.getElementById('forgot-send-code-btn');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        showToast("Please enter your email address first!", "error");
        return;
    }

    if (btn) {
        btn.disabled = true;
        let countdown = 90;
        const originalText = btn.innerHTML;
        const timer = setInterval(() => {
            btn.innerHTML = `<span>Resend in ${countdown}s</span>`;
            countdown--;
            if (countdown < 0) {
                clearInterval(timer);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 1000);
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 4500));
        const { data: userCheck, error: uError } = await supabaseClient.from('users').select('*').eq('email', email).maybeSingle();

        if (uError || !userCheck) {
            showToast("Account not found with this email!", "error");
            return;
        }

        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: { shouldCreateUser: false }
        });

        if (error) throw error;
        forgotTargetEmail = email;
        showToast("Verification code sent to your email!", "success");
    } catch (err) {
        showToast(err.message || "Failed to send reset code", "error");
    }
}

async function handleForgotVerifyOTP(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const otpToken = document.getElementById('forgot-otp').value.trim();
    const nextBtn = document.getElementById('forgot-next-btn');

    if (!email || !otpToken) {
        showToast("Please enter both email and OTP code.", "error");
        return;
    }

    const originalText = nextBtn ? nextBtn.innerHTML : '';
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.innerHTML = `<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 4500));
        const verifyResult = await supabaseClient.auth.verifyOtp({
            email: email,
            token: otpToken,
            type: 'email'
        });

        if (verifyResult.error) throw new Error("Invalid or expired OTP code.");

        forgotTargetEmail = email;
        showToast("OTP verified successfully! Please enter new password.", "success");
        
        document.getElementById('forgot-step-1-form').classList.add('hidden');
        document.getElementById('forgot-step-2-form').classList.remove('hidden');
    } catch (err) {
        showToast(err.message || "OTP verification failed", "error");
    } finally {
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.innerHTML = originalText;
        }
    }
}

async function handleForgotNewPasswordSubmit(e) {
    e.preventDefault();
    const newPwd = document.getElementById('forgot-new-pwd').value;
    const confirmPwd = document.getElementById('forgot-confirm-pwd').value;
    const updateBtn = document.getElementById('forgot-update-btn');

    if (!newPwd || !confirmPwd) {
        showToast("Please fill in all fields.", "error");
        return;
    }

    if (newPwd !== confirmPwd) {
        showToast("New passwords do not match!", "error");
        return;
    }

    if (newPwd.length < 6) {
        showToast("Password must be at least 6 characters long!", "error");
        return;
    }

    const originalText = updateBtn ? updateBtn.innerHTML : '';
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = `<span>Updating...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 4500));

        const { error: authError } = await supabaseClient.auth.updateUser({ password: newPwd });
        if (authError) throw authError;

        if (forgotTargetEmail) {
            await supabaseClient.from('users')
                .update({ password: newPwd })
                .eq('email', forgotTargetEmail);
        }

        closeForgotPasswordModal();
        showToast("Password successfully reset! You can now log in.", "success");
    } catch (err) {
        showToast(err.message || "Failed to update password", "error");
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }
    }
}

// ================= RENDER & UTILS =================
function renderUserData() {
    const upperName = (state.user.name || "USER").toUpperCase();
    const drawerName = document.getElementById('drawer-name');
    const drawerPhone = document.getElementById('drawer-phone');
    const drawerEmail = document.getElementById('drawer-email');
    const drawerAvatar = document.getElementById('drawer-avatar');
    const balEl = document.getElementById('balance-amount-32');
    const commEl = document.getElementById('commission-earnings');

    if (drawerName) drawerName.textContent = upperName;
    if (drawerPhone) drawerPhone.textContent = state.user.phone || "N/A";
    if (drawerEmail) drawerEmail.textContent = state.user.email || "N/A";
    if (drawerAvatar) drawerAvatar.textContent = upperName.charAt(0);
    if (balEl) balEl.textContent = `৳${state.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    if (commEl) commEl.textContent = `৳${state.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

    checkSystemBalanceLimit();
    updateRequestCounters();
    updateKYCUI();
}

function updateRequestCounters() {
    const pendingDeposits = state.incomingRequests.filter(r => (r.type === 'deposit' || r.type === 'Deposit') && r.status === 'Pending').length;
    const pendingWithdraws = state.incomingRequests.filter(r => (r.type === 'withdraw' || r.type === 'Withdraw') && r.status === 'Pending').length;

    const depBadge = document.getElementById('deposit-counter-badge');
    const witBadge = document.getElementById('withdraw-counter-badge');

    if (depBadge) {
        depBadge.textContent = pendingDeposits;
        if (pendingDeposits === 0) depBadge.classList.add('hidden');
        else depBadge.classList.remove('hidden');
    }

    if (witBadge) {
        witBadge.textContent = pendingWithdraws;
        if (pendingWithdraws === 0) witBadge.classList.add('hidden');
        else witBadge.classList.remove('hidden');
    }
}

function openRequestModal(type) {
    const modal = document.getElementById('request-modal');
    const title = document.getElementById('request-modal-title');
    const subtitle = document.getElementById('request-modal-subtitle');
    
    if (title) title.textContent = type === 'deposit' ? 'Incoming Deposit Requests' : 'Incoming Withdrawal Requests';
    if (subtitle) subtitle.textContent = type === 'deposit' ? 'Verify payment and approve deposit request' : 'Verify customer cashout and approve withdrawal';
    
    renderRequestsList(type);
    if (modal) modal.classList.remove('hidden');
}

function closeRequestModal() {
    const modal = document.getElementById('request-modal');
    if (modal) modal.classList.add('hidden');
}

function renderRequestsList(type) {
    const container = document.getElementById('request-list-container');
    if (!container) return;
    
    const filteredRequests = state.incomingRequests.filter(r => {
        const rType = (r.type || '').toLowerCase();
        return rType === type.toLowerCase() && r.status === 'Pending';
    });

    if (filteredRequests.length === 0) {
        container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">No pending ${type} requests found.</p>`;
        return;
    }

    container.innerHTML = '';
    filteredRequests.forEach(req => {
        const div = document.createElement('div');
        div.style.cssText = "background: #0f172a; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; border: 1px solid #334155;";
        
        const amountDisplay = req.bdtAmount || req.bdt_amount || req.amount || 0;
        const usdtDisplay = req.usdtAmount || req.usdt_amount ? `USDT: $${req.usdtAmount || req.usdt_amount}` : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #38bdf8;">${req.userName || req.user_name || req.user_email || 'User'}</strong>
                <span class="badge badge-amber">${req.status}</span>
            </div>
            <div style="color: #cbd5e1;">
                Amount: ৳${amountDisplay} ${usdtDisplay ? `(${usdtDisplay})` : ''}
                <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 0.15rem;">TrxID: ${req.trxId || req.trx_id || 'N/A'} | Date: ${req.date || 'N/A'}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                <button onclick="processAgentDeposit('${req.id}', 'approve')" class="btn-emerald-2" style="flex:1; justify-content: center; border-radius: 0.35rem; padding: 0.35rem;">Approve</button>
                <button onclick="processAgentDeposit('${req.id}', 'reject')" style="flex:1; background-color: #e11d48; color: white; border-radius: 0.35rem; padding: 0.35rem; font-size: 0.75rem;">Reject</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ================= ADMIN KYC PANEL & MODAL =================
function openKYCAdminModal() {
    let modal = document.getElementById('kyc-admin-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'kyc-admin-modal';
        modal.className = 'modal-backdrop-45 flex items-center justify-center hidden';
        modal.style.padding = '1rem';
        modal.innerHTML = `
            <div class="card-1 w-full max-w-lg relative" style="background-color: #1e293b; border: 1px solid #334155; max-height: 85vh; display: flex; flex-direction: column;">
                <button onclick="closeKYCAdminModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer;">✕</button>
                <h3 style="font-size: 1.125rem; font-weight: bold; color: #38bdf8; margin-bottom: 0.25rem;">🆔 Pending KYC Verification Requests</h3>
                <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.75rem;">Verify user KYC details and photos for approval</p>
                
                <div id="kyc-admin-list-container" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem; background: #0f172a; border-radius: 0.5rem; min-height: 250px;">
                    <p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: auto;">Loading...</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    renderKYCAdminList();
}

function closeKYCAdminModal() {
    const modal = document.getElementById('kyc-admin-modal');
    if (modal) modal.classList.add('hidden');
}

async function renderKYCAdminList() {
    const container = document.getElementById('kyc-admin-list-container');
    if (!container) return;

    if (!container.hasChildNodes() || container.innerText.includes('Loading...')) {
        container.innerHTML = `<p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: auto;">Loading...</p>`;
    }

    try {
        const { data, error } = await supabaseClient
            .from('kyc')
            .select('*')
            .eq('kyc_status', 'pending');

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = '';
            data.forEach(item => {
                const div = document.createElement('div');
                div.style.cssText = "background: #1e293b; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 0.5rem;";
                
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #38bdf8;">${item.user_name || item.user_email || 'User'}</strong>
                        <span class="badge badge-amber">Pending</span>
                    </div>
                    <div style="font-size: 0.7rem; color: #cbd5e1;">
                        <div>Email: ${item.user_email}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; font-size: 0.7rem;">
                        <a href="${item.nid_front || '#'}" target="_blank" class="btn-sky-2" style="flex:1; text-align:center; padding: 0.3rem; border-radius: 0.3rem; background: #0284c7; color: white; text-decoration: none;">Front Side (Open)</a>
                        <a href="${item.nid_back || '#'}" target="_blank" class="btn-sky-2" style="flex:1; text-align:center; padding: 0.3rem; border-radius: 0.3rem; background: #0284c7; color: white; text-decoration: none;">Back Side (Open)</a>
                        <a href="${item.nid_selfie || '#'}" target="_blank" class="btn-sky-2" style="flex:1; text-align:center; padding: 0.3rem; border-radius: 0.3rem; background: #0284c7; color: white; text-decoration: none;">Selfie (Open)</a>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                        <button onclick="approveKYCRequest('${item.user_email}')" class="btn-emerald-2" style="flex:1; padding: 0.35rem; border-radius: 0.3rem; background: #10b981; color: white; border: none; cursor: pointer; font-weight: bold;">Approve</button>
                        <button onclick="rejectKYCRequest('${item.user_email}')" style="flex:1; padding: 0.35rem; border-radius: 0.3rem; background: #e11d48; color: white; border: none; cursor: pointer; font-weight: bold;">Reject</button>
                    </div>
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; margin: auto;">No pending KYC requests found.</p>`;
        }
    } catch (err) {
        console.error("KYC admin fetch error:", err.message);
    }
}

async function approveKYCRequest(email) {
    try {
        await supabaseClient
            .from('kyc')
            .update({ kyc_status: 'approved' })
            .eq('user_email', email);

        await supabaseClient
            .from('users')
            .update({ kyc: 'approved' })
            .eq('email', email);

        showToast("KYC Approved successfully (Lifetime verified)!", "success");
        renderKYCAdminList();
    } catch (err) {
        showToast("Failed to approve KYC: " + err.message, "error");
    }
}

async function rejectKYCRequest(email) {
    try {
        await supabaseClient
            .from('kyc')
            .update({ kyc_status: 'rejected' })
            .eq('user_email', email);

        await supabaseClient
            .from('users')
            .update({ kyc: 'rejected' })
            .eq('email', email);

        showToast("KYC Rejected.", "info");
        renderKYCAdminList();
    } catch (err) {
        showToast("Failed to reject KYC: " + err.message, "error");
    }
}

function toggleKYCStatus() {
    openKYCAdminModal();
}

function updateKYCUI() {
    const noticeBanner = document.getElementById('kyc-notice-banner-30');
    const drawerBadge = document.getElementById('drawer-kyc-badge');
    const kycUploadBtn = document.querySelector('button[onclick="openKYCUpdateModal()"]');

    if (state.kycStatus === 'approved') {
        if (noticeBanner) noticeBanner.classList.add('hidden');
        if (drawerBadge) {
            drawerBadge.textContent = "Verified";
            drawerBadge.className = "badge badge-emerald";
        }
    } else if (state.kycStatus === 'pending') {
        if (noticeBanner) noticeBanner.classList.remove('hidden');

        if (kycUploadBtn) {
            kycUploadBtn.disabled = true;
            kycUploadBtn.style.opacity = "0.6";
            kycUploadBtn.style.cursor = "not-allowed";
            kycUploadBtn.innerHTML = `<span>⏳ KYC Pending</span>`;
        }

        if (drawerBadge) {
            drawerBadge.textContent = "Pending";
            drawerBadge.className = "badge badge-amber";
        }
    } else if (state.kycStatus === 'rejected') {
        if (noticeBanner) noticeBanner.classList.remove('hidden');

        if (kycUploadBtn) {
            kycUploadBtn.disabled = false;
            kycUploadBtn.style.opacity = "1";
            kycUploadBtn.style.cursor = "pointer";
            kycUploadBtn.innerHTML = `<span>KYC Upload</span>`;
        }

        if (drawerBadge) {
            drawerBadge.textContent = "Rejected";
            drawerBadge.className = "badge badge-error";
        }
    } else {
        if (noticeBanner) noticeBanner.classList.remove('hidden');
        if (kycUploadBtn) {
            kycUploadBtn.disabled = false;
            kycUploadBtn.style.opacity = "1";
            kycUploadBtn.style.cursor = "pointer";
            kycUploadBtn.innerHTML = `<span>KYC আপলোড</span>`;
        }
        if (drawerBadge) {
            drawerBadge.textContent = "Not Verified";
            drawerBadge.className = "badge badge-amber";
        }
    }
}

function openKYCUpdateModal() { 
    if (state.kycStatus === 'approved') {
        showToast("Your KYC has already been lifetime verified (Approved) by the admin!", "info");
        return;
    }
    const modal = document.getElementById('kyc-update-modal');
    if (modal) modal.classList.remove('hidden'); 
}

function closeKYCUpdateModal() { 
    const modal = document.getElementById('kyc-update-modal');
    if (modal) modal.classList.add('hidden'); 
}

function handleFileChange(input, boxId, textId, imgId) {
    const file = input.files[0];
    const box = document.getElementById(boxId);
    const textEl = document.getElementById(textId);
    const imgEl = document.getElementById(imgId);

    if (file && box && textEl && imgEl) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgEl.src = e.target.result;
            imgEl.style.display = 'inline-block';
            box.classList.add('uploaded');
            textEl.innerHTML = `<span style="color: #10b981;">✓ ${file.name}</span>`;
        }
        reader.readAsDataURL(file);
    }
}

// ================= IMGBB UPLOAD FUNCTION =================
async function uploadToImgBB(file) {
    const apiKey = 'dfdfea7a4e4ba556e75b33eaa10b73cd';
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    if (result.success) {
        return result.data.url;
    } else {
        throw new Error(result.error?.message || 'Image upload failed');
    }
}

// ================= KYC FORM SUBMIT (IMGBB INTEGRATED) =================
async function handleKYCUpdateSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    
    const fullName = document.getElementById('fullName')?.value.trim();
    const dob = document.getElementById('dob')?.value;
    const gender = document.getElementById('gender')?.value;
    const nationality = document.getElementById('nationality')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const telegram = document.getElementById('telegram')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const declarationAccepted = document.getElementById('declaration')?.checked;

    const frontFile = document.getElementById('idFront')?.files[0];
    const backFile = document.getElementById('idBack')?.files[0];
    const selfieFile = document.getElementById('idSelfie')?.files[0];

    if (!frontFile || !backFile || !selfieFile) {
        showToast('Please upload all 3 mandatory pictures: NID Card Front, Back, and Selfie.', "error");
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Uploading to ImgBB...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        const [frontUrl, backUrl, selfieUrl] = await Promise.all([
            uploadToImgBB(frontFile),
            uploadToImgBB(backFile),
            uploadToImgBB(selfieFile)
        ]);

        const { error } = await supabaseClient
            .from('kyc')
            .upsert([
                {
                    user_email: state.user.email,
                    user_name: state.user.name,
                    full_name: fullName,
                    dob: dob,
                    gender: gender,
                    nationality: nationality,
                    phone: phone,
                    telegram: telegram,
                    address: address,
                    declaration_accepted: declarationAccepted,
                    kyc_status: 'pending',
                    nid_front: frontUrl,
                    nid_back: backUrl,
                    nid_selfie: selfieUrl
                }
            ], { onConflict: 'user_email' });

        if (error) throw error;

        await supabaseClient
            .from('users')
            .update({ kyc: 'pending' })
            .eq('email', state.user.email);

        state.kycApproved = false;
        state.kycStatus = 'pending';
        updateKYCUI();
        closeKYCUpdateModal();
        
        showToast("KYC submitted successfully! Waiting for admin approval.", "success");
        document.getElementById('kycForm')?.reset();
        
        ['boxFront', 'boxBack', 'boxSelfie'].forEach(id => document.getElementById(id)?.classList.remove('uploaded'));
        ['imgFront', 'imgBack', 'imgSelfie'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
    } catch (err) {
        showToast("Failed to submit KYC: " + err.message, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// ================= MODALS: ADD MONEY & BANK =================
function openAddMoneyModal() { 
    if (state.kycStatus !== 'approved') {
        showToast("Your KYC is not verified yet! You can add money after admin approval.", "error");
        return;
    }
    const modal = document.getElementById('add-money-modal');
    if (modal) modal.classList.remove('hidden'); 
}

function closeAddMoneyModal() { 
    const modal = document.getElementById('add-money-modal');
    if (modal) modal.classList.add('hidden'); 
}

function copyUSDTAddress() {
    const addressInput = document.getElementById('usdt-wallet-address');
    if (addressInput) {
        navigator.clipboard.writeText(addressInput.value);
        showToast("USDT Wallet Address copied to clipboard!", "success");
    }
}

function calculateBDT(usdtVal) {
    const usdt = parseFloat(usdtVal);
    const bdtField = document.getElementById('add-money-bdt');
    if (!bdtField) return;
    if (isNaN(usdt) || usdt <= 0) {
        bdtField.value = "৳0";
        return;
    }
    const bdt = usdt * 130;
    bdtField.value = `৳${bdt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ================= ADD MONEY SUBMIT (IMGBB INTEGRATED) =================
async function handleAddMoneySubmit(e) {
    e.preventDefault();
    const trxId = document.getElementById('add-money-trxid')?.value.trim();
    const usdtVal = document.getElementById('add-money-usdt')?.value.trim();
    const screenshot = document.getElementById('add-money-screenshot')?.files[0];
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    if (!trxId || !usdtVal || !screenshot) {
        showToast("Error: Transaction ID, USDT amount, and payment screenshot are all required fields!", "error");
        return;
    }

    const usdtAmount = parseFloat(usdtVal);
    if (isNaN(usdtAmount) || usdtAmount <= 0) {
        showToast("Please enter a valid USDT amount!", "error");
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Uploading Screenshot...</span> <i class="fa-solid fa-spinner fa-spin" style="margin-left: 8px;"></i>`;
    }

    try {
        const screenshotUrl = await uploadToImgBB(screenshot);

        const bdtAmount = usdtAmount * 130;
        const currentDate = new Date().toLocaleDateString();

        const depositRequest = {
            user_email: state.user.email || 'user@vipwallet.com',
            user_name: state.user.name || 'USER',
            payment_method: 'Binance',
            trx_id: trxId,
            usdt_amount: usdtAmount,
            bdt_amount: bdtAmount,
            screenshot_url: screenshotUrl,
            status: 'Pending',
            date: currentDate
        };

        const { error: reqError } = await supabaseClient
            .from('add_money_requests')
            .insert([depositRequest]);

        if (reqError) throw reqError;

        await supabaseClient
            .from('add_money_history')
            .insert([depositRequest]);

        closeAddMoneyModal();
        renderAddMoneyHistory();
        showToast("Your add money request has been successfully submitted and is currently pending for admin approval.", "success");

        const trxField = document.getElementById('add-money-trxid');
        const usdtField = document.getElementById('add-money-usdt');
        const bdtField = document.getElementById('add-money-bdt');
        const fileField = document.getElementById('add-money-screenshot');
        const labelField = document.getElementById('label-add-money-screenshot');

        if (trxField) trxField.value = '';
        if (usdtField) usdtField.value = '';
        if (bdtField) bdtField.value = '৳0';
        if (fileField) fileField.value = '';
        if (labelField) labelField.innerHTML = '📷 Upload Payment Screenshot';
    } catch (err) {
        showToast("Failed to submit add money request: " + err.message, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

function openAddBankModal() { 
    if (state.kycStatus !== 'approved') {
        showToast("Your KYC is not verified yet! You can add bank accounts after admin approval.", "error");
        return;
    }
    const modal = document.getElementById('add-bank-modal');
    if (modal) modal.classList.remove('hidden'); 
}

function closeAddBankModal() { 
    const modal = document.getElementById('add-bank-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function handleAddBankSubmit(e) {
    e.preventDefault();
    const provider = document.getElementById('bank-provider')?.value.trim();
    const accType = document.getElementById('bank-acc-type')?.value.trim();
    const bankNumber = document.getElementById('bank-number')?.value.trim();

    if (!provider || !accType || !bankNumber) {
        showToast("Error: All fields are required to save your account!", "error");
        return;
    }

    if (bankNumber.length !== 11 || isNaN(bankNumber)) {
        showToast("Error: Please enter a valid 11-digit account/phone number!", "error");
        return;
    }

    const currentDate = new Date().toLocaleDateString();
    const userEmail = state.user.email || 'user@vipwallet.com';
    const userName = state.user.name || 'USER';

    try {
        await supabaseClient
            .from('bank_accounts')
            .update({ status: 'Offline' })
            .eq('user_email', userEmail);

        await supabaseClient
            .from('bank_accounts_history')
            .update({ status: 'Offline' })
            .eq('user_email', userEmail);

        const bankAccountData = {
            user_email: userEmail,
            user_name: userName,
            provider: provider,
            account_type: accType,
            account_number: bankNumber,
            status: 'Online',
            date: currentDate
        };

        const bankHistoryData = {
            user_email: userEmail,
            provider: provider,
            account_type: accType,
            account_number: bankNumber,
            status: 'Online',
            date: currentDate
        };

        const { data, error } = await supabaseClient
            .from('bank_accounts')
            .insert([bankAccountData])
            .select();

        if (error) throw error;

        await supabaseClient
            .from('bank_accounts_history')
            .insert([bankHistoryData]);

        if (data && data[0]) {
            if (!state.bankHistory) state.bankHistory = [];
            state.bankHistory.unshift(data[0]);
        }

        closeAddBankModal();
        renderAddBankHistory();
        showToast("Bank/Mobile account saved and set to Online successfully!", "success");

        const numField = document.getElementById('bank-number');
        if (numField) numField.value = '';
    } catch (err) {
        showToast("Failed to save account: " + err.message, "error");
    }
}

// ================= HISTORY & TRANSACTIONS =================
function openHistoryModal() { 
    const modal = document.getElementById('history-modal');
    if (modal) {
        modal.classList.remove('hidden');
        filterHistory('today');
    }
}

function closeHistoryModal() { 
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function openAddMoneyHistoryModal() { 
    const modal = document.getElementById('add-money-history-modal');
    if (modal) {
        modal.classList.remove('hidden');
        await renderAddMoneyHistory();
    }
}

function closeAddMoneyHistoryModal() { 
    const modal = document.getElementById('add-money-history-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function renderAddMoneyHistory() {
    const container = document.getElementById('add-money-history-container');
    const totalLabel = document.getElementById('total-add-money-label');
    if (!container) return;

    if (!container.hasChildNodes() || container.innerText.includes('Loading...')) {
        container.innerHTML = `<p style="font-size: 0.75rem; color: #64748b; text-align: center; padding: 1rem;">Loading...</p>`;
    }

    try {
        const { data, error } = await supabaseClient
            .from('add_money_history')
            .select('*')
            .eq('user_email', state.user.email)
            .order('id', { ascending: false });

        if (error) throw error;

        let totalLoaded = 0;
        if (data && data.length > 0) {
            container.innerHTML = '';
            data.forEach(tx => {
                const amount = tx.bdt_amount || tx.bdtAmount || tx.amount || 0;
                if (tx.status === 'Approved') {
                    totalLoaded += amount;
                }

                const div = document.createElement('div');
                div.style.cssText = "background: #0f172a; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border: 1px solid #334155;";
                
                let badgeClass = 'badge-amber';
                if (tx.status === 'Approved') badgeClass = 'badge-emerald';
                if (tx.status === 'Rejected') badgeClass = 'badge-error';

                div.innerHTML = `
                    <div>
                        <strong style="color: #38bdf8;">Add Money: ৳${amount}</strong>
                        <div style="color: #cbd5e1; font-size: 0.65rem;">TrxID: ${tx.trx_id || tx.trxId || 'N/A'} | Date: ${tx.date || 'N/A'}</div>
                    </div>
                    <span class="badge ${badgeClass}">${tx.status}</span>
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">No add money history found.</p>`;
        }

        if (totalLabel) totalLabel.textContent = `Total Loaded (Approved): ৳${totalLoaded}`;
    } catch (err) {
        console.error("Add money history fetch error:", err.message);
    }
}

async function openAddBankHistoryModal() { 
    const modal = document.getElementById('add-bank-history-modal');
    if (modal) {
        modal.classList.remove('hidden');
        await renderAddBankHistory();
    }
}

function closeAddBankHistoryModal() { 
    const modal = document.getElementById('add-bank-history-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function renderAddBankHistory() {
    const container = document.getElementById('add-bank-history-container');
    const totalLabel = document.getElementById('total-bank-label');
    if (!container) return;

    if (!container.hasChildNodes() || container.innerText.includes('Loading...')) {
        container.innerHTML = `<p style="font-size: 0.75rem; color: #64748b; text-align: center; padding: 1rem;">Loading...</p>`;
    }

    try {
        const { data, error } = await supabaseClient
            .from('bank_accounts_history')
            .select('*')
            .eq('user_email', state.user.email)
            .order('id', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = '';
            
            data.sort((a, b) => {
                if (a.status === 'Online' && b.status !== 'Online') return -1;
                if (a.status !== 'Online' && b.status === 'Online') return 1;
                return 0;
            });

            data.forEach(acc => {
                const isOnline = (acc.status === 'Online');
                const div = document.createElement('div');
                div.style.cssText = `background: #0f172a; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border: 1px solid ${isOnline ? '#10b981' : '#334155'};`;
                
                div.innerHTML = `
                    <div>
                        <strong style="color: #38bdf8;">${acc.provider} (${acc.account_type})</strong>
                        <div style="color: #cbd5e1; font-size: 0.65rem;">Number: ${acc.account_number} | Date: ${acc.date || 'N/A'}</div>
                    </div>
                    <span class="badge ${isOnline ? 'badge-emerald' : 'badge-amber'}">${isOnline ? 'Online' : 'Offline'}</span>
                `;
                container.appendChild(div);
            });
            if (totalLabel) totalLabel.textContent = `Total Accounts Uploaded: ${data.length}`;
        } else {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">No bank accounts found.</p>`;
            if (totalLabel) totalLabel.textContent = `Total Accounts Uploaded: 0`;
        }
    } catch (err) {
        console.error("Bank history fetch error:", err.message);
    }
}

async function filterHistory(period) {
    ['today', 'month', 'year', 'lifetime'].forEach(p => {
        const btn = document.getElementById(`hist-tab-${p}`);
        if (btn) btn.classList.remove('active');
    });
    const targetBtn = document.getElementById(`hist-tab-${period}`);
    if (targetBtn) targetBtn.classList.add('active');

    const container = document.getElementById('history-list-container');
    if (!container) return;

    if (!container.hasChildNodes() || container.innerText.includes('Loading...')) {
        container.innerHTML = `<p style="font-size: 0.75rem; color: #64748b; text-align: center; padding: 1rem;">Loading...</p>`;
    }

    try {
        const { data, error } = await supabaseClient
            .from('deposit_withdraw_history')
            .select('*')
            .eq('user_email', state.user.email)
            .order('id', { ascending: false });

        if (error) throw error;

        const now = new Date();
        const todayStr = now.toLocaleDateString();
        let filtered = data || [];

        if (period === 'today') {
            filtered = filtered.filter(item => item.date === todayStr);
        } else if (period === 'month') {
            const curMonth = now.getMonth();
            const curYear = now.getFullYear();
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at || item.date);
                return itemDate.getMonth() === curMonth && itemDate.getFullYear() === curYear;
            });
        } else if (period === 'year') {
            const curYear = now.getFullYear();
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at || item.date);
                return itemDate.getFullYear() === curYear;
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">No history found for this period.</p>`;
            return;
        }

        container.innerHTML = filtered.map(item => {
            let badgeColor = 'badge-sky';
            if (item.status === 'Approved') badgeColor = 'badge-emerald';
            if (item.status === 'Rejected') badgeColor = 'badge-amber';

            return `
                <div class="flex justify-between items-center" style="background-color: #0f172a; padding: 0.65rem; border-radius: 0.5rem; border: 1px solid #334155; margin-bottom: 0.5rem;">
                    <div>
                        <strong style="color: white; text-transform: capitalize;">${item.type} - ৳${item.amount}</strong>
                        <div style="font-size: 0.62rem; color: #94a3b8;">${item.date || 'N/A'} | Provider: ${item.provider}</div>
                    </div>
                    <span class="badge ${badgeColor}">${item.status}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Filter history error:", err.message);
    }
}

async function fetchIncomingRequestsFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('deposit_withdraw_history')
            .select('*')
            .eq('status', 'Pending');

        if (error) throw error;
        if (data) {
            state.incomingRequests = data;
            updateRequestCounters();
        }
    } catch (err) {
        console.error("Failed to fetch requests from Supabase API:", err.message);
    }
}
setInterval(fetchIncomingRequestsFromSupabase, 10000);

async function renderTodayTransactions() {
    const container = document.getElementById('today-transaction-list');
    if (!container) return;

    const todayStr = new Date().toLocaleDateString();
    const lastSavedDate = localStorage.getItem('vip_wallet_tx_date');
    
    if (lastSavedDate !== todayStr) {
        localStorage.setItem('vip_wallet_tx_date', todayStr);
    }

    try {
        const { data, error } = await supabaseClient
            .from('deposit_withdraw_history')
            .select('*')
            .eq('user_email', state.user.email)
            .eq('date', todayStr)
            .order('id', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">No transactions recorded for today yet.</p>`;
            return;
        }

        container.innerHTML = '';
        data.forEach(tx => {
            const div = document.createElement('div');
            div.style.cssText = "background: #0f172a; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border: 1px solid #334155;";
            
            let badgeColor = 'badge-sky';
            if (tx.status === 'Approved') badgeColor = 'badge-emerald';
            if (tx.status === 'Rejected') badgeColor = 'badge-amber';

            div.innerHTML = `
                <div>
                    <strong style="color: #38bdf8; text-transform: capitalize;">${tx.type} - ৳${tx.amount}</strong>
                    <div style="color: #cbd5e1; font-size: 0.65rem;">TrxID: ${tx.trx_id || 'N/A'}</div>
                </div>
                <span class="badge ${badgeColor}">${tx.status}</span>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Today transactions fetch error:", err.message);
    }
}

// ================= AGENT DEPOSIT / WITHDRAW APPROVE =================
async function processAgentDeposit(requestId, action) {
    if (!state.incomingRequests) state.incomingRequests = [];
    const req = state.incomingRequests.find(r => r.id == requestId);
    
    if (!req) return;

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const amountToCredit = req.amount || req.bdt_amount || 0;

    if (action === 'approve') {
        state.balance += amountToCredit;
        showToast(`Request successfully approved! ৳${amountToCredit} processed.`, "success");
    } else {
        showToast("Request has been rejected.", "info");
    }

    try {
        const { error: err1 } = await supabaseClient
            .from('deposit_withdraw_history')
            .update({ status: newStatus })
            .eq('id', req.id);

        if (err1) throw err1;

        const trxId = req.trx_id || req.trxId;
        if (trxId) {
            await supabaseClient
                .from('add_money_requests')
                .update({ status: newStatus })
                .eq('trx_id', trxId);

            await supabaseClient
                .from('add_money_history')
                .update({ status: newStatus })
                .eq('trx_id', trxId);
        }

    } catch (err) {
        console.error("Supabase update error:", err.message);
    }

    fetchIncomingRequestsFromSupabase();
    renderUserData();
    renderTodayTransactions();
    closeRequestModal();
}

// ================= PASSWORD CHANGE =================
function openChangePasswordModal() { 
    const modal = document.getElementById('password-modal');
    if (modal) modal.classList.remove('hidden'); 
}

function closeChangePasswordModal() { 
    const modal = document.getElementById('password-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function handlePasswordChangeSubmit(e) {
    e.preventDefault();
    const currentPass = document.getElementById('current-password')?.value;
    const newPass = document.getElementById('new-password')?.value;
    const confirmPass = document.getElementById('confirm-new-password')?.value;
    const email = state.user.email;

    if (!currentPass) {
        showToast("Please enter your current password!", "error");
        return;
    }

    if (newPass !== confirmPass) {
        showToast("New passwords do not match!", "error");
        return;
    }

    if (newPass.length < 6) {
        showToast("New password must be at least 6 characters long!", "error");
        return;
    }

    try {
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: currentPass
        });

        if (signInError) throw new Error("Incorrect current password!");

        const { error } = await supabaseClient.auth.updateUser({ password: newPass });
        if (error) throw error;

        await supabaseClient.from('users')
            .update({ password: newPass })
            .eq('email', email);

        closeChangePasswordModal();
        if (document.getElementById('current-password')) document.getElementById('current-password').value = '';
        if (document.getElementById('new-password')) document.getElementById('new-password').value = '';
        if (document.getElementById('confirm-new-password')) document.getElementById('confirm-new-password').value = '';

        showToast("Password successfully changed!", "success");
    } catch (err) {
        showToast(err.message || "Failed to update password", "error");
    }
}

// ================= LIVE SUPPORT =================
function openLiveSupportModal() {
    let supportModal = document.getElementById('live-support-modal');

    if (!supportModal) {
        supportModal = document.createElement('div');
        supportModal.id = 'live-support-modal';
        supportModal.className = 'modal-backdrop-45 flex items-center justify-center';
        supportModal.style.padding = '1rem';
        
        supportModal.innerHTML = `
            <div class="card-1 w-full max-w-md relative" style="background-color: #1e293b; border: 1px solid #334155; max-height: 85vh; display: flex; flex-direction: column;">
                <button onclick="closeLiveSupportModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer;">✕</button>
                <h3 style="font-size: 1.125rem; font-weight: bold; color: #38bdf8; margin-bottom: 0.25rem;">💬 Live Support Team</h3>
                <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.75rem;">Send messages directly to admin or support team</p>
                
                <div id="chat-messages-container" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem; background: #0f172a; border-radius: 0.5rem; margin-bottom: 0.75rem; min-height: 200px;">
                    <p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: auto;">Loading messages...</p>
                </div>

                <form onsubmit="handleSendSupportMessage(event)" style="display: flex; gap: 0.5rem; width: 100%;">
                    <input type="text" id="live-chat-input" placeholder="Type your message..." required style="flex: 1; padding: 0.5rem 0.75rem; font-size: 0.75rem; border-radius: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white;">
                    <button type="submit" class="btn-accent-1" style="border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.75rem; white-space: nowrap;">Send</button>
                </form>
            </div>
        `;
        document.body.appendChild(supportModal);
    } else {
        supportModal.classList.remove('hidden');
    }

    fetchChatMessages();
}

function closeLiveSupportModal() {
    const modal = document.getElementById('live-support-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleSendSupportMessage(e) {
    e.preventDefault();
    const input = document.getElementById('live-chat-input');
    const msgText = input ? input.value.trim() : '';

    if (!msgText) return;

    if (!state.user.email) {
        showToast("Please log in first!", "error");
        return;
    }

    const messageData = {
        user_name: state.user.name || "User",
        user_email: state.user.email,
        sender_type: 'user',
        message: msgText,
        status: 'Unread'
    };

    try {
        const { error } = await supabaseClient
            .from('support_chats')
            .insert([messageData]);

        if (error) throw error;

        if (input) input.value = '';
        fetchChatMessages();
        showToast("Message sent successfully!", "success");
    } catch (err) {
        showToast("Failed to send message: " + err.message, "error");
    }
}

async function fetchChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container || !state.user.email) return;

    try {
        const { data, error } = await supabaseClient
            .from('support_chats')
            .select('*')
            .eq('user_email', state.user.email)
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = '';
            data.forEach(msg => {
                const isUser = msg.sender_type === 'user';
                const msgDiv = document.createElement('div');
                msgDiv.style.cssText = `max-width: 80%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem; ${
                    isUser 
                    ? 'margin-left: auto; background-color: #0284c7; color: white;' 
                    : 'margin-right: auto; background-color: #334155; color: #38bdf8;'
                }`;
                msgDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 0.65rem; opacity: 0.8; margin-bottom: 0.1rem;">${isUser ? (msg.user_name || 'You') : 'Admin Support'}</div>
                    <div>${msg.message}</div>
                `;
                container.appendChild(msgDiv);
            });
            container.scrollTop = container.scrollHeight;
        } else {
            container.innerHTML = `<p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: auto;">No messages found. Start sending messages...</p>`;
        }
    } catch (err) {
        console.error("Chat fetch error:", err.message);
    }
}

// ================= LIVE PIPELINE BACKGROUND SYNC (100% FREE & AUTOMATIC) =================
let livePipelineTimer = null;

function startLivePipeline() {
    if (livePipelineTimer) clearInterval(livePipelineTimer);

    livePipelineTimer = setInterval(async () => {
        if (!state.isLoggedIn || !state.user.email) return;

        try {
            const { data: userData } = await supabaseClient
                .from('users')
                .select('balance, kyc')
                .eq('email', state.user.email)
                .maybeSingle();

            if (userData) {
                const newBal = parseFloat(userData.balance) || 0;
                if (newBal !== state.balance) {
                    state.balance = newBal;
                    renderUserData();
                }
                if (userData.kyc !== state.kycStatus) {
                    state.kycStatus = userData.kyc;
                    state.kycApproved = (userData.kyc === 'approved');
                    updateKYCUI();
                }
            }

            const addMoneyHistoryModal = document.getElementById('add-money-history-modal');
            if (addMoneyHistoryModal && !addMoneyHistoryModal.classList.contains('hidden')) {
                renderAddMoneyHistory();
            }

            const bankHistoryModal = document.getElementById('add-bank-history-modal');
            if (bankHistoryModal && !bankHistoryModal.classList.contains('hidden')) {
                renderAddBankHistory();
            }

            const chatModal = document.getElementById('live-support-modal');
            if (chatModal && !chatModal.classList.contains('hidden')) {
                fetchChatMessages();
            }

        } catch (err) {
            console.error("Pipeline background sync error:", err.message);
        }
    }, 4000);
}

function stopLivePipeline() {
    if (livePipelineTimer) {
        clearInterval(livePipelineTimer);
        livePipelineTimer = null;
    }
}

// ================= UTILS & LOGOUT =================
async function handleLogout() {
    stopLivePipeline();
    await supabaseClient.auth.signOut();
    
    state.isLoggedIn = false;
    state.systemOnline = false;
    state.kycApproved = false;
    state.kycStatus = 'none';
    state.balance = 0.00;
    state.totalEarnings = 0.00;
    state.user = { name: "", email: "", phone: "" };

    const systemCheckbox = document.getElementById('system-status-toggle');
    if (systemCheckbox) systemCheckbox.checked = false;
    const statusDot = document.getElementById('system-status-dot');
    const statusLabel = document.getElementById('system-status-label');
    if (statusDot) statusDot.style.backgroundColor = "#f43f5e";
    if (statusLabel) statusLabel.textContent = "System Offline";

    const drawer = document.getElementById('mobile-menu-drawer');
    if (drawer) drawer.classList.remove('open');

    if (dashboardSection) dashboardSection.classList.add('hidden');
    if (authSection) authSection.classList.remove('hidden');
    showToast("Logged out successfully. System is now Offline.", "info");
}

function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'}`;
    toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="background:none;color:white;margin-left:0.5rem;cursor:pointer;">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}
