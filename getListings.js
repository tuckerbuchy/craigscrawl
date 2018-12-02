const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
});
docClient = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: 'CraigslistApartments',
  // ProjectionExpression:"#price",
  // FilterExpression:"#price between :low and :high",
  // ExpressionAttributeNames: {
  //     "#price": "price",
  // },
  // ExpressionAttributeValues: {
  //        ":low": 100,
  //        ":high": 20000 
  // } 
};
docClient.scan(params, function(err, data){
  if (err) {
    console.log(err)
  } else {
    console.log(JSON.stringify(data['Items']))
  }
});
