// load-test-diagnostic.js
const axios = require('axios');

class DiagnosticLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA'
        };
    }

    getRequestHeaders() {
        return {
            "authorization": this.config.authToken,
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        };
    }

    async testVariousPayloads() {
        console.log('🔍 DIAGNOSING HTTP 400 ERRORS');
        console.log('='.repeat(50));
        
        const testCases = [
            {
                name: "Basic working payload",
                payload: {
                    amount: 1,
                    mobile: '0730123456',
                    operator_uuid: '70b9906d-c2ba-11',
                    operatorName: 'Etisalat'
                }
            },
            {
                name: "With user_detials (from your code)",
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
                name: "Different amount",
                payload: {
                    amount: 10,
                    mobile: '0730123456',
                    operator_uuid: '70b9906d-c2ba-11',
                    operatorName: 'Etisalat'
                }
            },
            {
                name: "Different mobile pattern",
                payload: {
                    amount: 1,
                    mobile: '0790123456', // Roshan pattern
                    operator_uuid: '70b9906d-c2ba-11', 
                    operatorName: 'Etisalat'
                }
            },
            {
                name: "Correct operator for mobile",
                payload: {
                    amount: 1,
                    mobile: '0790123456',
                    operator_uuid: '9edb602c-c2ba-11', // Roshan UUID
                    operatorName: 'Roshan'
                }
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n🧪 Testing: ${testCase.name}`);
            console.log('Payload:', JSON.stringify(testCase.payload, null, 2));

            try {
                const response = await axios.post(
                    `${this.config.baseUrl}/?username=${this.config.username}`,
                    testCase.payload,
                    { 
                        headers: this.getRequestHeaders(),
                        timeout: 10000,
                        validateStatus: null 
                    }
                );

                console.log(`📋 Response: HTTP ${response.status}`);
                
                if (response.status === 200) {
                    console.log('✅ SUCCESS:', response.data.message);
                } else if (response.status === 400) {
                    console.log('❌ VALIDATION ERROR:');
                    if (response.data && response.data.errors) {
                        response.data.errors.forEach(error => {
                            console.log(`   - ${error.msg || error.message}`);
                        });
                    } else {
                        console.log('   No detailed error message provided');
                    }
                } else {
                    console.log('Data:', JSON.stringify(response.data, null, 2));
                }

            } catch (error) {
                console.log('❌ Request failed:', error.message);
            }

            await this.delay(1000); // Wait between tests
        }
    }

    async analyzeHighVolumeIssues() {
        console.log('\n🔬 ANALYZING HIGH-VOLUME ISSUES');
        console.log('='.repeat(40));
        
        console.log('\nTesting rapid consecutive requests...');
        
        const mobiles = [];
        for (let i = 0; i < 10; i++) {
            mobiles.push(`0730${Math.random().toString().slice(2, 8)}`);
        }

        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < mobiles.length; i++) {
            const payload = {
                amount: 1,
                mobile: mobiles[i],
                operator_uuid: '70b9906d-c2ba-11',
                operatorName: 'Etisalat'
            };

            try {
                const response = await axios.post(
                    `${this.config.baseUrl}/?username=${this.config.username}`,
                    payload,
                    { 
                        headers: this.getRequestHeaders(),
                        timeout: 5000,
                        validateStatus: null 
                    }
                );

                if (response.status === 200) {
                    successCount++;
                    console.log(`   ✅ ${mobiles[i]}: Success`);
                } else {
                    failureCount++;
                    console.log(`   ❌ ${mobiles[i]}: HTTP ${response.status}`);
                    if (response.data && response.data.errors) {
                        console.log(`      ${response.data.errors[0]?.msg}`);
                    }
                }
            } catch (error) {
                failureCount++;
                console.log(`   ❌ ${mobiles[i]}: ${error.message}`);
            }

            // No delay between requests to simulate high load
        }

        console.log(`\n📊 Quick Load Test: ${successCount}/10 successful (${(successCount/10*100).toFixed(0)}%)`);
    }

    async checkSystemLimits() {
        console.log('\n📋 CHECKING SYSTEM LIMITS & CONFIGURATION');
        console.log('='.repeat(50));
        
        console.log('\nPossible causes of HTTP 400 errors:');
        console.log('1. 🔄 Duplicate mobile number detection');
        console.log('2. 💰 Insufficient user balance');
        console.log('3. ⏱️ Rate limiting on same user/mobile');
        console.log('4. 🔒 Operator-specific restrictions');
        console.log('5. 📱 Mobile number validation rules');
        console.log('6. 🚫 Stock transfer status checks');
        console.log('7. 👥 User permission issues');
        console.log('8. 🗄️ Database connection limits');
        
        console.log('\n💡 Based on your recharge controller code:');
        console.log('   - Checks STOCK_TRANSFER_STATUS in Redis');
        console.log('   - Validates mobile number matches operator');
        console.log('   - Checks user balance and permissions');
        console.log('   - Prevents duplicate recharges within 5 minutes');
        console.log('   - Validates operator is active');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        await this.testVariousPayloads();
        await this.analyzeHighVolumeIssues();
        await this.checkSystemLimits();
        
        console.log('\n🎯 RECOMMENDED NEXT STEPS:');
        console.log('1. Check your application logs for 400 error details');
        console.log('2. Verify Redis is running and STOCK_TRANSFER_STATUS is set');
        console.log('3. Check user balance and transaction limits');
        console.log('4. Review operator configuration in database');
        console.log('5. Monitor database connection pool usage');
    }
}

// Run the diagnostic
const diagnostic = new DiagnosticLoadTest();
diagnostic.run();