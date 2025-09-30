const API_URL = "https://sheetdb.io/api/v1/xrb53jafd7dhn";

// Utility: Fetch all products
async function fetchProducts() {
    const res = await fetch(API_URL);
    const data = await res.json();
    return Array.isArray(data) ? data : data.data;
}

// Utility: Add product
async function addProduct(product) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });
    return await res.json();
}

// Utility: Delete product (by id)
async function deleteProductById(id) {
    if (!id) return;
    await fetch(`${API_URL}/id/${id}`, { method: "DELETE" });
    renderAdminProducts(document.getElementById('adminSearchInput')?.value || '');
}

// Utility: Edit product (by id)
async function editProductById(id, updated) {
    if (!id) return;
    await fetch(`${API_URL}/id/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
    });
    renderAdminProducts(document.getElementById('adminSearchInput')?.value || '');
}

// VISITOR PAGE
async function renderProducts(searchTerm = '') {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    const products = await fetchProducts();
    let filtered = products;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = products.filter(p =>
            (p.title || '').toLowerCase().includes(term) ||
            (p.description || '').toLowerCase().includes(term)
        );
    }
    if (filtered.length === 0) {
        productList.innerHTML = "<p style='text-align:center;'>No products found. Check back soon!</p>";
    } else {
        productList.innerHTML = filtered.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.title}">
                <div class="content">
                    <h2>${product.title}</h2>
                    <p>${product.description}</p>
                </div>
                <a class="buy-btn" href="${product.amazonUrl}" target="_blank" rel="nofollow noopener">Buy on Amazon</a>
            </div>
        `).join('');
    }
}

// ADMIN PAGE
async function renderAdminProducts(searchTerm = '') {
    const adminList = document.getElementById('admin-product-list');
    if (!adminList) return;
    const products = await fetchProducts();
    let filtered = products;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = products.filter(p =>
            (p.title || '').toLowerCase().includes(term) ||
            (p.description || '').toLowerCase().includes(term)
        );
    }
    if (filtered.length === 0) {
        adminList.innerHTML = "<p style='text-align:center;'>No products found.</p>";
    } else {
        adminList.innerHTML = filtered.map((product, idx) => `
            <div class="admin-card" data-idx="${idx}">
                <img src="${product.image}" alt="${product.title}">
                <div class="content">
                    <h2>${product.title}</h2>
                    <p>${product.description}</p>
                    <a class="buy-btn" href="${product.amazonUrl}" target="_blank" rel="nofollow noopener">Buy on Amazon</a>
                </div>
                <div class="admin-controls">
                    <button onclick="showEditForm('${product.id}', ${idx})">Edit</button>
                    <button onclick="deleteProductById('${product.id}')">Delete</button>
                </div>
                <div class="edit-form-container" id="edit-form-${idx}" style="display:none;"></div>
            </div>
        `).join('');
    }
}

// Add product (admin)
if (document.getElementById('add-product-form')) {
    const form = document.getElementById('add-product-form');
    const successMessage = document.getElementById('success-message');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        const image = document.getElementById('image').value.trim();
        const amazonUrl = document.getElementById('amazonUrl').value.trim();
        const description = document.getElementById('description').value.trim();

        if (!title || !image || !amazonUrl || !description) {
            alert('Please fill all fields!');
            return;
        }
        if (!amazonUrl.startsWith('https://www.amazon')) {
            alert('Amazon URL must start with https://www.amazon');
            return;
        }

        await addProduct([{ title, image, amazonUrl, description }]);
        form.reset();
        successMessage.style.display = 'block';
        renderAdminProducts('');
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
}

// Show edit form (admin)
async function showEditForm(id, idx) {
    const products = await fetchProducts();
    const product = products.find(p => p.id === id);
    const formContainer = document.getElementById(`edit-form-${idx}`);
    if (!formContainer) return;

    document.querySelectorAll('.edit-form-container').forEach(cont => cont.style.display = 'none');
    formContainer.style.display = 'block';

    formContainer.innerHTML = `
        <form class="edit-form" onsubmit="event.preventDefault(); submitEditForm('${id}', ${idx});">
            <label>
                Title:
                <input type="text" id="edit-title-${idx}" value="${product.title}">
            </label>
            <label>
                Image URL:
                <input type="url" id="edit-image-${idx}" value="${product.image}">
            </label>
            <label>
                Amazon URL:
                <input type="url" id="edit-url-${idx}" value="${product.amazonUrl}">
            </label>
            <label>
                Description:
                <textarea id="edit-desc-${idx}">${product.description}</textarea>
            </label>
            <button type="submit">Save</button>
            <button type="button" onclick="cancelEdit(${idx})">Cancel</button>
        </form>
    `;
}

// Submit edit form (admin)
async function submitEditForm(id, idx) {
    const title = document.getElementById(`edit-title-${idx}`).value.trim();
    const image = document.getElementById(`edit-image-${idx}`).value.trim();
    const amazonUrl = document.getElementById(`edit-url-${idx}`).value.trim();
    const description = document.getElementById(`edit-desc-${idx}`).value.trim();

    if (!title || !image || !amazonUrl || !description) {
        alert('Please fill all fields!');
        return;
    }
    if (!amazonUrl.startsWith('https://www.amazon')) {
        alert('Amazon URL must start with https://www.amazon');
        return;
    }

    await editProductById(id, { title, image, amazonUrl, description });
    cancelEdit(idx);
    renderAdminProducts(document.getElementById('adminSearchInput')?.value || '');
}

// Cancel edit
function cancelEdit(idx) {
    const formContainer = document.getElementById(`edit-form-${idx}`);
    if (formContainer) formContainer.style.display = 'none';
}

// Initial render for admin
if (document.getElementById('admin-product-list')) {
    document.addEventListener('DOMContentLoaded', function() {
        renderAdminProducts('');
    });
}
