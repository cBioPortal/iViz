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
 * @author Yichao Sun on 5/11/16.
 */
'use strict';
(function(Vue, dc, iViz) {
  Vue.component('scatterPlot', {
    template: '<div id={{chartDivId}} class="grid-item grid-item-h-2 grid-item-w-2" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
      '<chart-operations :show-operations="showOperations" :display-name="displayName" :has-chart-title="true" :groupid="groupid" :reset-btn-id="resetBtnId" :chart="chartInst" :chart-id="chartId" :attributes="attributes"></chart-operations>' +
      '<div class="dc-chart dc-scatter-plot" align="center" style="float:none !important;" id={{chartId}} >' +
      '</div>',
    props: [
      'data', 'ndx', 'attributes', 'options', 'filters', 'groupid'
    ],
    created: function() {
    },
    data: function() {
      return {
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        showOperations: false,
        selectedSamples: [],
        chartInst: {}
      };
    },
    watch: {
      'filters': function(newVal) {
        this.chartInst.update(newVal);
        this.$dispatch('update-samples',newVal);
      }
    },
    events: {},
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      }
    },
    ready: function() {
      
      var _self = this;
      
      _self.chartInst = new iViz.view.component.scatterPlot();
      _self.chartInst.init(this.data, this.chartId, this.charDivId);
      
      document.getElementById(this.chartId).on('plotly_selected', function(_eventData) {
        if (typeof _eventData !== 'undefined') {
          var _selectedData = [];
          _.each(_eventData.points, function(_pointObj) {
            _.each(_self.data, function(_dataObj) {
              if (_dataObj['cna_fraction'] === _pointObj.x &&
                  _dataObj['mutation_count'] === _pointObj.y) {
                _selectedData.push(_dataObj);
              }
            });
          });
          _self.selectedSamples = _.pluck(_selectedData, "sample_id");
         // _self.chartInst.update(_self.selectedSamples);
          _self.filters = _self.selectedSamples;
          //_self.$dispatch('update-samples', _self.selectedSamples);
        }
      });
      
      _self.$on('scatter-plot-sample-update', function(_selectedSamples) {
        if (_selectedSamples.length !== _self.data.length) {
          _self.selectedSamples=_selectedSamples;
          _self.chartInst.update(_selectedSamples);
        } else {
          _self.selectedSamples=_selectedSamples;
          _self.chartInst.update([]);
        }
      });
    
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
