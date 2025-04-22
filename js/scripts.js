document.addEventListener('DOMContentLoaded', function() {
    // Header Hide on Scroll
    let lastScroll = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        
        lastScroll = currentScroll;
    });

    // Scroll Progress Bar
    const scrollProgress = document.querySelector('.scroll-progress');
    
    window.addEventListener('scroll', () => {
        const height = document.documentElement;
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = height.scrollHeight - height.clientHeight;
        const progress = `${(scrollTop / scrollHeight) * 100}%`;
        
        scrollProgress.style.transform = `scaleX(${scrollTop / scrollHeight})`;
    });

    // Back to Top Button
    const backToTop = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced Form Interactions
    const searchInputs = document.querySelectorAll('input[type="text"], input[type="email"], select');
    
    searchInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts(); // Function to fetch and display products

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                showNotification('Proszę wypełnić wszystkie wymagane pola', 'error');
            }
        });
    });

    // Event listener for inquire button
    document.body.addEventListener('click', async function(e) { // Make listener async
        if (e.target.classList.contains('inquire-btn')) {
            const productCard = e.target.closest('.product-card');
            const productId = productCard.dataset.id;
            const productName = productCard.querySelector('.product-title').textContent;
            
            // Check if user is logged in
            const token = localStorage.getItem('authToken');
            if (!token) {
                showNotification('Musisz być zalogowany, aby wysłać zapytanie.', 'error');
                // Optionally redirect to login page: window.location.href = '/login.html';
                return;
            }
            
            // Optional: Ask for a message (e.g., using prompt or a modal)
            const userMessage = prompt(`Wpisz wiadomość dotyczącą zapytania o: ${productName}`, '');

            try {
                e.target.disabled = true; // Disable button temporarily
                e.target.textContent = 'Wysyłanie...';

                const response = await fetch('/api/inquiries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        productId: productId,
                        message: userMessage || undefined // Send message only if provided
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Nie udało się wysłać zapytania.');
                }

                showNotification(`Zapytanie o ${productName} zostało wysłane! Skontaktujemy się z Tobą wkrótce.`, 'success');
            
            } catch (error) {
                console.error('Błąd wysyłania zapytania:', error);
                showNotification(`Błąd: ${error.message}`, 'error');
            } finally {
                 e.target.disabled = false; // Re-enable button
                 e.target.innerHTML = '<i class="fas fa-envelope"></i> Zapytaj o produkt';
            }
        }
    });
});

async function fetchProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return; // Exit if grid not found

    // Clear existing static content
    productsGrid.innerHTML = '<p>Ładowanie produktów...</p>';

    // Check if user is logged in (simple check using localStorage token)
    const token = localStorage.getItem('authToken');
    const apiUrl = token ? '/api/products' : '/api/products/public';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        productsGrid.innerHTML = ''; // Clear loading message

        if (products.length === 0) {
            productsGrid.innerHTML = '<p>Nie znaleziono produktów.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = createProductCard(product, !!token);
            productsGrid.appendChild(productCard);
        });

    } catch (error) {
        console.error('Błąd podczas ładowania produktów:', error);
        productsGrid.innerHTML = '<p>Wystąpił błąd podczas ładowania produktów.</p>';
    }
}

function createProductCard(product, isLoggedIn) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product._id; // Assuming MongoDB ObjectId

    const imageHtml = `
        <div class="product-image">
            <img src="${product.thumbnail || 'images/product-placeholder.jpg'}" alt="${product.name}">
        </div>`;

    const infoHtml = `
        <div class="product-info">
            <div class="product-category">${product.category || 'Brak kategorii'}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-specs">
                ${product.oemNumber ? `<span>OEM: ${product.oemNumber}</span>` : ''}
                ${product.compatibility?.brand ? `<span>Kompatybilność: ${product.compatibility.brand}</span>` : ''}
            </div>
            ${isLoggedIn && product.price ? `
            <div class="product-price">
                <span class="price-value">${product.price.toFixed(2)} zł</span>
            </div>
            ` : '<div class="product-price">Cena dostępna po zalogowaniu</div>'}
            ${isLoggedIn && product.availability ? `
            <div class="product-availability">
                <i class="fas fa-info-circle"></i>
                <span>Dostępność: ${product.availability}</span>
            </div>
            ` : ''}
            <button class="inquire-btn">
                <i class="fas fa-envelope"></i>
                Zapytaj o produkt
            </button>
        </div>`;

    card.innerHTML = imageHtml + infoHtml;
    return card;
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        background: var(--white);
        box-shadow: var(--shadow);
        transform: translateY(100%);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .notification.success {
        border-left: 4px solid var(--primary-color);
    }
    
    .notification.error {
        border-left: 4px solid var(--secondary-color);
    }
`;
document.head.appendChild(style);
