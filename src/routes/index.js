var express = require('express')

var router = express.Router()

const adminRouter = require('./admin.route');
const smsRoute = require('./marketingSms.route');
const regionRoutes = require('./region.routes');
const ticketRoute = require('./ticket.routes');
const redisRoute = require('./redis.route')
//const rabbitmqRoute = require('./rabbitmq.routes')
const operatorRoute = require('./operator.routes')
const countryRoutes = require('./country.routes')
const provinceRoute = require('./province.route')
const districtRoutes = require('./district.routes')
const languageRoutes = require('./language.routes')
const notificationRoute = require('./Notification.routes')
const agentRoute = require('./agent.route')
const postpaidRoute = require('./postpaid.routes')
const slabRoute = require('./slab.route')
const loginRoute = require('./login.route')
const emoneyRoute = require('./emoney.routes')
const walletRoute = require('./wallet.route')
const stocksRoute = require('./stocks.route')
const commissionRoute = require('./commission.route')
const departmentRoute = require('./department.route')
const memberRoute = require('./member.route')
const logRoute = require('./log.route')
const agentActivityTypeRoute = require('./agentActivityType.route')
const moduleRoute = require('./module.routes')
const operatorAccessRoute = require('./operatorAccess.routes')
const rechargeRoutes = require('./recharge.routes')
const smsUssdRoutes = require('./smsUssd.route')
const dashboardRoute = require('./dashboard.routes')
const rollbackRoute = require('./rollback.route')
const rechargeRoute = require('./rechargeRoute.routes')
const loginReason = require('./loginReason.route')
const newsRoute = require('./news.route')
const ussdRoute = require('./ussd.routes')
const p2aRoute = require('./P2A.route')
const ebundleTopup = require('./ebundleTopup.routes')
 
router.use('/admin', adminRouter);
router.use('/smsRoute', smsRoute)
router.use('/region', regionRoutes)
router.use('/ticket', ticketRoute)
router.use('/redis', redisRoute)
//router.use('/rabbitmq', rabbitmqRoute)
router.use('/operator', operatorRoute)
router.use('/country', countryRoutes)
router.use('/province', provinceRoute)
router.use('/district', districtRoutes)
router.use('/language', languageRoutes)
router.use('/notification', notificationRoute)
router.use('/agent', agentRoute)
router.use('/postpaid', postpaidRoute)
router.use('/slab', slabRoute)
router.use('/login', loginRoute)
router.use('/emoney', emoneyRoute)
router.use('/wallet', walletRoute)
router.use('/stock', stocksRoute)
router.use('/commission', commissionRoute)
router.use('/department',departmentRoute)
router.use('/member',memberRoute)
router.use('/log',logRoute)
router.use('/agent-activity-type',agentActivityTypeRoute)
router.use('/module',moduleRoute)
router.use('/operatorAccess',operatorAccessRoute)
router.use('/recharge',rechargeRoutes)
router.use('/smsUssd',smsUssdRoutes)
router.use('/dashboard',dashboardRoute)
router.use('/rollback',rollbackRoute)
router.use('/rechargeRoute',rechargeRoute)
router.use('/loginReason',loginReason)
router.use('/news',newsRoute)
router.use('/ussd',ussdRoute)
router.use('/P2A',p2aRoute)
router.use('/ebundle-topup',ebundleTopup)

//router.use('/users', users);

module.exports = router;

//  checking the log function for
// async function makerequest () {
//     const httpRequestMaker = require('../common/httpRequestMaker.common')
//     var data = {
//         userid : 1, 
//         username : 'mona',
//         usertype : 'admin',
//         old_password : 'checking request',
//         old_encryption_key : 'trying to make request',
//         new_password : 'change pass function',
//         new_encryption_key : 'password key',
//         created_by : 1
//     }
//     let result = await httpRequestMaker.httpPost('/api/v1/log/admin/password',data)
//     console.log(result)
// }

// makerequest()
