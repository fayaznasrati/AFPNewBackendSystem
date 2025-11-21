// diagnose-400.js
const axios = require('axios');

async function diagnose400Error() {
    console.log('🔍 DIAGNOSING HTTP 400 ERRORS');
    console.log('='.repeat(40));

    const baseUrl = 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single';
    const username = 'AFP-77454';
    const authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA';

    const headers = {
        "authorization": authToken,
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
    };

    // Test different payload variations
    const testCases = [
        {
            name: "Minimum payload",
            payload: {
                amount: 1,
                mobile: '0730123456',
                operator_uuid: '70b9906d-c2ba-11',
                operatorName: 'Etisalat'
            }
        },
        {
            name: "With user_detials",
            payload: {
                amount: 1,
                mobile: '0730123456',
                operator_uuid: '70b9906d-c2ba-11',
                operatorName: 'Etisalat',
                user_detials: {
                    userid: 2,
                    user_uuid: "5ad59565-c2a6-11",
                    mobile: "0771234567",
                    type: 2,
                    name: "Test Agent",
                    username: "AFP-77454",
                    region_id: 1
                }
            }
        },
        {
            name: "Full payload",
            payload: {
                amount: 1,
                mobile: '0730123456',
                operator_uuid: '70b9906d-c2ba-11',
                operatorName: 'Etisalat',
                user_detials: {
                    userid: 2,
                    user_uuid: "5ad59565-c2a6-11",
                    mobile: "0771234567",
                    type: 2,
                    name: "Test Agent",
                    username: "AFP-77454",
                    region_id: 1
                },
                userApplicationType: 'Web',
                userIpAddress: '172.70.189.59'
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log('Payload:', JSON.stringify(testCase.payload, null, 2));

        try {
            const response = await axios.post(
                `${baseUrl}/?username=${username}`,
                testCase.payload,
                { headers, timeout: 10000, validateStatus: null }
            );

            console.log(`Response: HTTP ${response.status}`);
            console.log('Data:', JSON.stringify(response.data, null, 2));

            if (response.status === 200) {
                console.log('✅ SUCCESS! This payload works.');
                break;
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

diagnose400Error();