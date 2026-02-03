
// Logic for Banking Operations (Client-Side Simulation)

// Reusing getUsers, saveUsers, getCurrentUser from auth.js context
// Note: In a real app we'd modularize, but here we assume shared availability via script loading order
// or we re-declare helpers if needed. Since they are global in auth.js, we can access them.

const DAILY_LIMIT = 10000;

function checkDailyLimit(user, amount) {
    const today = new Date().toLocaleDateString();

    // Reset if new day
    if (user.dailyWithdrawDate !== today) {
        user.dailyWithdrawTotal = 0;
        user.dailyWithdrawDate = today;
    }

    if (user.dailyWithdrawTotal + amount > DAILY_LIMIT) {
        const remaining = DAILY_LIMIT - user.dailyWithdrawTotal;
        return {
            allowed: false,
            message: `Daily limit exceeded! Remaining limit: $${remaining}`
        };
    }

    return { allowed: true };
}

async function getBalance() {
    const user = checkAuth();
    if (!user) return;

    // Simulate Network Delay
    updateUIBalance(user);
}

function updateUIBalance(user) {
    const elements = document.querySelectorAll('.balance-amount');
    elements.forEach(el => el.textContent = `$${user.balance.toFixed(2)}`);
}

async function handleTransaction(type, amount) {
    const user = getCurrentUser(); // Refresh from DB
    if (!user || amount <= 0) return { success: false, message: "Invalid amount" };

    initDB(); // Ensure fresh state
    const users = getUsers();
    const userIdx = users.findIndex(u => u.username === user.username);
    const currentUser = users[userIdx]; // Working copy

    // Simulate Delay
    await new Promise(r => setTimeout(r, 1500));

    if (type === 'withdraw') {
        if (currentUser.balance < amount) {
            return { success: false, message: "Insufficient Funds" };
        }

        // CHECK DAILY LIMIT
        const limitCheck = checkDailyLimit(currentUser, amount);
        if (!limitCheck.allowed) {
            return { success: false, message: limitCheck.message };
        }

        // EXECUTE WITHDRAW
        currentUser.balance -= Number(amount);
        currentUser.dailyWithdrawTotal += Number(amount);

        const txn = createTransaction('WITHDRAW', amount, currentUser.balance);
        currentUser.transactions.unshift(txn); // Add to top

    } else if (type === 'deposit') {
        // EXECUTE DEPOSIT
        currentUser.balance += Number(amount);

        const txn = createTransaction('DEPOSIT', amount, currentUser.balance);
        currentUser.transactions.unshift(txn);
    }

    // SAVE
    saveUsers(users);
    return { success: true, newBalance: currentUser.balance };
}

// Transfer Logic
async function handleTransfer(beneficiaryAcct, amount) {
    amount = Number(amount);
    if (amount <= 0) return { success: false, message: "Invalid amount" };

    const users = getUsers();
    const senderIdx = users.findIndex(u => u.username === localStorage.getItem('bank_user'));
    const sender = users[senderIdx];

    if (sender.accountNumber === beneficiaryAcct) {
        return { success: false, message: "Cannot transfer to yourself!" };
    }

    if (sender.balance < amount) {
        return { success: false, message: "Insufficient Funds" };
    }

    const receiverIdx = users.findIndex(u => u.accountNumber === beneficiaryAcct);
    if (receiverIdx === -1) {
        return { success: false, message: "Beneficiary Account Not Found" };
    }
    const receiver = users[receiverIdx];

    // Simulate Delay
    await new Promise(r => setTimeout(r, 2000));

    // EXECUTE TRANSFER

    // 1. Debit Sender
    sender.balance -= amount;
    const senderTxn = createTransaction('TRANSFER_SENT', amount, sender.balance);
    // Add Metadata to txn about receiver
    senderTxn.description = `To: ${receiver.fullName}`;
    sender.transactions.unshift(senderTxn);

    // 2. Credit Receiver
    receiver.balance += amount;
    const receiverTxn = createTransaction('TRANSFER_RECEIVED', amount, receiver.balance);
    receiverTxn.description = `From: ${sender.fullName}`;
    receiver.transactions.unshift(receiverTxn);

    // SAVE
    saveUsers(users);

    return { success: true, newBalance: sender.balance, senderName: sender.fullName, receiverName: receiver.fullName };
}

function createTransaction(type, amount, balanceAfter) {
    return {
        transactionId: 'txn_' + Date.now(),
        type: type,
        amount: Number(amount),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        balanceAfter: balanceAfter
    };
}
