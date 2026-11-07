"use strict";

// 1. BASIC WALLET SETTINGS
const DEMO_PIN = "1234";
const STARTING_BALANCE = 300000;

let balance = loadBalance();
let transactions = loadTransactions();
let selectedRecipient = null;
let balanceVisible = true;

// Demo contacts: phone number and recipient name
const contacts = {
    "0712345678": "Mary Wanjiku",
    "0722345678": "John Kamau",
    "0700123456": "Grace Achieng",
    "0798765432": "Peter Mwangi"
};


// 2. LOAD SAVED WALLET DATA
function loadBalance() {
    try {
        const saved = localStorage.getItem("walletBalance");

        if (saved === null) {
            return STARTING_BALANCE;
        }

        const value = Number(saved);

        return Number.isFinite(value) && value >= 0
            ? value
            : STARTING_BALANCE;
    } catch {
        return STARTING_BALANCE;
    }
}

function loadTransactions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("walletTransactions") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveWallet() {
    try {
        localStorage.setItem("walletBalance", balance.toFixed(2));
        localStorage.setItem(
            "walletTransactions",
            JSON.stringify(transactions)
        );
    } catch {
        showMessage(
            "Unable to save data in this browser.",
            "error"
        );
    }
}


// 3. DISPLAY AND HIDE BALANCE
function updateBalance() {
    const balanceElement = document.getElementById("balance");

    if (!balanceElement) return;

    if (balanceVisible) {
        balanceElement.textContent =
            "KSh " + balance.toLocaleString("en-KE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
    } else {
        balanceElement.textContent = "KSh ••••••";
    }
}

function toggleBalance() {
    balanceVisible = !balanceVisible;
    updateBalance();
}


// 4. DISPLAY SUCCESS AND ERROR MESSAGES
function showMessage(message, type = "success") {
    const messageElement = document.getElementById("message");

    if (!messageElement) {
        alert(message);
        return;
    }

    messageElement.textContent = message;
    messageElement.className = type;
}


// 5. VALIDATE THE AMOUNT ENTERED
function getAmount(inputId) {
    const input = document.getElementById(inputId);

    if (!input) {
        showMessage("An amount field could not be found.", "error");
        return null;
    }

    const amount = Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage(
            "Enter a valid amount greater than zero.",
            "error"
        );
        return null;
    }

    if (amount > 1000000000) {
        showMessage("The amount is too large.", "error");
        return null;
    }

    return Math.round(amount * 100) / 100;
}


// 6. CHECK THE DEMO PIN
function verifyPin(inputId) {
    const pinInput = document.getElementById(inputId);

    if (!pinInput) {
        showMessage("The PIN field could not be found.", "error");
        return false;
    }

    const pin = pinInput.value;

    if (!/^\d{4}$/.test(pin)) {
        showMessage("Enter your 4-digit PIN.", "error");
        return false;
    }

    if (pin !== DEMO_PIN) {
        showMessage("Incorrect PIN. Transaction cancelled.", "error");
        return false;
    }

    return true;
}


// 7. NORMALIZE KENYAN PHONE NUMBERS
function normalizePhone(phone) {
    let number = phone.replace(/[\s-]/g, "");

    if (number.startsWith("+254")) {
        number = "0" + number.slice(4);
    } else if (number.startsWith("254")) {
        number = "0" + number.slice(3);
    }

    return number;
}


// 8. FIND THE RECIPIENT
function findRecipient() {
    const phoneInput = document.getElementById("recipientPhone");
    const nameElement = document.getElementById("recipientName");

    if (!phoneInput || !nameElement) {
        showMessage(
            "Check the recipient phone and name fields in index.html.",
            "error"
        );
        return;
    }

    const phone = normalizePhone(phoneInput.value.trim());

    selectedRecipient = null;
    nameElement.textContent = "Recipient name will appear here.";

    if (!/^0[17]\d{8}$/.test(phone)) {
        showMessage("Enter a valid Kenyan mobile number.", "error");
        return;
    }

    if (!contacts[phone]) {
        nameElement.textContent = "Recipient not found.";
        showMessage(
            "This number is not in the demo contact list.",
            "error"
        );
        return;
    }

    selectedRecipient = {
        phone: phone,
        name: contacts[phone]
    };

    phoneInput.value = phone;
    nameElement.textContent =
        "Recipient: " + selectedRecipient.name;

    showMessage("Recipient found. Confirm the details before sending.");
}


