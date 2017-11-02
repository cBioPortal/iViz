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
var e = d3.format('.1e');

var xDomainPool = {
  1: {
    input: [0, 20, 40, 60, 80, 100, 120, 140]
  },
  2: {
    input:[1, 3, 10, 31, 100, 316, 1000, 3162, 10000, 31622]
  },
  3: {
    input:[3, 5, 6, 9, 15] // Boundary value coverage
  },
  4: {
    input:[0, 10, 20, 30, 40, 50] // Boundary value coverage
  },
  5: {
    input:[1, 40, 320, 1900] // Boundary value coverage
  },
  6: {
    input:[] // Boundary value coverage
  },
  7: {
    input:[10] // Boundary value coverage
  },
  8: {
    input:[43, 187] // Boundary value coverage
  },
  9: {
    input:[1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500]
  },
  10: {
    input:[1600, 1700, 1800, 1900, 2000]
  },
  11: {
    input:[1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200]
  },
  12: {
    input:[1100, 1200, 1300]
  },
  13: {
    input:[0.00000000001, 0.0000000001, 0.000000001, 0.00000001, 0.0000001, 0.000001, 0.00001, 0.0001, 0.001]
  },
  14: {
    input:[0.00000000006, 0.0000000001, 0.0000000006, 0.000000001, 0.000000006, 0.00000001, 0.00000006]
  },
  15: {
    input:[0.00000000006, 0.0000000001, 0.0000000006, 0.000000001, 0.000000006, 0.00000001, 0.00000006, 0.0000001]
  },
  16: {
    input:[0.00000000001, 0.00000000043, 0.0000000022, 0.000000074]
  }
};

// noGrouping is true when number of ticks < 6.
// logScale and noGrouping cannot be true at same time.
// emptyValue only has value when hasNA = true.

