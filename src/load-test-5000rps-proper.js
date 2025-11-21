// load-test-5000rps-proper.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class ProperLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            targetRPS: 5000,
            testDuration: 60,
            
            numWorkers: Math.min(os.cpus().length, 8),
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA',
            
            // Operators with correct prefixes and minimum amounts
            operators: [
                { 
                    prefix: "0730", 
                    uuid: "70b9906d-c2ba-11", 
                    name: "Etisalat",
                    minAmount: 25,
                    maxAmount: 25
                },
                { 
                    prefix: "077", 
                    uuid: "456a6b47-c2ba-11", 
                    name: "MTN",
                    minAmount: 25,
                    maxAmount: 25
                },
                { 
                    prefix: "0799", 
                    uuid: "9edb602c-c2ba-11", 
                    name: "Roshan",
                    minAmount: 25, // Roshan requires minimum 25 AFN
                    maxAmount: 25
                },
                { 
                    prefix: "0745", 
                    uuid: "1e0e1eeb-c2a6-11", 
                    name: "Salaam",
                    minAmount: 50,
                    maxAmount: 25
                },
                { 
                    prefix: "0700", 
                    uuid: "6a904d84-c2a6-11", 
                    name: "AWCC",
                    minAmount: 25,
                    maxAmount: 25
                }
            ]
        };

        this.config.requestsPerWorker = Math.ceil(this.config.targetRPS / this.config.numWorkers);
        this.usedMobiles = new Map(); // Track used mobiles per operator
        
        console.log('🚀 PROPER 5000 RPS LOAD TEST');
        console.log('='.repeat(60));
        console.log(`🎯 Target: ${this.config.targetRPS.toLocaleString()} RPS`);
        console.log(`⏱️  Duration: ${this.config.testDuration}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📊 Requests/worker: ${this.config.requestsPerWorker} RPS`);
        console.log(`🏢 Operators: ${this.config.operators.map(op => `${op.name} (min ${op.minAmount} AFN)`).join(', ')}`);
        console.log('='.repeat(60));
    }

    generateUniqueMobile(operator) {
        if (!this.usedMobiles.has(operator.prefix)) {
            this.usedMobiles.set(operator.prefix, new Set());
        }
        
        const usedSet = this.usedMobiles.get(operator.prefix);
        let mobile;
        let attempts = 0;
        
        do {
            const randomSuffix = Math.random().toString().slice(2, 8);
            mobile = `${operator.prefix}${randomSuffix}`;
            attempts++;
            
            // Clear some old entries if we have too many
            if (attempts > 50 && usedSet.size > 1000) {
                const values = Array.from(usedSet);
                for (let i = 0; i < 500; i++) {
                    usedSet.delete(values[i]);
                }
            }
        } while (usedSet.has(mobile) && attempts < 100);
        
        usedSet.add(mobile);
        return mobile;
    }

    generateTestPayload() {
        const operator = this.config.operators[Math.floor(Math.random() * this.config.operators.length)];
        const amount = Math.floor(Math.random() * (operator.maxAmount - operator.minAmount + 1)) + operator.minAmount;
        
        return {
            amount: amount,
            mobile: this.generateUniqueMobile(operator),
            operator_uuid: operator.uuid,
            operatorName: operator.name
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
                    timeout: 5000, // Fast timeout for high RPS
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
                operator: payload.operatorName,
                amount: payload.amount,
                workerId: workerId
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: payload.mobile,
                operator: payload.operatorName,
                amount: payload.amount,
                workerId: workerId
            };
        }
    }

    async runWorker(workerId) {
        const requestsPerSecond = this.config.requestsPerWorker;
        const batchSize = Math.max(5, Math.floor(requestsPerSecond / 20));
        
        let localResults = {
            workerId: workerId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            statusCodes: {},
            operators: {},
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
                    
                    // Track operator performance
                    const operator = requestResult.operator;
                    if (!localResults.operators[operator]) {
                        localResults.operators[operator] = { success: 0, failure: 0, totalAmount: 0 };
                    }
                    
                    if (requestResult.success) {
                        localResults.successfulRequests++;
                        localResults.operators[operator].success++;
                        localResults.operators[operator].totalAmount += requestResult.amount;
                    } else {
                        localResults.failedRequests++;
                        localResults.operators[operator].failure++;
                    }
                }
            });

            // Send frequent updates for real-time monitoring
            parentPort.postMessage({
                type: 'update',
                data: { ...localResults, timestamp: Date.now() }
            });

            // Reset counters but keep tracking for rate calculation
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
            // If batch took longer, continue immediately
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
                operators: {},
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

                // Store throughput history
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
                        
                        // Aggregate status codes
                        Object.entries(message.data.statusCodes).forEach(([code, count]) => {
                            results.statusCodes[code] = (results.statusCodes[code] || 0) + count;
                        });

                        // Aggregate operator stats
                        Object.entries(message.data.operators).forEach(([operator, stats]) => {
                            if (!results.operators[operator]) {
                                results.operators[operator] = { success: 0, failure: 0, totalAmount: 0 };
                            }
                            results.operators[operator].success += stats.success;
                            results.operators[operator].failure += stats.failure;
                            results.operators[operator].totalAmount += stats.totalAmount;
                        });
                    } else if (message.type === 'complete') {
                        completedWorkers++;
                        console.log(`   ✅ Worker ${message.data.workerId} completed`);
                        
                        if (completedWorkers === this.config.numWorkers) {
                            clearInterval(updateInterval);
                            results.endTime = Date.now();
                            this.generateComprehensiveReport(results);
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

    generateComprehensiveReport(results) {
        const duration = (results.endTime - results.startTime) / 1000;
        const averageRPS = results.totalRequests / duration;
        const successRate = (results.successfulRequests / results.totalRequests * 100);
        const avgLatency = results.successfulRequests > 0 ? 
            (results.totalLatency / results.successfulRequests) : 0;

        // Calculate peak RPS
        const peakRPS = Math.max(...results.throughputHistory.map(h => h.rps));

        console.log('\n📊 ===== COMPREHENSIVE PERFORMANCE REPORT =====');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 LOAD TEST SUMMARY`);
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

        console.log(`\n🏢 OPERATOR PERFORMANCE`);
        Object.entries(results.operators)
            .sort((a, b) => (b[1].success + b[1].failure) - (a[1].success + a[1].failure))
            .forEach(([operator, stats]) => {
                const total = stats.success + stats.failure;
                const successRate = total > 0 ? (stats.success / total * 100).toFixed(1) : 0;
                const avgAmount = stats.success > 0 ? (stats.totalAmount / stats.success).toFixed(0) : 0;
                console.log(`   ${operator}: ${stats.success}/${total} (${successRate}%) | Avg: ${avgAmount} AFN`);
            });

        console.log(`\n💪 PERFORMANCE ASSESSMENT - 5,000 RPS TARGET`);
        const targetAchievement = (averageRPS / this.config.targetRPS) * 100;
        console.log(`   Target Achievement: ${targetAchievement.toFixed(1)}%`);

        if (averageRPS >= this.config.targetRPS * 0.9) {
            console.log(`   🎉 EXCELLENT: System can handle 5,000 RPS!`);
        } else if (averageRPS >= this.config.targetRPS * 0.7) {
            console.log(`   ✅ VERY GOOD: ${averageRPS.toLocaleString()} RPS achieved`);
        } else if (averageRPS >= this.config.targetRPS * 0.5) {
            console.log(`   ⚠️  GOOD: ${averageRPS.toLocaleString()} RPS - room for optimization`);
        } else if (averageRPS >= 1000) {
            console.log(`   🔄 MODERATE: ${averageRPS.toLocaleString()} RPS - needs scaling`);
        } else {
            console.log(`   🔴 NEEDS WORK: ${averageRPS.toLocaleString()} RPS - significant improvements needed`);
        }

        if (successRate >= 95) {
            console.log(`   ✅ EXCELLENT: High reliability under load`);
        } else if (successRate >= 80) {
            console.log(`   ⚠️  GOOD: Acceptable reliability`);
        } else {
            console.log(`   🔴 POOR: High failure rate under load`);
        }

        console.log(`\n🔧 RECOMMENDATIONS FOR 5,000 RPS:`);
        
        if (averageRPS < this.config.targetRPS) {
            const scalingFactor = Math.ceil(this.config.targetRPS / Math.max(averageRPS, 1));
            console.log(`   1. Scale horizontally: Deploy ${scalingFactor}x more application servers`);
            console.log(`   2. Database optimization: Increase connection pool from 35 to ${35 * scalingFactor}`);
            console.log(`   3. Caching: Implement Redis cluster for operator/user data`);
        }
        
        if (results.statusCodes['400'] > results.totalRequests * 0.05) {
            console.log(`   4. Fix validation: ${results.statusCodes['400']} validation errors detected`);
            console.log(`   5. Check: Mobile-operator matching, minimum amounts, duplicate prevention`);
        }

        console.log(`\n🚀 NEXT STEPS:`);
        console.log(`   • Monitor database CPU and connection usage`);
        console.log(`   • Check Redis memory and performance`);
        console.log(`   • Review application logs for any errors`);
        console.log(`   • Consider implementing request queuing for peaks`);

        console.log('\n🎉 LOAD TEST COMPLETED SUCCESSFULLY!');
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
            
            const testPayload = {
                amount: 1,
                mobile: '0730987654',
                operator_uuid: '70b9906d-c2ba-11',
                operatorName: 'Etisalat'
            };

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
                console.log('✅ Health check passed! Starting 5000 RPS load test...\n');
                await this.runWithWorkers();
            } else {
                console.log(`❌ Health check failed: HTTP ${testResponse.status}`);
                console.log('Response:', testResponse.data);
            }
            
        } catch (error) {
            console.error('💥 Load test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new ProperLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new ProperLoadTest();
    loadTest.run();
}

module.exports = ProperLoadTest;