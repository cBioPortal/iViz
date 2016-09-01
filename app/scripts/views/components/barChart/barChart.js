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
    var hasEmptyValue_ = false;

    var initDc_ = function(logScale) {
      var tickVal = [];
      var barColor = {};
      var i = 0;

      var cluster = ndx_.dimension(function(d) {
        var val = d[data_.attrId];
        if (typeof val === 'undefined' || val === 'NA' || val === '' ||
          val === 'NaN') {
          hasEmptyValue_ = true;
          val = opts_.xDomain[opts_.xDomain.length - 1];
        } else if (logScale) {
          for (i = 1; i < opts_.xDomain.length; i++) {
            if (d[data_.attrId] < opts_.xDomain[i] &&
              d[data_.attrId] >= opts_.xDomain[i - 1]) {
              val = parseInt(Math.pow(10, i / 2 - 0.25), 10);
              break;
            }
          }
        } else if (d[data_.attrId] <= opts_.xDomain[1]) {
          val = opts_.xDomain[0];
        } else if (d[data_.attrId] > opts_.xDomain[opts_.xDomain.length - 3]) {
          val = opts_.xDomain[opts_.xDomain.length - 2];
        } else {
          // minus half of seperateDistance to make the margin values
          // always map to the left side. Thus for any value x, it is in the
          // range of (a, b] which means a < x <= b
          val = Math.ceil((d[data_.attrId] - opts_.startPoint) / opts_.gutter) *
            opts_.gutter + opts_.startPoint - opts_.gutter / 2;
        }

        if (tickVal.indexOf(val) === -1) {
          tickVal.push(Number(val));
        }

        return val;
      });

      tickVal.sort(function(a, b) {
        return a < b ? -1 : 1;
      });

      var tickL = tickVal.length - 1;

      for (i = 0; i < tickL; i++) {
        barColor[tickVal[i]] = colors_[i];
      }

      if (hasEmptyValue_) {
        barColor.NA = '#CCCCCC';
      } else {
        barColor[tickVal[tickL]] = colors_[tickL];
      }

      chartInst_
        .width(opts_.width)
        .height(opts_.height)
        .margins({top: 10, right: 20, bottom: 30, left: 40})
        .dimension(cluster)
        .group(cluster.group())
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
      if (logScale) {
        if (v === opts_.emptyMappingVal) {
          _returnValue = 'NA';
        } else {
          var index = opts_.xDomain.indexOf(v);
          if (index % 2 !== 0) {
            _returnValue = '';
          }
        }
      } else if (v === opts_.xDomain[0]) {
        return '<=' + opts_.xDomain[1];
      } else if (v === opts_.xDomain[opts_.xDomain.length - 2]) {
        return '>' + opts_.xDomain[opts_.xDomain.length - 3];
      } else if (v === opts_.xDomain[opts_.xDomain.length - 1]) {
        return 'NA';
      }
      return _returnValue;
    }

    function initTsvDownloadData() {
      var data = '';
      var _cases = chartInst_.dimension().top(Infinity);

      data = 'Sample ID\tPatient ID\t' + opts_.displayName;

      for (var i = 0; i < _cases.length; i++) {
        data += '\r\n';
        data += _cases[i].sample_id + '\t';
        data += _cases[i].patient_id + '\t';
        data += iViz.util.restrictNumDigits(_cases[i][data_.attrId]);
      }
      content.setDownloadData('tsv', {
        fileName: opts_.displayName,
        data: data
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
      hasEmptyValue_ = false;

      colors_ = $.extend(true, {}, iViz.util.getColors());

      chartInst_ = dc.barChart('#' + opts.chartId, opts.groupid);

      initDc_(opts.logScaleChecked);

      chartInst_.render();
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
          config.emptyMappingVal = config.maxVal + 0.2;
        } else if (range <= 1 && min >= 0 && max <= 1) {
          config.gutter = 0.1;
          config.startPoint = 0;
          config.emptyMappingVal = 1.1;
        } else if (range >= 1) {
          config.gutter = (
              parseInt(range / (config.numOfGroups * config.divider), 10) + 1
            ) * config.divider;
          config.maxVal = (parseInt(max / config.gutter, 10) + 1) *
            config.gutter;
          config.startPoint = parseInt(min / config.gutter, 10) *
            config.gutter;
          config.emptyMappingVal = config.maxVal + config.gutter;
        } else {
          config.gutter = 0.1;
          config.startPoint = -1;
          config.emptyMappingVal = config.maxVal + 0.1;
        }

        if (logScale) {
          for (i = 0; ; i += 0.5) {
            _tmpValue = parseInt(Math.pow(10, i), 10);

            config.xDomain.push(_tmpValue);
            if (_tmpValue > data.max) {
              config.emptyMappingVal = Math.pow(10, i + 0.5);
              config.xDomain.push(config.emptyMappingVal);
              config.maxDomain = Math.pow(10, i + 1);
              break;
            }
          }
        } else {
          for (i = 0; i <= config.numOfGroups; i++) {
            _tmpValue = i * config.gutter + config.startPoint;

            _tmpValue =
              Number(iViz.util.toPrecision(Number(_tmpValue), 3, 0.1));

            // If the current _tmpValue already bigger than maximum number, the
            // function should decrease the number of bars and also reset the
            // mapped empty value.
            if (_tmpValue >= max) {
              // if i = 0 and tmpValue bigger than maximum number, that means
              // all data fall into NA category.
              if (i !== 0) {
                config.xDomain.push(_tmpValue);
              }
              // Reset the empty mapping value
              if (range > 1000 || range < 1) {
                config.emptyMappingVal = (i + 1) * config.gutter +
                  config.startPoint;
              }

              // If the distance of Max and Min value is smaller than 1, give
              // a more precise value
              if (range < 1) {
                config.emptyMappingVal =
                  Number(iViz.util.toPrecision(
                    Number(config.emptyMappingVal), 3, 0.1));
              }

              break;
            } else {
              config.xDomain.push(_tmpValue);
            }
          }
          // currently we always add ">max" and "NA" marker
          // add marker for greater than maximum
          config.xDomain.push(Number(cbio.util.toPrecision(
            Number(config.xDomain[config.xDomain.length - 1] +
              config.gutter), 3, 0.1)));
          // add marker for NA values
          config.xDomain.push(Number(cbio.util.toPrecision(
            Number(config.xDomain[config.xDomain.length - 1] +
              config.gutter), 3, 0.1)));
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
