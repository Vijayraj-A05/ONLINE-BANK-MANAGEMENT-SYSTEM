// Shared logic for banking operations

async function getBalance() {
    const user = checkAuth();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE_URL}/balance?username=${user}`);
        const data = await response.json();

        if (data.success) {
            const balanceElements = document.querySelectorAll('.balance-amount');
            balanceElements.forEach(el => el.textContent = `$${data.balance.toFixed(2)}`);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

async function handleTransaction(type, amount) {
    const user = checkAuth();
    if (!user) return;

    const endpoint = type === 'deposit' ? '/deposit' : '/withdraw';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, amount: amount })
        });

        return await response.json();
    } catch (error) {
        console.error('Transaction Error:', error);
        return { success: false, message: 'Server error' };
    }
}
