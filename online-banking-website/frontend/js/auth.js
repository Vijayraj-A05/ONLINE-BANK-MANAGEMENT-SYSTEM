// --- CONFIG ---
const MAX_ATTEMPTS = 3;
const AUTO_LOGOUT_TIME = 3 * 60 * 1000; // 3 minutes
let logoutTimer;

// --- DATABASE INITIALIZATION (MOCK) ---
function initDB() {
    if (!localStorage.getItem('bankUsers')) {
        const initialUsers = [
            {
                userId: 'user_001',
                fullName: 'Anand Kumar',
                username: 'user1',
                pin: '1234',
                accountNumber: '100000001',
                balance: 15000.00,
                failedAttempts: 0,
                isLocked: false,
                lastLogin: new Date().toISOString(),
                dailyWithdrawTotal: 0,
                dailyWithdrawDate: new Date().toLocaleDateString(),
                transactions: [
                    {
                        transactionId: 'txn_1',
                        type: 'DEPOSIT',
                        amount: 5000,
                        date: '2023-10-26',
                        time: '14:30',
                        balanceAfter: 15000
                    }
                ]
            },
            {
                userId: 'user_002',
                fullName: 'Priya Sharma',
                username: 'user2',
                pin: '0000',
                accountNumber: '100000002',
                balance: 25000.00,
                failedAttempts: 0,
                isLocked: false,
                lastLogin: null,
                dailyWithdrawTotal: 0,
                dailyWithdrawDate: new Date().toLocaleDateString(),
                transactions: []
            }
        ];
        localStorage.setItem('bankUsers', JSON.stringify(initialUsers));
        console.log('Database Initialized');
    }
}

// --- HELPER FUNCTIONS ---
function getUsers() {
    return JSON.parse(localStorage.getItem('bankUsers') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('bankUsers', JSON.stringify(users));
}

function getCurrentUser() {
    const username = localStorage.getItem('bank_user');
    if (!username) return null;
    const users = getUsers();
    return users.find(u => u.username === username);
}

// --- AUTH LOGIC ---

function checkAuth() {
    initDB(); // Ensure DB exists
    const user = getCurrentUser();
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    if (!user && !isLoginPage) {
        window.location.href = 'index.html';
    } else if (user && isLoginPage) {
        window.location.href = 'dashboard.html';
    }

    if (user) {
        resetAutoLogout();
    }
    return user;
}

// Auto Logout System
function resetAutoLogout() {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        alert("Session expired due to inactivity.");
        logout();
    }, AUTO_LOGOUT_TIME);
}

// Events to reset timer
['click', 'mousemove', 'keypress'].forEach(evt => {
    document.addEventListener(evt, () => {
        if (localStorage.getItem('bank_user')) resetAutoLogout();
    });
});

async function login(username, pin) {
    initDB();
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    // Artificial Delay for ATM feel
    await new Promise(r => setTimeout(r, 1000));

    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }

    const user = users[userIndex];

    if (user.isLocked) {
        return { success: false, message: 'Account LOCKED. Contact Secure Bank.' };
    }

    if (user.pin === pin) {
        // SUCCESS
        user.failedAttempts = 0;
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('bank_user', user.username);
        saveUsers(users);
        return { success: true };
    } else {
        // FAIL
        user.failedAttempts++;
        if (user.failedAttempts >= MAX_ATTEMPTS) {
            user.isLocked = true;
            saveUsers(users);
            return { success: false, message: 'Incorrect PIN. Account LOCKED!' };
        }
        saveUsers(users);
        const attemptsLeft = MAX_ATTEMPTS - user.failedAttempts;
        return { success: false, message: `Incorrect PIN. Default is '1234'. ${attemptsLeft} attempts left.` };
    }
}

function logout() {
    localStorage.removeItem('bank_user');
    window.location.href = 'index.html';
}
