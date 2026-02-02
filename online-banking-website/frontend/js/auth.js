const API_BASE_URL = 'http://localhost:8080/api';

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('bank_user');
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    if (!user && !isLoginPage) {
        window.location.href = 'index.html';
    } else if (user && isLoginPage) {
        window.location.href = 'dashboard.html';
    }
    return user;
}

// Login Function
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('bank_user', data.username);
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, message: 'Server error. Is the backend running?' };
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('bank_user');
    window.location.href = 'index.html';
}
