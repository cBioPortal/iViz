/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an 'as is' basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';
(function(iViz, dc, _, $, d3) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.barChart = function() {
    var content = {};

    var chartInst_;// DC chart instance.
    var opts_ = {};// Chart configuration options
    var data_ = {};// Chart related data. Such as attr_id.
    var colors_;
    var ndx_;
    var hasEmptyValue_ = false;

    /**
     * Create DC chart with linear scale.
     * @private
     */
    var regularDc_ = function() {
      var tickVal = [];
      var barColor = {};

      var cluster = ndx_.dimension(function(d) {
        var val = d[data_.attrId];
        if (val === 'NA' || val === '' || val === 'NaN') {
          hasEmptyValue_ = true;
          val = opts_.emptyMappingVal;
        } else {
          val = d[data_.attrId] >= 0 ? parseInt(
            (d[data_.attrId] - opts_.startPoint) /
            opts_.gutter, 10) *
          opts_.gutter + opts_.startPoint + opts_.gutter / 2 :
          (parseInt(
            d[data_.attrId] /
            opts_.gutter, 10) - 1) *
          opts_.gutter + opts_.gutter / 2;
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

      for (var i = 0; i < tickL; i++) {
        barColor[tickVal[i]] = colors_[i];
      }

      if (hasEmptyValue_) {
        opts_.xDomain.push(Number(
          iViz.util.toPrecision(
            Number(opts_.emptyMappingVal), 3, 0.1)
          )
        );
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
        .transitionDuration(iViz.opts.transitionDuration || 400)
        .renderHorizontalGridLines(false)
        .renderVerticalGridLines(false);

      chartInst_.x(d3.scale.linear()
        .domain([
          opts_.xDomain[0] - opts_.gutter,
          opts_.xDomain[opts_.xDomain.length - 1] + opts_.gutter
        ]));

      chartInst_.yAxis().ticks(6);
      chartInst_.yAxis().tickFormat(d3.format('d'));
      chartInst_.xAxis().tickFormat(function(v) {
        return v === opts_.emptyMappingVal ? 'NA' : v;
      });

      chartInst_.xAxis().tickValues(opts_.xDomain);
      //chartInst_.xAxisLabel(data_.displayName);
      chartInst_.xUnits(function() {
        return opts_.xDomain.length * 1.3 <= 5 ? 5 : opts_.xDomain.length * 1.3;
      });
    };

    /**
     * Create DC chart with log scale.
     * @private
     */
    var logDc_ = function() {
      var _domainLength,
        _maxDomain = 10000;

      var emptyValueMapping = "1000";//Will be changed later based on maximum
      // value
      var xDomain =[];

      for(var i=0; ;i+=0.5){
        var _tmpValue = parseInt(Math.pow(10,i));

        xDomain.push(_tmpValue);
        if(_tmpValue >  data_.max){

          emptyValueMapping = Math.pow(10,i+0.5);
          xDomain.push(emptyValueMapping);
          _maxDomain = Math.pow(10,i+1);
          break;
        }
      }

      _domainLength = xDomain.length;

      var tickVal = [];
      var barColor = {};

      var cluster = ndx_.dimension(function(d) {

        var i, val = Number(d[data_.attrId]);

        if(isNaN(val)){
          hasEmptyValue_ = true;
          val = emptyValueMapping;
        }else{
          for(i = 1;i < _domainLength; i++){
            if(d[data_.attrId] < xDomain[i] &&
              d[data_.attrId] >= xDomain[i-1]){

              val = parseInt( Math.pow(10, i / 2 - 0.25 ));
            }
          }
        }

        if(tickVal.indexOf(val) === -1) {
          tickVal.push(Number(val));
        }

        return val;
      });

      tickVal.sort(function(a, b) {
        return a < b ? -1 : 1;
      });

      var tickL = tickVal.length - 1;

      for (var i = 0; i < tickL; i++) {
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
        .transitionDuration(iViz.opts.transitionDuration || 400)
        .renderHorizontalGridLines(false)
        .renderVerticalGridLines(false);

      chartInst_.x(d3.scale.log().nice()
        .domain([0.7,_maxDomain]));

      chartInst_.yAxis().ticks(6);
      chartInst_.yAxis().tickFormat(d3.format('d'));
      chartInst_.xAxis().tickFormat(function(v) {
        var _returnValue = v;
        if(v === emptyValueMapping){
          _returnValue = 'NA';
        }else{
          var index = xDomain.indexOf(v);
          if(index % 2 === 0)
            return v.toString();
          else
            return '';
        }
        return _returnValue;
      });

      chartInst_.xAxis().tickValues(xDomain);
      //chartInst_.xAxisLabel(data_.displayName);
      chartInst_.xUnits(function() {
        return xDomain.length * 1.3 <= 5 ? 5 : xDomain.length * 1.3;
      });
    };
    content.hasLogScale=function(){
      if(data_!==undefined){
        if(data_.min!==null && data_.max!==null){
          return ((data_.max-data_.min)>1000)&&(data_.min>1)?true:false;
        }
      }
      return false;
    };
    content.init = function(ndx, data, attrObj, settings, chartId, groupid, logScaleChecked) {
      data_.meta = _.map(_.filter(_.pluck(data, attrObj.attr_id), function(d) {
        return d !== 'NA';
      }), function(d) {
        return parseFloat(d);
      });
      data_.min = d3.min(data_.meta);
      data_.max = d3.max(data_.meta);
      opts_ = iViz.util.barChart.getDcConfig({
        min: d3.min(data_.meta),
        max: d3.max(data_.meta)
      });
      data_.attrId = attrObj.attr_id;
      data_.displayName = attrObj.display_name;
      opts_.width = settings.barChart.width;
      opts_.height = settings.barChart.height;

      ndx_ = ndx;

      colors_ = $.extend(true, {}, iViz.util.getColors());

      chartInst_ = dc.barChart('#' + chartId, groupid);

      //if (type === 'log') {
      if(logScaleChecked!==undefined){
        if(logScaleChecked){
          logDc_();
        } else {
          regularDc_();
        }
      } else {
        if (((data_.max - data_.min) > 1000) && (data_.min > 0.1)) {
          logDc_();
        } else {
          regularDc_();
        }
      }
      chartInst_.render();
      return chartInst_;
    };

    content.redraw = function(logScaleChecked){
      if(logScaleChecked){
        regularDc_();
      } else {
        logDc_();
      }
    };

    return content;
  };

  iViz.util.barChart = (function() {
    var content = {};

    /**
     * Customize the bar chart configuration options according to
     * the data range.
     * @param {object} data Data should inlude two parameters: min and max. They should all be number.
     * @return {{xDomain: Array, divider: number, numOfGroups: number, emptyMappingVal: string, gutter: number, startPoint: number, maxVal: string}} The customized configure options.
     */
    content.getDcConfig = function(data) {
      var config = {
        xDomain: [],
        divider: 1,
        numOfGroups: 10,
        emptyMappingVal: '',
        gutter: 0.2,
        startPoint: -1,
        maxVal: ''
      };

      if (!_.isUndefined(data.min) && !_.isUndefined(data.max)) {
        var max = data.max;
        var min = data.min;
        var range = max - min;
        var rangeL = parseInt(range, 10).toString().length - 2;
        var i = 0;

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
          config.maxVal = (parseInt(max / config.divider, 10) + 1) * config.divider;
          config.gutter = 0.2;
          config.startPoint = (parseInt(min / 0.2, 10) - 1) * 0.2;
          config.emptyMappingVal = config.maxVal + 0.2;
        } else if (range <= 1 && min >= 0 && max <= 1) {
          config.gutter = 0.1;
          config.startPoint = 0;
          config.emptyMappingVal = 1.1;
        } else if (range >= 1) {
          config.gutter = (parseInt(range / (config.numOfGroups * config.divider), 10) + 1) * config.divider;
          config.maxVal = (parseInt(max / config.gutter, 10) + 1) * config.gutter;
          config.startPoint = parseInt(min / config.gutter, 10) * config.gutter;
          config.emptyMappingVal = config.maxVal + config.gutter;
        } else {
          config.gutter = 0.1;
          config.startPoint = -1;
          config.emptyMappingVal = config.maxVal + 0.1;
        }

        for (i = 0; i <= config.numOfGroups; i++) {
          var _tmpValue = i * config.gutter + config.startPoint;

          _tmpValue = Number(iViz.util.toPrecision(Number(_tmpValue), 3, 0.1));

          // If the current _tmpValue already bigger than maximum number, the
          // function should decrease the number of bars and also reset the
          // mapped empty value.
          if (_tmpValue > max) {
            // if i = 0 and tmpValue bigger than maximum number, that means
            // all data fall into NA category.
            if (i !== 0) {
              config.xDomain.push(_tmpValue);
            }
            // Reset the empty mapping value
            if (range > 1000 || range < 1) {
              config.emptyMappingVal = (i + 1) * config.gutter + config.startPoint;
            }

            // If the distance of Max and Min value is smaller than 1, give
            // a more precise value
            if (range < 1) {
              config.emptyMappingVal = Number(iViz.util.toPrecision(Number(config.emptyMappingVal), 3, 0.1));
            }

            break;
          } else {
            config.xDomain.push(_tmpValue);
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
  window.d3);
