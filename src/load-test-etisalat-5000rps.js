// load-test-etisalat-5000rps.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class EtisalatLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            targetRPS: 5000,
            testDuration: 60,
            
            numWorkers: Math.min(os.cpus().length, 8),
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA',
            
            // ETISALAT ONLY - CORRECT CONFIGURATION
            operator: {
                prefixes: ["078", "073"], // Correct Etisalat prefixes
                uuid: "70b9906d-c2ba-11", 
                name: "Etisalat",
                minAmount: 1, // From your successful test
                maxAmount: 10
            }
        };

        this.config.requestsPerWorker = Math.ceil(this.config.targetRPS / this.config.numWorkers);
        this.usedMobiles = new Set();
        
        console.log('🚀 ETISALAT 5000 RPS LOAD TEST');
        console.log('='.repeat(60));
        console.log(`🎯 Target: ${this.config.targetRPS.toLocaleString()} RPS`);
        console.log(`⏱️  Duration: ${this.config.testDuration}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📊 Requests/worker: ${this.config.requestsPerWorker} RPS`);
        console.log(`🏢 Operator: ${this.config.operator.name}`);
        console.log(`📱 Prefixes: ${this.config.operator.prefixes.join(', ')}`);
        console.log(`💰 Amount: ${this.config.operator.minAmount} AFN`);
        console.log('='.repeat(60));
    }

    generateUniqueMobile() {
        let mobile;
        let attempts = 0;
        
        do {
            const prefix = this.config.operator.prefixes[Math.floor(Math.random() * this.config.operator.prefixes.length)];
            const randomSuffix = Math.random().toString().slice(2, 8); // 6 random digits
            mobile = `${prefix}${randomSuffix}`;
            attempts++;
            
            // Clear some old entries if we have too many
            if (attempts > 50 && this.usedMobiles.size > 5000) {
                const values = Array.from(this.usedMobiles);
                for (let i = 0; i < 1000; i++) {
                    this.usedMobiles.delete(values[i]);
                }
            }
        } while (this.usedMobiles.has(mobile) && attempts < 100);
        
        this.usedMobiles.add(mobile);
        return mobile;
    }

    generateTestPayload() {
        return {
            amount: this.config.operator.minAmount, // Always use minimum amount
            mobile: this.generateUniqueMobile(),
            operator_uuid: this.config.operator.uuid,
            operatorName: this.config.operator.name
        };
    }

    getRequestHeaders() {
        return {
            "Connection": "upgrade",
            "Host": "newtopuptest.afghan-pay.com",
            "X-Real-IP": "172.70.189.59",
            "X-Forwarded-For": "103.53.26.5, 172.70.189.59",
            "X-Forwarded-Proto": "http",
            "authorization": this.config.authToken,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json",
            "origin": "https://newtopuptest.afghan-pay.com",
            "referer": "https://newtopuptest.afghan-pay.com/agent/recharge"
        };
    }

    async makeRequest(workerId) {
        const payload = this.generateTestPayload();
        const startTime = Date.now();
        
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

            const latency = Date.now() - startTime;
            const isSuccess = response.status === 200;

            return {
                success: isSuccess,
                latency: latency,
                status: response.status,
                data: response.data,
                mobile: payload.mobile,
                workerId: workerId
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: payload.mobile,
                workerId: workerId
            };
        }
    }

    async runWorker(workerId) {
        const requestsPerSecond = this.config.requestsPerWorker;
        const batchSize = Math.max(5, Math.floor(requestsPerSecond / 10));
        
        let localResults = {
            workerId: workerId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            statusCodes: {},
            totalLatency: 0
        };

        const endTime = Date.now() + (this.config.testDuration * 1000);
        
        while (Date.now() < endTime) {
            const batchPromises = [];
            const batchStartTime = Date.now();
            
            for (let i = 0; i < batchSize; i++) {
                batchPromises.push(this.makeRequest(workerId));
            }

            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const requestResult = result.value;
                    localResults.totalRequests++;
                    localResults.totalLatency += requestResult.latency;
                    
                    const statusCode = requestResult.status;
                    localResults.statusCodes[statusCode] = (localResults.statusCodes[statusCode] || 0) + 1;
                    
                    if (requestResult.success) {
                        localResults.successfulRequests++;
                    } else {
                        localResults.failedRequests++;
                    }
                }
            });

            // Send update
            parentPort.postMessage({
                type: 'update',
                data: { ...localResults, timestamp: Date.now() }
            });

            // Reset counters
            localResults.totalRequests = 0;
            localResults.successfulRequests = 0;
            localResults.failedRequests = 0;
            localResults.totalLatency = 0;
            localResults.statusCodes = {};

            // Precise rate control
            const batchTime = Date.now() - batchStartTime;
            const targetBatchTime = (batchSize / requestsPerSecond) * 1000;
            
            if (batchTime < targetBatchTime) {
                await this.delay(targetBatchTime - batchTime);
            }
        }

        parentPort.postMessage({
            type: 'complete',
            data: { workerId: workerId }
        });
    }

    async runWithWorkers() {
        return new Promise((resolve, reject) => {
            const workers = [];
            let completedWorkers = 0;

            const results = {
                startTime: Date.now(),
                endTime: null,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalLatency: 0,
                statusCodes: {},
                throughputHistory: []
            };

            console.log('\n📈 LIVE PROGRESS:');
            console.log('Time | Total Req  | Current RPS | Success % | Avg Latency | Status');
            console.log('-----|------------|-------------|-----------|-------------|--------');

            let lastUpdateTime = Date.now();
            let lastTotalRequests = 0;

            const updateInterval = setInterval(() => {
                const currentTime = Date.now();
                const elapsed = (currentTime - results.startTime) / 1000;
                const currentRPS = ((results.totalRequests - lastTotalRequests) / ((currentTime - lastUpdateTime) / 1000)) || 0;
                
                const successRate = results.totalRequests > 0 ? 
                    (results.successfulRequests / results.totalRequests * 100).toFixed(1) : 0;

                const avgLatency = results.successfulRequests > 0 ? 
                    (results.totalLatency / results.successfulRequests).toFixed(0) : 0;

                const statusSummary = Object.entries(results.statusCodes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([code, count]) => `${code}:${count}`)
                    .join(', ');

                console.log(
                    `${elapsed.toFixed(0).padStart(3)}s | ` +
                    `${results.totalRequests.toString().padStart(9)} | ` +
                    `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                    `${successRate.toString().padStart(7)}% | ` +
                    `${avgLatency.toString().padStart(10)}ms | ` +
                    `${statusSummary}`
                );

                results.throughputHistory.push({
                    timestamp: currentTime,
                    rps: currentRPS,
                    successRate: successRate
                });

                lastUpdateTime = currentTime;
                lastTotalRequests = results.totalRequests;
            }, 2000);

            for (let i = 0; i < this.config.numWorkers; i++) {
                const worker = new Worker(__filename, {
                    workerData: {
                        workerId: i,
                        config: this.config
                    }
                });

                worker.on('message', (message) => {
                    if (message.type === 'update') {
                        results.totalRequests += message.data.totalRequests;
                        results.successfulRequests += message.data.successfulRequests;
                        results.failedRequests += message.data.failedRequests;
                        results.totalLatency += message.data.totalLatency;
                        
                        Object.entries(message.data.statusCodes).forEach(([code, count]) => {
                            results.statusCodes[code] = (results.statusCodes[code] || 0) + count;
                        });
                    } else if (message.type === 'complete') {
                        completedWorkers++;
                        console.log(`   ✅ Worker ${message.data.workerId} completed`);
                        
                        if (completedWorkers === this.config.numWorkers) {
                            clearInterval(updateInterval);
                            results.endTime = Date.now();
                            this.generateReport(results);
                            resolve();
                        }
                    }
                });

                worker.on('error', (error) => {
                    console.error(`   ❌ Worker ${i} error:`, error.message);
                });

                workers.push(worker);
            }
        });
    }

    generateReport(results) {
        const duration = (results.endTime - results.startTime) / 1000;
        const averageRPS = results.totalRequests / duration;
        const successRate = (results.successfulRequests / results.totalRequests * 100);
        const avgLatency = results.successfulRequests > 0 ? 
            (results.totalLatency / results.successfulRequests) : 0;

        const peakRPS = Math.max(...results.throughputHistory.map(h => h.rps));

        console.log('\n📊 ===== ETISALAT LOAD TEST REPORT =====');
        console.log('='.repeat(50));
        
        console.log(`\n🎯 PERFORMANCE SUMMARY`);
        console.log(`   Target RPS: ${this.config.targetRPS.toLocaleString()}`);
        console.log(`   Achieved RPS: ${averageRPS.toLocaleString()}`);
        console.log(`   Peak RPS: ${peakRPS.toLocaleString()}`);
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Average Latency: ${avgLatency.toFixed(0)}ms`);
        console.log(`   Duration: ${duration.toFixed(2)} seconds`);
        console.log(`   Total Requests: ${results.totalRequests.toLocaleString()}`);
        console.log(`   Successful: ${results.successfulRequests.toLocaleString()}`);
        console.log(`   Failed: ${results.failedRequests.toLocaleString()}`);

        console.log(`\n📋 STATUS CODE ANALYSIS`);
        Object.entries(results.statusCodes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([code, count]) => {
                const percentage = ((count / results.totalRequests) * 100).toFixed(1);
                const codeName = this.getStatusCodeName(code);
                console.log(`   ${code} (${codeName}): ${count.toLocaleString()} (${percentage}%)`);
            });

        console.log(`\n💪 CAPACITY ASSESSMENT`);
        const targetAchievement = (averageRPS / this.config.targetRPS) * 100;
        console.log(`   Target Achievement: ${targetAchievement.toFixed(1)}%`);

        if (averageRPS >= this.config.targetRPS * 0.9) {
            console.log(`   🎉 EXCELLENT: System can handle 5,000 RPS!`);
        } else if (averageRPS >= 1000) {
            console.log(`   ✅ GOOD: ${averageRPS.toLocaleString()} RPS achieved`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / averageRPS)}x for 5,000 RPS`);
        } else if (averageRPS >= 500) {
            console.log(`   ⚠️  MODERATE: ${averageRPS.toLocaleString()} RPS`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / averageRPS)}x for 5,000 RPS`);
        } else {
            console.log(`   🔴 LIMITED: ${averageRPS.toLocaleString()} RPS`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / averageRPS)}x for 5,000 RPS`);
        }

        console.log(`\n🔧 RECOMMENDATIONS:`);
        
        if (results.statusCodes['400'] > 0) {
            console.log(`   1. Fix ${results.statusCodes['400']} validation errors`);
            console.log(`   2. Check mobile number format: 078/073 + 7 digits`);
            console.log(`   3. Verify user balance and permissions`);
        }
        
        if (averageRPS < 1000) {
            console.log(`   4. Current bottleneck: ~${averageRPS.toFixed(0)} RPS`);
            console.log(`   5. Scale application servers: ${Math.ceil(5000 / averageRPS)}x needed`);
            console.log(`   6. Optimize database connections: ${35 * Math.ceil(5000 / averageRPS)} total connections needed`);
        }

        if (avgLatency > 1000) {
            console.log(`   7. High latency: ${avgLatency.toFixed(0)}ms average`);
            console.log(`   8. Optimize database queries and Redis caching`);
        }

        console.log(`\n🚀 NEXT STEPS:`);
        console.log(`   • Check application logs for error details`);
        console.log(`   • Monitor database CPU and connection pool`);
        console.log(`   • Verify Redis is running and responsive`);
        console.log(`   • Review Nginx access/error logs`);

        console.log('\n🎉 ETISALAT LOAD TEST COMPLETED!');
    }

    getStatusCodeName(code) {
        const statusNames = {
            '200': 'OK',
            '400': 'Bad Request', 
            '429': 'Too Many Requests',
            '500': 'Internal Server Error',
            '0': 'Network Error'
        };
        return statusNames[code] || 'Unknown';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            console.log('🔍 Performing health check...');
            
            // Test with both Etisalat prefixes
            const testPayloads = [
                {
                    amount: 1,
                    mobile: '0781234567',
                    operator_uuid: '70b9906d-c2ba-11',
                    operatorName: 'Etisalat'
                },
                {
                    amount: 1,
                    mobile: '0731234567', 
                    operator_uuid: '70b9906d-c2ba-11',
                    operatorName: 'Etisalat'
                }
            ];

            let healthChecksPassed = 0;
            
            for (const testPayload of testPayloads) {
                const testResponse = await axios.post(
                    `${this.config.baseUrl}/?username=${this.config.username}`,
                    testPayload,
                    {
                        headers: this.getRequestHeaders(),
                        timeout: 10000,
                        validateStatus: null
                    }
                );

                if (testResponse.status === 200) {
                    healthChecksPassed++;
                    console.log(`✅ ${testPayload.mobile}: Success`);
                } else {
                    console.log(`❌ ${testPayload.mobile}: HTTP ${testResponse.status}`);
                }
            }

            if (healthChecksPassed === testPayloads.length) {
                console.log('✅ All health checks passed! Starting 5000 RPS load test...\n');
                await this.runWithWorkers();
            } else {
                console.log(`❌ Health checks failed: ${healthChecksPassed}/${testPayloads.length} passed`);
            }
            
        } catch (error) {
            console.error('💥 Load test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new EtisalatLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new EtisalatLoadTest();
    loadTest.run();
}

module.exports = EtisalatLoadTest;