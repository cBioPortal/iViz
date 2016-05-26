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
 * Created by Yichao Sun on 5/11/16.
 */

'use strict';
(function (iViz, _, d3) {
  iViz.view.component.scatterPlot = function () {
    var content = {};
    content.init = function (_data, _chartId) {
      var _xArr = _.pluck(_data, "cna_fraction"),
          _yArr = _.pluck(_data, "mutation_count");
      var trace = {
        x: _xArr,
        y: _yArr,
        mode: 'markers',
        type: 'scatter',
        marker: {size: 5}
      };
      var data = [trace];
      var layout = {
        xaxis: {
          title: 'Fraction of copy number altered genome',
          range: [ d3.min(_xArr), d3.max(_xArr) ]
        },
        yaxis: {
          title: '# of mutations',
          range: [ d3.min(_yArr), d3.max(_yArr) ]
        },
      };
      Plotly.plot(document.getElementById(_chartId), data, layout);
    };
    return content;
  };
  iViz.util.scatterPlot = (function () {
  })();
})(window.iViz, window._, window.d3);
