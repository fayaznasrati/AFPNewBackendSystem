// load-test-realistic.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class RealisticLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            targetRPS: 500, // Start with achievable target
            testDuration: 60,
            
            numWorkers: 4, // Conservative worker count
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA',
            
            // Use different operators to spread load
            operators: [
                { prefix: "0730", uuid: "70b9906d-c2ba-11", name: "Etisalat" },
                { prefix: "0790", uuid: "9edb602c-c2ba-11", name: "Roshan" },
                { prefix: "0770", uuid: "456a6b47-c2ba-11", name: "MTN" }
            ]
        };

        this.config.requestsPerWorker = Math.ceil(this.config.targetRPS / this.config.numWorkers);
        this.usedMobiles = new Set();
        
        console.log('🎯 REALISTIC LOAD TEST - FINDING SYSTEM LIMITS');
        console.log('='.repeat(50));
        console.log(`🎯 Target: ${this.config.targetRPS} RPS`);
        console.log(`⏱️  Duration: ${this.config.testDuration}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📱 Operators: ${this.config.operators.map(op => op.name).join(', ')}`);
        console.log('='.repeat(50));
    }

    generateUniqueMobile(operatorPrefix) {
        let mobile;
        let attempts = 0;
        
        do {
            const randomSuffix = Math.random().toString().slice(2, 8);
            mobile = `${operatorPrefix}${randomSuffix}`;
            attempts++;
            
            if (attempts > 50) {
                // Reset if too many attempts
                this.usedMobiles.clear();
            }
        } while (this.usedMobiles.has(mobile) && attempts < 100);
        
        this.usedMobiles.add(mobile);
        return mobile;
    }

    generateTestPayload() {
        const operator = this.config.operators[Math.floor(Math.random() * this.config.operators.length)];
        return {
            amount: Math.floor(Math.random() * 10) + 1, // 1-10 AFN
            mobile: this.generateUniqueMobile(operator.prefix),
            operator_uuid: operator.uuid,
            operatorName: operator.name
        };
    }

    getRequestHeaders() {
        return {
            "authorization": this.config.authToken,
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
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
                    timeout: 8000,
                    validateStatus: null
                }
            );

            const latency = Date.now() - startTime;
            const isSuccess = response.status === 200;

            return {
                success: isSuccess,
                latency: latency,
                status: response.status,
                mobile: payload.mobile,
                operator: payload.operatorName,
                workerId: workerId
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: payload.mobile,
                operator: 'Unknown',
                workerId: workerId
            };
        }
    }

    async runWorker(workerId) {
        const requestsPerSecond = this.config.requestsPerWorker;
        const batchSize = Math.max(2, Math.floor(requestsPerSecond / 10));
        
        let localResults = {
            workerId: workerId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            statusCodes: {},
            operators: {}
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
                    
                    const statusCode = requestResult.status;
                    localResults.statusCodes[statusCode] = (localResults.statusCodes[statusCode] || 0) + 1;
                    
                    // Track operator performance
                    const operator = requestResult.operator;
                    localResults.operators[operator] = localResults.operators[operator] || { success: 0, failure: 0 };
                    if (requestResult.success) {
                        localResults.successfulRequests++;
                        localResults.operators[operator].success++;
                    } else {
                        localResults.failedRequests++;
                        localResults.operators[operator].failure++;
                    }
                }
            });

            // Send update
            parentPort.postMessage({
                type: 'update',
                data: localResults
            });

            // Reset for next batch
            localResults.totalRequests = 0;
            localResults.successfulRequests = 0;
            localResults.failedRequests = 0;
            localResults.statusCodes = {};

            // Rate control
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
                statusCodes: {},
                operators: {}
            };

            console.log('\n📈 LIVE PROGRESS:');
            console.log('Time | Total Req | Current RPS | Success % | Status');
            console.log('-----|-----------|-------------|-----------|--------');

            let lastUpdateTime = Date.now();
            let lastTotalRequests = 0;

            const updateInterval = setInterval(() => {
                const currentTime = Date.now();
                const elapsed = (currentTime - results.startTime) / 1000;
                const currentRPS = ((results.totalRequests - lastTotalRequests) / ((currentTime - lastUpdateTime) / 1000)) || 0;
                
                const successRate = results.totalRequests > 0 ? 
                    (results.successfulRequests / results.totalRequests * 100).toFixed(1) : 0;

                const statusSummary = Object.entries(results.statusCodes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([code, count]) => `${code}:${count}`)
                    .join(', ');

                console.log(
                    `${elapsed.toFixed(0).padStart(3)}s | ` +
                    `${results.totalRequests.toString().padStart(8)} | ` +
                    `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                    `${successRate.toString().padStart(7)}% | ` +
                    `${statusSummary}`
                );

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
                        
                        Object.entries(message.data.statusCodes).forEach(([code, count]) => {
                            results.statusCodes[code] = (results.statusCodes[code] || 0) + count;
                        });

                        Object.entries(message.data.operators).forEach(([operator, stats]) => {
                            results.operators[operator] = results.operators[operator] || { success: 0, failure: 0 };
                            results.operators[operator].success += stats.success;
                            results.operators[operator].failure += stats.failure;
                        });
                    } else if (message.type === 'complete') {
                        completedWorkers++;
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

        console.log('\n📊 ===== REALISTIC LOAD TEST REPORT =====');
        console.log('='.repeat(45));
        
        console.log(`\n📈 PERFORMANCE SUMMARY`);
        console.log(`   Target RPS: ${this.config.targetRPS}`);
        console.log(`   Achieved RPS: ${averageRPS.toFixed(2)}`);
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Total Requests: ${results.totalRequests}`);
        console.log(`   Successful: ${results.successfulRequests}`);
        console.log(`   Failed: ${results.failedRequests}`);

        console.log(`\n📋 STATUS CODE ANALYSIS`);
        Object.entries(results.statusCodes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([code, count]) => {
                const percentage = ((count / results.totalRequests) * 100).toFixed(1);
                console.log(`   ${code}: ${count} (${percentage}%)`);
            });

        console.log(`\n🏢 OPERATOR PERFORMANCE`);
        Object.entries(results.operators).forEach(([operator, stats]) => {
            const total = stats.success + stats.failure;
            const successRate = total > 0 ? (stats.success / total * 100).toFixed(1) : 0;
            console.log(`   ${operator}: ${stats.success}/${total} (${successRate}%)`);
        });

        console.log(`\n💡 RECOMMENDATIONS:`);
        if (successRate < 50) {
            console.log(`   1. Investigate HTTP 400 causes in application logs`);
            console.log(`   2. Check user balance and transaction limits`);
            console.log(`   3. Verify operator configurations`);
            console.log(`   4. Review Redis cache status`);
        }
        
        if (averageRPS < 100) {
            console.log(`   5. Current system capacity: ~${averageRPS.toFixed(0)} RPS`);
            console.log(`   6. To reach 5,000 RPS: Scale horizontally x${Math.ceil(5000/averageRPS)}`);
        } else {
            console.log(`   5. Good baseline: ${averageRPS.toFixed(0)} RPS achievable`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            await this.runWithWorkers();
        } catch (error) {
            console.error('Test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new RealisticLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new RealisticLoadTest();
    loadTest.run();
}