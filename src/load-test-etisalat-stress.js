// load-test-etisalat-stress.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class EtisalatStressTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            
            // STRESS TEST CONFIGURATION - Targeting 5000 RPS
            stages: [
                { duration: 30, targetRPS: 100, name: "Warm Up - 100 RPS" },
                { duration: 30, targetRPS: 500, name: "Stage 1 - 500 RPS" },
                { duration: 30, targetRPS: 1000, name: "Stage 2 - 1,000 RPS" },
                { duration: 30, targetRPS: 2000, name: "Stage 3 - 2,000 RPS" },
                { duration: 30, targetRPS: 3000, name: "Stage 4 - 3,000 RPS" },
                { duration: 30, targetRPS: 4000, name: "Stage 5 - 4,000 RPS" },
                { duration: 30, targetRPS: 5000, name: "Stage 6 - 5,000 RPS" }
            ],
            
            numWorkers: Math.min(os.cpus().length, 12), // Use more workers for high RPS
            requestsPerWorker: 0,
            
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA'
        };

        // Calculate requests per worker for each stage
        this.config.stages.forEach(stage => {
            stage.requestsPerWorker = Math.ceil(stage.targetRPS / this.config.numWorkers);
        });
        
        this.results = {
            startTime: null,
            endTime: null,
            stages: {},
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            peakRPS: 0
        };

        this.usedMobiles = new Set();
        
        console.log('🚀 ETISALAT STRESS TEST - TARGETING 5,000 RPS');
        console.log('='.repeat(65));
        console.log(`🎯 Ultimate Target: 5,000 requests/second`);
        console.log(`⏱️  Total Duration: ${this.config.stages.reduce((sum, stage) => sum + stage.duration, 0)}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📱 Mobile Prefix: 0730 (Etisalat)`);
        console.log(`💰 Amount: 1 AFN`);
        console.log('='.repeat(65));
        
        console.log('\n📈 TEST STAGES:');
        this.config.stages.forEach(stage => {
            console.log(`   ${stage.name} - ${stage.duration}s`);
        });
    }

    generateUniqueMobile() {
        let mobile;
        let attempts = 0;
        
        do {
            const randomSuffix = Math.random().toString().slice(2, 8);
            mobile = `0730${randomSuffix}`;
            attempts++;
            
            // Reset if too many attempts
            if (attempts > 100 && this.usedMobiles.size > 100000) {
                this.usedMobiles.clear();
            }
        } while (this.usedMobiles.has(mobile) && attempts < 200);
        
        this.usedMobiles.add(mobile);
        return mobile;
    }

    generateTestPayload() {
        return {
            amount: 1,
            mobile: this.generateUniqueMobile(),
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
            "authorization": this.config.authToken,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json",
            "origin": "https://newtopuptest.afghan-pay.com",
            "referer": "https://newtopuptest.afghan-pay.com/agent/recharge"
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
                    timeout: 3000, // Reduced timeout for high RPS
                    validateStatus: null
                }
            );

            const latency = Date.now() - startTime;
            const isSuccess = response.status === 200;

            return {
                success: isSuccess,
                latency: latency,
                status: response.status,
                mobile: payload.mobile
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                mobile: payload.mobile
            };
        }
    }

    async runWorker(workerId) {
        for (const stage of this.config.stages) {
            const requestsPerSecond = stage.requestsPerWorker;
            const batchSize = Math.max(10, Math.floor(requestsPerSecond / 5)); // Larger batches for high RPS
            
            const stageResults = {
                stage: stage.name,
                targetRPS: stage.targetRPS,
                startTime: Date.now(),
                endTime: null,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                latencies: [],
                statusCodes: {}
            };

            const endTime = Date.now() + (stage.duration * 1000);
            
            while (Date.now() < endTime) {
                const batchPromises = [];
                const batchStartTime = Date.now();
                
                // Create larger batches for high RPS
                for (let i = 0; i < batchSize; i++) {
                    batchPromises.push(this.makeRequest());
                }

                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled') {
                        const requestResult = result.value;
                        stageResults.totalRequests++;
                        stageResults.latencies.push(requestResult.latency);
                        
                        const statusCode = requestResult.status;
                        stageResults.statusCodes[statusCode] = (stageResults.statusCodes[statusCode] || 0) + 1;
                        
                        if (requestResult.success) {
                            stageResults.successfulRequests++;
                        } else {
                            stageResults.failedRequests++;
                        }
                    }
                });

                // Send progress update
                parentPort.postMessage({
                    type: 'stage_progress',
                    data: {
                        workerId: workerId,
                        stage: stage.name,
                        progress: stageResults
                    }
                });

                // Aggressive rate control for high RPS
                const batchTime = Date.now() - batchStartTime;
                const targetBatchTime = (batchSize / requestsPerSecond) * 1000;
                
                if (batchTime < targetBatchTime) {
                    await this.delay(targetBatchTime - batchTime);
                }
                // No delay if behind schedule - try to catch up
            }

            stageResults.endTime = Date.now();
            
            parentPort.postMessage({
                type: 'stage_complete',
                data: {
                    workerId: workerId,
                    stage: stage.name,
                    results: stageResults
                }
            });
        }

        parentPort.postMessage({
            type: 'worker_complete',
            data: { workerId: workerId }
        });
    }

    async runWithWorkers() {
        return new Promise((resolve, reject) => {
            const workers = [];
            let completedWorkers = 0;
            let currentStage = this.config.stages[0].name;

            const aggregatedResults = {
                startTime: Date.now(),
                endTime: null,
                stages: {},
                overall: {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    peakRPS: 0
                }
            };

            console.log('\n📈 PROGRESSIVE STRESS TEST IN PROGRESS:');
            console.log('Stage             | Time | Total Req  | Current RPS | Success % | Avg Latency');
            console.log('------------------|------|------------|-------------|-----------|------------');

            let lastUpdateTime = Date.now();
            let lastTotalRequests = 0;

            const updateInterval = setInterval(() => {
                const currentTime = Date.now();
                const elapsed = (currentTime - aggregatedResults.startTime) / 1000;
                const currentRPS = ((aggregatedResults.overall.totalRequests - lastTotalRequests) / ((currentTime - lastUpdateTime) / 1000)) || 0;
                
                const successRate = aggregatedResults.overall.totalRequests > 0 ? 
                    (aggregatedResults.overall.successfulRequests / aggregatedResults.overall.totalRequests * 100).toFixed(1) : 0;

                const avgLatency = Object.values(aggregatedResults.stages).length > 0 ? 
                    (Object.values(aggregatedResults.stages).reduce((sum, stage) => sum + (stage.avgLatency || 0), 0) / Object.values(aggregatedResults.stages).length).toFixed(0) : 0;

                console.log(
                    `${currentStage.padEnd(17)} | ` +
                    `${elapsed.toFixed(0).padStart(3)}s | ` +
                    `${aggregatedResults.overall.totalRequests.toString().padStart(9)} | ` +
                    `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                    `${successRate.toString().padStart(7)}% | ` +
                    `${avgLatency.toString().padStart(10)}ms`
                );

                aggregatedResults.overall.peakRPS = Math.max(aggregatedResults.overall.peakRPS, currentRPS);
                lastUpdateTime = currentTime;
                lastTotalRequests = aggregatedResults.overall.totalRequests;
            }, 2000);

            for (let i = 0; i < this.config.numWorkers; i++) {
                const worker = new Worker(__filename, {
                    workerData: {
                        workerId: i,
                        config: this.config
                    }
                });

                worker.on('message', (message) => {
                    if (message.type === 'stage_progress') {
                        // Track progress
                    } else if (message.type === 'stage_complete') {
                        const stageResults = message.data.results;
                        const stageName = message.data.stage;
                        
                        if (!aggregatedResults.stages[stageName]) {
                            aggregatedResults.stages[stageName] = {
                                targetRPS: stageResults.targetRPS,
                                totalRequests: 0,
                                successfulRequests: 0,
                                failedRequests: 0,
                                latencies: [],
                                statusCodes: {},
                                duration: (stageResults.endTime - stageResults.startTime) / 1000
                            };
                        }

                        aggregatedResults.stages[stageName].totalRequests += stageResults.totalRequests;
                        aggregatedResults.stages[stageName].successfulRequests += stageResults.successfulRequests;
                        aggregatedResults.stages[stageName].failedRequests += stageResults.failedRequests;
                        aggregatedResults.stages[stageName].latencies.push(...stageResults.latencies);

                        Object.entries(stageResults.statusCodes).forEach(([code, count]) => {
                            aggregatedResults.stages[stageName].statusCodes[code] = 
                                (aggregatedResults.stages[stageName].statusCodes[code] || 0) + count;
                        });

                        // Calculate stage metrics
                        const stage = aggregatedResults.stages[stageName];
                        stage.achievedRPS = stage.totalRequests / stage.duration;
                        stage.successRate = (stage.successfulRequests / stage.totalRequests) * 100;
                        stage.avgLatency = stage.latencies.length > 0 ? 
                            stage.latencies.reduce((a, b) => a + b, 0) / stage.latencies.length : 0;

                        // Update overall
                        aggregatedResults.overall.totalRequests += stageResults.totalRequests;
                        aggregatedResults.overall.successfulRequests += stageResults.successfulRequests;
                        aggregatedResults.overall.failedRequests += stageResults.failedRequests;

                        currentStage = stageName;
                    } else if (message.type === 'worker_complete') {
                        completedWorkers++;
                        if (completedWorkers === this.config.numWorkers) {
                            clearInterval(updateInterval);
                            aggregatedResults.endTime = Date.now();
                            this.generateStressReport(aggregatedResults);
                            resolve();
                        }
                    }
                });

                workers.push(worker);
            }
        });
    }

    generateStressReport(results) {
        const totalDuration = (results.endTime - results.startTime) / 1000;
        const overallRPS = results.overall.totalRequests / totalDuration;
        const overallSuccessRate = (results.overall.successfulRequests / results.overall.totalRequests) * 100;

        console.log('\n📊 ===== STRESS TEST REPORT =====');
        console.log('='.repeat(55));
        
        console.log(`\n🎯 ULTIMATE PERFORMANCE SUMMARY`);
        console.log(`   Target RPS: 5,000`);
        console.log(`   Achieved RPS: ${overallRPS.toLocaleString()}`);
        console.log(`   Peak RPS: ${results.overall.peakRPS.toLocaleString()}`);
        console.log(`   Success Rate: ${overallSuccessRate.toFixed(2)}%`);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)} seconds`);
        console.log(`   Total Requests: ${results.overall.totalRequests.toLocaleString()}`);
        console.log(`   Successful: ${results.overall.successfulRequests.toLocaleString()}`);
        console.log(`   Failed: ${results.overall.failedRequests.toLocaleString()}`);

        console.log(`\n📈 STAGE-BY-STAGE BREAKTHROUGH`);
        console.log('Stage           | Target RPS | Achieved RPS | Success % | Avg Latency');
        console.log('----------------|------------|--------------|-----------|------------');
        
        Object.entries(results.stages).forEach(([stageName, stage]) => {
            const status = stage.achievedRPS >= stage.targetRPS * 0.8 ? '✅' : 
                          stage.achievedRPS >= stage.targetRPS * 0.5 ? '⚠️ ' : '❌';
            
            console.log(
                `${stageName.padEnd(15)} | ` +
                `${stage.targetRPS.toString().padStart(9)} | ` +
                `${stage.achievedRPS.toFixed(0).toString().padStart(11)} | ` +
                `${stage.successRate.toFixed(1).toString().padStart(7)}% | ` +
                `${stage.avgLatency.toFixed(0).toString().padStart(10)}ms ${status}`
            );
        });

        console.log(`\n💪 5,000 RPS CAPACITY ASSESSMENT`);
        const targetAchievement = (overallRPS / 5000) * 100;
        console.log(`   Target Achievement: ${targetAchievement.toFixed(1)}%`);

        if (overallRPS >= 4500) {
            console.log(`   🎉 PHENOMENAL: System can handle 5,000 RPS!`);
            console.log(`   📊 Current capacity: ${overallRPS.toLocaleString()} RPS`);
        } else if (overallRPS >= 3000) {
            console.log(`   ✅ EXCELLENT: Strong foundation for 5,000 RPS`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / overallRPS)}x servers`);
        } else if (overallRPS >= 1500) {
            console.log(`   ⚠️  GOOD: Solid performance, needs optimization`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / overallRPS)}x servers`);
        } else if (overallRPS >= 500) {
            console.log(`   🔄 MODERATE: ${overallRPS.toLocaleString()} RPS baseline`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / overallRPS)}x servers`);
        } else {
            console.log(`   🔴 LIMITED: ${overallRPS.toLocaleString()} RPS - major improvements needed`);
            console.log(`   📈 Scale needed: ${Math.ceil(5000 / overallRPS)}x servers`);
        }

        console.log(`\n🔧 CRITICAL OPTIMIZATIONS FOR 5,000 RPS:`);
        
        // Find bottleneck stage
        const bottleneckStage = Object.values(results.stages).find(stage => 
            stage.achievedRPS < stage.targetRPS * 0.7
        );

        if (bottleneckStage) {
            console.log(`   1. 🚨 BOTTLENECK at ${bottleneckStage.targetRPS} RPS target`);
            console.log(`      Achieved: ${bottleneckStage.achievedRPS.toFixed(0)} RPS (${(bottleneckStage.achievedRPS/bottleneckStage.targetRPS*100).toFixed(1)}%)`);
        }

        if (overallRPS < 1000) {
            console.log(`   2. 🔥 IMMEDIATE: Current capacity only ${overallRPS.toFixed(0)} RPS`);
            console.log(`   3. Scale application servers: ${Math.ceil(5000 / overallRPS)}x needed`);
            console.log(`   4. Database: Increase connection pool to ${35 * Math.ceil(5000 / overallRPS)} connections`);
            console.log(`   5. Redis: Implement cluster for high-throughput caching`);
        } else {
            console.log(`   2. ✅ Good baseline: ${overallRPS.toLocaleString()} RPS`);
            console.log(`   3. Horizontal scaling: ${Math.ceil(5000 / overallRPS)}x more servers needed`);
            console.log(`   4. Load balancer: Configure for optimal distribution`);
            console.log(`   5. Database: Read replicas for query offloading`);
        }

        console.log(`\n🚀 NEXT STEPS FOR PRODUCTION READINESS:`);
        console.log(`   • Run 30-minute endurance test at maximum achieved RPS`);
        console.log(`   • Monitor database CPU and connection pool usage`);
        console.log(`   • Implement auto-scaling based on RPS metrics`);
        console.log(`   • Set up comprehensive monitoring and alerting`);
        console.log(`   • Conduct failover and recovery testing`);

        console.log('\n🎉 STRESS TEST COMPLETED!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            console.log('🔍 Performing health check...');
            
            const testPayload = {
                amount: 1,
                mobile: '0730123456',
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
                console.log('✅ Health check passed! Starting progressive stress test...\n');
                await this.runWithWorkers();
            } else {
                console.log(`❌ Health check failed: HTTP ${testResponse.status}`);
            }
            
        } catch (error) {
            console.error('💥 Stress test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new EtisalatStressTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const stressTest = new EtisalatStressTest();
    stressTest.run();
}

module.exports = EtisalatStressTest;