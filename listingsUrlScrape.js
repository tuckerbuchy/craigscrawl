const AWS = require('aws-sdk');
const util = require('util');
const rp = require('request-promise');
const cheerio = require('cheerio');

const CL_APA_PAGINATION_SIZE = 120; // TODO: Infer batch size from the first query.

class ApartmentJob{
    constructor(region, offset=0, limit=CL_APA_PAGINATION_SIZE, skip=1){
        this.region = region;
        this.offset = offset;
        this.limit = limit;
        this.skip = skip;
    }
}

function filterWithSkip(arr, skip){
    return arr.filter((element, index) => { return index % skip === 0; })
}

function getApartmentsUrl(region, offset=0){
    const craigslistUrl = 'https://%s.craigslist.ca/d/apts-housing-for-rent/search/apa?s=%s';
    return util.format(craigslistUrl, region, offset);
}

function getApartmentsList(apartmentJob){
    console.log("Got to apartment listing ting");
    const options = {
        uri: getApartmentsUrl(apartmentJob.region, apartmentJob.offset),
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    console.log("Got to apartment listing ting");
    return rp(options)
        .then(($) => {
            console.log("Got to rp.");
            let listingRows = $('.content ul.rows li.result-row');
            let listings = [];
            listingRows.each((i, listingRow) => {
                let priceHtml = $('.result-price', listingRow);
                let price = null;
                if (priceHtml) {
                    if (priceHtml.html()) {
                        price = priceHtml.html().replace('$', '');
                    }
                }

                const listing = {
                    'dataPid': listingRow.attribs['data-pid'],
                    'url': $('.result-title', listingRow).attr('href'),
                    'title': $('.result-title', listingRow).text(),
                    'price': price
                }
                listings.push(listing);
            });
            console.log("Done with listings...");
            return listings;
        })
        .then(listings => {
            return filterWithSkip(listings.slice(0, apartmentJob.limit), apartmentJob.skip)
        })
        .catch((err) => {
            console.log(err);
        });
        console.log("Got to end ");

}

async function crawlApartments (region, amount, skip){
    let n = 0;
    let apartmentJobs = [];
    while (n < amount){
        let remaining = amount - n;
        let batchSize = remaining >= CL_APA_PAGINATION_SIZE ? CL_APA_PAGINATION_SIZE : remaining;
        let apartmentJob = new ApartmentJob(region, n, batchSize, skip);
        apartmentJobs.push(apartmentJob);
        n += batchSize;
    }
    console.log(apartmentJobs);
    return apartmentJobs.reduce( ( promise, apartmentJob ) => {
        return promise.then( (allApartments) => {
            console.log(util.format("On offset %s with limit=%s skip=%s", apartmentJob.offset, apartmentJob.limit, apartmentJob.skip));
            return getApartmentsList(apartmentJob)
                .then((newApartments) => allApartments = allApartments.concat(newApartments))
        })
    }, Promise.resolve([]));
}

function listingToDynamo(listing) {
    const attrMap = {
        'dataPid': 'S',
        'url': 'S',
        'title': 'S',
        'price': 'N'
    }
    let listingDynamo = {};
    Object.keys(listing).forEach(function(attr) {
        let val = {}
        val[attrMap[attr]] = listing[attr];
        listingDynamo[attr] = val;
        return listingDynamo;
    });

    listingDynamo['complete'] = {BOOL: false}
    return listingDynamo;
}

function loadToDynamo(listings){
    // Set the region
    AWS.config.update({region: 'us-east-1'});

    // Create the DynamoDB service object
    docClient = new AWS.DynamoDB.DocumentClient();


    return listings.reduce( ( promise, listing ) => {
        var params = {
            TableName: 'CraigslistApartments',
            Item: listing,
        };
        return promise.then( () => {
            return new Promise((resolve, reject) => {
                docClient.put(params, function(err, data){
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        })
    }, Promise.resolve());
}

module.exports = {
    listingsUrlScrape: ( async (event, context) => {
        console.log(util.format("Doing with REGION=%s, AMOUNT=%s, SKIP=%s", process.env.REGION, process.env.AMOUNT, process.env.SKIP));
        const listings = await crawlApartments(process.env.REGION, process.env.AMOUNT, process.env.SKIP);
        await loadToDynamo(listings)
    })
};