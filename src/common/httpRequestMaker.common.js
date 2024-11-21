const https = require('https')
var axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class httpRequestMaker {
    
    // http post request maker
    httpPost = async (urlPath,bodyData) => {
        return new Promise((resolve, reject) => {
            var host = process.env.LOG_URL 
            var url = host + '/api/v1/log/' + urlPath
            // console.log(url)
            axios({
                method: 'post',
                url: url,
                data: bodyData
            })
            .then(function (response) {
                // console.log("Server-2 Log : ",response.data, response.status);
                if(response.status == 201 ) return resolve (1)
                if(response.status == 400 ) return resolve (2)
                if(response.status == 404 ) return resolve (3)
                reject(response.data)
            })
            .catch(function (error) {
                reject(error)
                console.log(error.data);
            });
        })
    }
}

module.exports = new httpRequestMaker()