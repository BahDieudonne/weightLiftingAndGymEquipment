document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.querySelector('.products-grid');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCountSpan = document.getElementById('cart-count');
  const cartTotalSpan = document.getElementById('cart-total');
  const categoriesList = document.querySelector('.categories-list');
  const priceRangeInput = document.getElementById('price-range');
  const maxPriceDisplay = document.getElementById('max-price-display');
  const sortBySelect = document.getElementById('sort-by');
  const emptyCartMessage = document.querySelector('.empty-cart-message');
  const viewCartBtn = document.getElementById('view-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const contactCheckoutButton = document.getElementById('contact-checkout-button'); // Renamed
  const contactInquirySection = document.getElementById('contact-inquiry-section');
  const backToShopBtn = document.getElementById('back-to-shop-btn');
  const contactForm = document.getElementById('contact-form');
  const contactMessageInput = document.getElementById('contactMessage');
  const contactStatusMessage = document.getElementById('contact-status-message');
  const shopContainer = document.querySelector('.shop-container'); // To add overlay

  // Get product data directly from the HTML elements when the page loads
  const allProductElements = Array.from(productsGrid.querySelectorAll('.product-card'));
  let products = allProductElements.map(card => ({
    id: parseInt(card.dataset.id),
    name: card.dataset.name,
    price: parseFloat(card.dataset.price),
    image: card.dataset.imageSrc,
    category: card.dataset.category
  }));

  // Initialize cart from local storage or as an empty array
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let currentFilterCategory = 'all';
  let currentMaxPrice = parseFloat(priceRangeInput.value);
  let currentSortBy = 'default';

  // --- Utility Functions ---

  // Creates and manages an overlay for when the cart/contact form is open
  function toggleOverlay(show) {
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.classList.add('overlay');
      shopContainer.appendChild(overlay);
      overlay.addEventListener('click', () => {
        // Close cart or contact if overlay is clicked
        if (cartSidebar.classList.contains('open')) {
          cartSidebar.classList.remove('open');
        }
        if (contactInquirySection.classList.contains('open')) {
          contactInquirySection.classList.remove('open');
        }
        toggleOverlay(false);
      });
    }
    if (show) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }


  // Function to render products in the grid
  function renderProducts(filteredProducts) {
    productsGrid.innerHTML = ''; // Clear any existing products in the grid

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
    addAddToCartListeners(); // Attach event listeners to the newly created "Add to Cart" buttons
  }

  // Attaches click listeners to all "Add to Cart" buttons
  function addAddToCartListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = parseInt(event.target.dataset.id);
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
        updateCartDisplay(); // Refresh the cart UI
        saveCartToLocalStorage(); // Save cart state
        openCartSidebar(); // Open cart sidebar when item is added
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
        cartItemsContainer.innerHTML = ''; // Clear current cart items display
        let totalItems = 0;
        let totalPrice = 0;

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block'; // Show "Cart is empty" message
            contactCheckoutButton.disabled = true; // Disable checkout if cart is empty
            contactCheckoutButton.textContent = 'Cart is Empty';
        } else {
            emptyCartMessage.style.display = 'none'; // Hide "Cart is empty" message
            contactCheckoutButton.disabled = false;
            contactCheckoutButton.textContent = 'Proceed to Contact';
            cart.forEach(item => {
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

                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
            });
        }

        cartCountSpan.textContent = totalItems; // Update cart icon count
        cartTotalSpan.textContent = totalPrice.toFixed(2); // Update cart total price
        addCartItemListeners(); // Attach listeners to new cart item buttons
    }

    // Attaches listeners for quantity changes and item removal within the cart
    function addCartItemListeners() {
        document.querySelectorAll('.cart-item-quantity button').forEach(button => {
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

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.closest('.remove-item').dataset.id);
                removeFromCart(productId);
            });
        });
    }

    // Saves the current cart array to the browser's local storage
    function saveCartToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Filters and sorts the `products` array based on current criteria, then re-renders
    function filterAndSortProducts() {
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

        renderProducts(filtered); // Re-render the grid with filtered and sorted products
    }

    // --- UI/Page Navigation Functions ---

    function openCartSidebar() {
        cartSidebar.classList.add('open');
        toggleOverlay(true);
    }

    function closeCartSidebar() {
        cartSidebar.classList.remove('open');
        toggleOverlay(false);
    }

    function openContactInquirySection() {
        cartSidebar.classList.remove('open'); // Close cart if open
        contactInquirySection.classList.add('open');
        toggleOverlay(true);
        populateContactForm();
    }

    function closeContactInquirySection() {
        contactInquirySection.classList.remove('open');
        toggleOverlay(false);
        contactForm.reset(); // Clear form
        displayContactStatus('', ''); // Clear status message
    }

    // Populates the contact form message with cart details
    function populateContactForm() {
        let messageBody = "Hello GymShop Team,\n\n";
        messageBody += "I am interested in the following products:\n\n";

        if (cart.length === 0) {
            messageBody += "No items currently in cart.\n";
            contactCheckoutButton.disabled = true;
        } else {
            cart.forEach(item => {
                messageBody += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
            });
            messageBody += `\nTotal Estimated Cost: $${cartTotalSpan.textContent}\n\n`;
            messageBody += "Please provide more information or how i can make payments to these items and the Payment Methods.\n\n";
        }

        messageBody += "Best regards,\n";
        contactMessageInput.value = messageBody;
    }

    // Displays status messages for the contact form
    function displayContactStatus(message, type) {
        contactStatusMessage.textContent = message;
        contactStatusMessage.className = 'contact-status-message'; // Reset classes
        contactStatusMessage.classList.add(type); // Add type class (success, error)
        contactStatusMessage.style.display = 'block';
    }

    // --- Event Listeners ---

    // Event listener for category filter clicks
    categoriesList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            document.querySelectorAll('.categories-list li').forEach(li => li.classList.remove('active'));
            event.target.classList.add('active');
            currentFilterCategory = event.target.dataset.category;
            filterAndSortProducts(); // Apply new filter
        }
    });

    // Event listener for price range slider input
    priceRangeInput.addEventListener('input', (event) => {
        currentMaxPrice = parseFloat(event.target.value);
        maxPriceDisplay.textContent = currentMaxPrice; // Update displayed max price
        filterAndSortProducts(); // Apply new price filter
    });

    // Event listener for sort by dropdown changes
    sortBySelect.addEventListener('change', (event) => {
        currentSortBy = event.target.value;
        filterAndSortProducts(); // Apply new sort order
    });

    // Toggle Cart Sidebar
    viewCartBtn.addEventListener('click', openCartSidebar);
    closeCartBtn.addEventListener('click', closeCartSidebar);

    // "Proceed to Contact" button in cart
    contactCheckoutButton.addEventListener('click', () => {
        if (cart.length > 0) {
            openContactInquirySection();
        } else {
            // This alert should ideally not be reachable if button is disabled
            alert('Your cart is empty. Please add items before proceeding.');
        }
    });

    // "Back to Shop" button in contact form
    backToShopBtn.addEventListener('click', closeContactInquirySection);

    // Contact form submission (mailto: logic)
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const customerName = document.getElementById('contactName').value.trim();
        const customerEmail = document.getElementById('contactEmail').value.trim();
        const customerNumber = document.getElementById('contactNumber').value.trim();
        const inquiryMessage = contactMessageInput.value;

        if (!customerName || !customerEmail || !customerNumber) {
            displayContactStatus('Please fill in your Name and Email.', 'error');
            return;
        }

        // Construct the mailto link
        const recipientEmail = 'weightliftinggymgearforsale@gmail.com'; // **CHANGE THIS TO YOUR ACTUAL EMAIL ADDRESS**
        const subject = encodeURIComponent(`GymShop Inquiry - Order from ${customerName}`);
        const body = encodeURIComponent(
            `Name: ${customerName}\n` +
            `Email: ${customerEmail}\n\n` +
            `Phone: ${customerNumber}\n\n\n` +
            inquiryMessage // This already contains the cart details
        );

        const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

        // Attempt to open default email client
        try {
            window.location.href = mailtoLink;
            displayContactStatus('Your inquiry is being prepared in your email client. Please send it from there.', 'info');
            // Clear cart and form after initiating email (assuming user will send it)
            cart = [];
            localStorage.removeItem('cart');
            updateCartDisplay();
            contactForm.reset();
            // Automatically close contact form after a short delay
            setTimeout(() => {
                closeContactInquirySection();
            }, 3000);
        } catch (e) {
            displayContactStatus('Could not open email client. Please ensure you have one configured.', 'error');
            console.error('Mailto failed:', e);
        }
    });


    // --- Initial Load ---
    updateCartDisplay(); // Display current cart from local storage
    filterAndSortProducts(); // Render initial products based on default settings
});

