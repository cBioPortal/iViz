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
 */

'use strict';
(function(iViz, dc, _, $) {
  
  iViz.dcCharts = function (meta, data, mapping, type) {
    
    var settings_ = {
      pieChart: {
        width: 150,
        height: 150,
        innerRadius: 15
      },
      barChart: {
        width: 400,
        height: 180
      },
      transitionDuration: iViz.opts.dc.transitionDuration
    };
    
    var filters_ = {}, chartInsts_ = [];
    
    var ndx_ = crossfilter(data);
    
    // ---- a separate sample/patient id chart for sync use only ----
    var chartInvisible_ = iViz.bridgeChart.init(ndx_, settings_, type);
    
    // ---- automatically create charts by iterating attributes meta ----
    _.each(meta, function (_attrObj) {
      
      if ($.inArray(_attrObj.view_type, ['pie_chart', 'bar_chart']) !== -1) { //TODO: remove this, should be able to handle all view types
        
        var _chartDivId = 'chart-' + _attrObj.attr_id + _attrObj.attr_type + '-' + '-div',
          _resetBtnId = 'chart-' + _attrObj.attr_id + _attrObj.attr_type + '-' + '-reset',
          _chartId = 'chart-' + _attrObj.attr_type + '_' + _attrObj.attr_id;
        
        // append html element
        // TODO: replace with template
        $('#main-grid').append(
          '<div id="' + _chartDivId + '">' +
          '<a id="' + _resetBtnId + '">Reset</a>' +
          '<i class="fa fa-arrows dc-chart-drag"></i>' +
          '<div class="dc-chart" id="' + _chartId + '"></div>' +
          '</div>'
        );
        
        // init and define dc chart instances based on chart types
        var _chartInst;
        switch (_attrObj.view_type) {
          
          case 'pie_chart':
            
            $('#' + _chartDivId).addClass('grid-item');
            $('#' + _chartId).addClass('dc-pie-chart');
            
            var _pieChart = new iViz.view.component.pieChart();
            var _data = $.extend(true, {}, _attrObj);
            
            _data.ndx = ndx_;
            _pieChart.init(_data, {
              divId: _chartId,
              width: settings_.pieChart.width,
              height: settings_.pieChart.height,
              transitionDuration: settings_.transitionDuration
            });
            _chartInst = _pieChart.getChart();
            
            $('#' + _chartId).append('<p class="text-center">' + _attrObj.display_name + '</p>');
            
            break;
          
          case 'bar_chart':
            
            $('#' + _chartDivId).addClass('grid-item');
            $('#' + _chartDivId).addClass('grid-item--width2');
            $('#' + _chartId).addClass('dc-bar-chart');
            
            var _barChart = new iViz.view.component.barChart();
            _chartInst = _barChart.init(ndx_, data, _attrObj, settings_, _chartId);
            
            break;
          
          case 'scatter_plots':
            break;
          case 'table':
            break;
          
        }
        
        iViz.event.resetAll(_chartInst, _resetBtnId);
        iViz.event.filtered(_chartInst, _attrObj, filters_, type);
        
        chartInsts_.push(_chartInst);
        
      }
      
      return this;
      
    });
    
    return {
      reset: function () {
        dc.redrawAll();
        iViz.view.grid.layout();
      },
      sync: function(_selected_cases) {
        chartInvisible_.filter(null);
        _.each(_selected_cases, function(_case_id) {
          chartInvisible_.filter(_case_id);
        });
      },
      filters: function() {
        return filters_;
      }
    }
  };
  
}(window.iViz, window.dc, window._, window.$));  


