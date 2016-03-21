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

iViz.view.component.barChart = function() {

  return {
    init: function(ndx, data, attrObj, settings, chartId) {
      
      var _barChartData = _.map(_.filter(_.pluck(data, attrObj.attr_id), function (d) {
        return d !== "NA"
      }), function (d) {
        return parseFloat(d);
      });
      var dim = ndx.dimension(function (d) { return d[attrObj.attr_id]; }),
          countPerFunc = dim.group().reduceCount(), _chartInst;
      var _min = d3.min(_barChartData), _max = d3.max(_barChartData);
  
      _chartInst = dc.barChart("#" + chartId);
      _chartInst.width(settings.barChart.width)
        .height(settings.barChart.height)
        .gap(2)
        .dimension(dim)
        .group(countPerFunc)
        .x(d3.scale.linear().domain([_min * 1.1 - _max * 0.1, _max]))
        .elasticY(true)
        .centerBar(true)
        .xAxisLabel(attrObj.display_name)
        .margins({top: 10, right: 20, bottom: 50, left: 50});
      
      return _chartInst;
  
    }
  }
  
}();