zip -r craigscrawl.zip *
aws s3 cp craigscrawl.zip s3://craigscrawl

aws lambda update-function-code --function-name grabListingUrls --s3-bucket craigscrawl --s3-key craigscrawl.zip --publish
aws lambda update-function-code --function-name scrapeListingPageData --s3-bucket craigscrawl --s3-key craigscrawl.zip --publish

rm -rf craigscrawl.zip
