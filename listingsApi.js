const AWS = require('aws-sdk');
const AthenaExpress = require("athena-express")

async function getListings(event, context, callback) {
  AWS.config.update({
    region: 'us-east-1',
  });
  docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'apartmentListings',
    // AttributesToGet: ["price"],
    Limit: 5
  };

  return docClient.scan(params).promise().then((records) => {
    return {
      statusCode: 200,
      body: JSON.stringify(records['Items'])
    };
  });
}

function formatPostedDateField() {
  return 'Date(from_iso8601_timestamp(posteddate))'
}

function formatPostDateValue(date) {
  if (!Date.parse(date)){
    throw new Error("Invalid date!!!");
  };

  return `Date('${date}')`
}

function buildQuery(queryParams) {
  let wheres = [];
  if (queryParams) {
    Object.keys(queryParams).forEach(param => {
      switch(param) {
        case 'type':
          if (queryParams[param]) wheres.push({field: 'type', operator: '=', value: `'${queryParams[param]}'`});
          break;
        case 'dogs':
          if (queryParams[param] === 'true') {
            wheres.push({field: 'dogs', operator: 'is not', value: 'NULL'});
          } else if (queryParams[param] === 'false') {
            wheres.push({field: 'dogs', operator: 'is', value: 'NULL'});  
          }
          break;
        case 'cats':
          if (queryParams[param] === 'true') {
            wheres.push({field: 'cats', operator: 'is not', value: 'NULL'});
          } else if (queryParams[param] === 'false') {
            wheres.push({field: 'cats', operator: 'is', value: 'NULL'});  
          } 
          break;
        case 'minBedrooms':
          if (queryParams[param]) wheres.push({field: 'bedrooms', operator: '>=', value: parseInt(queryParams[param])});
          break;
        case 'maxBedrooms':
          if (queryParams[param]) wheres.push({field: 'bedrooms', operator: '<=', value: parseInt(queryParams[param])});
          break;
        case 'minFt2':
          if (queryParams[param]) wheres.push({field: 'ft2', operator: '>=', value: parseInt(queryParams[param])})
          break;
        case 'maxFt2':
          if (queryParams[param]) wheres.push({field: 'ft2', operator: '<=', value: parseInt(queryParams[param])})
          break;
        case 'startDate':
          if (queryParams[param]) wheres.push({field: formatPostedDateField(), operator: '>=', value: formatPostDateValue(queryParams[param])})
      }
    });
  }
  let queryString = "select neighborhood, approx_percentile(price, 0.5) as averageRent, count(*) as numberRecords from apartments.apartment_listings";
  if (wheres.length){
    queryString += " where " + wheres.map((w)=>[w.field, w.operator, w.value].join(' ')).join(' AND ');
  }
  queryString += " group by neighborhood"
  return queryString;
}

async function getAverageRentOfNeighbourhood(event, context, callback) {
  try {
    const aws = require('aws-sdk');
    const athenaExpressConfig = { 
      aws,
      s3: "s3://athena-express-queries"
    };
    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    let queryString = buildQuery(event['queryStringParameters']);
    console.log(queryString);
    let query = {
      sql: queryString,
      db: "apartments"
    };

    console.log(queryString);
    let results = await athenaExpress.query(query);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
      },
      body: JSON.stringify(results)
    }

  } catch (error) {
    const response = {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
      },
      body: JSON.stringify(error)
    }
    console.log(error);
    return response;
  }
}

module.exports = {
  get: getListings,
  getAverageRent: getAverageRentOfNeighbourhood,
}