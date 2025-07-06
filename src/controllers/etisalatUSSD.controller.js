const { validationResult } = require('express-validator');
class etisalatController {

    ussdMainFunTesting = async (req,res) =>{
        try{
              console.log('***********************----Etisalat USSD Test----****************************')
                console.log("the Req : ",req)
                console.log("the Req.file : ",req.file)
                console.log("URL : ",req.url)
                console.log("METHOD : ",req.method)
                console.log("Header : ", req.headers)
                console.log("QUERY : ", req.query)
                console.log("PARAMS : ", req.params)
                console.log("BODY : ", req.body); // This should now show parsed XML
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log(req.body)
            console.log(req.param)
            let key = Object.keys(req.body)

            let  messageList = ` <XML version="1.0">
                                <Response>
                                <status>0</status>
                                <phone>93731439315</phone>
                                <message>10 - Recharge
                                1 - Balance enquiry
                                2 - Daily Top-up Report
                                3 - Last 5 Txn report
                                4 - Change M-pin
                                5 - Stock Transfer
                                00 - Next</message>
                                <act>1</act>
                                </Response>
                                </XML>`

                res.send(messageList)

        }catch(error){
            console.log(error)
            let key = Object.keys(req.body)
            // console.log(key)
            res.set({
                'Content-Type' : 'application/xml'
            })
            res.status(200).send(`<XML version="1.0">
            <Response>
                <status>0</status>
                <phone>${key[0].slice(key[0].indexOf('<phone>') + 7,key[0].indexOf('</phone>'))}</phone>
                <message>Internal service error!</message>
                <act>0</act>
            </Response></XML>`);
        }
    }
}
module.exports = new etisalatController()
