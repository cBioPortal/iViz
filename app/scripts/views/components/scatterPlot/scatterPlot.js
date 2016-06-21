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
(function (iViz, _, d3, $) {
  iViz.view.component.scatterPlot = function () {
    
    var content = {};
    var chartId_ , data_;

    content.init = function (_data, _chartId) {
      chartId_ = _chartId;
      data_ = _data;
      var _xArr = _.pluck(data_, 'cna_fraction'),
          _yArr = _.pluck(data_, 'mutation_count');
      var _qtips = [];
      _.each(data_, function(_dataObj) {
        _qtips.push("Sample Id: " +  _dataObj.sample_id + "<br>" +"CNA fraction: " + _dataObj.cna_fraction + "<br>" + "Mutation count: " + _dataObj.mutation_count);
      });
      var trace = {
        x: _xArr,
        y: _yArr,
        text: _qtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        marker: {
          size: 7,
          color: '#006bb3',
          line: {color: 'white'}
        }
      };
      var data = [trace];
      var layout = {
        xaxis: {
          title: 'Fraction of copy number altered genome',
          range: [ d3.min(_xArr), d3.max(_xArr) ],
          fixedrange: true
        },
        yaxis: {
          title: '# of mutations',
          range: [ d3.min(_yArr), d3.max(_yArr) ],
        },
        hovermode: 'closest',
        showlegend: false,
        width: 370,
        height: 320,
        margin: {
          l: 50,
          r: 50,
          b: 50,
          t: 50,
          pad: 0
        },
      };
      Plotly.plot(document.getElementById(_chartId), data, layout);
    };
    
    content.update = function(_sampleIds) { // update selected samples (change color)
      var _selectedData = _.filter(data_, function(_dataObj) { return $.inArray(_dataObj.sample_id, _sampleIds) !== -1 ;});
      var _unselectedData = _.filter(data_, function(_dataObj) { return $.inArray(_dataObj.sample_id, _sampleIds) === -1 ;});
      document.getElementById(chartId_).data = [];
      var _unselectedDataQtips = [], _selectedDataQtips = [];
      _.each(_unselectedData, function(_dataObj) {
        _unselectedDataQtips.push("Sample Id: " +  _dataObj.sample_id + "<br>" +"CNA fraction: " + _dataObj.cna_fraction + "<br>" + "Mutation count: " + _dataObj.mutation_count);
      });
      _.each(_selectedData, function(_dataObj) {
        _selectedDataQtips.push("Sample Id: " +  _dataObj.sample_id + "<br>" +"CNA fraction: " + _dataObj.cna_fraction + "<br>" + "Mutation count: " + _dataObj.mutation_count);
      });
      document.getElementById(chartId_).data[0] = {
        x: _.pluck(_unselectedData, 'cna_fraction'),
        y: _.pluck(_unselectedData, 'mutation_count'),
        text: _unselectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: "text",
        marker: {
          size: 7,
          color: '#006bb3',
          line: {color: 'white'}
        }
      };
      document.getElementById(chartId_).data[1] = {
        x: _.pluck(_selectedData, 'cna_fraction'),
        y: _.pluck(_selectedData, 'mutation_count'),
        text: _selectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: "text",
        marker: {
          size: 7, 
          color: 'red',
          line: {color: 'white'}
        }
      };
      Plotly.redraw(document.getElementById(chartId_));
    }
    
    return content;
  };
  iViz.util.scatterPlot = (function () {
  })();
})(window.iViz, window._, window.d3, window.jQuery || window.$);
