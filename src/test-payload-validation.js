// test-payload-validation.js
const axios = require('axios');

async function testPayloadValidation() {
    console.log('🔍 TESTING PAYLOAD VALIDATION');
    console.log('='.repeat(40));

    const baseUrl = 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single';
    const username = 'AFP-77454';
    const authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA';

    const headers = {
        "authorization": authToken,
        "content-type": "application/json"
    };

    // Test the exact payload that should work
    const payload = {
        amount: 1,
        mobile: '0730123456',
        operator_uuid: '70b9906d-c2ba-11',
        operatorName: 'Etisalat'
    };

    console.log('Testing payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(
            `${baseUrl}/?username=${username}`,
            payload,
            { headers, timeout: 10000, validateStatus: null }
        );

        console.log(`\n📋 RESPONSE:`);
        console.log(`Status: HTTP ${response.status}`);
        console.log(`Data:`, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            console.log('\n✅ SUCCESS! This payload works correctly.');
            console.log('You can now run the 5000 RPS load test.');
        } else {
            console.log('\n❌ Payload rejected. Possible issues:');
            if (response.data && response.data.errors) {
                response.data.errors.forEach(error => {
                    console.log(`   - ${error.msg || error.message}`);
                });
            }
        }

    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

testPayloadValidation();