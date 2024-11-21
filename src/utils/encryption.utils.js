var aes256 = require('aes256');

function encryptString(strKey, strPlainText){
    try {
        var encryptedPlainText = aes256.encrypt(strKey, strPlainText);
        return encryptedPlainText;  
    } catch(e) {
        console.log(e);
    }
}

function decryptString(strKey, strEncryptedText){
    try {
        var decryptedPlainText = aes256.decrypt(strKey, strEncryptedText);
        return decryptedPlainText; 
    } catch(e) {
        console.log(e);
    }      
}

module.exports = {
    encryptString,
    decryptString
}