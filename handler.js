'use strict';

const sizeOf = require('s3-image-size');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const bucketName = process.env.BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE;


module.exports.extractMetadata = (event, context, callback) => {

  var s3 = new AWS.S3();
  var key = event.Records[0].s3.object.key.replace(/\+/g, " ");
  var size = event.Records[0].s3.object.size;
  var bucketparams = {Bucket: bucketName, Key: key};
  console.log(JSON.stringify(bucketparams));
  s3.getObject(bucketparams, function(err, data){
    if (err){
	  callback(new Error(JSON.stringify(err)));
	  return;
	} 
	else{

	  sizeOf(s3, bucketName, key, function(err, dimensions, bytesRead){
	    const params = {
	      TableName: tableName,
		  Item:{
		    s3objectkey: key,
			size: size,
			width: dimensions.width,
			height: dimensions.height
		  }
        };
		
		dynamoDb.put(params, (error,result) => {
		  if(error){
		    callback(new Error(JSON.stringify(error)));
			return;
	      } 
		
		  const response = {
		    statusCode: 200,
			body: JSON.stringify(result),
	      }

 		  callback(null, response);
		});	
	  });
	    
	}     
  }); 
};

module.exports.getMetadata = (event, context, callback) => {
  var s3objectkey = event.pathParameters.s3objectkey.replace(/\+/g, " ")
  
  const params = {
    TableName: tableName,
    Key:{
      s3objectkey: s3objectkey  
    }
  };
  
  dynamoDb.get(params, (error,result) => {
    if(error){
      console.error(error);
      callback(new Error(JSON.stringify(error)));
      return;
    }
		
	const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    }

    callback(null, response);
    
  });
  
};

module.exports.getImage = (event, context, callback) => {
  var s3objectkey = event.pathParameters.s3objectkey.replace(/\+/g, " ")
  var s3 = new AWS.S3();
  var bucketparams = {Bucket: bucketName, Key: s3objectkey};
  
  s3.getSignedUrl('getObject', bucketparams, function(err, url){
    if(err){
	  callback(new Error(JSON.stringify(err)));
	  return;
	}else{
      const response = {
        statusCode: 200,
        body: JSON.stringify(url),
      }
      callback(null, response);
	}
  });
};

// s3.getObject(bucketparams, function(err, data){
	  // var binaryData = JSON.parse(JSON.stringify(data.Body)).data;
	  
	  // if(err){
		  // callback(err, null);
	  // }else{
	    // Jimp.read(url)
		// .then(image => {
		  // let response = {
			  // "statusCode": 200,
			  // "headers": {"Content-Type": "image/octet-stream"},
			  // "body": image,
			  // //"isBase64Encoded": true
		  // };
		  
		  // callback(null, response);
		// })
		// .catch(err => {
		  // // handle an exception
		// });
		   
	  // }
  // })	