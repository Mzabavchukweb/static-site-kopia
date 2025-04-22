// Function to get CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch('/api/auth/csrf-token'); // Endpoint może być inny
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.csrfToken) {
             throw new Error('Brak tokenu CSRF w odpowiedzi serwera.');
        }
        return data.csrfToken;
    } catch (error) {
        console.error('Błąd podczas pobierania tokenu CSRF:', error);
        // Informuj użytkownika, że formularz może nie działać
        showGlobalMessage('Nie można zainicjować formularza (błąd CSRF). Odśwież stronę.', 'error');
        return null; // Zwróć null, aby wskazać błąd
    }
}

// --- Funkcje Walidujące ---

// Podstawowa walidacja wymaganego pola
function validateRequired(value, fieldName) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
        return `${fieldName} jest wymagane.`;
    }
    return true;
}

// Function to validate NIP
function validateNIP(nip) {
    if (!nip) return 'NIP jest wymagany.';
    const nipClean = nip.replace(/[\s-]/g, ''); // Usuń spacje i myślniki
    if (!/^[0-9]{10}$/.test(nipClean)) return 'NIP musi składać się z 10 cyfr.';
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = nipClean.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i] * digits[i];
    }
    const checksum = sum % 11;
    const controlDigit = (checksum === 10) ? 0 : checksum;
    return controlDigit === digits[9] ? true : 'Nieprawidłowy numer NIP (błędna suma kontrolna).';
}

// Function to validate email
function validateEmail(email) {
    if (!email) return 'Adres email jest wymagany.';
    // Prosty, ale powszechny regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? true : 'Nieprawidłowy format adresu email.';
}

// Function to validate phone number
function validatePhone(phone) {
    if (!phone) return 'Numer telefonu jest wymagany.';
    // Uproszczony regex - min 9 cyfr, opcjonalny +, spacje, myślniki
    const phoneClean = phone.replace(/[\s-+()]/g, '');
    return /^[0-9]{9,}$/.test(phoneClean) ? true : 'Nieprawidłowy format numeru telefonu (min. 9 cyfr).';
}

// Function to validate postal code
function validatePostalCode(code) {
    if (!code) return 'Kod pocztowy jest wymagany.';
    return /^\d{2}-\d{3}$/.test(code) ? true : 'Nieprawidłowy kod pocztowy (format XX-XXX).';
}

// Ulepszona walidacja hasła
function validatePassword(password) {
    if (!password) return 'Hasło jest wymagane.';
    if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków.';
    if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać co najmniej jedną wielką literę.';
    if (!/[a-z]/.test(password)) return 'Hasło musi zawierać co najmniej jedną małą literę.';
    if (!/\d/.test(password)) return 'Hasło musi zawierać co najmniej jedną cyfrę.';
    if (!/[@$!%*?&]/.test(password)) return 'Hasło musi zawierać co najmniej jeden znak specjalny (@$!%*?&).';
    return true;
}

// Funkcja walidacji potwierdzenia hasła
function validateConfirmPassword(confirmPassword, password) {
    if (!confirmPassword) return 'Potwierdzenie hasła jest wymagane.';
    if (!password) return true; // Nie porównuj, jeśli główne hasło jest puste
    return confirmPassword === password ? true : 'Hasła nie są takie same.';
}

// --- Funkcje Pomocnicze (UI) ---

// Funkcja pokazywania błędu dla konkretnego pola
function showFieldError(elementId, message) {
    const field = document.getElementById(elementId);
    const errorElement = document.getElementById(`${elementId}Error`);
    if (field && errorElement) {
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
        errorElement.style.display = 'flex'; // Użyj flex dla wyrównania ikony i tekstu
        field.classList.add('error-input'); // Dodaj klasę do inputa dla stylizacji ramki
    } else {
         console.warn(`Nie znaleziono pola lub elementu błędu dla ID: ${elementId}`);
    }
}

// Funkcja ukrywania błędu dla konkretnego pola
function clearFieldError(elementId) {
    const field = document.getElementById(elementId);
    const errorElement = document.getElementById(`${elementId}Error`);
    if (field && errorElement) {
        errorElement.textContent = ''; // Wyczyść tekst
        errorElement.style.display = 'none'; // Ukryj element błędu
        field.classList.remove('error-input'); // Usuń klasę błędu z inputa
    }
}

