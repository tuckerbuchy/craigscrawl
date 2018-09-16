const Nightmare = require('nightmare')
const fs = require('fs')
const util = require('util')
const path = require('path');
const AWS = require('aws-sdk')
const apartmentActions = require('./apartments/nightmareActions.js')
const apartmentCrawler = require('./apartments/crawl.js')

function configureNightmare() {
    Nightmare.action('crawlApartmentsListPage', apartmentActions.crawlApartmentsListPage)
    Nightmare.action('extractApartmentPageData', apartmentActions.extractApartmentPageData)
}

configureNightmare()

function runCrawl() {
    apartmentCrawler.crawlApartments(region=process.env.REGION, amount=process.env.AMOUNT, skip=process.env.SKIP).then((allListings) => {
        console.log(util.format("Crawled %d listings in total.", allListings.length));
        // fs.writeFile('listings_sample.json', JSON.stringify(allListings, null, 2), (err) => {
        //     if (err) throw err;
        // });
        let key = path.join('apa', (new Date()).toISOString(), 'crawl.json')
        const s3 = new AWS.S3();
        s3.putObject({
                Bucket: 'craigscrawl',
                Key: key,
                Body: JSON.stringify(allListings, null, 2)
            },
            function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log("Succesfully uploaded the crawl data.", data);
            });

    });
}


exports.handler = function(event, context){
    runCrawl();
}