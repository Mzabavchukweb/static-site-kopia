document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('b2bRegisterForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const passwordStrengthContainer = document.getElementById('passwordStrength');
    const validationMessages = document.getElementById('validationMessages');
    const termsCheckbox = document.getElementById('terms');
    
    // Function to display validation messages
    const showValidationMessages = (messages, isError = true) => {
        console.log('showValidationMessages called with:', messages, 'isError:', isError); // Debug log
        if (!validationMessages) {
            console.error('Validation messages container not found!'); // Debug log
            return;
        }
        if (!messages || messages.length === 0) {
             console.log('No messages to display, hiding container.'); // Debug log
             validationMessages.innerHTML = ''; // Clear previous messages
             validationMessages.style.display = 'none';
             return;
        }
        
        console.log('Displaying messages...'); // Debug log
        validationMessages.innerHTML = messages.map(msg => 
            `<div class="validation-message ${isError ? 'error' : 'success'}">${msg || 'Nieznany błąd'}</div>` // Added fallback for empty msg
        ).join('');
        validationMessages.style.display = 'block'; // Ensure it's set to block
    };

    // Funkcja do sprawdzania siły hasła
    const checkPasswordStrength = (password) => {
        if (!passwordStrengthContainer) {
            console.warn('Password strength container not found'); // Debug log
            return;
        }
        
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        score = Math.min(score, 4); 
        
        const newClassName = `password-strength strength-${score}`;
        console.log(`Password score: ${score}, Setting class: ${newClassName}`); // Debug log
        // Update strength bar class on the container
        passwordStrengthContainer.className = newClassName;
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
        if (!companyName || !nip) return { exists: false };
        try {
            const response = await fetch('/api/auth/check-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, nip })
            });
            if (!response.ok) {
                console.error('Company check failed:', response.statusText);
                return { exists: false, error: 'Nie udało się sprawdzić firmy.' };
            }
            return await response.json(); 
        } catch (error) {
            console.error('Błąd podczas sprawdzania firmy:', error);
            return { exists: false, error: 'Błąd sieci podczas sprawdzania firmy.' };
        }
    };

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            console.log('Form submission started...'); // Debug log
            showValidationMessages([]); // Clear previous messages

            // --- Frontend Validations --- 
            console.log('Checking terms...'); // Debug log
            if (!termsCheckbox || !termsCheckbox.checked) {
                 console.log('Terms not checked.'); // Debug log
                 showValidationMessages(['Musisz zaakceptować Regulamin i Politykę Prywatności.']);
                 return;
            }
            
            console.log('Checking password match...'); // Debug log
            if (!passwordInput || !confirmPasswordInput || passwordInput.value !== confirmPasswordInput.value) {
                console.log('Passwords do not match.'); // Debug log
                showValidationMessages(['Hasła nie są identyczne.']);
                confirmPasswordInput?.focus();
                return;
            }

            console.log('Checking password strength...'); // Debug log
            const password = passwordInput.value;
            if (password.length < 8 || 
                !/[A-Z]/.test(password) || 
                !/[a-z]/.test(password) || 
                !/[0-9]/.test(password) || 
                !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                console.log('Password too weak. Stopping submission.'); // Debug log
                showValidationMessages(['Hasło nie spełnia wymagań bezpieczeństwa (min. 8 znaków, wielka/mała litera, cyfra, znak specjalny).']);
                passwordInput?.focus(); // Added optional chaining
                return; // Ensure execution stops
            }
            console.log('Password strength check passed.'); // Debug log - Should only appear if valid
            
            // 3.5 Validate NIP length (Basic frontend check)
            const nipInput = document.getElementById('nip');
            const nipValue = nipInput ? nipInput.value.replace(/\D/g, '') : ''; // Get digits only
            if (nipValue.length !== 10) {
                console.log('NIP length invalid.'); // Debug log
                showValidationMessages(['NIP musi składać się z 10 cyfr.']);
                nipInput?.focus();
                return;
            }

            // --- Collect Form Data --- 
            console.log('Collecting form data...'); // Debug log
            const formData = {
                firstName: document.getElementById('firstName')?.value.trim(),
                lastName: document.getElementById('lastName')?.value.trim(),
                email: document.getElementById('email')?.value.trim(),
                password: password, 
                companyName: document.getElementById('companyName')?.value.trim(),
                companyCountry: 'PL', 
                nip: nipValue, // Use already cleaned NIP value
                phone: document.getElementById('phone')?.value.trim(),
                address: {
                    street: document.getElementById('street')?.value.trim(),
                    postalCode: document.getElementById('postalCode')?.value.trim(),
                    city: document.getElementById('city')?.value.trim(),
                }
            };
            
            console.log('Checking for missing required fields...'); // Debug log
            let missingField = false;
            const requiredFields = ['firstName', 'lastName', 'email', 'password', 'companyName', 'nip', 'phone', 'street', 'postalCode', 'city'];
            for (const field of requiredFields) {
                if (field.startsWith('address.') && (!formData.address || !formData.address[field.split('.')[1]])) {
                    missingField = true; console.log('Missing field:', field); break;
                } else if (!field.startsWith('address.') && !formData[field]) {
                    missingField = true; console.log('Missing field:', field); break;
                }
            }
             if (missingField) {
                 console.warn('Formularz B2B nie jest w pełni wypełniony - stopping.'); // Debug log
                 showValidationMessages(['Proszę wypełnić wszystkie wymagane pola oznaczone *']);
                 return; 
             }
            
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if(submitButton) submitButton.disabled = true;
            console.log('Button disabled, starting backend checks...'); // Debug log

            try {
                // --- Backend Checks & Submission --- 
                console.log('Checking company existence...'); // Debug log
                const companyCheck = await checkCompanyExists(formData.companyName, formData.nip);
                console.log('Company check result:', companyCheck); // Debug log
                if (companyCheck.error) {
                    showValidationMessages([companyCheck.error]);
                    if(submitButton) submitButton.disabled = false;
                    return;
                }
                if (companyCheck.exists) {
                    showValidationMessages(['Firma o podanej nazwie lub NIP jest już zarejestrowana.']);
                    if(submitButton) submitButton.disabled = false;
                    return;
                }

                console.log('Attempting registration fetch...'); // Debug log
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                console.log('Registration response status:', response.status); // Debug log

                const data = await response.json(); 
                console.log('Registration response data:', data); // Debug log

                if (response.ok) {
                    console.log('Registration successful.'); // Debug log
                    showValidationMessages([data.message || 'Rejestracja udana. Sprawdź email w celu weryfikacji.'], false);
                    registerForm.reset(); 
                    checkPasswordStrength(''); // Reset strength meter
                    // setTimeout(() => { // Redirect is commented out for easier debugging now
                    //      window.location.href = '/verification-pending.html'; 
                    // }, 3000); 
                } else {
                     console.log('Registration failed, showing errors.'); // Debug log
                    const errors = data.errors ? data.errors.map(err => err.msg || err.message) : [data.message || 'Wystąpił błąd rejestracji.'];
                    showValidationMessages(errors);
                    if(submitButton) submitButton.disabled = false;
                     console.log('Displayed errors:', errors); // Debug log
                }

            } catch (error) {
                console.error('Catch block error during registration process:', error); // Debug log
                showValidationMessages(['Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.']);
                if(submitButton) submitButton.disabled = false;
            }
        });
    }

    // Input Formatting
    const formatInput = (elementId, formatter) => {
        const inputElement = document.getElementById(elementId);
        if (inputElement) {
            inputElement.addEventListener('input', (e) => {
                e.target.value = formatter(e.target.value);
            });
        }
    };

    formatInput('nip', (value) => value.replace(/\D/g, '').slice(0, 10)); 
    formatInput('postalCode', (value) => {
        let digits = value.replace(/\D/g, '').slice(0, 5);
        if (digits.length > 2) {
            return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        }
        return digits;
    });
    formatInput('phone', (value) => value.replace(/[^\d+\s-]/g, '')); 
}); 