// Funkcja tworzenia kontenera na globalne komunikaty, jeśli nie istnieje
function createGlobalMessageContainer() {
    let container = document.getElementById('globalMessageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'globalMessageContainer';
        const form = document.getElementById('registrationForm');
        // Wstaw przed formularzem lub na początku body, jeśli formularz nie istnieje
        const targetElement = form || document.body;
        const referenceNode = form || document.body.firstChild;
        // Upewnij się, że referenceNode jest prawidłowym węzłem
        if (targetElement.parentNode && referenceNode instanceof Node) {
             targetElement.parentNode.insertBefore(container, referenceNode);
        } else if (document.body && document.body.firstChild) {
            document.body.insertBefore(container, document.body.firstChild); // Fallback
        } else {
            document.body.appendChild(container); // Ostateczny fallback
        }
    }
    return container;
}

// Funkcja pokazywania globalnego komunikatu (błąd lub sukces)
function showGlobalMessage(message, type = 'error') {
    const globalMessageContainer = createGlobalMessageContainer();

    const messageDiv = document.createElement('div');
    messageDiv.className = `global-message ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    messageDiv.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;

    // Dodaj przycisk zamknięcia
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'close-global-message';
    closeButton.onclick = () => messageDiv.remove();
    messageDiv.appendChild(closeButton);

    // Dodaj komunikat do kontenera
    globalMessageContainer.appendChild(messageDiv);

    // Automatyczne ukrywanie po 7 sekundach dla błędów
    if (type === 'error') {
        setTimeout(() => {
             if (messageDiv.parentNode) { // Sprawdź, czy element nadal istnieje
                 messageDiv.remove();
             }
        }, 7000);
    }
}

// Funkcja pokazywania/ukrywania stanu ładowania przycisku submit
function showSubmitLoading(submitButton, isLoading) {
    if (!submitButton) return;
    // Zapisz oryginalny tekst przycisku, jeśli jeszcze nie zapisany
    if (isLoading && !submitButton.dataset.originalText) {
        submitButton.dataset.originalText = submitButton.innerHTML.trim(); // Użyj innerHTML, aby zachować ikonę
    }

    if (isLoading) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Przetwarzanie...';
    } else {
        submitButton.disabled = false;
        // Przywróć oryginalny tekst lub domyślny, jeśli coś pójdzie nie tak
        submitButton.innerHTML = submitButton.dataset.originalText || 'Zarejestruj się';
    }
}

// Funkcja wyświetlająca ekran sukcesu po rejestracji
function showRegistrationSuccess(form, emailValue) {
    // Zastąp zawartość formularza komunikatem sukcesu
    form.innerHTML = `
        <div class="success-message-container">
            <i class="fas fa-check-circle success-icon"></i>
            <h3>Rejestracja zakończona pomyślnie!</h3>
            <p>Na podany adres email (${emailValue || 'Twój email'}) został wysłany link weryfikacyjny.</p>
            <p>Sprawdź swoją skrzynkę odbiorczą (również folder spam) i kliknij w link, aby aktywować konto.</p>
            <a href="/" class="btn btn-primary back-home-button">
                <i class="fas fa-home"></i> Wróć do strony głównej
            </a>
        </div>
    `;
}


// --- Główna Funkcja Walidująca Cały Formularz ---

function validateFullForm(form) {
    let isValid = true;
    const formData = new FormData(form);
    const password = formData.get('password');

    // 1. Czyść poprzednie błędy pól
    form.querySelectorAll('input, select, textarea').forEach(el => {
        if(el.id) clearFieldError(el.id);
    });
    // 2. Czyść poprzednie globalne komunikaty o błędach walidacji
    const globalContainer = document.getElementById('globalMessageContainer');
    if (globalContainer) {
        globalContainer.querySelectorAll('.global-message.error').forEach(el => {
            // Usuwaj tylko te komunikaty, które mogły być wynikiem poprzedniej walidacji
            if (!el.classList.contains('server-error')) { // Załóżmy, że błędy serwera mają inną klasę
                 el.remove();
            }
        });
    }

    // Definicja pól i ich walidatorów
    const fieldsToValidate = [
        { id: 'firstName', validator: (val) => validateRequired(val, 'Imię') },
        { id: 'lastName', validator: (val) => validateRequired(val, 'Nazwisko') },
        { id: 'email', validator: validateEmail },
        { id: 'phone', validator: validatePhone },
        { id: 'companyName', validator: (val) => validateRequired(val, 'Nazwa firmy') },
        { id: 'nip', validator: validateNIP },
        { id: 'street', validator: (val) => validateRequired(val, 'Ulica i numer') },
        { id: 'postalCode', validator: validatePostalCode },
        { id: 'city', validator: (val) => validateRequired(val, 'Miasto') },
        { id: 'password', validator: validatePassword },
        { id: 'confirmPassword', validator: (val) => validateConfirmPassword(val, password) },
    ];

    // Pętla walidacji dla każdego pola
    fieldsToValidate.forEach(({ id, validator }) => {
        const value = formData.get(id);
        const result = validator(value); // Wywołaj walidator
        if (result !== true) { // Jeśli walidator zwrócił błąd (string)
            showFieldError(id, result); // Pokaż błąd przy polu
            isValid = false;
        }
    });

    // Walidacja akceptacji regulaminu (checkbox)
    const termsCheckbox = form.elements['termsAccepted'];
    const termsErrorElementId = 'termsAcceptedError'; // Użyjmy jednego ID
    if (termsCheckbox && !termsCheckbox.checked) {
        showFieldError(termsErrorElementId, 'Akceptacja regulaminu jest wymagana.');
        // Dodatkowo oznacz wizualnie grupę checkboxa, jeśli to konieczne
        const checkboxGroup = termsCheckbox.closest('.form-group.checkbox');
        if (checkboxGroup) checkboxGroup.classList.add('error-group');
        isValid = false;
    } else if (termsCheckbox) {
        clearFieldError(termsErrorElementId);
        const checkboxGroup = termsCheckbox.closest('.form-group.checkbox');
        if (checkboxGroup) checkboxGroup.classList.remove('error-group');
    }

    return isValid;
}

// ==================================
// Główny kod inicjalizacyjny
// ==================================
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) {
         console.error('Krytyczny błąd: Nie znaleziono formularza o ID registrationForm.');
         return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
         console.error('Krytyczny błąd: Nie znaleziono przycisku submit w formularzu.');
         showGlobalMessage('Błąd konfiguracji formularza (brak przycisku submit).', 'error');
         form.style.display = 'none'; // Ukryj formularz, bo i tak nie zadziała
         return;
    }

    let csrfToken = null;

    // --- Pobierz CSRF token --- JEST KRYTYCZNY DLA BEZPIECZEŃSTWA!
    try {
        csrfToken = await getCsrfToken();
        if (!csrfToken) {
            // Błąd CSRF uniemożliwia bezpieczne wysłanie formularza
            submitButton.disabled = true;
            console.error("Wyłączono przycisk submit z powodu braku tokenu CSRF.");
            // Komunikat dla użytkownika jest już pokazany przez getCsrfToken
            return; // Zakończ inicjalizację, nie podpinaj reszty zdarzeń
        }
        console.log("CSRF Token pobrany pomyślnie.");
    } catch (error) {
         // Błąd już obsłużony w getCsrfToken, przycisk powinien być wyłączony
         console.error("Inicjalizacja CSRF nie powiodła się.");
         submitButton.disabled = true;
         return;
    }

    // --- Walidacja w czasie rzeczywistym (on blur) ---
    const fieldsForRealtimeValidation = [
        'firstName', 'lastName', 'email', 'phone', 'companyName',
        'nip', 'street', 'postalCode', 'city', 'password', 'confirmPassword'
    ];

    fieldsForRealtimeValidation.forEach(id => {
        const field = form.elements[id];
        if (field) {
            field.addEventListener('blur', (e) => {
                const value = e.target.value;
                let result = true;

                // Znajdź odpowiedni walidator
                const validationMap = {
                    firstName: (val) => validateRequired(val, 'Imię'),
                    lastName: (val) => validateRequired(val, 'Nazwisko'),
                    email: validateEmail,
                    phone: validatePhone,
                    companyName: (val) => validateRequired(val, 'Nazwa firmy'),
                    nip: validateNIP,
                    street: (val) => validateRequired(val, 'Ulica i numer'),
                    postalCode: validatePostalCode,
                    city: (val) => validateRequired(val, 'Miasto'),
                    password: validatePassword,
                    confirmPassword: (val) => validateConfirmPassword(val, form.elements['password']?.value)
                };

                const validator = validationMap[id];
                if (validator) {
                    result = validator(value);
                }

                // Pokaż lub ukryj błąd
                if (result !== true) {
                    showFieldError(id, result);
                } else {
                    clearFieldError(id);
                }

                // Dodatkowa walidacja confirmPassword, jeśli zmieniono password
                if (id === 'password') {
                    const confirmField = form.elements['confirmPassword'];
                    if (confirmField && confirmField.value) {
                        const confirmResult = validateConfirmPassword(confirmField.value, value);
                        if (confirmResult !== true) {
                            showFieldError('confirmPassword', confirmResult);
                        } else {
                            clearFieldError('confirmPassword');
                        }
                    }
                }
            });
        } else {
             console.warn(`Nie znaleziono pola do walidacji realtime: ${id}`);
        }
    });

    // --- Obsługa wysłania formularza ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ponownie sprawdź CSRF token - na wszelki wypadek
        if (!csrfToken) {
            showGlobalMessage('Błąd bezpieczeństwa (brak tokenu CSRF). Odśwież stronę i spróbuj ponownie.', 'error');
            return;
        }

        // Wykonaj pełną walidację formularza przed wysłaniem
        const isFormValid = validateFullForm(form);
        if (!isFormValid) {
            showGlobalMessage('Proszę poprawić błędy w formularzu.', 'error');
            // Scroll do pierwszego błędu
            const firstErrorField = form.querySelector('.error-input, .error-group'); // Znajdź pierwszy element z błędem
            if (firstErrorField) {
                 firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 // Spróbuj ustawić focus na pierwszym błędnym polu input (jeśli to nie grupa checkboxa)
                 const inputInsideError = firstErrorField.querySelector('input') || (firstErrorField.matches('input') ? firstErrorField : null);
                 if(inputInsideError) {
                     try { inputInsideError.focus({ preventScroll: true }); } catch (err) {}
                 }
            }
            return; // Zatrzymaj wysyłanie
        }

        // Pokaż stan ładowania
        showSubmitLoading(submitButton, true);
        const emailValue = form.elements.email?.value; // Zapisz email na potrzeby komunikatu sukcesu

        // Przygotuj dane do wysłania
        const formData = new FormData(form);
        const dataToSend = Object.fromEntries(formData.entries());
        dataToSend.termsAccepted = form.elements['termsAccepted']?.checked === true;

        // Wyślij dane do serwera
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken // Dołącz token CSRF!
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                let errorMessage = result.message || `Błąd serwera (${response.status})`;

                // Sprawdź, czy serwer zwrócił tablicę błędów walidacji
                if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                    errorMessage = result.message || 'Popraw błędy wskazane przez serwer.'; // Główny komunikat
                    result.errors.forEach(err => {
                        if (err.param) { // err.param to ID pola (np. 'email')
                            showFieldError(err.param, err.msg);
                        }
                    });
                    // Scroll do pierwszego błędu zwróconego przez serwer
                    const firstServerErrorField = form.querySelector('.error-input, .error-group');
                    if (firstServerErrorField) {
                         firstServerErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         const inputInsideError = firstServerErrorField.querySelector('input') || (firstServerErrorField.matches('input') ? firstServerErrorField : null);
                         if(inputInsideError) {
                             try { inputInsideError.focus({ preventScroll: true }); } catch (err) {}
                         }
                    }
                } else if (response.status === 409) {
                     // Konflikt (email/NIP istnieje) - często nie ma err.param
                    errorMessage = result.message || 'Konflikt danych. Sprawdź, czy email lub NIP nie są już zarejestrowane.';
                } else if (response.status === 403) {
                     // Problem z CSRF
                     errorMessage = result.message || 'Błąd bezpieczeństwa (CSRF). Odśwież stronę.';
                }
                // Użyj Error, aby przekazać komunikat do catch
                throw new Error(errorMessage);
            }

            // Sukces!
            showRegistrationSuccess(form, emailValue);

        } catch (error) {
            console.error('Błąd podczas wysyłania formularza:', error);
            showGlobalMessage(error.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.', 'error');
        } finally {
            // Zawsze ukryj ładowanie, chyba że pokazano sukces (bo wtedy przycisk znika)
            if (!form.querySelector('.success-message-container')) {
                 showSubmitLoading(submitButton, false);
            }
        }
    });

    console.log("Inicjalizacja formularza rejestracji zakończona pomyślnie.");
});

// Upewnij się, że nie ma żadnego dodatkowego kodu poniżej tej linii. 