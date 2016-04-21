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

/**
 * @author suny1@mskcc.org on 3/15/16.
 *
 * Invisible charts functioning as bridges between different chart groups
 * Each chart group has its own invisible chart, consisting of sample/patient ids
 *
 */

'use strict';
(function($, dc) {
  iViz.bridgeChart = {};
  iViz.bridgeChart.init = function(ndx, settings, type,id) {
    var dimHide, countPerFuncHide;
    if (type === 'patient') {
      dimHide = ndx.dimension(function (d) { return d.patient_id; }),
        countPerFuncHide = dimHide.group().reduceCount();
    } else if (type === 'sample') {
      dimHide = ndx.dimension(function (d) { return d.sample_id; }),
        countPerFuncHide = dimHide.group().reduceCount();
    }
    $('#main-bridge').append(
      '<div class="grid-item" id="' + type +'_'+id+ '_id_chart_div">' +
      '<div class="dc-chart dc-pie-chart" id="' + type +'_'+id+ '_id_chart"></div>' +
      "</div>"
    );
    var _chartInvisible = dc.pieChart('#' + type +'_'+id+ '_id_chart', type +'-'+id);
    _chartInvisible.width(settings.pieChart.width)
      .height(settings.pieChart.height)
      .dimension(dimHide)
      .group(countPerFuncHide)
      .innerRadius(settings.pieChart.innerRadius);
    return _chartInvisible;
  }
  return iViz.bridgeChart;
}(window.$, window.dc));
