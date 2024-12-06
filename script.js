const sheetID = '1JHTsFnzvEwoc7pQhzIr4EZ4hRPiD0JuS9H_iN9SakS4'
const apiKey = 'AIzaSyACyo3-x-Fr2DHfHxRypRFPGzPjOIz3sIc';
const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/repuestos?key=${apiKey}`;

let cart = [];
let allProducts = []; 

fetch(sheetURL)
    .then(response => { 
        if (!response.ok) {
            throw new Error('Error al obtener datos de Google Sheets');
        }
        return response.json();
    })
    .then(data => {
        const rows = data.values;
        const headers = rows[0].map(header => header.trim().toLowerCase());
        const products = rows.slice(1).map(row => {
            let product = {};
            headers.forEach((header, index) => {
                product[header] = row[index] || '';
            });
            return product;
        }).filter(product => product['active']?.toLowerCase() === 'y');

        allProducts = products; // Guardamos todos los productos
        displayProducts(products);
    })
    .catch(error => console.error('Error al cargar productos:', error));

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    let currentCategory = '';
    let categories = new Set();
    const defaultImageUrl = "./assets/no-image.avif";

    products.forEach(product => {
        const category = product['product category'];

        categories.add(category);

        if (category !== currentCategory) {
            currentCategory = category;
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;
            categoryTitle.id = category.replace(/\s+/g, '-').toLowerCase(); // Asignar ID a la categoría
            productList.appendChild(categoryTitle);
        }

        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        const imageUrl = product['image'] || defaultImageUrl;

        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product['product name']}" style="max-width: 100px; cursor: pointer;" onclick="showImage('${imageUrl}')">
            <div class="product-info" id="${product['product name'].replace(/\s+/g, '-').toLowerCase()}">
                <h3>${product['product name']}</h3>
                <p>${product['product description']}</p>
                 <p>Precio: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product['price'])}</p>
                <label>
                    Cantidad:
                    <input type="number" min="1" value="1" data-name="${product['product name']}" data-price="${product['price']}">
                </label>
                <button class="add-to-cart" data-name="${product['product name']}" data-price="${product['price']}">Agregar al Carrito</button>
            </div>
        `;

        productList.appendChild(productDiv);
    });

    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = ''; // Limpiar categorías antes de agregar nuevas
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => scrollToCategory(category));
        categoryList.appendChild(li);
    });

    const buttons = document.querySelectorAll('.add-to-cart');
    buttons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
}





function scrollToCategory(category) {
    const categoryId = category.replace(/\s+/g, '-').toLowerCase();
    const categoryElement = document.getElementById(categoryId);
    if (categoryElement) {
        categoryElement.scrollIntoView({ behavior: 'smooth' }); // Desplazamiento suave
    }
}


document.getElementById('view-cart').addEventListener('click', function() {
    const cartSection = document.getElementById('preview');  // Aquí estamos apuntando a la sección del carrito
    if (cartSection) {
        cartSection.scrollIntoView({ behavior: 'smooth' });  // Desplazamiento suave hacia el carrito
    }
});



function showImage(imageUrl) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.border = '5px solid white';
    modal.appendChild(img);

    modal.addEventListener('click', () => {
        modal.remove();
    });

    document.body.appendChild(modal);
}

function addToCart(event) {
    const button = event.target;
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));
    const productContainer = button.closest('.product');
    const quantityInput = productContainer.querySelector('input[type="number"]');
    let quantity = parseInt(quantityInput.value, 10);
    const imageUrl = productContainer.querySelector('img').src;

    if (isNaN(quantity) || quantity <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }

    const productInCart = cart.find(item => item.name === name);
    if (productInCart) {
        productInCart.quantity += quantity;
    } else {
        cart.push({ name, price, quantity, imageUrl });
    }

    showToast(`${name} ha sido agregado al carrito con éxito!`);
    quantityInput.value = 1;
    displayCart();
}

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 2000);
}

function displayCart() {
    const preview = document.getElementById('preview');
    let total = 0;

    preview.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        return `
            <div class="product-cart" style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; align-items: center; background-color:#ffa41c6;">
                <img src="${item.imageUrl}" alt="${item.name}" style="max-width: 50px; margin-right: 10px;">
                <div style="background-color:#ffa41c6">
                    ${item.name} - Cantidad: ${item.quantity} - Precio: $${item.price}
                    <p>Subtotal: $${subtotal.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart('${item.name}')">Eliminar</button>
            </div>
        `;
    }).join('');

    preview.innerHTML += `<div style="padding-top: 10px; font-weight: bold;">Total del pedido: $${total.toFixed(2)}</div>`;
    document.getElementById('send-order').style.display = cart.length > 0 ? 'block' : 'none';
}

function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    displayCart();
}

document.getElementById('send-order').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("No hay productos en el carrito.");
        return;
    }

    const nameInput = document.querySelector('.input-group-item input[placeholder="Tu nombre"]');
    const contactNumberInput = document.querySelector('.input-group-item input[placeholder="Tu número de contacto"]');
    const additionalInfoInput = document.querySelector('.input-group-item textarea');

    const name = nameInput.value.trim();
    const contactNumber = contactNumberInput.value.trim();
    const additionalInfo = additionalInfoInput.value.trim();

    const cartMessage = cart.map(item =>
        `${item.name} - Cantidad: ${item.quantity} - Precio: $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n\n');

    const message = `Nombre: ${name}\nNúmero de contacto: ${contactNumber}\nInformación adicional: ${additionalInfo}\n\nPedido:\n${cartMessage}`;

    const whatsappURL = `https://wa.me/3416154511?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
});

// Funcionalidad de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    // Crear la barra de búsqueda
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.placeholder = 'Buscar productos...';
    searchBar.style = `
        width: 50%; 
        padding: 12px; 
        margin-bottom: 10px; 
        background-color: rgba(255, 255, 255, 0.9); 
        border: 1px solid #ccc; 
        border-radius: 20px; 
        font-size: 16px; 
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        margin: 10px auto; /* Centrado en el contenedor */
        display: block;
    `;

    // Agregar la barra de búsqueda al principio de la sección main
    const mainSection = document.querySelector('main');
    mainSection.insertBefore(searchBar, mainSection.firstChild);  // Insertamos antes del primer elemento en main

    // Evento de búsqueda
    searchBar.addEventListener('input', event => {
        const query = event.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(product =>
            product['product name'].toLowerCase().includes(query)
        );
        displayProducts(filteredProducts);

        // Ir al primer producto que coincida con la búsqueda sin animación
        if (filteredProducts.length > 0) {
            const firstProductId = filteredProducts[0]['product name'].replace(/\s+/g, '-').toLowerCase();
            const firstProductElement = document.getElementById(firstProductId);
            if (firstProductElement) {
                firstProductElement.scrollIntoView({ behavior: 'auto' }); // Ir directamente sin animación
            }
        }
    });
});



    document.querySelector('main').prepend(searchBar);  // Insertamos la barra de búsqueda al principio del main




