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
        apiKey: process.env.GMAPS_API_KEY,
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
        'lat' : Number(lat),
        'lon' : Number(lon)
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

            let position = null;
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

            const listingData = {
                ...geo,
                postedDate,
                updatedDate
            };
            console.log(listingData);
            return listingData;
        })
        .catch((err) => {
            console.log(err);
        });
}

module.exports = {
    getPageData,
};
