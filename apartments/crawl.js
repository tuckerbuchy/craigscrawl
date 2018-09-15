const Nightmare = require('nightmare')
const util = require('util')
const apartmentActions = require('./nightmareActions.js')

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
const nightmare = Nightmare({ 
  show: true 
})

function getApartmentsUrl(region, offset=0){
  const craigslistUrl = 'https://%s.craigslist.ca/d/apts-housing-for-rent/search/apa?s=%s';
  return util.format(craigslistUrl, region, offset);
}

function getApartmentsBatch(apartmentJob) {
  return nightmare
    .goto(getApartmentsUrl(region, apartmentJob.offset))
    .crawlApartmentsListPage()
    .then(apartments => {
      return new Promise((resolve, reject) => {
        apartments = apartments.slice(0, apartmentJob.limit);
        apartments = filterWithSkip(apartments, apartmentJob.skip);
        apartments.reduce(function(accumulator, apartment) {
        return accumulator.then(function(accumulator) {
          return nightmare.goto(apartment.url)
              .wait('body')
              .extractApartmentPageData()
          .then((data) => {
            // Node way to merge two hash's
            apartment = Object.assign(apartment, data);
          })
          .catch(error => {
            console.error('Geospatial crawl failed:', error)
          });
        });
      }, Promise.resolve(true)).then(() => {
          resolve(apartments);
      });
      })
    })
    .then((apartments) => {
      return nightmare.end().then(() => {
        return Promise.resolve(apartments)
      });
    })
    .catch(error => {
      console.error('Search failed:', error)
    })
}

module.exports = {
  crawlApartments: function (region, amount, skip){
    let n = 0;
    let apartmentJobs = [];
    while (n < amount){
      let remaining = amount - n;
      let batchSize = remaining >= CL_APA_PAGINATION_SIZE ? CL_APA_PAGINATION_SIZE : remaining;
      let apartmentJob = new ApartmentJob(region, n, batchSize, skip);
      apartmentJobs.push(apartmentJob);
      n += batchSize;
    }

    return apartmentJobs.reduce( ( promise, apartmentJob ) => {
      return promise.then( (allApartments) => {
        console.log(util.format("On offset %s with limit=%s skip=%s", apartmentJob.offset, apartmentJob.limit, apartmentJob.skip));
        return getApartmentsBatch(apartmentJob)
            .then((newApartments) => allApartments = allApartments.concat(newApartments))
      })
    }, Promise.resolve([]));
  }
}
