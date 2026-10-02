const loadExpenses = () => {
    try {
        const saved = localStorage.getItem("expenses");
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;   // corrupted data or storage blocked
    }
};

const saveExpenses = () => {
    try {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch {
        // storage full or blocked: the app still works, it just won't save
    }
};


let expenses = loadExpenses() ?? [
  { id: 1, title: "Nasi lemak", amount: 6.5, category: "food" },
  { id: 2, title: "Grab", amount: 18, category: "transport" },
  { id: 3, title: "Movie", amount: 25, category: "fun" },
  { id: 4, title: "Lunch", amount: 12, category: "food" }
];

let selectedCategory = "all";
let sortorder = "none";
let editingId = null;   // null means nobody is being edited

const getvisible = ()=>{
    const filtered = selectedCategory === "all" 
    ? expenses 
    : expenses.filter((e) => e.category === selectedCategory);

    if (sortorder === "newest") { return [...filtered].sort((a, b) => b.id - a.id); }
    if (sortorder === "oldest") { return [...filtered].sort((a, b) => a.id - b.id); }
    if (sortorder === "asc") { return [...filtered].sort((a, b) => a.amount - b.amount); }
    if (sortorder === "desc") { return [...filtered].sort((a, b) => b.amount - a.amount); }
    return filtered;
}

const escapeHtml = (text) =>
    String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const render = () => {
    const visible = getvisible();
    document.getElementById("expense-list").innerHTML = visible.length
        ? visible
            .map((e) => e.id === editingId
                ? `<li>
                    <input id="edit-title" value="${escapeHtml(e.title)}">
                    <input id="edit-amount" type="number" step="0.01" value="${e.amount}">
                    <button data-action="save" data-id="${e.id}">Save</button>
                    <button data-action="cancel">Cancel</button>
                </li>`
                : `<li>${escapeHtml(e.title)} - ${escapeHtml(e.category)} - RM${e.amount.toFixed(2)}
                    <button data-action="edit" data-id="${e.id}">Edit</button>
                    <button data-action="delete" data-id="${e.id}">Delete</button>
                </li>`)
            .join("")
        : "<li>No expenses found</li>";

    document.getElementById("total").textContent = 
        `Total: RM${visible.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`;

    const highestExpense = visible.reduce((best, e) => (e.amount > best.amount ? e : best), visible[0]);
    document.getElementById("highest").textContent = 
        highestExpense 
            ? `Highest: ${highestExpense.title} - RM${highestExpense.amount.toFixed(2)}`
            : "Highest: N/A";

    const byCategory = visible.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
    }, {});
    document.getElementById("summary").innerHTML = Object.entries(byCategory)
        .map(([category, amount]) => `<li>${escapeHtml(category)}: RM${amount.toFixed(2)}</li>`)
        .join("");
};

document.getElementById("category-filter").addEventListener("change", (e) => {
    selectedCategory = e.target.value;
    render();
}); 

document.getElementById("sort-order").addEventListener("change", (e) => {
    sortorder = e.target.value;
    render();
});

document.getElementById("expense-list").addEventListener("click", (event) => {
    const { action, id } = event.target.dataset;
    if (!action) return;
    const numId = Number(id);

    if (action === "delete") {
        expenses = expenses.filter((e) => e.id !== numId);
    } else if (action === "edit") {
        editingId = numId;
    } else if (action === "cancel") {
        editingId = null;
    } else if (action === "save") {
        const title = document.getElementById("edit-title").value.trim();
        const amount = Number(document.getElementById("edit-amount").value);
        if (!title || !(amount > 0)) return;   // ignore invalid input

        expenses = expenses.map((e) => (e.id === numId ? { ...e, title, amount } : e));
        editingId = null;
    }
    saveExpenses();
    render();
});

document.getElementById("add-btn").addEventListener("click", () => {
    const titleInput = document.getElementById("new-title");
    const amountInput = document.getElementById("new-amount");

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category = document.getElementById("new-category").value;

    if (!title || !(amount > 0)) {
        document.getElementById("error").textContent = "Enter a title and an amount above 0.";
        return;
    }
    document.getElementById("error").textContent = "";

    const nextId = Math.max(0, ...expenses.map((e) => e.id)) + 1;
    expenses = [...expenses, { id: nextId, title, amount, category }];

    titleInput.value = "";
    amountInput.value = "";
    saveExpenses();
    render();
});

document.getElementById("reset").addEventListener("click", () => {
    selectedCategory = "all";
    sortorder = "none";
    document.getElementById("category-filter").value = "all";
    document.getElementById("sort-order").value = "none";
    render();
});

render();