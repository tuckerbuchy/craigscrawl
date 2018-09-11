const Nightmare = require('nightmare')
const util = require('util')
const apartmentActions = require('./nightmareActions.js')

const CL_APA_PAGINATION_SIZE = 120; // TODO: Infer batch size from the first query.

const nightmare = Nightmare({ 
  show: true 
})

function getApartmentsUrl(offset=0){
  const craigslistUrl = 'https://vancouver.craigslist.ca/d/apts-housing-for-rent/search/apa?s=%s';
  return util.format(craigslistUrl, offset);
}

function getApartmentsBatch(offset=0, limit=CL_APA_PAGINATION_SIZE) {
  return nightmare
    .goto(getApartmentsUrl(offset=offset))
    .crawlApartmentsListPage()
    .then(listings => {
      return new Promise((resolve, reject) => {
        listings = listings.splice(0, limit)
        listings.reduce(function(accumulator, listing) {
        return accumulator.then(function(accumulator) {
          return nightmare.goto(listing.url)
              .wait('body')
              .extractApartmentGeospatialData()
          .then((geo) => {
            listing['geo'] = geo;
          })
          .catch(error => {
            console.error('Geospatial crawl failed:', error)
          });
        });
      }, Promise.resolve(true)).then(() => {
          resolve(listings);
      });
      })
    })
    .then((listings) => {
      return nightmare.end().then(() => {
        return Promise.resolve(listings)
      });
    })
    .catch(error => {
      console.error('Search failed:', error)
    })
}

module.exports = {
  crawlApartments: function (amount){
    let n = 0;
    let listingJobs = [];
    while (n < amount){
      let remaining = amount - n;
      let batchSize = remaining >= CL_APA_PAGINATION_SIZE ? CL_APA_PAGINATION_SIZE : remaining;
      listingJob = {
        url: getApartmentsUrl(n),
        limit: batchSize,
        offset: n
      }
      listingJobs.push(listingJob);
      n += batchSize;
    }

    return listingJobs.reduce( ( promise, listingJob ) => {
      return promise.then( (allListings) => {
        console.log(util.format("Processing %s listings at %s", listingJob.limit, listingJob.offset));
        return getApartmentsBatch(listingJob.offset, listingJob.limit)
            .then((listings) => allListings = allListings.concat(listings))
      })
    }, Promise.resolve([]));
  }
}
