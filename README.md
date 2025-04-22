# AutoParts B2B Platform

System B2B dla hurtowni części samochodowych.

## Konfiguracja środowiska

1. Sklonuj repozytorium
2. Zainstaluj zależności:
```bash
cd backend
npm install
```

3. Utwórz plik `.env` w katalogu `backend` z następującą zawartością:
```
# API Keys
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=your_verified_email@domain.com

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/auto-parts-b2b

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# REGON API Configuration
REGON_API_KEY=your_regon_api_key_here
```

4. Uruchom serwer deweloperski:
```bash
npm run dev
```

## Konfiguracja Resend

1. Zarejestruj się na [Resend](https://resend.com)
2. Uzyskaj klucz API
3. Zweryfikuj swoją domenę
4. Zaktualizuj zmienne środowiskowe:
   - `RESEND_API_KEY` - Twój klucz API z Resend
   - `FROM_EMAIL` - Adres email z Twojej zweryfikowanej domeny

## Funkcjonalności

- System rejestracji i logowania B2B
- Weryfikacja email przy rejestracji
- Katalog produktów
- System zamówień
- Panel administracyjny

## Technologie

- Node.js
- Express.js
- MongoDB
- Resend (system mailowy)
- JWT (autoryzacja)

## Rozwój

1. Utwórz nową gałąź dla swojej funkcjonalności:
```bash
git checkout -b feature/nazwa-funkcjonalności
```

2. Wprowadź zmiany i zatwierdź je:
```bash
git add .
git commit -m "Opis zmian"
```

3. Wypchnij zmiany do repozytorium:
```bash
git push origin feature/nazwa-funkcjonalności
```

## Testy

```bash
npm test
```

## Licencja

MIT 