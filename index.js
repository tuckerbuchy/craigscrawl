const util = require('util')
const Nightmare = require('nightmare')
const RESULT_BATCH_SIZE = 120; // TODO: Infer batch size from the first query.

function getCraigslistUrl(offset=0){
	const craigslistUrl = 'https://vancouver.craigslist.ca/d/apts-housing-for-rent/search/apa?s=%s';
	return util.format(craigslistUrl, offset);
}

Nightmare.action('crawlClHousingListings', function(done){
	this.evaluate_now(() => {
	  	const listingRows = document.querySelectorAll('.content ul.rows li.result-row');
	  	let listings = [];
	  	listingRows.forEach((listingRow) => {
			let priceHtml = listingRow.querySelector('.result-price');
			let price = null;
			if (priceHtml) {
				price = listingRow.querySelector('.result-price').innerText.replace('$', '');;
			}

			const listing = {
				'data_pid': listingRow.getAttribute('data-pid'),
				'url': listingRow.querySelector('.result-title').href,
				'title': listingRow.querySelector('.result-title').innerText,
				'price': price,
				'post_datetime': listingRow.querySelector('.result-date').getAttribute('datetime')
			}
			listings.push(listing);
		});
		return listings;
	}, done)
})

Nightmare.action('extractGeospatial', function(done){
	this.evaluate_now(() => {
		const map = document.querySelector('#map');
		const geo = {
			'lat' : map.getAttribute('data-latitude'),
			'lon' : map.getAttribute('data-longitude')
		};
		return geo;
	}, done)
})

const nightmare = Nightmare({ 
	show: true 
})

let pageListings = null;
nightmare
  .goto(getCraigslistUrl(offset=400))
  .crawlClHousingListings()
  .then(listings => {
  	// For easier debugging
  	listings = listings.slice(0, 5);
  	return new Promise((resolve, reject) => {
  		listings.reduce(function(accumulator, listing) {
		  return accumulator.then(function(accumulator) {
		    return nightmare.goto(listing.url)
		      	.wait('body')
		      	.extractGeospatial()
				.then((geo) => {
					listing['geo'] = geo;
				});
		  });
		}, Promise.resolve(true)).then(() => {
		    resolve(listings);
		});
  	})
  })
  .then((listings) => {
  	console.log(listings);
  	pageListings = listings;
  })
  .catch(error => {
    console.error('Search failed:', error)
  })