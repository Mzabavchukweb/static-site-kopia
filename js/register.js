document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const passwordStrength = document.getElementById('passwordStrength');
    const validationMessages = document.getElementById('validationMessages');
    
    // Funkcja do wyświetlania komunikatów walidacji
    const showValidationMessages = (messages, isError = true) => {
        validationMessages.innerHTML = messages.map(msg => 
            `<div class="validation-message ${isError ? 'error' : 'success'}">${msg}</div>`
        ).join('');
        validationMessages.style.display = messages.length > 0 ? 'block' : 'none';
    };

    // Funkcja do sprawdzania siły hasła
    const checkPasswordStrength = (password) => {
        const strength = {
            0: "Bardzo słabe",
            1: "Słabe",
            2: "Średnie",
            3: "Dobre",
            4: "Silne"
        };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) score++;

        passwordStrength.textContent = strength[score];
        passwordStrength.className = `password-strength strength-${score}`;
    };

    // Funkcja do przełączania widoczności hasła
    const togglePasswordVisibility = (input, toggle) => {
        if (!input || !toggle) return;

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            // Zmień ikonę
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    };

    // Inicjalizacja przełączników widoczności hasła
    togglePasswordVisibility(passwordInput, passwordToggle);
    togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);

    // Walidacja hasła w czasie rzeczywistym
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            checkPasswordStrength(password);
            validatePasswordMatch();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }

    // Funkcja sprawdzająca zgodność haseł
    const validatePasswordMatch = () => {
        if (!passwordInput || !confirmPasswordInput) return;

        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Hasła nie są identyczne');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    };

    // Sprawdzanie czy firma już istnieje
    const checkCompanyExists = async (companyName, nip) => {
        try {
            const response = await fetch('/api/auth/check-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ companyName, nip })
            });
            return await response.json();
        } catch (error) {
            console.error('Błąd podczas sprawdzania firmy:', error);
            return { exists: false };
        }
    };

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Sprawdź zgodność haseł
            if (passwordInput.value !== confirmPasswordInput.value) {
                showValidationMessages(['Hasła nie są identyczne']);
                return;
            }

            // Sprawdź siłę hasła
            if (passwordInput.value.length < 8 || 
                !passwordInput.value.match(/[A-Z]/) || 
                !passwordInput.value.match(/[0-9]/) || 
                !passwordInput.value.match(/[!@#$%^&*(),.?":{}|<>]/)) {
                showValidationMessages(['Hasło nie spełnia wymagań bezpieczeństwa']);
                return;
            }

            // Zbierz dane z formularza
            const formData = {
                email: document.getElementById('email').value,
                password: passwordInput.value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                companyName: document.getElementById('companyName').value,
                nip: document.getElementById('nip').value.replace(/[^0-9]/g, ''),
                phone: document.getElementById('phone').value,
                address: {
                    street: document.getElementById('street').value,
                    postalCode: document.getElementById('postalCode').value,
                    city: document.getElementById('city').value,
                    country: 'Polska'
                }
            };

            try {
                // Sprawdź czy firma już istnieje
                const companyCheck = await checkCompanyExists(formData.companyName, formData.nip);
                if (companyCheck.exists) {
                    showValidationMessages(['Firma o podanej nazwie lub NIP już istnieje w systemie']);
                    return;
                }

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    showValidationMessages([data.message], false);
                    setTimeout(() => {
                        window.location.href = '/verification-pending.html';
                    }, 3000);
                } else {
                    const errors = data.errors || [data.message];
                    showValidationMessages(errors);
                }
            } catch (error) {
                console.error('Błąd rejestracji:', error);
                showValidationMessages(['Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.']);
            }
        });
    }

    // Walidacja NIP w czasie rzeczywistym
    const nipInput = document.getElementById('nip');
    if (nipInput) {
        nipInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            e.target.value = value.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1-$2-$3-$4');
        });
    }

    // Walidacja kodu pocztowego
    const postalCodeInput = document.getElementById('postalCode');
    if (postalCodeInput) {
        postalCodeInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length > 5) {
                value = value.slice(0, 5);
            }
            e.target.value = value.replace(/(\d{2})(\d{3})/, '$1-$2');
        });
    }

    // Walidacja numeru telefonu
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length > 9) {
                value = value.slice(0, 9);
            }
            e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        });
    }
}); 