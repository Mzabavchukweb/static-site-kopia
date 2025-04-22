const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Resend } = require('resend');

const resend = new Resend('re_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9');

// Szablon emaila weryfikacyjnego
const getVerificationEmailTemplate = (userName, verificationLink) => {
    return {
        from: 'onboarding@resend.dev',
        subject: 'Weryfikacja konta B2B - AutoParts',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Witaj ${userName}!</h2>
                
                <p>Dziękujemy za rejestrację w systemie AutoParts B2B. Aby aktywować swoje konto, kliknij w poniższy link:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Aktywuj konto
                    </a>
                </div>
                
                <p>Link jest ważny przez 24 godziny. Jeśli nie rejestrowałeś się w naszym systemie, zignoruj tę wiadomość.</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">
                        Z poważaniem,<br>
                        Zespół AutoParts B2B
                    </p>
                </div>
            </div>
        `
    };
};

// Funkcja do wysyłania maila
const sendEmail = async (to, template) => {
    // W trybie testowym możemy wysyłać tylko na zweryfikowany adres
    const testEmail = 'zabavchukmaks21@gmail.com';
    
    try {
        const { data, error } = await resend.emails.send({
            from: template.from,
            to: testEmail, // Używamy testowego adresu
            subject: template.subject,
            html: template.html
        });

        if (error) {
            console.error('Błąd wysyłania maila:', error);
            throw new Error('Błąd wysyłania maila');
        }

        return data;
    } catch (error) {
        console.error('Błąd wysyłania maila:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    getVerificationEmailTemplate
}; 