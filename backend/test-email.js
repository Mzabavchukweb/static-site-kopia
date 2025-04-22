const { Resend } = require('resend');

const resend = new Resend('re_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9');

async function main() {
    try {
        console.log('Starting test email send...');
        
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'zabavchukmaks21@gmail.com',
            subject: 'Test Email - AutoParts B2B',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Test Email</h2>
                    <p>To jest testowa wiadomość z systemu AutoParts B2B.</p>
                    <p>Jeśli otrzymałeś tego maila, oznacza to, że system mailowy działa poprawnie!</p>
                    <p>Czas wysłania: ${new Date().toLocaleString()}</p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 