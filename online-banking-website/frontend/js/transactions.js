async function loadTransactions() {
    const user = checkAuth();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions?username=${user}`);
        const data = await response.json();

        if (data.success) {
            const tbody = document.getElementById('transactions-body');
            tbody.innerHTML = ''; // Clear loading/empty state

            if (data.transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">No transactions found</td></tr>';
                return;
            }

            data.transactions.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.date}</td>
                    <td>${t.type}</td>
                    <td style="color: ${t.type === 'DEPOSIT' ? 'green' : 'red'}">
                        ${t.type === 'DEPOSIT' ? '+' : '-'}$${t.amount.toFixed(2)}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}
