const { extractInfoFromTags } = require('../tags');
var should = require('chai').should()
// var assert = require('assert');
describe('test tag regex expressions', function() {
  describe('test bedrooms and bathrooms', function() {
    it('should return the number of bedrooms', function() {
      let testTags = [
        '1BR / 1Ba',
        '543ft2',
        'apartment',
        'available apr 1',
        'w/d in unit',
        'no smoking',
        'cats are OK - purrr',
        'dogs are OK - wooof',
      ];

      let info = extractInfoFromTags(testTags);
      info.should.have.property('bedrooms').equal('1');
      info.should.have.property('ft2').equal('543');
      info.should.have.property('dogs').equal(true);
      info.should.have.property('cats').equal(true);
      info.should.have.property('washerDryer').equal(true);
      info.should.have.property('type').equal('apartment');
    });
  });
});
