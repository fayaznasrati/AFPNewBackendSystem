// load-test-etisalat.js
const axios = require('axios');

class EtisalatLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            testDuration: 60, // 1 minute quick test
            requestsPerSecond: 100,
            concurrentUsers: 5
        };

        // Fixed authorization token from your headers
        this.authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA';
        
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            latencies: [],
            startTime: null,
            endTime: null,
            errors: []
        };
    }

    generateMobileNumber() {
        // Always start with 0730, then add 6 random digits
        const randomSuffix = Math.random().toString().slice(2, 8); // 6 random digits
        return `0730${randomSuffix}`;
    }

    generateTestPayload() {
        return {
            amount: 1,
            mobile: this.generateMobileNumber(),
            operator_uuid: '70b9906d-c2ba-11',
            operatorName: 'Etisalat'
        };
    }

    getRequestHeaders() {
        return {
            "Connection": "upgrade",
            "Host": "newtopuptest.afghan-pay.com",
            "X-Real-IP": "172.70.189.59",
            "X-Forwarded-For": "103.53.26.5, 172.70.189.59",
            "X-Forwarded-Proto": "http",
            "priority": "u=1, i",
            "sec-ch-ua-platform": "\"Windows\"",
            "authorization": this.authToken,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            "accept": "application/json, text/plain, */*",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "content-type": "application/json",
            "sec-ch-ua-mobile": "?0",
            "origin": "https://newtopuptest.afghan-pay.com",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            "referer": "https://newtopuptest.afghan-pay.com/agent/recharge",
            "accept-encoding": "gzip, br",
            "accept-language": "en-US,en;q=0.9,fa-IR;q=0.8,fa;q=0.7",
            "cf-ray": "9a2137b3bd256bfd-SIN",
            "cdn-loop": "cloudflare; loops=1",
            "CF-Connecting-IP": "103.53.26.5",
            "CF-IPCountry": "AF",
            "CF-Visitor": "{\"scheme\":\"https\"}"
        };
    }

    async makeRequest() {
        const payload = this.generateTestPayload();
        const startTime = Date.now();
        
        try {
            const response = await axios.post(
                `${this.config.baseUrl}/?username=${this.config.username}`,
                payload,
                {
                    headers: this.getRequestHeaders(),
                    timeout: 30000,
                    validateStatus: function (status) {
                        return status < 500; // Resolve only if status code < 500
                    }
                }
            );

            const latency = Date.now() - startTime;
            
            return {
                success: true,
                latency: latency,
                status: response.status,
                mobile: payload.mobile,
                response: response.data
            };
            
        } catch (error) {
            const errorInfo = {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: error.response?.status,
                mobile: payload.mobile,
                response: error.response?.data
            };
            
            this.results.errors.push(errorInfo);
            return errorInfo;
        }
    }

    async runLoadTest() {
        console.log('🎯 ETISALAT RECHARGE LOAD TEST');
        console.log('='.repeat(50));
        console.log(`🌐 Endpoint: ${this.config.baseUrl}`);
        console.log(`👤 Username: ${this.config.username}`);
        console.log(`⏱️  Duration: ${this.config.testDuration} seconds`);
        console.log(`🔥 Target: ${this.config.requestsPerSecond} RPS`);
        console.log(`👥 Concurrent Users: ${this.config.concurrentUsers}`);
        console.log(`📱 Mobile Prefix: 0730 (Etisalat)`);
        console.log('='.repeat(50));

        this.results.startTime = Date.now();
        const endTime = this.results.startTime + (this.config.testDuration * 1000);
        
        let lastPrintTime = Date.now();
        let requestCounter = 0;

        console.log('\n🚀 STARTING LOAD TEST...\n');

        while (Date.now() < endTime) {
            const batchPromises = [];
            const batchStartTime = Date.now();
            
            // Create concurrent requests
            for (let i = 0; i < this.config.concurrentUsers; i++) {
                batchPromises.push(this.makeRequest());
                requestCounter++;
            }

            // Execute batch
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Process results
            this.processBatchResults(batchResults);
            
            // Progress display every 5 seconds
            const currentTime = Date.now();
            if (currentTime - lastPrintTime >= 5000) {
                const elapsed = (currentTime - this.results.startTime) / 1000;
                const rps = this.results.totalRequests / elapsed;
                const successRate = (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(1);
                
                console.log(`⏱️  ${elapsed.toFixed(1)}s | 📊 ${this.results.totalRequests} req | ✅ ${this.results.successfulRequests} | ❌ ${this.results.failedRequests} | 🎯 ${successRate}% | 🔥 ${rps.toFixed(1)} RPS`);
                lastPrintTime = currentTime;
            }

            // Maintain RPS rate
            const batchTime = Date.now() - batchStartTime;
            const targetBatchTime = (this.config.concurrentUsers / this.config.requestsPerSecond) * 1000;
            
            if (batchTime < targetBatchTime) {
                await this.delay(targetBatchTime - batchTime);
            }
        }

        this.results.endTime = Date.now();
    }

    processBatchResults(batchResults) {
        batchResults.forEach(result => {
            this.results.totalRequests++;
            
            if (result.status === 'fulfilled') {
                const requestResult = result.value;
                
                if (requestResult.success) {
                    this.results.successfulRequests++;
                    this.results.latencies.push(requestResult.latency);
                } else {
                    this.results.failedRequests++;
                }
            } else {
                this.results.failedRequests++;
                this.results.errors.push({
                    error: result.reason?.message || 'Unknown error',
                    mobile: 'Unknown'
                });
            }
        });
    }

    generateDetailedReport() {
        const duration = (this.results.endTime - this.results.startTime) / 1000;
        const totalRequests = this.results.totalRequests;
        const successfulRequests = this.results.successfulRequests;
        const failedRequests = this.results.failedRequests;
        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100) : 0;
        const requestsPerSecond = totalRequests / duration;

        // Calculate latency statistics
        let avgLatency = 0;
        let minLatency = Infinity;
        let maxLatency = 0;
        let p95Latency = 0;

        if (this.results.latencies.length > 0) {
            avgLatency = this.results.latencies.reduce((a, b) => a + b, 0) / this.results.latencies.length;
            minLatency = Math.min(...this.results.latencies);
            maxLatency = Math.max(...this.results.latencies);
            
            // Calculate 95th percentile
            const sortedLatencies = [...this.results.latencies].sort((a, b) => a - b);
            const p95Index = Math.floor(sortedLatencies.length * 0.95);
            p95Latency = sortedLatencies[p95Index];
        }

        console.log('\n📈 ===== LOAD TEST RESULTS =====');
        console.log('='.repeat(40));
        console.log(`🎯 TEST CONFIGURATION`);
        console.log(`   Endpoint: ${this.config.baseUrl}`);
        console.log(`   Operator: Etisalat (0730 prefix)`);
        console.log(`   Amount: 1 AFN`);
        console.log(`   Duration: ${duration.toFixed(2)} seconds`);
        
        console.log(`\n📊 PERFORMANCE METRICS`);
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Successful: ${successfulRequests}`);
        console.log(`   Failed: ${failedRequests}`);
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Throughput: ${requestsPerSecond.toFixed(2)} requests/second`);
        
        console.log(`\n⏱️  LATENCY STATISTICS`);
        console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
        console.log(`   Minimum: ${minLatency === Infinity ? 'N/A' : minLatency + 'ms'}`);
        console.log(`   Maximum: ${maxLatency}ms`);
        console.log(`   95th Percentile: ${p95Latency}ms`);

        // Error analysis
        if (this.results.errors.length > 0) {
            console.log(`\n❌ ERROR ANALYSIS (${this.results.errors.length} errors)`);
            
            const errorCounts = {};
            this.results.errors.forEach(error => {
                const errorKey = error.status || error.error;
                errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
            });

            Object.entries(errorCounts).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} occurrences`);
            });
        }

        // Performance assessment
        console.log(`\n💡 PERFORMANCE ASSESSMENT`);
        if (successRate >= 95) {
            console.log(`   ✅ EXCELLENT: High success rate`);
        } else if (successRate >= 80) {
            console.log(`   ⚠️  GOOD: Acceptable success rate`);
        } else {
            console.log(`   🔴 POOR: Low success rate - check errors`);
        }

        if (avgLatency < 500) {
            console.log(`   ✅ EXCELLENT: Low latency`);
        } else if (avgLatency < 1000) {
            console.log(`   ⚠️  ACCEPTABLE: Moderate latency`);
        } else {
            console.log(`   🔴 HIGH: Latency needs optimization`);
        }

        if (requestsPerSecond >= 50) {
            console.log(`   🚀 EXCELLENT: High throughput`);
        } else if (requestsPerSecond >= 20) {
            console.log(`   ✅ GOOD: Decent throughput`);
        } else {
            console.log(`   ⚠️  LOW: Throughput needs improvement`);
        }

        console.log(`\n🎯 RECOMMENDATIONS`);
        if (this.results.errors.length > 0) {
            console.log(`   1. Check server logs for error details`);
            console.log(`   2. Verify database connection pool`);
            console.log(`   3. Monitor Redis cache performance`);
        }
        console.log(`   4. Consider increasing RPS for stress testing`);
        console.log(`   5. Monitor system resources during peak load`);

        console.log('\n🎉 LOAD TEST COMPLETED!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            // Quick pre-test to verify endpoint
            console.log('🔍 Verifying endpoint connectivity...');
            const testPayload = this.generateTestPayload();
            testPayload.mobile = '0730123456'; // Fixed test number
            
            const testResponse = await axios.post(
                `${this.config.baseUrl}/?username=${this.config.username}`,
                testPayload,
                {
                    headers: this.getRequestHeaders(),
                    timeout: 10000
                }
            );
            
            console.log(`✅ Endpoint verified - Status: ${testResponse.status}`);
            
            // Run the actual load test
            await this.runLoadTest();
            this.generateDetailedReport();
            
        } catch (error) {
            console.error('💥 Load test failed:', error.message);
            console.log('\n🔧 TROUBLESHOOTING:');
            console.log('   1. Check if the server is accessible');
            console.log('   2. Verify the authorization token is valid');
            console.log('   3. Check network connectivity');
            console.log('   4. Verify the endpoint URL is correct');
        }
    }
}

// Command line execution
if (require.main === module) {
    const loadTest = new EtisalatLoadTest();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--stress')) {
        loadTest.config.testDuration = 300; // 5 minutes
        loadTest.config.requestsPerSecond = 50;
        loadTest.config.concurrentUsers = 25;
        console.log('🔥 STRESS TEST MODE ACTIVATED');
    } else if (args.includes('--quick')) {
        loadTest.config.testDuration = 30; // 30 seconds
        loadTest.config.requestsPerSecond = 5;
        loadTest.config.concurrentUsers = 3;
        console.log('⚡ QUICK TEST MODE ACTIVATED');
    }
    
    loadTest.run();
}

module.exports = EtisalatLoadTest;