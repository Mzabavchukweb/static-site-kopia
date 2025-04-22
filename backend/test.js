const { Resend } = require('resend');

const resend = new Resend('re_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9');

async function main() {
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'zabavchukmaks21@gmail.com',
            subject: 'Test Email',
            html: '<p>Test email from Resend!</p>'
        });

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 