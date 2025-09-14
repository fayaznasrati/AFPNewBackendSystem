// const AWS = require('aws-sdk');
// const fs = require('fs');

// // Enter copied or downloaded access ID and secret key here
// const ID = '';
// const SECRET = '';

// // The name of the bucket that you have created
// const BUCKET_NAME = 'afptesting';

// const s3 = new AWS.S3({
//     accessKeyId: ID,
//     secretAccessKey: SECRET
// });

// const fileContent = fs.readFileSync('src/uploads/2021-07-28T1400download.png');

// const params = {
//     Bucket: BUCKET_NAME,
//     Key: 'server-cat.jpg', // File name you want to save as in S3
//     Body: fileContent,
//     ContentType: 'image/png',
//     ACL:'public-read-write'
// };

// s3.upload(params, function(err, data) {
//     if (err) {
//         console.log(err)
//         throw err;
//     }
//     console.log(`File uploaded successfully. ${data.Location}`);
// });