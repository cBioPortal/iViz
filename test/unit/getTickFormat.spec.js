"use strict";

var jsdom = require("jsdom");
var { JSDOM } = jsdom;
var { window } = new JSDOM(`<!DOCTYPE html>`);
global.window = window;
global.navigator = global.window.navigator;

var expect = require('chai').expect;
var iViz = require('../../app/scripts/main.js');
global.window.iViz = iViz;
global.window.iViz.util = {};

var util = require('../../app/scripts/controller/util.js');
var _ = require('../../bower_components/underscore/underscore.js');
var d3 = require('../../bower_components/d3/d3.js');
global.d3 = d3;
global.window.iViz.util = util;


var logScale = false;
var data = {};
var opts = {};
var ticks = [];

// noGrouping is true when number of ticks < 6.
// logScale and noGrouping cannot be true at same time.
// emptyValue only has value when hasNA = true.

describe("cbio-util.js getTickFormat() tests", function () {
  
  it('1. No NA and has outliers.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0, 20, 40, 60, 80, 100, 120, 140],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[ticks.length - 2]); // last tick = '>' + value of last second tick
  });

  it('2. logScale but no NA tick. Odd tick should start from 1***, even tick should be "". ', function() {
    ticks = [];
    logScale = true;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1, 3, 10, 31, 100, 316, 1000, 3162, 10000, 31622],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);

    for (var i = 0; i < opts.xDomain.length; i++) {
      if ((i + 1) % 2 === 0) {
        expect(ticks[i]).to.be.equal('');
      } else {
        expect(ticks[i]).to.be.equal(ticks[i]);
      }
    }
  });

  it('3. Has NA and outliers.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0, 20, 40, 60, 80, 100, 120, 140],
      'emptyMappingVal' : 140,
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);

    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 2]).to.be.equal('>' + opts.xDomain[ticks.length - 3]); // last second tick = '>' + value of last third tick
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('4. Ticks should be same as xDomain (no max and min outlier) when no grouping is true.', function() {
    ticks = []
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [3, 5, 6, 9],
      'emptyMappingVal' : '',
      'xFakeDomain': [0, 1, 2, 3]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);
    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      expect(ticks[i]).to.be.equal(opts.xDomain[i]);
    }

  });

  it('4.1 Only 1 number tick.', function() {
    ticks = []
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [10],
      'emptyMappingVal' : '',
      'xFakeDomain': [0]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);
    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      expect(ticks[i]).to.be.equal(opts.xDomain[i]);
    }
  });

  it('4.2 Only 1 number tick and NA tick.', function() {
    ticks = []
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [3, 5],
      'emptyMappingVal' : 1,
      'xFakeDomain': [0, 1]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);
    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      expect(ticks[i]).to.be.equal(opts.xDomain[i]);
    }
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('5. Ticks should be same as xDomain (no max and min outlier) when no grouping is true except last tick(NA).', function() {
    ticks = []
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [3, 5, 6, 9, 11],
      'emptyMappingVal' : 8,
      'xFakeDomain': [0, 2, 4, 6, 8]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);
    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      expect(ticks[i]).to.be.equal(opts.xDomain[i]);
    }
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('6. logScale and has NA tick. Odd tick should start from 1***, even tick should be "" and last tick is "NA".', function() {
    ticks = [];
    logScale = true;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1, 3, 10, 31, 100, 316, 1000, 3162, 10000, 31622],
      'emptyMappingVal' : 31622,
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length);

    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      if ((i + 1) % 2 === 0) {
        expect(ticks[i]).to.be.equal('');
      } else {
        expect(ticks[i]).to.be.equal(ticks[i]);
      }
    }
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('1.3 More than 5 ticks when no NA and has outliers.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0, 1, 2, 3, 4, 5],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[opts.xDomain.length - 2]); // last tick = '>' + value of last second tick
  });

  it('7. Special case for year: min year > 1500, and length > 7.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[opts.xDomain.length - 2]); // last tick = '>' + value of last second tick
  });

  it('7.1 Special case for year: min year > 1500, and length < 7.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1600, 1700, 1800, 1900, 2000],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[opts.xDomain.length - 2]); // last tick = '>' + value of last second tick
  });

  it('7.2 Special case for year; min year < 1500, and length > 7.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200],
      'emptyMappingVal' : '',
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
    expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[opts.xDomain.length - 2]); // last tick = '>' + value of last second tick
  });

  it('7.2 Special case for year; min year < 1500, and length < 7.', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [1300, 1400, 1500],
      'emptyMappingVal' : '',
      'xFakeDomain': [0, 100, 200]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    for (var i = 0; i < opts.xDomain.length - 1; i++) {
      expect(ticks[i]).to.be.equal(opts.xDomain[i]);
    }
  });

  it('8.1.1 Small Data: initial of ticks is "1", no NA and noGrouping = false', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000001, 0.000000001, 0.00000001, 0.0000001, 0.000001, 0.00001, 0.0001, 0.001],
      'emptyMappingVal' : ''
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });

  it('8.1.2 Small Data: initial of ticks is not "1", no NA and noGrouping = false\'', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000006, 0.0000000001, 0.0000000006, 0.000000001, 0.000000006, 0.00000001, 0.00000006],
      'emptyMappingVal' : ''
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });

  it('8.2.1 Small Data: initial of ticks is "1", has NA and noGrouping = false', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000001, 0.000000001, 0.00000001, 0.0000001, 0.000001, 0.00001, 0.0001, 0.001],
      'emptyMappingVal' : 0.001
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('8.2.2 Small Data: initial of ticks is not "1", has NA and noGrouping = false\'', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000006, 0.0000000001, 0.0000000006, 0.000000001, 0.000000006, 0.00000001, 0.00000006, 0.0000001],
      'emptyMappingVal' : 0.0000001
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
    expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
  });

  it('8.3.1 Small Data: initial of ticks is "1", no NA and noGrouping = true', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000001, 0.000000001, 0.00000001],
      'emptyMappingVal' : '',
      'xFakeDomain': [0, 0.000001, 0.000002, 0.000003]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });

  it('8.3.2 Small Data: initial of ticks is not "1", no NA and noGrouping = true', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000006, 0.000000001, 0.00000006],
      'emptyMappingVal' : '',
      'xFakeDomain': [0, 0.000001, 0.000002, 0.000003]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });

  it('8.4.1 Small Data: initial of ticks is "1", has NA and noGrouping = true', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000001, 0.000000001, 0.00000001],
      'emptyMappingVal' : 0.000003,
      'xFakeDomain': [0, 0.000001, 0.000002, 0.000003]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });

  it('8.4.2 Small Data: initial of ticks is not "1", has NA and noGrouping = true', function() {
    ticks = [];
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    opts = {
      'xDomain' : [0.00000000001, 0.0000000006, 0.000000001, 0.00000006],
      'emptyMappingVal' : 0.000003,
      'xFakeDomain': [0, 0.000001, 0.000002, 0.000003]
    };

    data.min = _.min(opts.xDomain);
    data.max = _.max(opts.xDomain);

    _.each(opts.xFakeDomain, function(v) {
      ticks.push(util.getTickFormat(v, logScale, data, opts));
    });

    // console.log(opts.xDomain, opts.xFakeDomain, ticks);

    expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
  });
  
});