describe("util.js getTickFormat() tests", function() {
  it('1.1 No NA but has outliers(<=min, >max). Ticks format: <=min, min, ..., max, >max', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };
    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        // Designed for noGrouping data for making distance between points is same.
        // xFakeDomain is a very sepcial array for noGrouping data. 
        // X axis will set tick value according to xFakeDomain since the slot is same, 
        // but tick values show on then chart are still same as values of xDomain.
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;
      
      if (data.noGrouping) {
        _.each(opts.xDomain, function(x){
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function(v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // Skip over the special year case
      if (ticks.length > 5 && !(data.min > 1500 && opts.xDomain.length > 7)) {
        expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 1; i++) {
          expect(ticks[i]).to.be.equal(opts.xDomain[i]);
        }
        expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[ticks.length - 2]); // last tick = '>' + value of second-last tick
      }
    });
  });

  it('1.2 Has NA and outliers. Ticks format: <=min, min, ..., max, >max, NA', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }

      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length);
      // Skip over the special year case
      if (ticks.length > 5 && !(data.min > 1500 && opts.xDomain.length > 7)) {
        expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 2; i++) {
          expect(ticks[i]).to.be.equal(opts.xDomain[i]);
        }
        expect(ticks[ticks.length - 2]).to.be.equal('>' + opts.xDomain[ticks.length - 3]); // second-last tick = '>' + value of third-last tick
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
      }
    });
  });

  it('2.1 logScale but no NA. Odd tick should start from 1***, even tick should be "". Ticks format: 1, "", 10, "", 100, "", .....', function() {
    logScale = true;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length);
      // check if ticks qualify logScale
      if (((data.max - data.min) > 1000) && data.min === 1 && ticks.length > 5) {
        for (var i = 0; i < opts.xDomain.length; i++) {
          if ((i + 1) % 2 === 1 ) {
            // Verify that odd values are a power of 10
            var tick = ticks[i];
            // Turn the exponent of tick to positive if it's negative
            if (ticks[i] < 1) {
              tick = 1 / ticks[i];
            }
            while (tick !== 1) {
              tick /= 10;
            }
            expect(tick).to.be.equal(1);
          } else {
            expect(ticks[i]).to.be.equal('');
          }
        }
      }
    });
  });

  it('2.2 logScale and has NA. Odd tick should start from 1***, even tick should be "" and last tick is "NA". Ticks format: 1, "", 10, "", 100, "",..., NA', function() {
    logScale = true;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length);
      // check if ticks qualify logScale
      if (((data.max - data.min) > 1000) && data.min === 1 && ticks.length > 5) {
        for (var i = 0; i < opts.xDomain.length - 1; i++) {
          if ((i + 1) % 2 === 0) {
            expect(ticks[i]).to.be.equal('');
          } else {
            // Verify that odd values are a power of 10
            var tick = ticks[i];
            // Turn the exponent of tick to positive if it's negative
            if (ticks[i] < 1) {
              tick = 1 / ticks[i];
            }
            while (tick !== 1) {
              tick /= 10;
            }
            expect(tick).to.be.equal(1);
          }
        }
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
      }
    });
  });

  it('3.1 When no grouping is true, ticks should be same as their own value.', function() {
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xFakeDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });
      expect(ticks).to.have.lengthOf(opts.xDomain.length);
      // check if ticks qualify noGrouping
      if (ticks.length < 6) {
        for (var i = 0; i < opts.xDomain.length - 1; i++) {
          expect(ticks[i]).to.be.equal(opts.xDomain[i]);
        }
      }
    });
  });

  it('3.2 When noGrouping is true and has NA, the last tick is NA and other ticks should be same as their own value.', function() {
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);

      _.each(opts.xFakeDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length);
      // check if ticks are not empty and qualify noGrouping
      if (ticks.length < 6 && ticks.length > 0) {
        for (var i = 0; i < opts.xDomain.length - 1; i++) {
          expect(ticks[i]).to.be.equal(opts.xDomain[i]);
        }
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA'
      }
    });
  });
  
  it('4.1 Test case for year: min year > 1500, length > 7 but no NA. i.e. <2004, "", 2007, "", 2013, "", 2019, "", 2025, >2025', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check the special case for year
      if (data.min > 1500 && opts.xDomain.length > 7) {
        expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 1; i++) {
          if (i % 2 === 0) {
            expect(ticks[i]).to.be.equal(opts.xDomain[i]);
          } else {
            expect(ticks[i]).to.be.equal('');
          }
        }
        expect(ticks[ticks.length - 1]).to.be.equal('>' + opts.xDomain[opts.xDomain.length - 2]); // last tick = '>' + value of second-last tick
      }
    });
  });

  it('4.2 Test case for year: min year > 1500, length > 7 and has NA. i.e. <2004, "", 2007, "", 2013, "", 2019, "", 2025, >2025, NA', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check the special case for year
      if (data.min > 1500 && opts.xDomain.length > 7) {
        expect(ticks[0]).to.be.equal('<=' + opts.xDomain[1]); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 2; i++) {
          if (i % 2 === 0) {
            expect(ticks[i]).to.be.equal(opts.xDomain[i]);
          } else {
            expect(ticks[i]).to.be.equal('');
          }
        }
        expect(ticks[ticks.length - 2]).to.be.equal('>' + opts.xDomain[ticks.length - 3]); // second-last tick = '>' + value of third-last tick
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
      }
    });
  });
  
  it('5.1 Small Data: no NA and noGrouping = false. Ticks format: <=min, min(1.0e-8), ... , max(1.0e-4), >max', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check if ticks are small number but not noGrouping
      if (ticks.length > 5 && opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] < 0.001 &&
        opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] > 0) {
        expect(ticks[0]).to.be.equal('<=' + e(opts.xDomain[1])); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 1; i++) {
          if (ticks[i].toString().charAt(0) === '1') {
            expect(ticks[i]).to.be.equal(e(opts.xDomain[i]));
          } else {
            expect(ticks[i]).to.be.equal('');
          }
        }
        expect(ticks[ticks.length - 1]).to.be.equal('>' + e(opts.xDomain[opts.xDomain.length - 2])); // last tick = '>' + value of second-last tick
      }
    });
  });

  it('5.2 Small Data: has NA and noGrouping = false. Ticks format: <=min, min(1.0e-8), ... , max(1.0e-4), >max, NA', function() {
    logScale = false;
    data = {
      'noGrouping': false,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check if ticks are small number but not noGrouping
      if (ticks.length > 5 && opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] < 0.001 &&
        opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] > 0) {
        expect(ticks[0]).to.be.equal('<=' + e(opts.xDomain[1])); // first tick = '<=' + value of second tick
        for (var i = 1; i < opts.xDomain.length - 2; i++) {
          if (ticks[i].toString().charAt(0) === '1') {
            expect(ticks[i]).to.be.equal(e(opts.xDomain[i]));
          } else {
            expect(ticks[i]).to.be.equal('');
          }
        }
        expect(ticks[ticks.length - 2]).to.be.equal('>' + e(opts.xDomain[opts.xDomain.length - 3])); // second-last tick = '>' + value of third-last tick
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
      }
    });
  });

  it('5.3 Small Data: no NA and noGrouping = true. Ticks should be same as its value.', function() {
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': false,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xFakeDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check if ticks are small number and noGrouping is true
      if (ticks.length < 6 && opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] < 0.001 &&
        opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] > 0) {
        for (var i = 0; i < opts.xDomain.length; i++) {
          expect(ticks[i]).to.be.equal(e(opts.xDomain[i]));
        }
      }
    });
  });

  it('5.4 Small Data: has NA and noGrouping = true. Last tick is "NA" and other ticks should be same as their own value.', function() {
    logScale = false;
    data = {
      'noGrouping': true,
      'hasNA': true,
      'smallDataFlag': true,
      'min': '',
      'max': ''
    };

    _.each(xDomainPool, function(xDomain) {
      ticks = [];
      opts = {
        xDomain: [],
        emptyMappingVal: '',
        xFakeDomain: []
      };
      opts.xDomain = xDomain.input;

      if (data.noGrouping) {
        _.each(opts.xDomain, function (x) {
          opts.xFakeDomain.push(opts.xDomain.indexOf(x));
        });
      }
      if (data.hasNA) {
        if (opts.xFakeDomain.length > 0) {
          opts.emptyMappingVal = opts.xFakeDomain[opts.xFakeDomain.length - 1];
        } else {
          opts.emptyMappingVal = opts.xDomain[opts.xDomain.length - 1];
        }
      }
      data.min = _.min(opts.xDomain);
      data.max = _.max(opts.xDomain);
      _.each(opts.xFakeDomain, function (v) {
        ticks.push(util.getTickFormat(v, logScale, data, opts));
      });

      expect(ticks).to.have.lengthOf(opts.xDomain.length); // same length
      // check if ticks are small number and noGrouping is true
      if (ticks.length < 6 && opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] < 0.001 &&
        opts.xDomain[Math.ceil((opts.xDomain.length * (1 / 2)))] > 0) {
        for (var i = 0; i < opts.xDomain.length - 1; i++) {
          expect(ticks[i]).to.be.equal(e(opts.xDomain[i]));
        }
        expect(ticks[ticks.length - 1]).to.be.equal('NA'); // last tick = 'NA' 
      }
    });
  });
});