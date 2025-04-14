const { body } = require('express-validator');
const request = require('request');

exports.apiCall = async (url) =>{
    try{
        return new Promise((resolve, reject) =>{

            setTimeout(() => {
                resolve({ balance : 0 });
            }, 10*1000);

            request.post(url, {
                form : {
                    "key" : "kydscAPI@Key"
                }
            },(error,response,body) => {
                // console.log(body)
                if (!error && response.statusCode === 200) {
                    // console.log(body)
                    resolve({ balance : body });
                }else{
                    resolve({ 
                        error : 'IP issue'
                    });
                }
            })
        })

    }catch(e){
        console.log(e)
        throw new Error(e)
    }
}

exports.apiCallData = async (url,data) =>{
    try{
        return new Promise((resolve, reject) =>{
            request.post(url, {
                form : {
                    "key" : "kydscAPI@Key",
                    ...data
                }
            },(error,response,body) => {
                // console.log(body)
                if (!error && response.statusCode === 200) {
                    // console.log(body)
                    resolve(body);
                }else{
                    resolve({ 
                        error : 'IP issue'
                    });
                }
            })
        })

    }catch(e){
        console.log(e)
        throw new Error(e)
    }
}

exports.apiCallEtisalatBalanceCheck = async (url,mobile) =>{
    try{
        return new Promise((resolve, reject) =>{
            request.post(url, {
                form : {
                    "key" : "kydscAPI@Key",
                    "mobile" : '93' + mobile.slice(1,mobile.length)
                }
            },(error,response,body) => {
                // console.log(body)
                if (!error && response.statusCode === 200) {
                    // console.log(body)
                    if(typeof(body) === 'string'){
                        body = JSON.parse(body)
                    }
                    resolve(body);
                }else{
                    resolve({ 
                        error : 'IP issue'
                    });
                }
            })
        })

    }catch(e){
        console.log(e)
        throw new Error(e)
    }
}