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

      dcDimension = ndx_.dimension(function(d) {
        var val = d[data_.attrId];
        var _min;
        var _max;
        if (typeof val === 'undefined' || val === 'NA' || val === '' ||
          val === 'NaN') {
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
        } else if (d[data_.attrId] <= opts_.xDomain[1]) {
          val = opts_.xDomain[0];
        } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 3]) {
          val = opts_.xDomain[opts_.xDomain.length - 2];
        } else {
          // minus half of separateDistance to make the margin values
          // always map to the left side. Thus for any value x, it is in the
          // range of (a, b] which means a < x <= b
          val = Math.ceil((d[data_.attrId] - opts_.startPoint) / opts_.gutter) *
            opts_.gutter + opts_.startPoint - opts_.gutter / 2;
          _min = val - opts_.gutter / 2;
          _max = val + opts_.gutter / 2;
        }

        if (tickVal.indexOf(val) === -1) {
          tickVal.push(Number(val));
        }

        if (!mapTickToCaseIds.hasOwnProperty(val)) {
          mapTickToCaseIds[val] = {
            caseIds: [],
            tick: getTickFormat(val, logScale)
          };
          if (!_.isUndefined(_min) && !_.isUndefined(_max)) {
            mapTickToCaseIds[val].range = _min + '< ~ <=' + _max;
          }
        }
        mapTickToCaseIds[val].caseIds.push(
          data_.groupType === 'patient' ? d.patient_id : d.sample_id);
        return val;
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

      if (logScale) {
        chartInst_.x(d3.scale.log().nice()
          .domain([0.7, opts_.maxDomain]));
      } else {
        chartInst_.x(d3.scale.linear()
          .domain([
            opts_.xDomain[0] - opts_.gutter,
            opts_.xDomain[opts_.xDomain.length - 1] + opts_.gutter
          ]));
      }

      chartInst_.yAxis().ticks(6);
      chartInst_.yAxis().tickFormat(d3.format('d'));
      chartInst_.xAxis().tickFormat(function(v) {
        return getTickFormat(v, logScale);
      });

      chartInst_.xAxis().tickValues(opts_.xDomain);
      chartInst_.xUnits(function() {
        return opts_.xDomain.length * 1.3 <= 5 ? 5 : opts_.xDomain.length * 1.3;
      });
    };

    function getTickFormat(v, logScale) {
      var _returnValue = v;
      var index = 0;
      if (logScale) {
        if (v === opts_.emptyMappingVal) {
          _returnValue = 'NA';
        } else {
          index = opts_.xDomain.indexOf(v);
          if (index % 2 !== 0) {
            _returnValue = '';
          }
        }
      } else if (opts_.xDomain.length === 1) {
        return 'NA';
      } else if (opts_.xDomain.length === 2) {
        // when there is only one value and NA in the data
        if (v === opts_.xDomain[0]) {
          _returnValue = v;
        } else {
          _returnValue = 'NA';
        }
      } else if (v === opts_.xDomain[0]) {
        return '<=' + opts_.xDomain[1];
      } else if (v === opts_.xDomain[opts_.xDomain.length - 2]) {
        return '>' + opts_.xDomain[opts_.xDomain.length - 3];
      } else if (v === opts_.xDomain[opts_.xDomain.length - 1]) {
        return 'NA';
      } else if (data_.min > 1500 &&
        opts_.xDomain.length > 7) {
        // this is the special case for printing out year
        index = opts_.xDomain.indexOf(v);
        if (index % 2 === 0) {
          _returnValue = v;
        } else {
          _returnValue = '';
        }
      } else {
        _returnValue = v;
      }
      return _returnValue;
    }

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
        var sampleId = _cases[i].sample_id;
        var patientId = _cases[i].patient_id;
        var row = [];
        if (opts_.groupType === 'patient') {
          sampleId = iViz.getSampleIds(patientId);
          if (_.isArray(sampleId)) {
            sampleId = sampleId.join(', ');
          } else {
            sampleId = '';
          }
          row.push(patientId);
          row.push(sampleId);
        } else {
          patientId = iViz.getPatientIds(sampleId);
          if (_.isArray(patientId)) {
            patientId = patientId.join(', ');
          } else {
            patientId = '';
          }
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
        max: data_.max
      }, opts.logScaleChecked));
      ndx_ = ndx;

      colors_ = $.extend(true, {}, iViz.util.getColors());

      chartInst_ = dc.barChart('#' + opts.chartId, opts.groupid);

      initDc_(opts.logScaleChecked);

      return chartInst_;
    };

    content.redraw = function(logScaleChecked) {
      opts_ = _.extend(opts_, iViz.util.barChart.getDcConfig({
        min: data_.min,
        max: data_.max
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
        data_.groupType === 'patient' ? 'patient_id' : 'sample_id';
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
        divider: 1,
        numOfGroups: 10,
        emptyMappingVal: '',
        gutter: 0.2,
        startPoint: -1,
        maxVal: '',
        maxDomain: 10000 // Design specifically for log scale
      };

      if (!_.isUndefined(data.min) && !_.isUndefined(data.max)) {
        var max = data.max;
        var min = data.min;
        var range = max - min;
        var rangeL = parseInt(range, 10).toString().length - 2;
        var i = 0;
        var _tmpValue;

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
        }

        if (max <= 1 && max > 0 && min >= -1 && min < 0) {
          config.maxVal = (parseInt(max / config.divider, 10) + 1) *
            config.divider;
          config.gutter = 0.2;
          config.startPoint = (parseInt(min / 0.2, 10) - 1) * 0.2;
          // config.emptyMappingVal = config.maxVal + 0.2;
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
              config.emptyMappingVal = Math.pow(10, i + 1);
              config.xDomain.push(config.emptyMappingVal);
              config.maxDomain = Math.pow(10, i + 1.5);
              break;
            }
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
            // add marker for NA values
            config.emptyMappingVal =
              config.xDomain[config.xDomain.length - 1] + config.gutter;
            config.xDomain.push(config.emptyMappingVal);
          } else {
            // add marker for greater than maximum
            config.xDomain.push(
              Number(cbio.util.toPrecision(
                Number(config.xDomain[config.xDomain.length - 1] +
                  config.gutter), 3, 0.1)));
            // add marker for NA values
            config.emptyMappingVal =
              Number(cbio.util.toPrecision(
                Number(config.xDomain[config.xDomain.length - 1] +
                  config.gutter), 3, 0.1));
            config.xDomain.push(config.emptyMappingVal);
          }
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
