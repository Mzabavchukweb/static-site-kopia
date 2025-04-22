document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('b2bRegistrationForm');
    const validationMessages = document.getElementById('validationMessages');
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordRequirements = document.getElementById('passwordRequirements');

    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Password strength checker
    if (passwordInput && passwordRequirements) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            // Check password requirements
            const hasMinLength = password.length >= 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            // Update strength indicator
            strength += hasMinLength ? 1 : 0;
            strength += hasUpperCase ? 1 : 0;
            strength += hasLowerCase ? 1 : 0;
            strength += hasNumbers ? 1 : 0;
            strength += hasSpecialChar ? 1 : 0;

            // Update visual strength indicator
            if (passwordStrength) {
                passwordStrength.className = 'password-strength strength-' + strength;
            }

            // Update requirements list
            const requirements = passwordRequirements.querySelectorAll('li');
            if (requirements.length >= 5) {
                requirements[0].classList.toggle('valid', hasMinLength);
                requirements[1].classList.toggle('valid', hasUpperCase);
                requirements[2].classList.toggle('valid', hasLowerCase);
                requirements[3].classList.toggle('valid', hasNumbers);
                requirements[4].classList.toggle('valid', hasSpecialChar);
            }
        });
    }

    // Form submission handler
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Disable form
            const submitButton = registrationForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Przetwarzanie...';
            
            // Clear previous messages
            if (validationMessages) {
                validationMessages.innerHTML = '';
                validationMessages.style.display = 'none';
            }

            // Get form data
            const formData = new FormData(registrationForm);
            const data = {};
            
            // Properly collect form data
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Basic validation
            let isValid = true;
            let messages = [];

            if (!data.companyName) {
                isValid = false;
                messages.push('Nazwa firmy jest wymagana');
            }

            if (!data.nip) {
                isValid = false;
                messages.push('NIP jest wymagany');
            } else if (!/^\d{10}$/.test(data.nip)) {
                isValid = false;
                messages.push('NIP musi składać się z 10 cyfr');
            }

            if (!data.email) {
                isValid = false;
                messages.push('Adres email jest wymagany');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                isValid = false;
                messages.push('Nieprawidłowy format adresu email');
            }

            if (!data.password) {
                isValid = false;
                messages.push('Hasło jest wymagane');
            } else if (data.password.length < 8) {
                isValid = false;
                messages.push('Hasło musi mieć co najmniej 8 znaków');
            }

            if (data.password !== data.confirmPassword) {
                isValid = false;
                messages.push('Hasła nie są identyczne');
            }

            if (!data.terms) {
                isValid = false;
                messages.push('Musisz zaakceptować regulamin i politykę prywatności');
            }

            if (!isValid && validationMessages) {
                validationMessages.style.display = 'block';
                messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'validation-message error';
                    messageElement.textContent = message;
                    validationMessages.appendChild(messageElement);
                });
                
                // Re-enable form
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }

            try {
                // Send registration request to backend
                const response = await fetch('/api/register-b2b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                let result;
                try {
                    result = await response.json();
                } catch (error) {
                    throw new Error('Błąd podczas przetwarzania odpowiedzi serwera');
                }

                if (response.ok) {
                    // Show success message
                    if (validationMessages) {
                        validationMessages.style.display = 'block';
                        const successMessage = document.createElement('div');
                        successMessage.className = 'validation-message success';
                        successMessage.innerHTML = `
                            <div style="margin-bottom: 10px;">Rejestracja zakończona pomyślnie! Sprawdź swoją skrzynkę email, aby aktywować konto.</div>
                            <div style="font-size: 0.9em; color: var(--text-light);">
                                <i class="fas fa-spinner fa-spin"></i> Za chwilę nastąpi przekierowanie...
                            </div>
                        `;
                        validationMessages.appendChild(successMessage);
                    }

                    // Disable all form inputs
                    const formInputs = registrationForm.querySelectorAll('input, button');
                    formInputs.forEach(input => input.disabled = true);

                    // Redirect to verification pending page after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/verification-pending.html';
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Wystąpił błąd podczas rejestracji');
                }
            } catch (error) {
                if (validationMessages) {
                    validationMessages.style.display = 'block';
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'validation-message error';
                    errorMessage.textContent = error.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
                    validationMessages.appendChild(errorMessage);
                }
                
                // Re-enable form
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
}); 