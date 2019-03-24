

function extractInfoFromTags(tags) {
  let tagInfo = {};
  const bedroomRegex = /(.*)BR.*/;
  const sqrtFtRegex = /(.*)ft2/;
  const dogsRegex = /dogs are OK/;
  const catsRegex = /cats are OK/;
  const washerDryerRegex = /w\/d in unit/;
  const listingTypeRegex = /(apartment|condo|townhouse|house)/;

  tags.forEach((t) => {
    let match = null;
    if (match = t.match(bedroomRegex)){
      tagInfo['bedrooms'] = parseInt(match[1]);
    } else if (match = t.match(sqrtFtRegex)) {
      tagInfo['ft2'] = parseInt(match[1]);
    } else if (match = t.match(dogsRegex)) {
      tagInfo['dogs'] = true;
    } else if (match = t.match(catsRegex)) {
      tagInfo['cats'] = true;
    } else if (match = t.match(washerDryerRegex)) {
      tagInfo['washerDryer'] = true;
    } else if (match = t.match(listingTypeRegex)) {
      tagInfo['type'] = match[1];
    } 
  });

  return tagInfo;
}

module.exports = {
    extractInfoFromTags,
};