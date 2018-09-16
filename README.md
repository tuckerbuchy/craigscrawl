# Craigslist Crawler

## Example 
```node
apartmentCrawler.crawlApartments(amount=2).then(allListings => { console.log(allListings) })
```
### Sample Output
```json
[
  {
    "data_pid": "6679257325",
    "post_datetime": "2018-09-10 22:08",
    "price": "1900",
    "title": "Station Square Metrotown Burnaby",
    "url": "https://vancouver.craigslist.ca/bnc/apa/d/station-square-metrotown/6679257325.html",
    "geo": {
      "lat": "49.229159",
      "lon": "-123.002071"
    }
  },
  {
    "data_pid": "6680801991",
    "post_datetime": "2018-09-10 22:08",
    "price": "1550",
    "title": "Vancouver E56th between Fraser & Knight 2 bedrooms &1.5baths",
    "url": "https://vancouver.craigslist.ca/van/apa/d/vancouver-e56th-between/6680801991.html",
    "geo": {
      "lat": "49.218929",
      "lon": "-123.087784"
    }
  }
]
```

### Lambda deployment
#### Zip it
`zip -r craigscrawl.zip * -x '*electron/dist*'`
#### Ship it
aws s3 cp craigscrawl.zip s3://<yourbucket>
