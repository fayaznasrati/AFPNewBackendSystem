// load-test-high-rps.js
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const fs = require('fs');

class HighRPSLoadTest {
    constructor() {
        this.config = {
            baseUrl: 'https://newtopuptest.afghan-pay.com/api/v1/recharge/single',
            username: 'AFP-77454',
            stages: [
                { duration: 30, targetRPS: 50, name: "Stage 1 - 50 RPS" },
                { duration: 30, targetRPS: 100, name: "Stage 2 - 100 RPS" },
                { duration: 30, targetRPS: 200, name: "Stage 3 - 200 RPS" },
                { duration: 30, targetRPS: 500, name: "Stage 4 - 500 RPS" },
                { duration: 30, targetRPS: 1000, name: "Stage 5 - 1000 RPS" },
                { duration: 30, targetRPS: 2000, name: "Stage 6 - 2000 RPS" }
            ],
            numWorkers: Math.min(os.cpus().length, 8),
            authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VyVHlwZSI6IkFnZW50IiwiaWF0IjoxNzYzNzM3NzcwLCJleHAiOjE3NjQzNDI1NzB9.uTY24EqWqvcLFgSkJoItsP35PwoXUMd8fpEvzfNG-UA'
        };

        this.results = {
            startTime: null,
            endTime: null,
            stages: {},
            bottlenecks: [],
            recommendations: []
        };

        this.usedMobiles = new Set();
        
        console.log('🚀 HIGH-RPS LOAD TEST - FINDING BOTTLENECKS');
        console.log('='.repeat(60));
        console.log(`🎯 Target: Progressive RPS up to 2,000`);
        console.log(`⏱️  Total Duration: ${this.config.stages.reduce((sum, stage) => sum + stage.duration, 0)}s`);
        console.log(`👥 Workers: ${this.config.numWorkers}`);
        console.log(`📱 Operator: Etisalat (0730 prefix)`);
        console.log(`💰 Amount: 1 AFN`);
        console.log('='.repeat(60));
    }

