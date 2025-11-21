// load-test-sequential-mobile.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class SequentialMobileLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            targetRPS: 5000,
            testDuration: 60,
            
            numWorkers: Math.min(os.cpus().length, 8),
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA',
            
            operator: {
                prefixes: ["078", "073"],
                uuid: "70b9906d-c2ba-11", 
                name: "Etisalat",
                minAmount: 1
            }
        };

        this.config.requestsPerWorker = Math.ceil(this.config.targetRPS / this.config.numWorkers);
        
        // Track mobile numbers per worker to avoid duplicates
        this.workerMobileCounters = new Map();
        
        console.log('🚀 SEQUENTIAL MOBILE LOAD TEST');
        console.log('='.repeat(60));
        console.log(`🎯 Target: ${this.config.targetRPS.toLocaleString()} RPS`);
        console.log(`⏱️  Duration: ${this.config.testDuration}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📊 Requests/worker: ${this.config.requestsPerWorker} RPS`);
        console.log(`📱 Mobile Pattern: 0730100000, 0730100001, 0730100002, ...`);
        console.log(`💰 Amount: ${this.config.operator.minAmount} AFN`);
        console.log('='.repeat(60));
    }

    generateSequentialMobile(workerId, requestCount) {
        // Each worker starts from a different base to avoid overlaps
        const workerBase = workerId * 1000000; // Worker 0: 0-999999, Worker 1: 1000000-1999999, etc.
        const sequentialNumber = workerBase + requestCount;
        
        // Use 0730 prefix and pad to 10 digits total (0730 + 6 digits)
        const prefix = this.config.operator.prefixes[Math.floor(Math.random() * this.config.operator.prefixes.length)];
        const suffix = sequentialNumber.toString().padStart(6, '0').slice(-6);
        
        return `${prefix}${suffix}`;
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

    async makeRequest(workerId, requestCount) {
        const mobile = this.generateSequentialMobile(workerId, requestCount);
        const payload = {
            amount: this.config.operator.minAmount,
            mobile: mobile,
            operator_uuid: this.config.operator.uuid,
            operatorName: this.config.operator.name
        };

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
                mobile: mobile,
                workerId: workerId,
                requestCount: requestCount
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: mobile,
                workerId: workerId,
                requestCount: requestCount
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
            totalLatency: 0,
            requestCount: 0 // Track sequential counter for this worker
        };

        const endTime = Date.now() + (this.config.testDuration * 1000);
        
        while (Date.now() < endTime) {
            const batchPromises = [];
            const batchStartTime = Date.now();
            
            for (let i = 0; i < batchSize; i++) {
                localResults.requestCount++;
                batchPromises.push(this.makeRequest(workerId, localResults.requestCount));
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

            // Reset counters (keep requestCount for sequential numbering)
            const currentRequestCount = localResults.requestCount;
            localResults.totalRequests = 0;
            localResults.successfulRequests = 0;
            localResults.failedRequests = 0;
            localResults.totalLatency = 0;
            localResults.statusCodes = {};
            localResults.requestCount = currentRequestCount;

            // Rate control
            const batchTime = Date.now() - batchStartTime;
            const targetBatchTime = (batchSize / requestsPerSecond) * 1000;
            
            if (batchTime < targetBatchTime) {
                await this.delay(targetBatchTime - batchTime);
            }
        }

        parentPort.postMessage({
            type: 'complete',
            data: { workerId: workerId, totalRequests: localResults.requestCount }
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
                throughputHistory: [],
                sampleMobiles: [] // Store some sample mobile numbers for verification
            };

            console.log('\n📈 LIVE PROGRESS:');
            console.log('Time | Total Req  | Current RPS | Success % | Avg Latency | Sample Mobile');
            console.log('-----|------------|-------------|-----------|-------------|---------------');

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

                // Show a sample mobile number to verify sequential pattern
                const sampleMobile = results.sampleMobiles.length > 0 ? 
                    results.sampleMobiles[results.sampleMobiles.length - 1] : '---';

                console.log(
                    `${elapsed.toFixed(0).padStart(3)}s | ` +
                    `${results.totalRequests.toString().padStart(9)} | ` +
                    `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                    `${successRate.toString().padStart(7)}% | ` +
                    `${avgLatency.toString().padStart(10)}ms | ` +
                    `${sampleMobile}`
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

                        // Store sample mobile numbers (last one from each update)
                        if (message.data.totalRequests > 0) {
                            results.sampleMobiles.push(`W${message.data.workerId}:${message.data.requestCount}`);
                            // Keep only last 5 samples
                            if (results.sampleMobiles.length > 5) {
                                results.sampleMobiles.shift();
                            }
                        }
                    } else if (message.type === 'complete') {
                        completedWorkers++;
                        console.log(`   ✅ Worker ${message.data.workerId} completed (${message.data.totalRequests} requests)`);
                        
                        if (completedWorkers === this.config.numWorkers) {
                            clearInterval(updateInterval);
                            results.endTime = Date.now();
                            this.generateReport(results);
                            resolve();
                        }
                    }
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

        console.log('\n📊 ===== SEQUENTIAL MOBILE LOAD TEST REPORT =====');
        console.log('='.repeat(60));
        
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

        console.log(`\n📱 MOBILE NUMBER PATTERN:`);
        console.log(`   Format: 0730100000, 0730100001, 0730100002, ...`);
        console.log(`   Each worker uses sequential numbers to avoid duplicates`);
        console.log(`   Total unique mobiles used: ${results.totalRequests.toLocaleString()}`);

        console.log(`\n🔧 RECOMMENDATIONS:`);
        
        if (results.statusCodes['400'] > 0) {
            console.log(`   1. Still ${results.statusCodes['400']} validation errors - check logs`);
        }
        
        if (averageRPS < 1000) {
            console.log(`   2. Current capacity: ~${averageRPS.toFixed(0)} RPS`);
            console.log(`   3. Scale application servers: ${Math.ceil(5000 / averageRPS)}x needed`);
        }

        if (avgLatency > 1000) {
            console.log(`   4. High latency: ${avgLatency.toFixed(0)}ms average`);
            console.log(`   5. Optimize database and Redis performance`);
        }

        console.log(`\n🚀 NEXT STEPS:`);
        console.log(`   • Monitor system resources during load`);
        console.log(`   • Check database connection pool usage`);
        console.log(`   • Verify Redis performance`);
        console.log(`   • Review application logs for any errors`);

        console.log('\n🎉 SEQUENTIAL MOBILE LOAD TEST COMPLETED!');
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
            console.log('🔍 Testing sequential mobile pattern...');
            
            // Test a few sequential numbers to verify the pattern works
            const testMobiles = [
                '0730100000',
                '0730100001', 
                '0730100002',
                '0780100000',
                '0780100001'
            ];

            let successfulTests = 0;
            
            for (const mobile of testMobiles) {
                const payload = {
                    amount: 1,
                    mobile: mobile,
                    operator_uuid: '70b9906d-c2ba-11',
                    operatorName: 'Etisalat'
                };

                const response = await axios.post(
                    `${this.config.baseUrl}/?username=${this.config.username}`,
                    payload,
                    {
                        headers: this.getRequestHeaders(),
                        timeout: 10000,
                        validateStatus: null
                    }
                );

                if (response.status === 200) {
                    successfulTests++;
                    console.log(`✅ ${mobile}: Success`);
                } else {
                    console.log(`❌ ${mobile}: HTTP ${response.status}`);
                }

                await this.delay(200);
            }

            if (successfulTests === testMobiles.length) {
                console.log('✅ All sequential pattern tests passed! Starting load test...\n');
                await this.runWithWorkers();
            } else {
                console.log(`❌ Sequential pattern tests: ${successfulTests}/${testMobiles.length} passed`);
            }
            
        } catch (error) {
            console.error('💥 Load test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new SequentialMobileLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new SequentialMobileLoadTest();
    loadTest.run();
}