// ========= Contact Options ==========
// ... (rest of your shop1.js code remains the same) ...

document.addEventListener('DOMContentLoaded', () => {
    // ... (existing variable declarations) ...

    // New elements for WhatsApp and Telegram links (their IDs remain the same)
    const whatsappLink = document.getElementById('whatsapp-link');
    const telegramLink = document.getElementById('telegram-link');

    // **IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DETAILS**
    const whatsappPhoneNumber = '237678901234'; // Example: +237 678 901 234 -> 237678901234 (no +, no spaces)
    const telegramUsername = 'Steven_austwell'; // Your Telegram @username (without the @)

    // ... (rest of your utility functions like renderProducts, addToCart, etc.) ...

    // Generates the message for WhatsApp/Telegram based on cart contents
    function getCartMessageForChat() {
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

    // ... (rest of your UI/Page Navigation functions) ...

    // --- Event Listeners ---

    // ... (existing event listeners for categories, price range, sort by, cart toggle, contact checkout, back to shop, contact form submission) ...

    // WhatsApp Link click
    whatsappLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        const message = getCartMessageForChat();
        const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        displayContactStatus('Preparing your WhatsApp message...', 'info');
    });

  // Telegram Link click
  telegramLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    const message = getCartMessageForChat();
    const telegramUrl = `https://t.me/${Steven_austwell}?text=${message}`;
    window.open(telegramUrl, '_blank');
    displayContactStatus('Preparing your Telegram message...', 'info');
  });

  // --- Initial Load ---
  updateCartDisplay(); // Display current cart from local storage
  filterAndSortProducts(); // Render initial products based on default settings
});