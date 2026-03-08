const { sendOtpEmail } = require('./utils/emailService');

async function runTest() {
    const testEmail = 'codewithtom37@gmail.com';
    console.log(`🚀 Starting manual email test to: ${testEmail}...`);

    try {
        const result = await sendOtpEmail(testEmail, 'TEST-654321');
        console.log('✅ TEST SUCCESSFUL!');
        console.log('Result:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.command) console.error('SMTP Command:', error.command);
        if (error.response) console.error('SMTP Response:', error.response);
        if (error.stack) console.error('Stack Trace:', error.stack);
        process.exit(1);
    }
}

runTest();