    generateUniqueMobile() {
        let mobile;
        do {
            const randomSuffix = Math.random().toString().slice(2, 8);
            mobile = `0730${randomSuffix}`;
        } while (this.usedMobiles.has(mobile) && this.usedMobiles.size < 10000);
        
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
                    timeout: 3000, // Aggressive timeout for high RPS
                    validateStatus: null
                }
            );

            const latency = Date.now() - startTime;
            const isSuccess = response.status === 200;

            return {
                success: isSuccess,
                latency: latency,
                status: response.status,
                timestamp: startTime
            };
            
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message,
                status: 0,
                timestamp: startTime
            };
        }
    }

    async runStage(stage, workerId) {
        const requestsPerWorker = Math.ceil(stage.targetRPS / this.config.numWorkers);
        const batchSize = Math.max(2, Math.floor(requestsPerWorker / 5));
        
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
            const targetBatchTime = (batchSize / requestsPerWorker) * 1000;
            
            if (batchTime < targetBatchTime) {
                await this.delay(targetBatchTime - batchTime);
            }
        }

        stageResults.endTime = Date.now();
        return stageResults;
    }

    async runWorker(workerId) {
        for (const stage of this.config.stages) {
            const stageResults = await this.runStage(stage, workerId);
            
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

            console.log('\n📈 PROGRESSIVE LOAD TEST IN PROGRESS:');
            console.log('Stage             | Time | Total Req | Current RPS | Success % | Avg Latency');
            console.log('------------------|------|-----------|-------------|-----------|------------');

            let lastUpdateTime = Date.now();
            let lastTotalRequests = 0;

            const updateInterval = setInterval(() => {
                const currentTime = Date.now();
                const elapsed = (currentTime - aggregatedResults.startTime) / 1000;
                const currentRPS = ((aggregatedResults.overall.totalRequests - lastTotalRequests) / ((currentTime - lastUpdateTime) / 1000)) || 0;
                
                const successRate = aggregatedResults.overall.totalRequests > 0 ? 
                    (aggregatedResults.overall.successfulRequests / aggregatedResults.overall.totalRequests * 100).toFixed(1) : 0;

                const avgLatency = aggregatedResults.overall.successfulRequests > 0 ? 
                    (Object.values(aggregatedResults.stages).reduce((sum, stage) => sum + (stage.avgLatency || 0), 0) / Object.keys(aggregatedResults.stages).length).toFixed(0) : 0;

                console.log(
                    `${currentStage.padEnd(17)} | ` +
                    `${elapsed.toFixed(0).padStart(3)}s | ` +
                    `${aggregatedResults.overall.totalRequests.toString().padStart(8)} | ` +
                    `${currentRPS.toFixed(0).toString().padStart(10)} | ` +
                    `${successRate.toString().padStart(7)}% | ` +
                    `${avgLatency.toString().padStart(10)}ms`
                );

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
                        // Track progress but don't aggregate until stage complete
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
                        aggregatedResults.overall.peakRPS = Math.max(
                            aggregatedResults.overall.peakRPS, 
                            stage.achievedRPS
                        );

                        currentStage = stageName;
                    } else if (message.type === 'worker_complete') {
                        completedWorkers++;
                        if (completedWorkers === this.config.numWorkers) {
                            clearInterval(updateInterval);
                            aggregatedResults.endTime = Date.now();
                            this.analyzeBottlenecks(aggregatedResults);
                            this.generateReport(aggregatedResults);
                            resolve();
                        }
                    }
                });

                workers.push(worker);
            }
        });
    }

    analyzeBottlenecks(results) {
        console.log('\n🔍 BOTTLENECK ANALYSIS');
        console.log('='.repeat(50));

        const stages = Object.values(results.stages);
        
        for (let i = 0; i < stages.length - 1; i++) {
            const currentStage = stages[i];
            const nextStage = stages[i + 1];
            
            const rpsGrowth = nextStage.achievedRPS - currentStage.achievedRPS;
            const targetGrowth = nextStage.targetRPS - currentStage.targetRPS;
            const growthRatio = rpsGrowth / targetGrowth;

            if (growthRatio < 0.5) {
                const bottleneckAt = currentStage.targetRPS;
                this.results.bottlenecks.push({
                    stage: `Around ${bottleneckAt} RPS`,
                    achieved: currentStage.achievedRPS,
                    growthRatio: growthRatio.toFixed(2)
                });

                console.log(`🚨 BOTTLENECK DETECTED at ~${bottleneckAt} RPS`);
                console.log(`   Expected: ${targetGrowth} RPS growth`);
                console.log(`   Actual: ${rpsGrowth.toFixed(0)} RPS growth`);
                console.log(`   Growth Ratio: ${(growthRatio * 100).toFixed(0)}% of expected`);
            }
        }

        // Analyze latency patterns
        const latencyThreshold = 1000; // 1 second
        const highLatencyStages = stages.filter(stage => stage.avgLatency > latencyThreshold);
        
        if (highLatencyStages.length > 0) {
            console.log(`\n⏱️  LATENCY BOTTLENECK: Stages with >${latencyThreshold}ms latency`);
            highLatencyStages.forEach(stage => {
                console.log(`   ${stage.targetRPS} RPS target: ${stage.avgLatency.toFixed(0)}ms avg latency`);
            });
        }

        // Analyze error patterns
        const errorProneStages = stages.filter(stage => stage.successRate < 95);
        if (errorProneStages.length > 0) {
            console.log(`\n❌ ERROR BOTTLENECK: Stages with <95% success rate`);
            errorProneStages.forEach(stage => {
                console.log(`   ${stage.targetRPS} RPS target: ${stage.successRate.toFixed(1)}% success`);
            });
        }
    }

    generateReport(results) {
        const totalDuration = (results.endTime - results.startTime) / 1000;
        const overallRPS = results.overall.totalRequests / totalDuration;
        const overallSuccessRate = (results.overall.successfulRequests / results.overall.totalRequests) * 100;

        console.log('\n📊 ===== HIGH-RPS LOAD TEST REPORT =====');
        console.log('='.repeat(55));
        
        console.log(`\n🎯 OVERALL PERFORMANCE`);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)} seconds`);
        console.log(`   Total Requests: ${results.overall.totalRequests.toLocaleString()}`);
        console.log(`   Successful: ${results.overall.successfulRequests.toLocaleString()}`);
        console.log(`   Failed: ${results.overall.failedRequests.toLocaleString()}`);
        console.log(`   Overall RPS: ${overallRPS.toLocaleString()}`);
        console.log(`   Peak RPS: ${results.overall.peakRPS.toLocaleString()}`);
        console.log(`   Success Rate: ${overallSuccessRate.toFixed(2)}%`);

        console.log(`\n📈 STAGE-BY-STAGE PERFORMANCE`);
        console.log('Stage           | Target RPS | Achieved RPS | Success % | Avg Latency');
        console.log('----------------|------------|--------------|-----------|------------');
        
        Object.entries(results.stages).forEach(([stageName, stage]) => {
            console.log(
                `${stageName.padEnd(15)} | ` +
                `${stage.targetRPS.toString().padStart(9)} | ` +
                `${stage.achievedRPS.toFixed(0).toString().padStart(11)} | ` +
                `${stage.successRate.toFixed(1).toString().padStart(7)}% | ` +
                `${stage.avgLatency.toFixed(0).toString().padStart(10)}ms`
            );
        });

        console.log(`\n💪 SYSTEM CAPACITY ASSESSMENT`);
        
        const maxStableStage = Object.values(results.stages)
            .filter(stage => stage.successRate >= 95 && stage.avgLatency < 2000)
            .pop();

        if (maxStableStage) {
            console.log(`   ✅ Stable Capacity: ~${maxStableStage.achievedRPS.toFixed(0)} RPS`);
            console.log(`   📊 At this load: ${maxStableStage.successRate.toFixed(1)}% success, ${maxStableStage.avgLatency.toFixed(0)}ms latency`);
        } else {
            console.log(`   🔴 No stable capacity found - system needs optimization`);
        }

        console.log(`\n🔧 BOTTLENECKS IDENTIFIED: ${this.results.bottlenecks.length}`);
        this.results.bottlenecks.forEach((bottleneck, index) => {
            console.log(`   ${index + 1}. ${bottleneck.stage} (${bottleneck.growthRatio}x expected growth)`);
        });

        console.log(`\n🚀 RECOMMENDATIONS FOR 5,000 RPS:`);
        
        if (results.overall.peakRPS < 100) {
            console.log(`   1. 🔥 IMMEDIATE: Current system only handles ~${results.overall.peakRPS.toFixed(0)} RPS`);
            console.log(`   2. Scale application servers: ${Math.ceil(5000 / results.overall.peakRPS)}x needed`);
            console.log(`   3. Optimize database: Connection pooling, query optimization`);
            console.log(`   4. Implement caching: Redis for operator data, user data`);
        } else if (results.overall.peakRPS < 1000) {
            console.log(`   1. Good baseline: ${results.overall.peakRPS.toLocaleString()} RPS achieved`);
            console.log(`   2. Scale horizontally: ${Math.ceil(5000 / results.overall.peakRPS)}x more servers needed`);
            console.log(`   3. Database optimization: Read replicas, connection pool tuning`);
        } else {
            console.log(`   1. Excellent! System can handle ${results.overall.peakRPS.toLocaleString()} RPS`);
            console.log(`   2. For 5,000 RPS: Scale ${Math.ceil(5000 / results.overall.peakRPS)}x`);
            console.log(`   3. Consider load balancer optimization`);
        }

        if (this.results.bottlenecks.length > 0) {
            console.log(` Address bottlenecks at: ${this.results.bottlenecks.map(b => b.stage).join(', ')}`);
        }

        console.log(`\n📋 NEXT STEPS:`);
        console.log(`   • Monitor database CPU and connections during peak load`);
        console.log(`   • Check Redis memory usage and response times`);
        console.log(`   • Review application logs for errors at each stage`);
        console.log(`   • Consider implementing async processing for non-critical operations`);

        console.log('\n🎉 HIGH-RPS LOAD TEST COMPLETED!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            console.log('🔍 Performing quick health check...');
            
            const testPayload = this.generateTestPayload();
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
                console.log('✅ Health check passed! Starting progressive load test...\n');
                await this.runWithWorkers();
            } else {
                console.log(`❌ Health check failed: HTTP ${testResponse.status}`);
            }
            
        } catch (error) {
            console.error('💥 Load test failed:', error.message);
        }
    }
}

// Worker thread code
if (!isMainThread) {
    const workerTest = new HighRPSLoadTest();
    workerTest.config = workerData.config;
    workerTest.runWorker(workerData.workerId);
}

// Main thread execution
if (isMainThread) {
    const loadTest = new HighRPSLoadTest();
    loadTest.run();
}