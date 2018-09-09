// const cheerio = require('cheerio');
// const fs = require('fs');
const util = require('util');

// // Wrap readfile to get a async/await version.
// const readFile = util.promisify(fs.readFile);

// async function parseHTML(page) {
//   const data = await readFile(page);
//   const $ = cheerio.load(data);

// }
// // parseHTML('html/sample.html');
// parseHTML('html/apa.html');


const Nightmare = require('nightmare')
const nightmare = Nightmare({ 
	show: true 
})

Nightmare.action('grabGeospatial', function(done){
	this.evaluate_now(() => {
		let map = document.querySelector('#map');
		let geo = {
		'lat' : map.getAttribute('data-latitude'),
		'lon' : map.getAttribute('data-longitude')
		};
		return geo;
	}, done)
})

nightmare
  .goto('https://vancouver.craigslist.ca/')
  .click('a.apa')
  .wait()
  .evaluate(() => {
  	const results = document.querySelectorAll('.content ul.rows li.result-row');
  	let searchResults = [];
  	results.forEach((result) => {
		let priceHtml = result.querySelector('.result-price');
		let price = null;
		if (priceHtml) {
			price = result.querySelector('.result-price').innerText.replace('$', '');;
		}
		let row = {
			'data_pid': result.getAttribute('data-pid'),
			'url': result.querySelector('.result-title').href,
			'title': result.querySelector('.result-title').innerText,
			'price': price
		}
		searchResults.push(row);
	});
	return searchResults;
  })
  .then(results => {
  	// For easier debugging
  	clResults = results.slice(0, 5);
  	//
  	return new Promise((resolve, reject) => {
  		clResults.reduce(function(accumulator, clResult) {
		  return accumulator.then(function(accumulator) {
		    return nightmare.goto(clResult.url)
		      	.wait('body')
		      	.evaluate(() => {
					let map = document.querySelector('#map');
					let geo = {
					'lat' : map.getAttribute('data-latitude'),
					'lon' : map.getAttribute('data-longitude')
					};
					return geo;
				})
				.then((geo) => {
					clResult['geo'] = geo;
				});
		  });
		}, Promise.resolve(true)).then(() => {
		    resolve(clResults);
		});
  	})
  })
  .then((results) => {
  	console.log("HELLO RESSULTS", results);

  })
  .catch(error => {
    console.error('Search failed:', error)
  })