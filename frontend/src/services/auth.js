function checkLoginStatus() {
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const adminPanel = document.getElementById('admin-panel');
    const navMisReservas = document.getElementById('nav-mis-reservas');
    const footerMisReservas = document.getElementById('footer-mis-reservas');
    const mobileLoginBtn = document.getElementById('mobile-login-button');
    const mobileUserMenu = document.getElementById('mobile-user-menu');
    const mobileAdminPanel = document.getElementById('mobile-admin-panel');
    const mobileNavMisReservas = document.getElementById('mobile-nav-mis-reservas');

    const userString = localStorage.getItem('currentUser');

    if (userString) {
        let userData = null;
        try {
            userData = JSON.parse(userString);
        } catch (e) {}

        const datosPersonales = userData ? (userData.usuario || userData.user || userData.data || userData) : null;
        const rolDetectado = datosPersonales ? (datosPersonales.id_rol || datosPersonales.rol || datosPersonales.rol_id || datosPersonales.idRol) : null;
        const isAdmin = (rolDetectado == 2 || rolDetectado === 'admin' || rolDetectado === 'Administrador');

        if (loginButton) loginButton.classList.add('hidden');
        if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');

        if (userMenu) {
            userMenu.classList.remove('hidden');
            userMenu.classList.add('flex');
        }
        if (mobileUserMenu) {
            mobileUserMenu.classList.remove('hidden');
            mobileUserMenu.classList.add('flex');
        }

        if (navMisReservas) navMisReservas.classList.remove('hidden');
        if (mobileNavMisReservas) mobileNavMisReservas.classList.remove('hidden');
        if (footerMisReservas) footerMisReservas.classList.remove('hidden');

        if (isAdmin) {
            if (adminPanel) {
                adminPanel.classList.remove('hidden');
            }
            if (mobileAdminPanel) {
                mobileAdminPanel.classList.remove('hidden');
                mobileAdminPanel.classList.add('flex');
            }
        } else {
            if (adminPanel) {
                adminPanel.classList.add('hidden');
                adminPanel.classList.remove('flex');
            }
            if (mobileAdminPanel) {
                mobileAdminPanel.classList.add('hidden');
                mobileAdminPanel.classList.remove('flex');
            }
        }
    } else {
        if (loginButton) loginButton.classList.remove('hidden');
        if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');

        if (userMenu) {
            userMenu.classList.add('hidden');
            userMenu.classList.remove('flex');
        }
        if (mobileUserMenu) {
            mobileUserMenu.classList.add('hidden');
            mobileUserMenu.classList.remove('flex');
        }

        if (navMisReservas) navMisReservas.classList.add('hidden');
        if (mobileNavMisReservas) mobileNavMisReservas.classList.add('hidden');
        if (footerMisReservas) footerMisReservas.classList.add('hidden');

        if (adminPanel) {
            adminPanel.classList.add('hidden');
            adminPanel.classList.remove('flex');
        }
        if (mobileAdminPanel) {
            mobileAdminPanel.classList.add('hidden');
            mobileAdminPanel.classList.remove('flex');
        }
    }
}

function handleAdminDropdown() {
    const adminButton = document.getElementById('admin-panel-button');
    const adminMenu = document.getElementById('admin-panel-menu');

    if (adminButton && adminMenu) {
        adminButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            adminMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
            if (!adminMenu.classList.contains('hidden')) {
                adminMenu.classList.add('hidden');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    handleAdminDropdown();
});