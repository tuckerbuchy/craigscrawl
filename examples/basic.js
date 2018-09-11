const Nightmare = require('nightmare')
const fs = require('fs')
const util = require('util')
const apartmentActions = require('./apartments/nightmareActions.js')
const apartmentCrawler = require('./apartments/crawl.js')

function configureNightmare() {
  Nightmare.action('crawlApartmentsListPage', apartmentActions.crawlApartmentsListPage)
  Nightmare.action('extractApartmentGeospatialData', apartmentActions.extractApartmentGeospatialData)
}

configureNightmare()

apartmentCrawler.crawlApartments(amount=15).then((allListings) => {
	console.log(util.format("Crawled %d listings in total.", allListings.length));
	fs.writeFile('listings_sample.json', JSON.stringify(allListings, null, 2), (err) => {
		if (err) throw err;
	});
});

