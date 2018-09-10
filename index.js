const fs = require('fs')
const util = require('util')
const Nightmare = require('nightmare')
const vo = require('vo')
const RESULT_BATCH_SIZE = 120; // TODO: Infer batch size from the first query.


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
		let lat = null;
		let lon = null;

		if (map) {
			lat = map.getAttribute('data-latitude');
			lon = map.getAttribute('data-longitude');
		}

		const geo = {
			'lat' : lat,
			'lon' : lon
		};
		return geo;
	}, done)
})

const nightmare = Nightmare({ 
	show: true 
})

function getCraigslistUrl(offset=0){
	const craigslistUrl = 'https://vancouver.craigslist.ca/d/apts-housing-for-rent/search/apa?s=%s';
	return util.format(craigslistUrl, offset);
}

function getSomeCraigslistListings(offset=0, limit=RESULT_BATCH_SIZE) {
	return nightmare
	  .goto(getCraigslistUrl(offset=offset))
	  .crawlClHousingListings()
	  .then(listings => {
	  	return new Promise((resolve, reject) => {
	  		listings = listings.splice(0, limit)
	  		listings.reduce(function(accumulator, listing) {
			  return accumulator.then(function(accumulator) {
			    return nightmare.goto(listing.url)
			      	.wait('body')
			      	.extractGeospatial()
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
	  	return Promise.resolve(listings)
	  })
	  .catch(error => {
	    console.error('Search failed:', error)
	  })
}

let allListings = [];
function crawlCraigslist(amount){
	let n = 0;
	let listingJobs = [];
	while (n < amount){
		// const newListings = await getSomeCraigslistListings(n);
		let remaining = amount - n;
		let batchSize = remaining >= RESULT_BATCH_SIZE ? RESULT_BATCH_SIZE : remaining;
		listingJob = {
			url: getCraigslistUrl(n),
			limit: batchSize,
			offset: n
		}
		listingJobs.push(listingJob);
		n += RESULT_BATCH_SIZE;
	}

	return listingJobs.reduce( ( promise, listingJob ) => {
		return promise.then( () => {
			console.log(util.format("Processing %s listings at %s", listingJob.limit, listingJob.offset));
			return getSomeCraigslistListings(listingJob.offset, listingJob.limit)
					.then((listings) => allListings = allListings.concat(listings))
		})
	}, Promise.resolve());
}

crawlCraigslist(amount=2).then(() => {
	console.log(util.format("Crawled %d listings in total.", allListings.length));
	fs.writeFile('listings_sample.json', JSON.stringify(allListings, null, 2), (err) => {
		if (err) throw err;
	});
});

