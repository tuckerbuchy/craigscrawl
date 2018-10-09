'use strict';
const AWS = require("aws-sdk");
const rp = require('request-promise');
const cheerio = require('cheerio');
const NodeGeocoder = require('node-geocoder');

async function getNeighbourhood(lat, lon) {
    var options = {
        provider: 'google',
        // Optional depending on the providers
        httpAdapter: 'https', // Default
        apiKey: '',
        formatter: null         // 'gpx', 'string', ...
    };

    var geocoder = NodeGeocoder(options);
    const res = await geocoder.reverse({lat:parseFloat(lat), lon:parseFloat(lon)});
    let neighborhood = null;
    if (res) {
        const loc = res[0];
        neighborhood = loc.extra.neighborhood;
    }
    return neighborhood;
}

function getGeoData($){
    const map = $('#map');
    let lat = null;
    let lon = null;

    if (map) {
        lat = map.attr('data-latitude');
        lon = map.attr('data-longitude');
    }

    const geo = {
        'lat' : lat,
        'lon' : lon
    };

    return geo;
}

async function getPageData(url) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(async ($) => {
            const geo = getGeoData($);
            geo['neighborhood'] = await getNeighbourhood(geo.lat, geo.lon);

            let position;
            let nodes = $('.postinginfo')
            nodes.each( (i, n) => {
                if ($(n).text().includes('posted: ')){
                    position = i;
                };
            });
            let postedNode = nodes[position];

            nodes = $('.postinginfo');

            position = null;
            nodes.each( (i, n) => {
                if ($(n).text().includes('updated: ')){
                    position = i;
                };
            });
            let updatedNode = nodes[position];

            let postedDate;
            if (postedNode) postedDate = $(postedNode).children('time').attr('datetime');
            let updatedDate
            if (updatedNode) updatedDate = $(updatedNode).children('time').attr('datetime');

            return {
                geo,
                postedDate,
                updatedDate
            };
        })
        .catch((err) => {
            console.log(err);
        });
}

function loadToDynamo(dataPid, extraData){
    // Set the region
    AWS.config.update({region: 'us-east-1'});

    // Create the DynamoDB service object
    const docClient = new AWS.DynamoDB.DocumentClient();


    var params = {
        TableName: 'CraigslistApartments',
        Key:{
            "dataPid": dataPid
        },
        UpdateExpression: "set latitude = :lat, longitude=:lon, neighborhood=:neighborhood, postedDate=:postedDate, updatedDate=:updatedDate",
        ExpressionAttributeValues:{
            ":lat": extraData.geo.lat,
            ":lon": extraData.geo.lon,
            ":neighborhood": extraData.geo.neighborhood,
            ":postedDate": Date(extraData.postedDate),
            ":updatedDate": extraData.updatedDate,
        }
    };

    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
}

module.exports = {
    listingsPageScrape: (event, context, callback) => {
        event.Records.forEach(async (record) => {
            console.log('Stream record: ', JSON.stringify(record, null, 2));

            if (record.eventName == 'INSERT') {
                let url = JSON.stringify(record.dynamodb.NewImage.url.S);
                url = decodeURI(url).replace(/['"]+/g, '');
                const pageData = await getPageData(url);
                await loadToDynamo(record.dynamodb.NewImage.dataPid.S, pageData);
            }
        });
        callback(null, `Successfully processed ${event.Records.length} records.`);
    }
};
