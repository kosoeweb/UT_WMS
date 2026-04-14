// auth-wms.js
async function checkLogin() {
    const { data: { session } } = await supabase.auth.getSession();
    const currentPage = window.location.pathname.split('/').pop();

    if (!session) {
        if (currentPage !== 'login.html') window.location.href = 'login.html';
        return;
    }

    if (currentPage === 'login.html') {
        window.location.href = 'index.html'; // WMS ရဲ့ ပင်မစာမျက်နှာကို ပြောင်းပေးပါ
        return;
    }

    const userEmail = session.user.email;
    let role = 'staff'; // WMS အတွက် default role ကို staff အဖြစ်ထားပါမယ်

    try {
        const { data: profile } = await supabase.from('wms_profiles').select('role').eq('email', userEmail).single();
        if (profile && profile.role) role = profile.role.toLowerCase();
    } catch(e) { console.error("Profile Fetch Error:", e); }

    setupUserInterface(userEmail, role);
    applyPermissions(role, currentPage);
}

function setupUserInterface(email, role) {
    // Navbar ရဲ့ ညာဘက်ဆုံး အပိုင်းကို ရှာမယ် (သင့် WMS html ထဲက Navbar class အတိုင်း ပြင်ပေးဖို့ လိုနိုင်ပါတယ်)
    const navDiv = document.querySelector('.navbar .container-fluid > div:last-child');
    if (!navDiv) return;

    navDiv.classList.add('d-flex', 'align-items-center');
    let badgeColor = role === 'admin' ? 'bg-danger' : 'bg-secondary';
    
    // အဟောင်းတွေရှိရင် ဖျက်မယ်
    const oldLogout = navDiv.querySelector('.logout-btn');
    if(oldLogout) oldLogout.remove();
    const oldInfo = navDiv.querySelector('.user-info-badge');
    if(oldInfo) oldInfo.remove();

    let userInfoHtml = `
        <div class="user-info-badge ms-3 me-2 text-end" style="line-height: 1.1;">
            <small class="text-white fw-bold d-block">${email}</small>
            <span class="badge ${badgeColor}" style="font-size: 0.65rem;">${role.toUpperCase()} TIER</span>
        </div>
        <button onclick="logout()" class="btn btn-warning btn-sm fw-bold shadow-sm logout-btn" title="Logout">
            <i class="bi bi-box-arrow-right"></i>
        </button>
    `;
    navDiv.insertAdjacentHTML('beforeend', userInfoHtml);
}

function applyPermissions(role, currentPage) {
    if (role === 'staff') {
        // ၁။ Locations ကို ပိတ်မည်
        const locationTab = document.querySelector('a[href="#location"]'); 
        if (locationTab) locationTab.parentElement.style.display = 'none';

        // ၂။ Categories / Settings ကို ပိတ်မည်
        const categoryTab = document.querySelector('a[href="#settings"]'); 
        if (categoryTab) categoryTab.parentElement.style.display = 'none';

        // ၃။ Create Item ကို ပိတ်မည်
        const createTab = document.querySelector('a[href="#createItem"]'); 
        if (createTab) {
            createTab.parentElement.style.display = 'none'; // Tab ခလုတ်ကို ဖျောက်မည်

            // စာမျက်နှာပွင့်တာနဲ့ Edit Item ဆီသို့ အလိုအလျောက် ပြောင်းပေးမည်
            const editTab = document.querySelector('a[href="#editItem"]'); // သင့် HTML ထဲက href နာမည်အတိုင်း ပြင်ပါ (ဥပမာ - #edit)
            if (editTab) {
                // Bootstrap ရဲ့ Tab စနစ်ကို သုံးပြီး Edit Tab ကို ဖွင့်ခိုင်းခြင်း
                const tab = new bootstrap.Tab(editTab);
                tab.show();
            }
        }

        // ၄။ Update Item ခလုတ်ကို ဖျောက်မည်
        const updateBtn = document.getElementById('btnEdit'); 
        if (updateBtn) updateBtn.style.display = 'none';
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', checkLogin);