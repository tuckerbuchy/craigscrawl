module.exports = {
  crawlApartmentsListPage: function (done) {
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
  },
  extractApartmentGeospatialData: function(done){
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
  }
}