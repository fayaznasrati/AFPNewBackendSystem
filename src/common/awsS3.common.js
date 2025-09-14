// const AWS = require('aws-sdk');
// const fs = require('fs');
// const dotenv = require('dotenv');
// // configer env
// dotenv.config()

// const ID = process.env.AWS_KEY;
// const SECRET = process.env.AWS_SECRET;
// const BUCKET_NAME = process.env.AWS_BUCKET;

// class awsCommon {

//   constructor() {
//     this._s3 = new AWS.S3({
//       accessKeyId: ID,
//       secretAccessKey: SECRET
//     });
//   }

//   // upload image
//   upload = async(file) => {
//     try{
//       // reading the file
//         const fileContent = await fs.readFileSync(file.path);
//         // console.log(file)

//       // upload paren for S3
//         const params = {
//           Bucket: BUCKET_NAME,
//           Key: file.filename, // File name you want to save as in S3
//           Body: fileContent,
//           ContentType: file.mimetype,
//           ACL:'public-read-write'
//         };

//       // calling the upload function
//         let uploadDetails = await this._s3.upload(params).promise()

//         if(uploadDetails.Location){
//           // delete file as upload successfully
//             fs.unlinkSync(file.path)
//         }
      
//         return uploadDetails

//     }catch(error){
//       console.log(error)
//       throw new error(error)
//     }
//   }
// }

// module.exports = new awsCommon();