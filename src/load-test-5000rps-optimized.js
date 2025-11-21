// load-test-5000rps-optimized.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const fs = require('fs');

class OptimizedLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            targetRPS: 5000,
            testDuration: 60,
            warmUpDuration: 10,
            totalDuration: 70,
            
            numWorkers: Math.min(os.cpus().length, 8),
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA',
            
            // Based on your successful test
            mobilePrefix: '0730',
            amount: 1,
            operator_uuid: '70b9906d-c2ba-11',
            operatorName: 'Etisalat'
        };

        this.config.requestsPerWorker = Math.ceil(this.config.targetRPS / this.config.numWorkers);
        
        this.results = {
            startTime: null,
            endTime: null,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            statusCodes: {},
            errors: [],
            throughputHistory: []
        };

        console.log('🚀 OPTIMIZED 5000 RPS LOAD TEST');
        console.log('='.repeat(60));
        console.log(`🎯 Target: ${this.config.targetRPS.toLocaleString()} RPS`);
        console.log(`⏱️  Duration: ${this.config.totalDuration} seconds`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📊 Requests/worker: ${this.config.requestsPerWorker} RPS`);
        console.log(`📱 Mobile: ${this.config.mobilePrefix}XXXXXX`);
        console.log(`💰 Amount: ${this.config.amount} AFN`);
        console.log(`🏢 Operator: ${this.config.operatorName}`);
        console.log('='.repeat(60));
    }

    generateMobileNumber() {
        const usedMobiles = new Set();
        
        return () => {
            let mobile;
            let attempts = 0;
            
            // Generate unique mobile numbers to avoid duplicate recharge prevention
            do {
                const randomSuffix = Math.random().toString().slice(2, 8);
                mobile = `${this.config.mobilePrefix}${randomSuffix}`;
                attempts++;
                
                if (attempts > 100) {
                    // Clear some space if we have too many
                    const values = Array.from(usedMobiles);
                    for (let i = 0; i < Math.floor(values.length / 2); i++) {
                        usedMobiles.delete(values[i]);
                    }
                }
            } while (usedMobiles.has(mobile) && attempts < 1000);
            
            usedMobiles.add(mobile);
            return mobile;
        };
    }

    // Create mobile generator
    mobileGenerator = this.generateMobileNumber();

    generateTestPayload() {
        return {
            amount: this.config.amount,
            mobile: this.mobileGenerator(),
            operator_uuid: this.config.operator_uuid,
            operatorName: this.config.operatorName
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
                    timeout: 5000, // Reduced timeout for high RPS
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
                workerId: workerId,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: payload.mobile,
                workerId: workerId,
                timestamp: Date.now()
            };
        }
    }

    async runWorker(workerId) {
        const requestsPerSecond = this.config.requestsPerWorker;
        const batchSize = Math.max(5, Math.floor(requestsPerSecond / 20)); // Smaller, more frequent batches
        
        let localResults = {
            workerId: workerId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            statusCodes: {},
            lastBatchTime: Date.now()
        };

        const sendUpdate = () => {
            parentPort.postMessage({
                type: 'update',
                data: {
                    ...localResults,
                    timestamp: Date.now()
                }
            });
            
            // Reset for next interval, keep tracking for rate calculation
            localResults.totalRequests = 0;
            localResults.successfulRequests = 0;
            localResults.failedRequests = 0;
            localResults.statusCodes = {};
            localResults.lastBatchTime = Date.now();
        };

        const updateInterval = setInterval(sendUpdate, 1000); // Update every second
        const endTime = Date.now() + (this.config.totalDuration * 1000);
        
        while (Date.now() < endTime) {
            const batchPromises = [];
            const batchStartTime = Date.now();
            
            // Create batch of requests
            for (let i = 0; i < batchSize; i++) {
                batchPromises.push(this.makeRequest(workerId));
            }

            // Execute batch with timeout
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Process results quickly
            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const requestResult = result.value;
                    localResults.totalRequests++;
                    
                    const statusCode = requestResult.status;
                    localResults.statusCodes[statusCode] = (localResults.statusCodes[statusCode] || 0) + 1;
                    
                    if (requestResult.success) {
                        localResults.successfulRequests++;
                    } else {
                        localResults.failedRequests++;
                    }
                } else {
                    localResults.totalRequests++;
                    localResults.failedRequests++;
                    localResults.statusCodes['0'] = (localResults.statusCodes['0'] || 0) + 1;
                }
            });

            // Precise rate control
            const batchTime = Date.now() - batchStartTime;
            const targetBatchTime = (batchSize / requestsPerSecond) * 1000;
            
            if (batchTime < targetBatchTime) {
                await this.delay(targetBatchTime - batchTime);
            }
            // If batch took longer, continue immediately to catch up
        }

        clearInterval(updateInterval);
        sendUpdate(); // Final update
        
        parentPort.postMessage({
            type: 'complete',
            data: { workerId: workerId }
        });
    }

    async runWithWorkers() {
        return new Promise((resolve, reject) => {
            const workers = [];
            let completedWorkers = 0;

            console.log('\n🚀 Starting workers...');
            
            for (let i = 0; i < this.config.numWorkers; i++) {
                const worker = new Worker(__filename, {
                    workerData: {
                        workerId: i,
                        config: this.config
                    }
                });

                worker.on('message', (message) => {
                    if (message.type === 'update') {
                        this.results.totalRequests += message.data.totalRequests;
                        this.results.successfulRequests += message.data.successfulRequests;
                        this.results.failedRequests += message.data.failedRequests;
                        
                        // Aggregate status codes
                        Object.entries(message.data.statusCodes).forEach(([code, count]) => {
                            this.results.statusCodes[code] = (this.results.statusCodes[code] || 0) + count;
                        });

                        // Calculate current RPS
                        const currentRPS = message.data.totalRequests / ((Date.now() - message.data.lastBatchTime) / 1000);
                        this.results.throughputHistory.push({
                            timestamp: message.data.timestamp,
                            rps: currentRPS,
                            successRate: message.data.totalRequests > 0 ? 
                                (message.data.successfulRequests / message.data.totalRequests) * 100 : 0
                        });
                    } else if (message.type === 'complete') {
                        completedWorkers++;
                        console.log(`   ✅ Worker ${message.data.workerId} completed`);
                        
                        if (completedWorkers === this.config.numWorkers) {
                            this.results.endTime = Date.now();
                            resolve();
                        }
                    }
                });

                worker.on('error', (error) => {
                    console.error(`   ❌ Worker ${i} error:`, error.message);
                });

                workers.push(worker);
            }

            this.results.startTime = Date.now();
            this.startProgressMonitor();
        });
    }

    startProgressMonitor() {
        let lastUpdate = Date.now();
        
        console.log('\n📈 LIVE PROGRESS:');
        console.log('Time     | Total Req  | Current RPS | Success % | Status Codes');
        console.log('---------|------------|-------------|-----------|--------------');

        const progressInterval = setInterval(() => {
            const currentTime = Date.now();
            const elapsed = (currentTime - this.results.startTime) / 1000;
            
            // Calculate current RPS from recent history
            const recentHistory = this.results.throughputHistory
                .filter(h => h.timestamp > currentTime - 2000)
                .slice(-5);
            
            const currentRPS = recentHistory.length > 0 ? 
                recentHistory.reduce((sum, h) => sum + h.rps, 0) / recentHistory.length : 0;

            const successRate = this.results.totalRequests > 0 ? 
                (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(1) : 0;

            // Get top status codes
            const statusSummary = Object.entries(this.results.statusCodes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([code, count]) => `${code}:${count}`)
                .join(', ');

            console.log(
                `${elapsed.toFixed(1).padStart(6)}s | ` +
                `${this.results.totalRequests.toString().padStart(9)} | ` +
                `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                `${successRate.toString().padStart(7)}% | ` +
                `${statusSummary}`
            );

            lastUpdate = currentTime;

            if (this.results.endTime) {
                clearInterval(progressInterval);
            }
        }, 2000);
    }

    generateComprehensiveReport() {
        const duration = (this.results.endTime - this.results.startTime) / 1000;
        const totalRequests = this.results.totalRequests;
        const successfulRequests = this.results.successfulRequests;
        const failedRequests = this.results.failedRequests;
        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100) : 0;
        const averageRPS = totalRequests / duration;

        // Calculate performance metrics
        const peakRPS = Math.max(...this.results.throughputHistory.map(h => h.rps));
        const avgSuccessRate = this.results.throughputHistory.length > 0 ?
            this.results.throughputHistory.reduce((sum, h) => sum + h.successRate, 0) / 
            this.results.throughputHistory.length : 0;

        console.log('\n📊 ===== COMPREHENSIVE PERFORMANCE REPORT =====');
        console.log('='.repeat(55));
        
        console.log(`\n🎯 LOAD TEST SUMMARY`);
        console.log(`   Target RPS: ${this.config.targetRPS.toLocaleString()}`);
        console.log(`   Achieved RPS: ${averageRPS.toLocaleString()}`);
        console.log(`   Peak RPS: ${peakRPS.toLocaleString()}`);
        console.log(`   Duration: ${duration.toFixed(2)} seconds`);
        console.log(`   Workers: ${this.config.numWorkers}`);

        console.log(`\n📈 REQUEST STATISTICS`);
        console.log(`   Total Requests: ${totalRequests.toLocaleString()}`);
        console.log(`   Successful: ${successfulRequests.toLocaleString()}`);
        console.log(`   Failed: ${failedRequests.toLocaleString()}`);
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Average Success Rate: ${avgSuccessRate.toFixed(2)}%`);

        console.log(`\n📋 STATUS CODE BREAKDOWN`);
        Object.entries(this.results.statusCodes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([code, count]) => {
                const percentage = ((count / totalRequests) * 100).toFixed(1);
                const codeName = this.getStatusCodeName(code);
                console.log(`   ${code} (${codeName}): ${count.toLocaleString()} (${percentage}%)`);
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

        if (successRate >= 99) {
            console.log(`   ✅ EXCELLENT: High reliability under load`);
        } else if (successRate >= 95) {
            console.log(`   ⚠️  GOOD: Acceptable reliability`);
        } else {
            console.log(`   🔴 POOR: High failure rate under load`);
        }

        console.log(`\n🔧 RECOMMENDATIONS FOR PRODUCTION:`);
        
        if (averageRPS < this.config.targetRPS) {
            const scalingFactor = Math.ceil(this.config.targetRPS / averageRPS);
            console.log(`   1. Scale horizontally: Deploy ${scalingFactor}x more application servers`);
            console.log(`   2. Database optimization: Increase connection pool, add read replicas`);
            console.log(`   3. Caching: Implement Redis cluster for operator/user data`);
        }
        
        if (this.results.statusCodes['400'] > totalRequests * 0.1) {
            console.log(`   4. Fix validation: ${this.results.statusCodes['400']} validation errors detected`);
        }
        
        if (this.results.statusCodes['429']) {
            console.log(`   5. Rate limiting: ${this.results.statusCodes['429']} rate limit hits - adjust limits`);
        }

        console.log(`\n🚀 NEXT STEPS:`);
        console.log(`   • Run longer duration tests (10-30 minutes)`);
        console.log(`   • Test with mixed operator patterns`);
        console.log(`   • Monitor database and Redis performance`);
        console.log(`   • Implement auto-scaling policies`);

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
            console.log('🔍 Performing quick health check...');
            
            const testPayload = {
                amount: this.config.amount,
                mobile: '0730987654',
                operator_uuid: this.config.operator_uuid,
                operatorName: this.config.operatorName
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
                console.log('✅ Health check passed! Starting massive load test...\n');
                await this.runWithWorkers();
                this.generateComprehensiveReport();
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
    const workerTest = new OptimizedLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new OptimizedLoadTest();
    loadTest.run();
}

module.exports = OptimizedLoadTest;