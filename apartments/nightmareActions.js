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
          'dataPid': listingRow.getAttribute('data-pid'),
          'url': listingRow.querySelector('.result-title').href,
          'title': listingRow.querySelector('.result-title').innerText,
          'price': price
        }
        listings.push(listing);
      });
      return listings;
    }, done)
  },
  extractApartmentPageData: function(done){
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

      let position;
      let nodes = document.querySelectorAll('.postinginfo')
      nodes.forEach( (n, i) => {
        if (n.innerText.includes('posted: ')){
          position = i;
        };
      });
      let postedNode = nodes[position];

      nodes = document.querySelectorAll('.postinginfo');

      position = null;
      nodes.forEach( (n, i) => {
        if (n.innerText.includes('updated: ')){
          position = i;
        };
      });
      let updatedNode = nodes[position];

      let postedDate;
      if (postedNode) postedDate = postedNode.querySelector('time').getAttribute('datetime');
      let updatedDate
      if (updatedNode) updatedDate = updatedNode.querySelector('time').getAttribute('datetime');
      
      return {
        geo,
        postedDate,
        updatedDate
      };
    }, done)
  }
}