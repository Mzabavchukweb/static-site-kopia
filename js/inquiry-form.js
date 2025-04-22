// Inquiry form functionality
function createInquiryForm(productId, productName) {
    const form = document.createElement('form');
    form.className = 'inquiry-form';
    form.innerHTML = `
        <div class="inquiry-form-content">
            <h3>Zapytanie o produkt: ${productName}</h3>
            <div class="form-group">
                <label for="quantity">Ilość*:</label>
                <input type="number" id="quantity" name="quantity" min="1" required>
            </div>
            <div class="form-group">
                <label for="message">Dodatkowe uwagi:</label>
                <textarea id="message" name="message" placeholder="Np. szczególne wymagania, preferowany termin dostawy"></textarea>
            </div>
            <button type="submit" class="inquiry-button">
                <i class="fas fa-envelope"></i> Wyślij zapytanie
            </button>
        </div>
    `;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quantity = parseInt(form.querySelector('[name="quantity"]').value);
        const message = form.querySelector('[name="message"]').value;

        if (!quantity || quantity < 1) {
            alert('Proszę podać prawidłową ilość produktu');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Musisz być zalogowany, aby wysłać zapytanie');
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId,
                    quantity,
                    message,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert('Zapytanie zostało wysłane. Skontaktujemy się z Tobą wkrótce.');
                form.reset();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Błąd podczas wysyłania zapytania');
            }
        } catch (error) {
            alert(error.message || 'Przepraszamy, wystąpił błąd. Spróbuj ponownie później.');
            console.error('Error:', error);
        }
    });

    return form;
} 