// If the recipient's number changes, find the name again.
function setupRecipientField() {
    const phoneInput = document.getElementById("recipientPhone");
    const nameElement = document.getElementById("recipientName");

    if (phoneInput && nameElement) {
        phoneInput.addEventListener("input", function () {
            selectedRecipient = null;
            nameElement.textContent =
                "Find the recipient again after changing the number.";
        });
    }
}


// 9. SAVE A TRANSACTION TO HISTORY
function recordTransaction(type, details, amount, status) {
    transactions.unshift({
        date: new Date().toLocaleString(),
        type: type,
        details: details,
        amount: amount,
        status: status
    });

    saveWallet();
    displayHistory();
}


// 10. SEND MONEY
function sendMoney() {
    if (!selectedRecipient) {
        showMessage(
            "Enter the recipient's number and find their name first.",
            "error"
        );
        return;
    }

    const amount = getAmount("sendAmount");

    if (amount === null) return;

    if (amount > balance) {
        showMessage("Insufficient wallet balance.", "error");
        return;
    }

    if (!verifyPin("sendPin")) return;

    const recipient = selectedRecipient;

    balance = Math.round((balance - amount) * 100) / 100;

    recordTransaction(
        "Sent",
        recipient.name + " (" + recipient.phone + ")",
        amount,
        "Successful"
    );

    updateBalance();

    showMessage(
        "Successfully sent KSh " +
        amount.toFixed(2) +
        " to " + recipient.name + "."
    );

    document.getElementById("sendAmount").value = "";
    document.getElementById("sendPin").value = "";
}


// 11. WITHDRAW MONEY
function withdrawMoney() {
    const amount = getAmount("withdrawAmount");

    if (amount === null) return;

    if (amount > balance) {
        showMessage("Insufficient wallet balance.", "error");
        return;
    }

    if (!verifyPin("withdrawPin")) return;

    balance = Math.round((balance - amount) * 100) / 100;

    recordTransaction(
        "Withdrawal",
        "Cash withdrawal",
        amount,
        "Successful"
    );

    updateBalance();

    showMessage(
        "Withdrawal successful: KSh " + amount.toFixed(2)
    );

    document.getElementById("withdrawAmount").value = "";
    document.getElementById("withdrawPin").value = "";
}


// 12. DEPOSIT MONEY
function depositMoney() {
    const sourceElement = document.getElementById("depositSource");

    if (!sourceElement || !sourceElement.value) {
        showMessage("Select the source of your deposit.", "error");
        return;
    }

    const amount = getAmount("depositAmount");

    if (amount === null) return;

    if (!verifyPin("depositPin")) return;

    const source = sourceElement.value;

    balance = Math.round((balance + amount) * 100) / 100;

    recordTransaction(
        "Deposit",
        "From " + source,
        amount,
        "Successful"
    );

    updateBalance();

    showMessage(
        "Deposit recorded: KSh " +
        amount.toFixed(2) +
        " from " + source + "."
    );

    document.getElementById("depositAmount").value = "";
    document.getElementById("depositPin").value = "";
}


// 13. DISPLAY TRANSACTION HISTORY
function displayHistory() {
    const historyElement = document.getElementById("history");

    if (!historyElement) return;

    historyElement.replaceChildren();

    if (transactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No transactions yet.";

        row.appendChild(cell);
        historyElement.appendChild(row);

        return;
    }

    transactions.forEach(function (transaction) {
        const row = document.createElement("tr");

        const values = [
            transaction.date,
            transaction.type,
            transaction.details,
            "KSh " + Number(transaction.amount).toFixed(2),
            transaction.status
        ];

        values.forEach(function (value) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        historyElement.appendChild(row);
    });
}


// 14. CLEAR TRANSACTION HISTORY
function clearHistory() {
    const confirmed = window.confirm(
        "Clear all demo transaction history? " +
        "Your current balance will remain unchanged."
    );

    if (!confirmed) return;

    transactions = [];

    saveWallet();
    displayHistory();

    showMessage("Demo transaction history cleared.");
}


// 15. INITIALIZE THE WALLET WHEN THE PAGE LOADS
setupRecipientField();
updateBalance();
displayHistory();