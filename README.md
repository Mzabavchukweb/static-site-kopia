# B2B Auto Parts Platform

Platforma B2B do sprzedaży części samochodowych z systemem rejestracji, logowania i weryfikacji email.

## Funkcjonalności

- Rejestracja użytkowników B2B
- Logowanie użytkowników
- Weryfikacja email
- Panel administratora
- Katalog produktów
- System zamówień

## Wymagania

- Node.js >= 14.0.0
- NPM >= 6.0.0

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/mzabavchukweb/static-site-kopia.git
cd static-site-kopia
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:
Utwórz plik `.env` w głównym katalogu projektu i dodaj następujące zmienne:
```env
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5500
```

## Uruchomienie

### Tryb developerski:
```bash
npm run dev
```

### Tryb produkcyjny:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5500`

## Endpointy API

- `POST /api/auth/login` - Logowanie użytkownika
- `POST /api/register-b2b` - Rejestracja użytkownika B2B
- `GET /api/verify-email` - Weryfikacja adresu email
- `POST /api/test-email` - Test wysyłania emaili

## Konfiguracja email (Resend)

1. Utwórz konto na [Resend](https://resend.com)
2. Uzyskaj klucz API
3. Dodaj zweryfikowany adres email
4. Ustaw klucz API w zmiennych środowiskowych

## Licencja

MIT 