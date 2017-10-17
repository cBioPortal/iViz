'use strict';
(function(iViz, dc, _, $, d3, cbio) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.BarChart = function() {
    var content = this;

    var chartInst_;// DC chart instance.
    var opts_ = {};// Chart configuration options
    var data_ = {};// Chart related data. Such as attr_id.
    var colors_;
    var ndx_;
    var dcDimension;
    var mapTickToCaseIds = {}; // Save the related caseIds under tick value.

    var initDc_ = function(logScale) {
      var tickVal = [];
      var i = 0;
      var barSet = {};
      
      dcDimension = ndx_.dimension(function (d) {
        var val = d[data_.attrId];
        var _min;
        var _max;
        var endNumIndex = opts_.xDomain.length - 1; // when data doesn't have NA

        // isNaN(val) treats string in data as 'NA', such as "withheld" and "cannotReleaseHIPAA"
        if (iViz.util.strIsNa(val, true) || isNaN(val)) {
            val = opts_.xDomain[opts_.xDomain.length - 1];
        } else if (logScale) {
            for (i = 1; i < opts_.xDomain.length; i++) {
                if (d[data_.attrId] < opts_.xDomain[i] &&
                    d[data_.attrId] >= opts_.xDomain[i - 1]) {
                    val = parseInt(Math.pow(10, i / 2 - 0.25), 10);
                    _min = opts_.xDomain[i - 1];
                    _max = opts_.xDomain[i];
                    break;
                }
            }
        } else if (data_.noGrouping) {
          val = opts_.xFakeDomain[opts_.xDomain.indexOf(Number(d[data_.attrId]))];
        } else {
          if (data_.smallDataFlag) {
            if (d[data_.attrId] <= opts_.xDomain[1]) {
              val = opts_.xDomain[0];
            } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 3] && data_.hasNA) {
              val = opts_.xDomain[opts_.xDomain.length - 2];
            } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 2] && !data_.hasNA) {
              val = opts_.xDomain[opts_.xDomain.length - 1];
            } else {
              if (data_.hasNA) {
                endNumIndex = opts_.xDomain.length - 2;
              } 
              for (i = 2; i < endNumIndex; i++) {
                if (d[data_.attrId] <= opts_.xDomain[i] &&
                  d[data_.attrId] >= opts_.xDomain[i - 1]) {
                  _min = opts_.xDomain[i - 1];
                  _max = opts_.xDomain[i];
                  val = _min + (_max - _min) / 4;
                  break;
                }
              }
            }
          } else {
            if (d[data_.attrId] <= opts_.xDomain[1]) {
              val = opts_.xDomain[0];
            } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 3] && data_.hasNA) {
              val = opts_.xDomain[opts_.xDomain.length - 2];
            } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 2] && !data_.hasNA) {
              val = opts_.xDomain[opts_.xDomain.length - 1];
            } else {
              // minus half of separateDistance to make the margin values
              // always map to the left side. Thus for any value x, it is in the
              // range of (a, b] which means a < x <= b
              val = Math.ceil((d[data_.attrId] - opts_.startPoint) / opts_.gutter) *
                opts_.gutter + opts_.startPoint - opts_.gutter / 2;
              _min = val - opts_.gutter / 2;
              _max = val + opts_.gutter / 2;
            }
          }
        } 
        
        barSet[val] = 1;
        if (tickVal.indexOf(val) === -1) {
          tickVal.push(Number(val));
        }

        if (!mapTickToCaseIds.hasOwnProperty(val)) {
          mapTickToCaseIds[val] = {
            caseIds: [],
            tick: iViz.util.getTickFormat(val, logScale, data_, opts_)
          };
          if (!_.isUndefined(_min) && !_.isUndefined(_max)) {
            mapTickToCaseIds[val].range = _min + '< ~ <=' + _max;
          }
        }
        mapTickToCaseIds[val].caseIds.push(
          data_.groupType === 'patient' ? d.patient_uid : d.sample_uid);
        return val;
      });
    
      opts_.xBarValues = Object.keys(barSet);
      opts_.xBarValues.sort(function (a, b) {
          return Number(a) < Number(b) ? -1 : 1;
      });

      tickVal.sort(function(a, b) {
        return a < b ? -1 : 1;
      });


      chartInst_
        .width(opts_.width)
        .height(opts_.height)
        .margins({top: 10, right: 20, bottom: 30, left: 40})
        .dimension(dcDimension)
        .group(dcDimension.group())
        .centerBar(true)
        .elasticY(true)
        .elasticX(false)
        .turnOnControls(true)
        .mouseZoomable(false)
        .brushOn(true)
        .colors('#2986e2')
        .transitionDuration(iViz.opts.transitionDuration || 400)
        .renderHorizontalGridLines(false)
        .renderVerticalGridLines(false);

      if (data_.noGrouping) {
        chartInst_.barPadding(1);// separate continuous bar
      }

      if (logScale || data_.smallDataFlag) {
        chartInst_.xAxis().tickValues(opts_.xDomain);
        chartInst_.x(d3.scale.log().nice()
          .domain([opts_.minDomain, opts_.maxDomain]));
      } else if (data_.noGrouping) {
        chartInst_.xAxis().tickValues(opts_.xFakeDomain);
        chartInst_.x(d3.scale.linear()
          .domain([
            opts_.xFakeDomain[0] - opts_.gutter,
            opts_.xFakeDomain[opts_.xFakeDomain.length - 1] + opts_.gutter
          ]));
      } else {
        chartInst_.xAxis().tickValues(opts_.xDomain);
        chartInst_.x(d3.scale.linear()
          .domain([
            opts_.xDomain[0] - opts_.gutter,
            opts_.xDomain[opts_.xDomain.length - 1] + opts_.gutter
          ]));
      }
      chartInst_.yAxis().ticks(6);
      chartInst_.yAxis().tickFormat(d3.format('d'));
      chartInst_.xAxis().tickFormat(function(v) {
        return iViz.util.getTickFormat(v, logScale, data_, opts_);
      });
      
      chartInst_.xUnits(function() {
        return opts_.xDomain.length * 1.3 <= 5 ? 5 : opts_.xDomain.length * 1.3;
      });
    };

    function initTsvDownloadData() {
      var data = [];
      var _cases = _.sortBy(chartInst_.dimension().top(Infinity), function(item) {
        return isNaN(item[data_.attrId]) ? Infinity : -item[data_.attrId];
      });
      var header = ['Patient ID', 'Sample ID', opts_.displayName];

      if (opts_.groupType === 'sample') {
        var tmp = header[0];
        header[0] = header[1];
        header[1] = tmp;
      }
      data.push(header.join('\t'));

      for (var i = 0; i < _cases.length; i++) {
        var row = [];
        if (opts_.groupType === 'patient') {
          var patientUID = _cases[i].patient_uid;
          var patientId = iViz.getCaseIdUsingUID('patient', patientUID);
          var sampleIds = iViz.getSampleIds(_cases[i].study_id, patientId);
          if (_.isArray(sampleIds)) {
            sampleIds = sampleIds.join(', ');
          } else {
            sampleIds = '';
          }
          row.push(patientId);
          row.push(sampleIds);
        } else {
          var sampleUID = _cases[i].sample_uid;
          var sampleId = iViz.getCaseIdUsingUID('sample', sampleUID);
          var patientId = iViz.getPatientId(_cases[i].study_id, sampleId);

          row.push(sampleId);
          row.push(patientId);
        }
        row.push(_.isUndefined(_cases[i][data_.attrId]) ? 'NA' :
          iViz.util.restrictNumDigits(_cases[i][data_.attrId]));
        data.push(row.join('\t'));
      }
      content.setDownloadData('tsv', {
        fileName: opts_.displayName,
        data: data.join('\n')
      });
    }

    function initCanvasDownloadData() {
      content.setDownloadData('svg', {
        title: opts_.displayName,
        chartDivId: opts_.chartDivId,
        chartId: opts_.chartId,
        fileName: opts_.displayName
      });
      content.setDownloadData('pdf', {
        title: opts_.displayName,
        chartDivId: opts_.chartDivId,
        chartId: opts_.chartId,
        fileName: opts_.displayName
      });
    }

    content.init = function(ndx, data, opts) {
      opts_ = _.extend({}, opts);
      data_ = data;
      opts_ = _.extend(opts_, iViz.util.barChart.getDcConfig({
        min: data_.min,
        max: data_.max,
        meta: data_.meta,
        uniqueSortedData: data_.uniqueSortedData,
        minExponent: data_.minExponent,
        maxExponent: data_.maxExponent,
        smallDataFlag: data_.smallDataFlag,
        noGrouping: data_.noGrouping,
        hasNA: data_.hasNA
      }, opts.logScaleChecked));
      ndx_ = ndx;

      colors_ = $.extend(true, {}, iViz.util.getColors());

      chartInst_ = dc.barChart('#' + opts.chartId, opts.groupid);

      initDc_(opts.logScaleChecked);

      return chartInst_;
    };

    content.rangeFilter = function(logScaleChecked, _filter) {
      var tempFilters_ = [];
      var minNumBarPoint = '';
      var maxNumBarPoint = '';
      var selectedNumBar = [];
      var hasNA = false;
      var hasGreaterOutlier = false;
      var hasSmallerOutlier = false;
      var startNumIndex = 0;
      var endNumIndex = opts_.xDomain.length >= 1 ? opts_.xDomain.length - 1 : 0;

      tempFilters_[0] = '';
      tempFilters_[1] = '';
      
      if (opts_.xDomain.length === 0) {
        tempFilters_[0] = 'Invalid Selection';
      } else {
        // set start and end indexes for number bars
        if (opts_.xDomain.length >= 2) {
          if (data_.noGrouping) {
            if (data_.hasNA) {
              endNumIndex = opts_.xDomain.length - 2 ;
            }
          } else {
            if (logScaleChecked) {
              if (data_.hasNA) { // has 'NA' tick
                endNumIndex = opts_.xDomain.length - 2;
              }
            } else {
              startNumIndex = 1;
              if (data_.hasNA) {// has 'NA' tick
                endNumIndex = opts_.xDomain.length >= 3 ? opts_.xDomain.length - 3 : endNumIndex;
              } else {
                endNumIndex = opts_.xDomain.length - 2;
              }
            }
          }
        }

        _.each(opts_.xDomain, function(tick) {
          if (tick >= _filter[0] && tick <= _filter[1]) {
            if (data_.hasNA && tick === opts_.xDomain[opts_.xDomain.length - 1]) {
              hasNA = true;
            } else if (!data_.noGrouping && !logScaleChecked) {
              if (tick === opts_.xDomain[0]) {
                hasSmallerOutlier = true;
              } else if (tick === opts_.xDomain[endNumIndex + 1]) {
                hasGreaterOutlier = true;
              }
            }
          }
        });

        // store all number bars' middle value in selected range
        _.each(opts_.xBarValues, function(middle) {
          if (middle >= _filter[0] && middle <= _filter[1]) {
            if ((data_.noGrouping || logScaleChecked) &&
              (data_.hasNA && middle !== opts_.xDomain[opts_.xDomain.length - 1])) {
              // exclude 'NA' value
              selectedNumBar.push(middle);
            } else {
              // exclude '>max', '<=min' and 'NA' value
              if (middle !== opts_.xDomain[0] || middle !== opts_.xDomain[endNumIndex + 1] ||
                (data_.hasNA && middle !== opts_.xDomain[opts_.xDomain.length - 1])) {
                selectedNumBar.push(middle);
              }
            }
          }
        });

        // make sure x axis has "<=min" and ">max" ticks
        if (!data_.noGrouping && !logScaleChecked && opts_.xDomain.length >= 2) {
          // if left point between '<= min' and 'min'
          if (_filter[0] > opts_.xDomain[0] && _filter[0] <= opts_.xDomain[1]) {
            minNumBarPoint = opts_.xDomain[1];
          }
          // if right point between 'max' and '>max'
          if (_filter[1] >= opts_.xDomain[endNumIndex] && _filter[1] < opts_.xDomain[endNumIndex + 1]) {
            maxNumBarPoint = opts_.xDomain[endNumIndex];
          }
        }
        
        if (data_.noGrouping) {
          minNumBarPoint = opts_.xFakeDomain[0];
          if (data_.hasNA) {
            maxNumBarPoint = opts_.xFakeDomain[opts_.xFakeDomain.length - 2];
          } else {
            maxNumBarPoint = opts_.xFakeDomain[opts_.xFakeDomain.length - 1];
          }
        } else {
          for (var i = startNumIndex; i <= endNumIndex - 1; i++) {
            if (_filter[0] >= opts_.xDomain[i] && _filter[0] < opts_.xDomain[i + 1]) {// check left range point
              // when there is a bar inside single slot
              if (selectedNumBar[0] >= opts_.xDomain[i + 1] && selectedNumBar[0] < opts_.xDomain[i + 2]) {
                // left point is closer to the upward tick
                minNumBarPoint = opts_.xDomain[i + 1];
              } else {
                if ((_filter[0] - opts_.xDomain[i]) > (opts_.xDomain[i + 1] - _filter[0])) {
                  // left point is closer to the upward tick
                  minNumBarPoint = opts_.xDomain[i + 1];
                } else {
                  // left point is closer to the downward tick
                  minNumBarPoint = opts_.xDomain[i];
                }
              }
            }

            if (_filter[1] >= opts_.xDomain[i] && _filter[1] < opts_.xDomain[i + 1]) {// check right range point
              if (selectedNumBar[selectedNumBar.length - 1] >= opts_.xDomain[i - 1] &&
                selectedNumBar[selectedNumBar.length - 1] < opts_.xDomain[i]) {
                // right point is closer to the downward tick
                maxNumBarPoint = opts_.xDomain[i];
              } else {
                if ((_filter[1] - opts_.xDomain[i]) > (opts_.xDomain[i + 1] - _filter[1])) {
                  // right point is closer to the upward tick
                  maxNumBarPoint = opts_.xDomain[i + 1];
                } else {
                  // right point is closer to the downward tick
                  maxNumBarPoint = opts_.xDomain[i];
                }
              }
            }
          }
        }

        // avoid "min< ~ <=min"
        if (!data_.noGrouping && _.isNumber(minNumBarPoint) && _.isNumber(maxNumBarPoint) && minNumBarPoint === maxNumBarPoint) {
          tempFilters_[0] = 'Invalid Selection';
        } else if ((!data_.noGrouping && _filter[0] < opts_.xDomain[0] && _filter[1] > opts_.xDomain[opts_.xDomain.length - 1]) || 
          (data_.noGrouping && _filter[0] < opts_.xFakeDomain[0] && _filter[1] > opts_.xFakeDomain[opts_.xFakeDomain.length - 1])) {
          tempFilters_[0] = 'All';
        } else {
          if (data_.noGrouping) {
            if (selectedNumBar.length === opts_.xBarValues.length ||
              (_filter[0] <= opts_.xBarValues[0] && _filter[1] >= opts_.xBarValues[opts_.xBarValues.length - 2] &&
              data_.hasNA && !hasNA)) {// select all number bars
              tempFilters_[0] = 'All Numbers';
            } else if (selectedNumBar.length === 0 && hasNA) {// only choose NA bar
              tempFilters_[0] = 'NA';
            } else if (selectedNumBar.length === 1) {// only choose 1 number bar
              if (hasNA) { // chose max num bar and NA bar
                tempFilters_[0] = opts_.xDomain[opts_.xFakeDomain.indexOf(Number(selectedNumBar[0]))] + ', NA';
              } else {
                tempFilters_[0] = opts_.xDomain[opts_.xFakeDomain.indexOf(Number(selectedNumBar[0]))];
              }
            } else {
              _.each(selectedNumBar, function(barValue) {
                tempFilters_[0] += opts_.xDomain[opts_.xFakeDomain.indexOf(Number(barValue))] + ', ';
              });
              if (hasNA) {
                tempFilters_[0] += 'NA';
              } else {
                tempFilters_[0] = tempFilters_[0].slice(0, -2);// remove last coma
              }
            }
          } else {
            if (logScaleChecked) {
              if (!hasNA && _filter[0] < opts_.xDomain[startNumIndex] &&
                _filter[1] > opts_.xDomain[endNumIndex]) {
                tempFilters_[0] = 'All Numbers';
              } else if (!hasNA && minNumBarPoint !== '' && maxNumBarPoint !== '') {
                tempFilters_[0] = minNumBarPoint + '<';
                tempFilters_[1] = '<=' + maxNumBarPoint;
              } else if (!hasNA && minNumBarPoint === '' && maxNumBarPoint !== '') {
                tempFilters_[1] = '<=' + maxNumBarPoint;
              } else if (hasNA && minNumBarPoint !== '' && maxNumBarPoint === '') {
                tempFilters_[0] = minNumBarPoint + '<';
                tempFilters_[1] = '<=' + opts_.xDomain[endNumIndex] + ", NA";
              } else if (hasNA && minNumBarPoint === '' && maxNumBarPoint === ''){//only select "NA" bar
                tempFilters_[0] = 'NA';
              } else {
                tempFilters_[0] = 'Invalid Selection';
              }
            } else {
              if (!hasNA && !hasSmallerOutlier && !hasGreaterOutlier &&
                minNumBarPoint !== '' && maxNumBarPoint !== '') {
                tempFilters_[0] = minNumBarPoint + '<';
                tempFilters_[1] = '<=' + maxNumBarPoint;
              } else if (hasNA && !hasSmallerOutlier) {
                if (hasGreaterOutlier) { // "> Num, NA"
                  if (minNumBarPoint === '') {// only select '>Num' and 'NA' bars
                    tempFilters_[1] = '> ' + opts_.xDomain[opts_.xDomain.length - 3] + ', NA';
                  } else {
                    tempFilters_[1] = '> ' + minNumBarPoint + ', NA';
                  }
                } else {
                  if (minNumBarPoint === '' && maxNumBarPoint === '') {
                    tempFilters_[0] = 'NA';
                  }
                }
              } else if (!hasNA && hasGreaterOutlier) {
                if (hasSmallerOutlier) {// Select all bars excluding NA
                  tempFilters_[0] = 'All Numbers';
                } else {// "> Num"
                  if(minNumBarPoint === '') {
                    tempFilters_[1] = '> ' + opts_.xDomain[endNumIndex];
                  } else {
                    tempFilters_[1] = '> ' + minNumBarPoint;
                  }
                }
              } else if (hasSmallerOutlier && !hasGreaterOutlier && !hasNA) {// "<= Num"
                if (maxNumBarPoint === '') {
                  tempFilters_[1] = '<= ' + opts_.xDomain[1];
                } else {
                  tempFilters_[1] = '<= ' + maxNumBarPoint;
                }
              } else {
                tempFilters_[0] = 'Invalid Selection';
              }
            }
          }
        }
      }      

      return tempFilters_;
    };

    content.redraw = function(logScaleChecked) {
      opts_ = _.extend(opts_, iViz.util.barChart.getDcConfig({
        min: data_.min,
        max: data_.max,
        meta: data_.meta,
        uniqueSortedData: data_.uniqueSortedData,
        minExponent: data_.minExponent,
        maxExponent: data_.maxExponent,
        smallDataFlag: data_.smallDataFlag,
        noGrouping: data_.noGrouping,
        hasNA: data_.hasNA
      }, logScaleChecked));

      initDc_(logScaleChecked);
    };

    content.updateDataForDownload = function(fileType) {
      if (fileType === 'tsv') {
        initTsvDownloadData();
      } else if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };
    // return content;

    /**
     * sortBy {String} sort category by 'key' (key, value are supported)
     * @return {Array} the list of current bar categories.
     */
    content.getCurrentCategories = function(sortBy) {
      var groups = dcDimension.group().top(Infinity);
      var groupTypeId =
        data_.groupType === 'patient' ? 'patient_uid' : 'sample_uid';
      var selectedCases = _.pluck(dcDimension.top(Infinity), groupTypeId);
      var categories = [];
      var colorCounter = 0;

      sortBy = sortBy || 'value';

      groups = _.sortBy(groups, sortBy);
      _.each(groups, function(group) {
        if (group.value > 0 && mapTickToCaseIds.hasOwnProperty(group.key)) {
          var color;
          var name = mapTickToCaseIds[group.key].range || mapTickToCaseIds[group.key].tick;
          if (name === 'NA') {
            color = '#ccc';
          } else {
            color = colors_[colorCounter];
            colorCounter++;
          }
          categories.push({
            key: group.key,
            name: mapTickToCaseIds[group.key].range || mapTickToCaseIds[group.key].tick,
            color: color,
            caseIds: _.intersection(selectedCases, mapTickToCaseIds[group.key].caseIds)
          });
        }
      });
      return categories;
    };

    /**
     * Color bar based on categories info.
     * @param {Array} categories The current bar categories, can be calculated by
     * using getCurrentCategories method.
     */
    content.colorBars = function(categories) {
      if (!_.isArray(categories)) {
        categories = this.getCurrentCategories();
      }
      chartInst_.selectAll('g rect').style('fill', function(d) {
        var color = 'grey';
        for (var i = 0; i < categories.length; i++) {
          var category = categories[i];
          if (_.isObject(d.data) && category.key === d.data.key) {
            color = category.color;
            break;
          }
        }
        return color;
      });
    };

    /**
     * Reset bar color by removing fill attribute.
     */
    content.resetBarColor = function() {
      chartInst_.selectAll('g rect').style('fill', '');
    };
  };

  iViz.view.component.BarChart.prototype =
    new iViz.view.component.GeneralChart('barChart');
  iViz.view.component.BarChart.constructor = iViz.view.component.BarChart;

  iViz.util.barChart = (function() {
    var content = {};

    /**
     * Customize the bar chart configuration options according to
     * the data range.
     * @param {object} data Data should include two parameters: min and max.
     * They should all be number.
     * @param {boolean} logScale Whether to generate
     * log scale bar chart options.
     * @return {object} The customized configure options
     */
    content.getDcConfig = function(data, logScale) {
      var config = {
        xDomain: [],
        xFakeDomain: [], // Design for noGrouping Data
        divider: 1,
        numOfGroups: 10,
        emptyMappingVal: '',
        gutter: 0.2,
        startPoint: -1,
        maxVal: '',
        minDomain: 0.7, // Design specifically for log scale
        maxDomain: 10000, // Design specifically for log scale
        xBarValues: [],
      };

      if (!_.isUndefined(data.min) && !_.isUndefined(data.max)) {
        var max = data.max;
        var min = data.min;
        var range = max - min;
        var rangeL = parseInt(range, 10).toString().length - 2;
        var i = 0;
        var _tmpValue;
        var minExponent, maxExponent, exponentRange;

        if (data.smallDataFlag) {
          minExponent = data.minExponent;
          maxExponent = data.maxExponent;
          exponentRange = maxExponent - minExponent;
        }

        // Set divider based on the number m in 10(m)
        for (i = 0; i < rangeL; i++) {
          config.divider *= 10;
        }

        if (max < 100 &&
          max > 50) {
          config.divider = 10;
        } else if (max < 100 &&
          max > 30) {
          config.divider = 5;
        } else if (max < 100 &&
          max > 10) {
          config.divider = 2;
        } else if (data.smallDataFlag) {
          var numberOfTickValues = 4;
          if (exponentRange > 1) {
            config.divider = Math.round(exponentRange / numberOfTickValues);
          } else if (exponentRange === 0) {
            config.divider = 2 * Math.pow(10, minExponent);
          }
        }
        
        if (range === 0) {
          config.startPoint = min;
        } else if (max <= 1 && max > 0 && min >= -1 && min < 0) {
          config.maxVal = (parseInt(max / config.divider, 10) + 1) *
            config.divider;
          config.gutter = 0.2;
          config.startPoint = (parseInt(min / 0.2, 10) - 1) * 0.2;
          // config.emptyMappingVal = config.maxVal + 0.2;
        } else if (range <= 0.1) {
          config.gutter = 0.01;
        } else if (range <= 1 && min >= 0 && max <= 1) {
          config.gutter = 0.1;
          config.startPoint = 0;
          // config.emptyMappingVal = 1.1;
        } else if (range >= 1) {
          config.gutter = (
              parseInt(range / (config.numOfGroups * config.divider), 10) + 1
            ) * config.divider;
          config.maxVal = (parseInt(max / config.gutter, 10) + 1) *
            config.gutter;
          config.startPoint = parseInt(min / config.gutter, 10) *
            config.gutter;
          // config.emptyMappingVal = config.maxVal + config.gutter;
        } else {
          config.gutter = 0.1;
          config.startPoint = -1;
          // config.emptyMappingVal = config.maxVal + 0.1;
        }

        if (logScale) {
          for (i = 0; ; i += 0.5) {
            _tmpValue = parseInt(Math.pow(10, i), 10);

            config.xDomain.push(_tmpValue);
            if (_tmpValue > data.max) {
              config.xDomain.push(Math.pow(10, i + 0.5));
              if (data.hasNA) {
                config.emptyMappingVal = Math.pow(10, i + 1);
              }
              config.maxDomain = Math.pow(10, i + 1.5);
              break;
            }
          }
        } else if (data.smallDataFlag) {// use decimal scientific ticks for 0 < data < 0.1
          if (exponentRange > 1) {
            config.minDomain = Math.pow(10, minExponent - config.divider * 1.5);
            config.xDomain.push(Math.pow(10, minExponent - config.divider));// add "<=" marker
            for (i = minExponent; i <= maxExponent; i += config.divider) {
              config.xDomain.push(Math.pow(10, i));
            }
            config.xDomain.push(Math.pow(10, maxExponent + config.divider));// add ">=" marker
            if (data.hasNA) {
              config.emptyMappingVal = Math.pow(10, maxExponent + config.divider * 2);// add "NA" marker
            }
            config.maxDomain = Math.pow(10, maxExponent + config.divider * 2.5);
          } else if (exponentRange === 1) {
            config.minDomain = Math.pow(10, minExponent - 1);
            config.xDomain.push(Math.pow(10, minExponent) / 3); // add "<=" marker
            for (i = minExponent; i <= maxExponent + 1; i++) {
              config.xDomain.push(Math.pow(10, i));
              config.xDomain.push(3 * Math.pow(10, i));
            }
            if (data.hasNA) {
              config.emptyMappingVal = Math.pow(10, maxExponent + 2);// add "NA" marker
            }
            config.maxDomain = 3 * Math.pow(10, maxExponent + 2);
          } else { // exponentRange = 0
            config.minDomain = Math.pow(10, minExponent) - config.divider;
            for (i = Math.pow(10, minExponent); i <= Math.pow(10, maxExponent + 1); i += config.divider) {
              config.xDomain.push(i);
            }
            if (data.hasNA) {
              config.emptyMappingVal = Math.pow(10, maxExponent + 1) + config.divider;// add "NA" marker
            }
            config.maxDomain = Math.pow(10, maxExponent + 1) + config.divider * 2;
          }
        } else {
          // for data has at most 5 points
          if (data.noGrouping) {
            _.each(data.uniqueSortedData, function(value) {
              config.xFakeDomain.push(data.uniqueSortedData.indexOf(value) * config.gutter);
              config.xDomain.push(value);
            });
            if (data.hasNA) {
              // add marker for NA values
              config.emptyMappingVal =
                config.xFakeDomain[config.xFakeDomain.length - 1] + config.gutter;
              config.xFakeDomain.push(config.emptyMappingVal);
            }
          } else {
            if (!_.isNaN(range)) {
              for (i = 0; i <= config.numOfGroups; i++) {
                _tmpValue = i * config.gutter + config.startPoint;
                if (config.startPoint < 1500) {
                  _tmpValue =
                    Number(cbio.util.toPrecision(Number(_tmpValue), 3, 0.1));
                }

                // If the current tmpValue already bigger than maxmium number, the
                // function should decrease the number of bars and also reset the
                // Mappped empty value.
                if (_tmpValue >= max) {
                  // if i = 0 and tmpValue bigger than maximum number, that means
                  // all data fall into NA category.
                  config.xDomain.push(_tmpValue);
                  break;
                } else {
                  config.xDomain.push(_tmpValue);
                }
              }
            }

            if (config.xDomain.length === 0) {
              config.xDomain.push(Number(config.startPoint));
            } else if (config.xDomain.length === 1) {
              config.xDomain.push(Number(config.xDomain[0] + config.gutter));
            } else if (Math.abs(min) > 1500) {
              // currently we always add ">max" and "NA" marker
              // add marker for greater than maximum
              config.xDomain.push(
                Number(config.xDomain[config.xDomain.length - 1] +
                  config.gutter));
              if (data.hasNA) {
                // add marker for NA values
                config.emptyMappingVal =
                  config.xDomain[config.xDomain.length - 1] + config.gutter;
              }
            } else {
              // add marker for greater than maximum
              config.xDomain.push(
                Number(cbio.util.toPrecision(
                  Number(config.xDomain[config.xDomain.length - 1] +
                    config.gutter), 3, 0.1)));
              if (data.hasNA) {
                // add marker for NA values
                config.emptyMappingVal =
                  Number(cbio.util.toPrecision(
                    Number(config.xDomain[config.xDomain.length - 1] +
                      config.gutter), 3, 0.1));
              }
            }
          }
        }

        if (config.emptyMappingVal !== '') {
          config.xDomain.push(config.emptyMappingVal);
        }
      }
      return config;
    };
    return content;
  })();
})(window.iViz,
  window.dc,
  window._,
  window.$ || window.jQuery,
  window.d3,
  window.cbio
);