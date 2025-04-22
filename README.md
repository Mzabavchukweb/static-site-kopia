# B2B Registration System

System rejestracji B2B z walidacją danych, weryfikacją email i zabezpieczeniami.

## Funkcje

- Rejestracja użytkowników B2B
- Walidacja danych formularza
- Weryfikacja email
- Zabezpieczenia (CSRF, Rate Limiting, Hashowanie haseł)
- Responsywny interfejs

## Wymagania

- Node.js (v14 lub nowszy)
- npm (v6 lub nowszy)

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/your-username/b2b-registration.git
cd b2b-registration
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skopiuj plik konfiguracyjny:
```bash
cp .env.example .env
```

4. Edytuj plik `.env` i ustaw odpowiednie wartości:
```env
PORT=3000
NODE_ENV=development
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@your-domain.com
```

## Uruchomienie

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### POST /api/auth/register
Rejestracja nowego użytkownika.

Request body:
```json
{
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "companyName": "string",
    "nip": "string",
    "street": "string",
    "postalCode": "string",
    "city": "string",
    "password": "string",
    "confirmPassword": "string",
    "termsAccepted": boolean
}
```

Response:
- 201: Użytkownik zarejestrowany
- 400: Błąd walidacji
- 500: Błąd serwera

### GET /api/auth/verify/:token
Weryfikacja użytkownika.

Response:
- 200: Weryfikacja udana
- 400: Nieprawidłowy token
- 500: Błąd serwera

## Testy

Uruchom testy:
```bash
npm test
```

Testy z pokryciem:
```bash
npm run test:coverage
```

## Bezpieczeństwo

- CSRF Protection
- Rate Limiting
- Hashowanie haseł (bcrypt)
- Walidacja danych
- CORS Policy

## Licencja

MIT 