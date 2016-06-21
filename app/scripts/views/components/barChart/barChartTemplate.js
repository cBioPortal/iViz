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
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
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

  Vue.component('barChart', {
    template: '<div id={{charDivId}} class="grid-item grid-item-w-2 grid-item-h-1" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
    '<chart-operations :show-survival-icon="showSurvivalIcon" :show-log-scale="showLogScale"' +
    ':show-operations="showOperations" :groupid="groupid" :reset-btn-id="resetBtnId" :chart="chartInst" :chart-id="chartId" :show-log-scale="showLogScale"></chart-operations>' +
    '<div class="dc-chart dc-bar-chart" align="center" style="float:none !important;" id={{chartId}} ></div><p class="text-center">{{displayName}}</p>' +
    '</div>',
    props: [
      'data', 'ndx', 'attributes', 'filters', 'groupid'
    ],
    data: function() {
      return {
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") +
        '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") +
        '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        chartInst:'',
        barChart:'',
        showOperations: false,
        filtersUpdated:false,
        showLogScale:false,
        showSurvivalIcon:true
      }
    }, watch: {
      'filters': function(newVal, oldVal) {
        if(!this.filtersUpdated) {
          this.filtersUpdated = true;
          if (newVal.length == 0) {
            this.chartInst.filter(null);
            this.$dispatch('update-filters');
          }
        } else{
          this.filtersUpdated = false;
        }
      },
    },events: {
      'closeChart':function(){
        this.$dispatch('close');
      },
      'changeLogScale':function(logScaleChecked){
        $('#'+this.chartId).find('svg').remove();
        dc.deregisterChart(this.chartInst, this.groupid);
        this.initChart(logScaleChecked);
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      },initChart:function(logScaleChecked){
        this.chartInst =
          this.barChart.init(this.ndx, this.data, this.attributes, settings_,
            this.chartId, this.groupid,logScaleChecked);
        this.showLogScale =this.barChart.hasLogScale();
        var self_ = this;
        this.chartInst.on('filtered', function(_chartInst, _filter) {
          if(!self_.filtersUpdated) {
            self_.filtersUpdated = true;
            var tempFilters_ = $.extend(true, [], self_.filters);
            tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
              self_.attributes.view_type);
            if (typeof tempFilters_ !== 'undefined' && tempFilters_.length !== 0) {
              tempFilters_[0] = tempFilters_[0].toFixed(2);
              tempFilters_[1] = tempFilters_[1].toFixed(2);
            }
            self_.filters = tempFilters_;
            self_.$dispatch('update-filters');
          }else{
            self_.filtersUpdated = false;
          }
        });
      }
    },
    ready: function() {
      this.barChart = new iViz.view.component.barChart();
      settings_.barChart.width = window.style.vars.barchartWidth || 150;
      settings_.barChart.height = window.style.vars.barchartHeight || 150;
      this.initChart();
      this.$dispatch('data-loaded', true);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
