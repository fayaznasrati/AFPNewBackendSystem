const { validationResult } = require('express-validator');

const redisMaster = require('../common/master/radisMaster.common')
const smsFunction = require('../common/smsFunction.common')
const ussdController = require('./ussd.controller')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

// configer env
const dotenv = require('dotenv');
dotenv.config()

class p2aController {

    mainController = async (req,res) => {
        try{
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log(req.body)
            let { MSISDN, input} = req.body;

            if(! input.includes('P2A Request :')) return res.send()

            // check status
            redisMaster.get('SMS_STATUS', async(err, reply) => {
                if (reply === null || reply === undefined || reply == 0) {
                    return res.send('Service is In-Active !')
                }else{
                    // if(input == 'INT_DELIVERY_NOTIFY') return res.send()
                    // if(input.includes('Message for')) return res.send()
                    // if(input.includes('stat:ENROUTE err:')) return res.send()

                    // if(input.includes('Invalid code or Session Time end')) return res.send()
                    // if(input.includes('Entered code is invalid')) return res.send()
                    // if(input.includes('error in request')) return res.send()

                    input = input.slice(15,input.length)
                    // console.log(input)

                    // check mobile number
                    let userNumber = '0' + MSISDN.slice(2,MSISDN.length);

                    let p2aResponce = {
                        message : 'error in request',
                        freeFlow : 'FB'
                    }

                    // check redis if there is any pre request
                    let reqDetails = {
                        MSISDN : MSISDN,
                        mobile : userNumber,
                        input : input,
                    }

                    reqDetails.input = ( reqDetails.input.slice(0,5) == '*515*' || reqDetails.input.slice(0,5) == '*515#' ) ? reqDetails.input.slice(1,reqDetails.input.length -1) : reqDetails.input
                    
                    let lastInput = 'NA'

                    let p2aLog = {
                        MSISDN : MSISDN,
                        input : input,
                        lastInput : lastInput
                    }

                    if(reqDetails.input.slice(0,3) != '515'){
                        lastInput = await this.getLastCode('P2A'+reqDetails.MSISDN)
                        // console.log('get last code : ','P2A'+reqDetails.MSISDN,', lastcode :', lastInput )
                        if( lastInput.error ){
                            p2aResponce.freeFlow = 'FB'
                            p2aResponce.message = lastInput.error
                        }else{
                            p2aLog.lastInput = lastInput
                            reqDetails.input = lastInput + '*' + reqDetails.input
                        }
                    }
                    
                    let inputCode = reqDetails.input.split('*')

                    let menuInput = inputCode == 515 ? '0' : String(inputCode[1])

                    if( inputCode[0] == '515'){
                        switch(String(menuInput)){
                            // case '0': 
                            // case '00':    
                            //     // send menue
                            //     p2aResponce = this.menu(String(menuInput))
                            //     break;
                            case '1':
                                //balacne enquary
                                p2aResponce = await this.checkBalance(inputCode,userNumber)
                                break;
                            case '2':
                                // daily report  
                                p2aResponce = await this.dailyTopUpReport(inputCode,userNumber)
                                break;
                            case '3':
                                //last 5 txn report
                                p2aResponce = await this.last5TxnReport(inputCode,userNumber)
                                break;
                            case '4':
                                // change m-pin
                                p2aResponce = await this.changeMpin(inputCode,userNumber)
                                break;
                            case '5':
                                // stock transfer
                                p2aResponce = await this.stockTransfer(inputCode,userNumber)
                                break;
                            case '6':
                                // daily stock report
                                p2aResponce = await this.dailyStockTransferReport(inputCode,userNumber)
                                break;
                            case '7':
                                // check txn status by mobile number
                                p2aResponce = await this.checkTxnStatusByNumber(inputCode,userNumber)
                                break;
                            case '8':
                                // check recieved rollback amount
                                p2aResponce = await this.checkRollbackAmount(inputCode,userNumber)
                                break;
                            case '9':
                                // check rollback by rollback phone number
                                p2aResponce = await this.checkRollbackByNumber(inputCode,userNumber)
                                break;
                            case '10':
                                if(inputCode.length == 2){
                                    p2aResponce = {
                                        message : 'Enter 10 digit mobile number',
                                        freeFlow : 'FC'
                                    }
                                }else{
                                    p2aResponce = {
                                        message : 'Entered code is invalid',
                                        freeFlow : 'FB'
                                    }
                                }
                                break;
                            default:
                                // if input length is 10 process rechange
                                if(menuInput.length == 10){
                                    p2aResponce = await this.recharge(inputCode,userNumber)
                                }else{
                                    // else send error
                                    p2aResponce = {
                                        message : 'Entered code is invalid',
                                        freeFlow : 'FB'
                                    }

                                    // send sms for error
                                    let smsDetails = {
                                        userId : 'NA',
                                        username : 'NA',
                                        mobile : reqDetails.mobile,
                                        recieverMessage : p2aResponce.message
                                    }
                                    smsFunction.directSMS(smsDetails)
                                    
                                }
                        }
                    }

                    // console.log(response)
                    if (p2aResponce.freeFlow == 'FB'){
                        // delete session form redis
                        redisMaster.delete('P2A'+reqDetails.MSISDN)
                        // console.log('Deleted last code id : ','P2A'+reqDetails.MSISDN)
                    }else{
                        // add session to redis
                        if(reqDetails.input != '515*00' && reqDetails.input != '515*0' && reqDetails.input != '515*10'){
                            redisMaster.post('P2A'+reqDetails.MSISDN, reqDetails.input)
                            redisMaster.exp('P2A'+reqDetails.MSISDN, process.env.P2A_SESSION_TIME)
                        }else{
                            redisMaster.post('P2A'+reqDetails.MSISDN, '515')
                            redisMaster.exp('P2A'+reqDetails.MSISDN, process.env.P2A_SESSION_TIME)   
                        }
                        // console.log('add session id :','P2A'+reqDetails.MSISDN, ', lastcode :', reqDetails.input)
                    }

                    // add log
                    this.addP2aLog(p2aLog ,p2aResponce.message)

                    if(p2aResponce.message == `--`) res.send()
                    else res.send(p2aResponce.message)
                }
            })

        }catch(error){
            console.log('[mainController] : error :',error)
            res.send('Internaml error')
        }
    }

