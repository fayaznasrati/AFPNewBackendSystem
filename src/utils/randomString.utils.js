var randomstring = require("randomstring");
var crypto = require("crypto");
//import cryptoRandomString from 'crypto-random-string';

function generateRandomString(intLength){     
    strRandomString = randomstring.generate({
        length: intLength,
        charset: 'alphabetic'
    });

    return strRandomString;  
}

function generateRandomNumber(intLength){
    strRandomNumber = randomstring.generate({
        length: intLength,
        charset: 'numeric'
    });
    return strRandomNumber;  
}

function generateRandomHash(strString){
    
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(strString).digest('hex');
    return hash;
}

module.exports = {
    generateRandomString,
    generateRandomNumber,
    generateRandomHash
}