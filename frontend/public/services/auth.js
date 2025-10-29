
function checkLoginStatus() {
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const adminPanel = document.getElementById('admin-panel');
    
   if (!loginButton || !userMenu || !adminPanel) {
        return;
    }

    const userString = localStorage.getItem('currentUser');

    if (userString) {
        const userData = JSON.parse(userString);
        
        loginButton.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userMenu.classList.add('flex');

        if (userData.rol === "Administrador") {
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('flex');
        } else {
            adminPanel.classList.add('hidden');
            adminPanel.classList.remove('flex');
        }

    } else {
        loginButton.classList.remove('hidden');
        userMenu.classList.add('hidden');
        userMenu.classList.remove('flex');
        adminPanel.classList.add('hidden');
        adminPanel.classList.remove('flex');
    }
}

function handleLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '/views/login.html';
        });
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
    handleLogout();
    handleAdminDropdown();
});