    menu = (input) =>{
        try{
            let messageList = {
                '0' : [
                    '10 - Recharge',
                    '1 - Balance enquiry',
                    '2 - Daily Top-up Report',
                    '3 - Last 5 Txn report',
                    '4 - Change M-pin',
                    '5 - Stock Transfer',
                    '00 - Next'
                ],
                '00': [
                    '6 - Daily Stock Transfer Report',
                    '7 - Check Txn Status by Mobile Num',
                    '8 - Check Rollback Amount',
                    '9 - Check Rollback by Mobile Num',
                ]}
            let freeFlow = 'FC'
            let message = messageList[input]
            return ({message : message.join('\n'),freeFlow})
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - R", freeFlow : "FB"})
        }
    }

    recharge = async (input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'recharge',
            }
            switch (input.length){
                case 2:
                    responce ={
                        message : 'Enter Amount',
                        freeFlow : 'FC'
                    }
                    break;

                case 3:
                    // make api call
                    if( !(Number(input[2]) && Number(input[2]) >= 1) ){
                        responce ={
                            message : 'Enter proper amount',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    ussdDetails.mpin = ''
                    ussdDetails.rechargeNumber = input[1]
                    ussdDetails.rechargeAmount = input[2]
                    // console.log(Number(ussdDetails.rechargeNumber))
                    if(!(Number(ussdDetails.rechargeNumber) && Number(ussdDetails.rechargeNumber))) {
                        responce.message = 'Enter proper reciever number'
                        break;
                    }
                    if(!(Number(ussdDetails.rechargeAmount) && Number(ussdDetails.rechargeAmount) >= 1)) {
                        responce.message = 'Enter proper amount'
                        break;
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                case 4:
                    ussdDetails.rechargeNumber = input[1]
                    ussdDetails.rechargeAmount = input[2]
                    ussdDetails.mpin = input[3]
                    if(!(Number(ussdDetails.rechargeNumber) && Number(ussdDetails.rechargeNumber)) ) {
                        responce.message = 'Enter proper reciever number'
                        break;
                    }
                    if(!(Number(ussdDetails.rechargeAmount) && Number(ussdDetails.rechargeAmount) >= 1)) {
                        responce.message = 'Enter proper amount'
                        break
                    }
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - R", freeFlow : "FB"})
        }
    }

    checkBalance = async (input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'checkBalance',
            }
            switch (input.length){
                case 2:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    responce = await this.runCode(ussdDetails)
                    break;
                case 3:
                    // make api call
                    ussdDetails.mpin = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    dailyTopUpReport = async(input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'dailyTopUpReport',
            }
            switch (input.length){
                case 2:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    responce = await this.runCode(ussdDetails)
                    break;
                case 3:
                    // make api call
                    ussdDetails.mpin = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    last5TxnReport = async (input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'last5TxnReport',
            }
            switch (input.length){
                case 2:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    responce = await this.runCode(ussdDetails)
                    break;
                case 3:
                    // make api call
                    ussdDetails.mpin = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    changeMpin = async(input,userNumber) =>{
        try{
            let responce = {
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'changeMpin',
            }
            switch (input.length){
                // case 2:
                //     responce = {
                //         message : 'Enter old pin',
                //         freeFlow : 'FC'
                //     }
                //     break;
                // case 3:
                //     responce = {
                //         message : 'Enter new pin',
                //         freeFlow : 'FC'
                //     }
                //     break;
                // case 4:
                //     responce = {
                //         message : 'Enter new pin again',
                //         freeFlow : 'FC'
                //     }
                //     break;
                case 5:
                    if ( !(Number(input[2])  && input[2].length == 4) ){
                        responce = {
                            message : 'Enter current pin properly',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if ( input[2] == input[3] ){
                        responce = {
                            message : 'New Pin should be different from old pin',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if ( !Number(input[3]) ){
                        responce = {
                            message : 'New Pin should be number only',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if(input[3].length != 4){
                        responce = {
                            message : 'New pin should be of 4 number only',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if ( input[3] != input[4] ){
                        responce = {
                            message : 'Entered pin is not matching New pin',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    ussdDetails.mpin = input[2]
                    ussdDetails.newPin = input[3]
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    stockTransfer = async(input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'stockTransfer',
            }
            switch (input.length){
                // case 2:
                //     responce ={
                //         message : 'Enter userId number e.g. AFP-12345 then enter 12345',
                //         freeFlow : 'FC'
                //     }
                //     break;

                // case 3:
                //     responce ={
                //         message : 'Enter amount',
                //         freeFlow : 'FC'
                //     }
                //     break;

                case 4:
                    // make api call
                    if( !(Number(input[3]) && Number(input[3]) >= 1) ){
                        responce ={
                            message : 'Enter proper amount',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if(!Number(input[2])){
                        responce ={
                            message : 'Enter proper userId number',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    ussdDetails.mpin = ''
                    ussdDetails.recieverId = 'AFP-'+ input[2]
                    ussdDetails.amountTransfered = input[3]
                    responce = await this.runCode(ussdDetails)
                    break;
                case 5:
                   // make api call
                    if( !(Number(input[3]) && Number(input[3]) >= 1) ){
                        responce ={
                            message : 'Enter proper amount',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    if(!Number(input[2])){
                        responce ={
                            message : 'Enter proper userId number',
                            freeFlow : 'FB'
                        }
                        break;
                    }
                    ussdDetails.mpin = input[4]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    ussdDetails.recieverId = 'AFP-'+ input[2]
                    ussdDetails.amountTransfered = input[3]
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    dailyStockTransferReport = async(input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'dailyStockTransferReport',
            }
            switch (input.length){
                case 2:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    responce = await this.runCode(ussdDetails)
                    break;
                case 3:
                    // make api call
                    ussdDetails.mpin = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    checkTxnStatusByNumber = async (input,userNumber) =>{
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'checkTxnStatusByNumber',
            }
            switch (input.length){
                // case 2:
                //     responce ={
                //         message : 'Enter recharge mobile number',
                //         freeFlow : 'FC'
                //     }
                //     break;
                case 3:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    ussdDetails.checkNumber = input[2]
                    if(!( ussdDetails.checkNumber.length == 10 && Number(ussdDetails.checkNumber))) {
                        responce.message = 'Enter proper mobile number'
                        break;
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                case 4:
                    // make api call
                    ussdDetails.mpin = input[3]
                    ussdDetails.checkNumber = input[2]
                    if(!( ussdDetails.checkNumber.length == 10 && Number(ussdDetails.checkNumber))) {
                        responce.message = 'Enter proper mobile number'
                        break;
                    }
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    checkRollbackAmount = async(input,userNumber) => {
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'checkRollbackAmount',
            }
            switch (input.length){
                case 2:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    responce = await this.runCode(ussdDetails)
                    break;
                case 3:
                    // make api call
                    ussdDetails.mpin = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    checkRollbackByNumber = async(input,userNumber) => {
        try{
            let responce ={
                message : 'Error',
                freeFlow : 'FB'
            }
            let ussdDetails = {
                userNumber : userNumber,
                method : 'checkRollbackByNumber',
            }
            switch (input.length){
                // case 2:
                //     responce ={
                //         message : 'Enter recharge mobile number',
                //         freeFlow : 'FC'
                //     }
                //     break;
                case 3:
                    // check if m pin is required for the agent
                    // else process recharge
                    ussdDetails.mpin = ''
                    ussdDetails.checkNumber = input[2]
                    if(!( ussdDetails.checkNumber.length == 10 && Number(ussdDetails.checkNumber))) {
                        responce.message = 'Enter proper mobile number'
                        break;
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                case 4:
                    // make api call
                    ussdDetails.mpin = input[3]
                    ussdDetails.checkNumber = input[2]
                    if(!(Number(ussdDetails.mpin) && ussdDetails.mpin.length == 4)) {
                        responce.message = 'Enter proper Pin'
                        break
                    }
                    if(!( ussdDetails.checkNumber.length == 10 && Number(ussdDetails.checkNumber))) {
                        responce.message = 'Enter proper mobie number'
                        break;
                    }
                    responce = await this.runCode(ussdDetails)
                    break;
                default:
                    responce.message ='Entered code is invalid'
                    break;
            }
            return (responce)
        }catch(error){
            console.error(error)
            return ({ message : "Internal Server Error - B", freeFlow : "FB"})
        }
    }

    runCode = async (ussdDetails) => {
        try{
            let responce = {
                message : 'Error',
                freeFlow : 'FB'
            }

            ussdDetails.userApplicationType = 4 // application type 4 for sms

            let apiResponce = await ussdController.runMenu(ussdDetails)
            // console.log("apiResponce",apiResponce)

            if(apiResponce.error){
                return({
                    message : apiResponce.error,
                    freeFlow : 'FB'
                })
            }

            // if user not exists
            if ( apiResponce.userState == 0 ){
                return({
                    message : 'you are not a valid user',
                    freeFlow : 'FB'
                })
            }
            if ( apiResponce.userState == 1 ){
                return({
                    message : 'Your account is decativated',
                    freeFlow : 'FB'
                })
            }
            if ( apiResponce.mpinStatus == 0 ){
                // enter pin
                return({
                    message : 'Enter Pin',
                    freeFlow : 'FC'
                })
            }
            if( apiResponce.mpinStatus == 1 ){
                // enter pin
                return({
                    message : 'Incorrect M-Pin',
                    freeFlow : 'FB'
                })
            }

            switch(ussdDetails.method){
                case 'checkBalance':
                    responce.message = `Dear ${apiResponce.userName} ${apiResponce.userId}, Your available Bal is:${parseFloat(String(apiResponce.userBalance)).toFixed(2)} AFN, Thank you for being Afghan Pay Agent!`
                    switch(String(apiResponce.languageType)){
                        case '2' : // Pashto
                            responce.message = `ښاغلی ${apiResponce.userName}! ستاسو په حساب کې موجود کریډیټ ${parseFloat(String(apiResponce.userBalance)).toFixed(2)} افغانی دی.  مننه، افغان پی.`
                            break;
                        case '3' : // Dari
                            responce.message = `محترم ${apiResponce.userName}! کریدت موجود در حساب شما ${parseFloat(String(apiResponce.userBalance)).toFixed(2)} افغانی است. تشکر، افغان پی.`
                            break;
                        case '1': // english
                        default :
                            responce.message = `Dear ${apiResponce.userName} ${apiResponce.userId}, Your available Bal is:${parseFloat(String(apiResponce.userBalance)).toFixed(2)} AFN, Thank you for being Afghan Pay Agent!`
                            break;
                    }
                    break;
                case 'dailyTopUpReport':
                    responce.message = `--`
                    break; 
                case 'last5TxnReport':
                    responce.message = apiResponce.txnCount ? `--` : `Dear ${apiResponce.userName}, there is no transaction report to share, Thank you for being Afghan Pay Agent!`
                    break;
                case 'changeMpin':
                    responce.message = apiResponce.pinChangeStatus != 1 ? apiResponce.pinChangeMessage : `--`
                    break;
                case 'stockTransfer':
                    responce.message = `--`
                    break;
                case 'dailyStockTransferReport':
                    responce.message = `--`
                    break;
                case 'checkTxnStatusByNumber':
                    // responce.message = apiResponce.rechargeDetails != 1 ? `Dear ${apiResponce.userName} no recharge found, Thanks for being Afghan Pay agent!` : `--`
                    responce.message = `--`
                    break;
                case 'checkRollbackAmount':
                    responce.message = `--`
                    break;
                case 'checkRollbackByNumber':
                    responce.message = `--`
                    break;
                case 'recharge' :
                    responce.message = `--`
                    break;
                default: 
                    responce.message = 'Internal connection error' 
                    break;
            }    
            
            return(responce)

        }catch(error){
            console.error(error)
            return({
                message : 'Internal connection Error',
                freeFlow : 'FB'
            })
        }
    }

    addP2aLog = async (reqDetails, responce) =>{
        try{
            let data = {
                MSISDN : reqDetails.MSISDN,
                input : reqDetails.input,
                lastInput : reqDetails.lastInput || 'NA',
                smsResponce : responce,
            }
            const intResult = await httpRequestMakerCommon.httpPost("p2a",data)
            var strLog = intResult == 1 ? 'P2a log added successfully' : intResult == 2 ? 'P2a log error' : 'end point not found'
            // console.log('Server Log : '+strLog)

        }catch(error){
            console.log('[p2a log error] : error :',error)
            return ({ error : "Internal error"})
        }
    }

    sendP2aSms = (reqDetails, responce) =>{
        try{
            if(reqDetails.userId){ // sms to agent
                let smsDetails = {
                    agentId : reqDetails.userId,
                    recieverMessage : responce
                }
                smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                    if(smsFunResponce.error){
                        // console.log('send sms error for agent id : ',reqDetails.userId)
                    }else{
                        // console.log('sms added')
                    }
                })
            }else{  // sms to unknown user
                let smsDetails = {
                    userId : 'NA',
                    username : 'NA',
                    mobile : reqDetails.mobile,
                    recieverMessage : responce
                }
                smsFunction.directSMS(smsDetails).then((smsFunResponce)=>{ 
                    if(smsFunResponce.error){
                        console.log('send sms error for user : ',reqDetails.mobile)
                    }else{
                        // console.log('sms added')
                    }
                })
            }
        }catch(error){
            console.log('[p2a sms error] : error :',error)
            return ({ error : "Internal error"})
        }
    }

    getLastCode = (reqDetails) => {
        return new Promise((resolve, reject) => {
            try{
                redisMaster.get(reqDetails, async (err, reply) => {
                    try{
                        if(err) return reject(err)
                        if (reply === null || reply === undefined) {
                            resolve ({error : 'Invalid code or Session Time end'})
                        }else{
                            resolve (reply)
                        }
                    }catch(error){
                        console.log('[last code] : error :',error)
                        resolve ({ error : "redis input check error"})
                    }
                })
            }catch(error){
                console.log('[last code] : error :',error)
                resolve ({ error : "check input error"})
            }
        })
    }
}

module.exports = new p2aController()
