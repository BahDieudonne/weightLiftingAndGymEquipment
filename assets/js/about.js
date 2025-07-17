document.addEventListener('DOMContentLoaded', () => {
    // Selectors for elements that might appear on multiple pages (like header cart)
    const cartCountSpan = document.getElementById('cart-count');
    const viewCartBtn = document.getElementById('view-cart-btn');

    // Selectors specific to the shop page (these might be null on other pages, which is fine)
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalSpan = document.getElementById('cart-total');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const contactCheckoutButton = document.getElementById('contact-checkout-button');
    const contactInquirySection = document.getElementById('contact-inquiry-section');
    const backToShopBtn = document.getElementById('back-to-shop-btn');
    const contactForm = document.getElementById('contact-form');
    const contactMessageInput = document.getElementById('contactMessage');
    const contactStatusMessage = document.getElementById('contact-status-message');
    const shopContainer = document.querySelector('.shop-container'); // This might only exist on shop1.html

    // New elements for WhatsApp and Telegram links (only on contact section)
    const whatsappLink = document.getElementById('whatsapp-link');
    const telegramLink = document.getElementById('telegram-link');

    // **IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DETAILS**
    const whatsappPhoneNumber = '237678901234'; // Example: +237 678 901 234 -> 237678901234 (no +, no spaces)
    const telegramUsername = 'yourtelegramusername'; // Your Telegram @username (without the @)

    // Products array (typically loaded from a JSON or backend, but we'll use a placeholder for now)
    // This part is crucial for the shop page. For other pages, it's not strictly needed unless product data is shared.
    let products = []; // Will be populated if on shop page

    // Initialize cart from local storage or as an empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- Utility Functions ---

    // Creates and manages an overlay for when the cart/contact form is open
    function toggleOverlay(show) {
        let overlay = document.querySelector('.overlay');
        if (!overlay && shopContainer) { // Only create if on a page that uses it
            overlay = document.createElement('div');
            overlay.classList.add('overlay');
            shopContainer.appendChild(overlay);
            overlay.addEventListener('click', () => {
                if (cartSidebar && cartSidebar.classList.contains('open')) {
                    cartSidebar.classList.remove('open');
                }
                if (contactInquirySection && contactInquirySection.classList.contains('open')) {
                    contactInquirySection.classList.remove('open');
                }
                toggleOverlay(false);
            });
        }
        if (overlay) { // Only toggle if overlay exists
            if (show) {
                overlay.classList.add('active');
                document.body.classList.add('no-scroll'); // Prevent background scroll
            } else {
                overlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        }
    }

    // Function to render products in the grid (only relevant for shop page)
    function renderProducts(filteredProducts) {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return; // Exit if not on the shop page

        productsGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 50px; color: #777;">No products found matching your criteria.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.id = product.id;
            productCard.dataset.name = product.name;
            productCard.dataset.price = product.price;
            productCard.dataset.imageSrc = product.image;
            productCard.dataset.category = product.category;

            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h4>${product.name}</h4>
                <p>$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
            `;
            productsGrid.appendChild(productCard);
        });
        addAddToCartListeners();
    }

    // Attaches click listeners to all "Add to Cart" buttons (only relevant for shop page)
    function addAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.id);
                // Ensure 'products' array is populated before trying to find a product
                if (products.length === 0 && document.querySelector('.products-grid')) {
                    // Re-populate products array if on shop page and it's empty
                    const allProductElements = Array.from(document.querySelector('.products-grid').querySelectorAll('.product-card'));
                    products = allProductElements.map(card => ({
                        id: parseInt(card.dataset.id),
                        name: card.dataset.name,
                        price: parseFloat(card.dataset.price),
                        image: card.dataset.imageSrc,
                        category: card.dataset.category
                    }));
                }
                const productToAdd = products.find(p => p.id === productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                }
            });
        });
    }

    // Adds a product to the cart or increments its quantity if already present
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartDisplay();
        saveCartToLocalStorage();
        if (cartSidebar) openCartSidebar(); // Open cart sidebar if it exists
    }

    // Removes a product entirely from the cart
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
        saveCartToLocalStorage();
    }

    // Updates the quantity of a specific item in the cart
    function updateCartItemQuantity(productId, change) {
        const item = cart.find(i => i.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                updateCartDisplay();
                saveCartToLocalStorage();
            }
        }
    }

    // Renders the entire cart section, updating item list, count, and total
    function updateCartDisplay() {
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;

        if (cart.length === 0) {
            if (emptyCartMessage) emptyCartMessage.style.display = 'block';
            if (contactCheckoutButton) {
                contactCheckoutButton.disabled = true;
                contactCheckoutButton.textContent = 'Cart is Empty';
            }
        } else {
            if (emptyCartMessage) emptyCartMessage.style.display = 'none';
            if (contactCheckoutButton) {
                contactCheckoutButton.disabled = false;
                contactCheckoutButton.textContent = 'Proceed to Contact';
            }
            cart.forEach(item => {
                if (cartItemsContainer) {
                    const cartItemDiv = document.createElement('div');
                    cartItemDiv.classList.add('cart-item');
                    cartItemDiv.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-item-details">
                            <h5>${item.name}</h5>
                            <p>$${item.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button data-id="${item.id}" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button data-id="${item.id}" data-action="increase">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    cartItemsContainer.appendChild(cartItemDiv);
                }
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
            });
        }

        if (cartCountSpan) cartCountSpan.textContent = totalItems;
        if (cartTotalSpan) cartTotalSpan.textContent = totalPrice.toFixed(2);
        addCartItemListeners();
    }

    // Attaches listeners for quantity changes and item removal within the cart
    function addCartItemListeners() {
        if (cartItemsContainer) {
            cartItemsContainer.querySelectorAll('.cart-item-quantity button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = parseInt(event.target.dataset.id);
                    const action = event.target.dataset.action;
                    if (action === 'increase') {
                        updateCartItemQuantity(productId, 1);
                    } else if (action === 'decrease') {
                        updateCartItemQuantity(productId, -1);
                    }
                });
            });

            cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = parseInt(event.target.closest('.remove-item').dataset.id);
                    removeFromCart(productId);
                });
            });
        }
    }

    // Saves the current cart array to the browser's local storage
    function saveCartToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Filters and sorts the `products` array (only relevant for shop page)
    function filterAndSortProducts() {
        const categoriesList = document.querySelector('.categories-list');
        const priceRangeInput = document.getElementById('price-range');
        const maxPriceDisplay = document.getElementById('max-price-display');
        const sortBySelect = document.getElementById('sort-by');

        if (!categoriesList || !priceRangeInput || !sortBySelect) {
            // Not on the shop page, no need to filter/sort products
            // However, we still need to initialize `products` if on the shop page to allow adding to cart
            if (document.querySelector('.products-grid')) {
                 const allProductElements = Array.from(document.querySelector('.products-grid').querySelectorAll('.product-card'));
                products = allProductElements.map(card => ({
                    id: parseInt(card.dataset.id),
                    name: card.dataset.name,
                    price: parseFloat(card.dataset.price),
                    image: card.dataset.imageSrc,
                    category: card.dataset.category
                }));
                renderProducts(products); // Render all products initially
                addAddToCartListeners(); // Attach listeners
            }
            return;
        }

        // Shop page specific filtering/sorting logic
        let currentFilterCategory = categoriesList.querySelector('.active')?.dataset.category || 'all';
        let currentMaxPrice = parseFloat(priceRangeInput.value);
        let currentSortBy = sortBySelect.value;

        let filtered = products.filter(product => {
            const categoryMatch = currentFilterCategory === 'all' || product.category === currentFilterCategory;
            const priceMatch = product.price <= currentMaxPrice;
            return categoryMatch && priceMatch;
        });

        switch (currentSortBy) {
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                // If default, maintain the order as read from HTML initially
                break;
        }

        renderProducts(filtered);
    }

    // --- UI/Page Navigation Functions ---

    function openCartSidebar() {
        if (cartSidebar) {
            cartSidebar.classList.add('open');
            toggleOverlay(true);
        }
    }

    function closeCartSidebar() {
        if (cartSidebar) {
            cartSidebar.classList.remove('open');
            toggleOverlay(false);
        }
    }

    function openContactInquirySection() {
        if (cartSidebar) cartSidebar.classList.remove('open'); // Close cart if open
        if (contactInquirySection) {
            contactInquirySection.classList.add('open');
            toggleOverlay(true);
            populateContactForm();
        }
    }

    function closeContactInquirySection() {
        if (contactInquirySection) contactInquirySection.classList.remove('open');
        toggleOverlay(false);
        if (contactForm) contactForm.reset();
        if (contactStatusMessage) displayContactStatus('', '');
    }

    // Populates the contact form message with cart details
    function populateContactForm() {
        if (!contactMessageInput || !cartTotalSpan) return;

        let messageBody = "Hello GymShop Team,\n\n";
        messageBody += "I am interested in the following products:\n\n";

        if (cart.length === 0) {
            messageBody += "No items currently in cart.\n";
        } else {
            cart.forEach(item => {
                messageBody += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
            });
            messageBody += `\nTotal Estimated Cost: $${cartTotalSpan.textContent}\n\n`;
            messageBody += "Please provide more information or an invoice for these items.\n\n";
        }

        messageBody += "Best regards,\n";
        contactMessageInput.value = messageBody;
    }

    // Generates the message for WhatsApp/Telegram based on cart contents
    function getCartMessageForChat() {
        if (!cartTotalSpan) return ""; // Ensure cartTotalSpan exists

        let message = "Hello GymShop!\nI'm interested in ordering the following items:\n\n";
        if (cart.length === 0) {
            message += "My cart is currently empty, but I'd like to inquire about your products.\n";
        } else {
            cart.forEach(item => {
                message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
            });
            message += `\nTotal estimated cost: $${cartTotalSpan.textContent}\n`;
            message += "Please let me know how I can proceed with this order. Thanks!\n";
        }
        return encodeURIComponent(message);
    }

    // Displays status messages for the contact form
    function displayContactStatus(message, type) {
        if (contactStatusMessage) {
            contactStatusMessage.textContent = message;
            contactStatusMessage.className = 'contact-status-message'; // Reset classes
            contactStatusMessage.classList.add(type); // Add type class (success, error, info)
            contactStatusMessage.style.display = 'block';
        }
    }

    // --- Event Listeners ---

    // Event listener for category filter clicks (only relevant for shop page)
    const categoriesList = document.querySelector('.categories-list');
    if (categoriesList) {
        categoriesList.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI') {
                document.querySelectorAll('.categories-list li').forEach(li => li.classList.remove('active'));
                event.target.classList.add('active');
                // currentFilterCategory is handled within filterAndSortProducts
                filterAndSortProducts();
            }
        });
    }

    // Event listener for price range slider input (only relevant for shop page)
    const priceRangeInput = document.getElementById('price-range');
    const maxPriceDisplay = document.getElementById('max-price-display');
    if (priceRangeInput && maxPriceDisplay) {
        priceRangeInput.addEventListener('input', (event) => {
            // currentMaxPrice is handled within filterAndSortProducts
            maxPriceDisplay.textContent = parseFloat(event.target.value);
            filterAndSortProducts();
        });
    }

    // Event listener for sort by dropdown changes (only relevant for shop page)
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', (event) => {
            // currentSortBy is handled within filterAndSortProducts
            filterAndSortProducts();
        });
    }


    // Toggle Cart Sidebar (works on any page with cart-icon)
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', openCartSidebar);
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCartSidebar);
    }

    // "Proceed to Contact" button in cart (only relevant if cart sidebar exists)
    if (contactCheckoutButton) {
        contactCheckoutButton.addEventListener('click', () => {
            openContactInquirySection();
        });
    }

    // "Back to Shop" button in contact form (only relevant if contact section exists)
    if (backToShopBtn) {
        backToShopBtn.addEventListener('click', closeContactInquirySection);
    }

    // Contact form submission (Web3Forms logic - only relevant if contact form exists)
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (cart.length === 0 && !confirm("Your cart is empty. Do you want to send an inquiry without selected items?")) {
                displayContactStatus('Inquiry cancelled. Please add items or confirm empty cart.', 'info');
                return;
            }

            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            try {
                displayContactStatus('Sending your inquiry...', 'info');
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });

                const result = await response.json();

                if (result.success) {
                    displayContactStatus('Inquiry sent successfully! We will get back to you soon.', 'success');
                    cart = [];
                    localStorage.removeItem('cart');
                    updateCartDisplay();
                    contactForm.reset();
                    setTimeout(() => closeContactInquirySection(), 3000);
                } else {
                    console.error('Web3Forms Error:', result);
                    displayContactStatus(`Failed to send inquiry: ${result.message || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                displayContactStatus('An error occurred while sending your inquiry. Please try again later.', 'error');
            }
        });
    }

    // WhatsApp Link click (only relevant if WhatsApp link exists)
    if (whatsappLink) {
        whatsappLink.addEventListener('click', (event) => {
            event.preventDefault();
            const message = getCartMessageForChat();
            const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${message}`;
            window.open(whatsappUrl, '_blank');
            displayContactStatus('Preparing your WhatsApp message...', 'info');
        });
    }

    // Telegram Link click (only relevant if Telegram link exists)
    if (telegramLink) {
        telegramLink.addEventListener('click', (event) => {
            event.preventDefault();
            const message = getCartMessageForChat();
            const telegramUrl = `https://t.me/${telegramUsername}?text=${message}`;
            window.open(telegramUrl, '_blank');
            displayContactStatus('Preparing your Telegram message...', 'info');
        });
    }


    // --- Initial Load ---
    updateCartDisplay(); // Always update cart display in header
    // Only call filterAndSortProducts if on the shop page, otherwise just populate products
    if (document.querySelector('.products-grid')) {
         const allProductElements = Array.from(document.querySelector('.products-grid').querySelectorAll('.product-card'));
        products = allProductElements.map(card => ({
            id: parseInt(card.dataset.id),
            name: card.dataset.name,
            price: parseFloat(card.dataset.price),
            image: card.dataset.imageSrc,
            category: card.dataset.category
        }));
        filterAndSortProducts(); // This will also render products
    } else {
        // If not on shop page, just ensure add to cart listeners are there if products are available (e.g. for future popups)
        addAddToCartListeners();
    }
});