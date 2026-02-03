
// Transaction Logic with Filters

async function loadTransactions() {
    initDB();
    const user = getCurrentUser(); // Get fresh from DB
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    renderTransactions(user.transactions);
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="color: #888; margin-top: 10px;">No transactions found</p>
                </td>
            </tr>`;
        return;
    }

    transactions.forEach(t => {
        const tr = document.createElement('tr');

        let icon = '';
        let color = '';
        let sign = '';

        if (t.type === 'DEPOSIT' || t.type === 'TRANSFER_RECEIVED') {
            color = 'var(--success)';
            sign = '+';
            icon = 'fa-arrow-down';
        } else {
            color = 'var(--danger)';
            sign = '-';
            icon = 'fa-arrow-up';
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight:bold;">${t.date}</div>
                <div style="font-size:0.8rem; color:#888;">${t.time}</div>
            </td>
            <td>
                <span class="badge badge-${t.type}">${t.type.replace('_', ' ')}</span>
                ${t.description ? `<div style="font-size:0.8rem; color:#666;">${t.description}</div>` : ''}
            </td>
            <td style="color: ${color}; font-weight:bold;">
                ${sign}$${t.amount.toFixed(2)}
            </td>
            <td>$${t.balanceAfter.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Logic
function filterTransactions() {
    const user = getCurrentUser();
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;

    let filtered = user.transactions.filter(t => {
        const matchesSearch = t.transactionId.toLowerCase().includes(searchVal) ||
            t.amount.toString().includes(searchVal) ||
            (t.description && t.description.toLowerCase().includes(searchVal));

        const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

        return matchesSearch && matchesType;
    });

    renderTransactions(filtered);
}
