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
(function(Vue, d3, dc, iViz, _, $) {
  Vue.component('barChart', {
    template: '<div id={{charDivId}} class="grid-item grid-item-w-2 grid-item-h-1 bar-chart" data-number="6" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
    '<chart-operations :show-log-scale="settings.showLogScale"' +
    ':show-operations="showOperations" :groupid="groupid" :reset-btn-id="resetBtnId" :chart-ctrl="barChart" :chart="chartInst" :chart-id="chartId" :show-log-scale="showLogScale" :filters.sync="filters"></chart-operations>' +
    '<div class="dc-chart dc-bar-chart" align="center" style="float:none !important;" id={{chartId}} ></div><span class="text-center chart-title-span">{{displayName}}</span>' +
    '</div>',
    props: [
      'ndx', 'attributes', 'filters', 'groupid'
    ],
    data: function() {
      return {
        chartDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, '') +
        '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, '') +
        '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)| /g, ''),
        displayName: this.attributes.display_name,
        chartInst: '',
        barChart: '',
        showOperations: false,
        filtersUpdated: false,
        showSurvivalIcon: true,
        data: {},
        settings: {
          width: 400,
          height: 180,
          showLogScale: false,
          transitionDuration: iViz.opts.dc.transitionDuration
        },
        opts: {}
      };
    }, watch: {
      filters: function(newVal) {
        if (this.filtersUpdated) {
          this.filtersUpdated = false;
        } else {
          this.filtersUpdated = true;
          if (newVal.length === 0) {
            this.chartInst.filter(null);
            dc.redrawAll(this.groupid);
            this.$dispatch('update-filters');
          }
        }
      }
    }, events: {
      closeChart: function() {
        dc.deregisterChart(this.chartInst, this.attributes.groupid);
        this.chartInst.dimension().dispose();
        this.$dispatch('close');
      },
      changeLogScale: function(logScaleChecked) {
        $('#' + this.chartId).find('svg').remove();
        dc.deregisterChart(this.chartInst, this.attributes.groupid);
        this.initChart(logScaleChecked);
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      }, initChart: function(logScaleChecked) {
        this.opts = _.extend(this.opts, {
          logScaleChecked: logScaleChecked
        });

        this.chartInst = this.barChart.init(this.ndx, this.data, this.opts);
        var self_ = this;
        this.chartInst.on('filtered', function(_chartInst, _filter) {
          //TODO : Right now we are manually checking for brush mouseup event. This should be updated one latest dc.js is released
          // https://github.com/dc-js/dc.js/issues/627
          self_.chartInst.select('.brush').on('mouseup', function() {
            if (!self_.filtersUpdated) {
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
            } else {
              self_.filtersUpdated = false;
            }
          });
        });
      }
    },
    ready: function() {
      this.barChart = new iViz.view.component.BarChart();
      this.barChart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);
      this.settings.width = window.style.vars.barchartWidth || 150;
      this.settings.height = window.style.vars.barchartHeight || 150;

      this.opts = _.extend(this.opts, {
        groupType: this.attributes.group_type,
        attrId: this.attributes.attr_id,
        displayName: this.attributes.display_name,
        chartDivId: this.chartDivId,
        chartId: this.chartId,
        groupid: this.groupid,
        width: this.settings.width,
        height: this.settings.height
      });

      this.data.meta = _.map(_.filter(_.pluck(iViz.getAttrData(this.opts.groupType), this.opts.attrId), function(d) {
        return d !== 'NA';
      }), function(d) {
        return parseFloat(d);
      });
      var findExtremeResult = cbio.util.findExtremes(this.data.meta);
      this.data.min = findExtremeResult[0];
      this.data.max = findExtremeResult[1];
      this.data.attrId = this.attributes.attr_id;

      if (((this.data.max - this.data.min) > 1000) && (this.data.min > 1)) {
        this.settings.showLogScale = true;
      }
      this.initChart(this.settings.showLogScale);
      this.$dispatch('data-loaded', this.chartDivId);
    }
  });
})(window.Vue, window.d3, window.dc, window.iViz, window._,
  window.$ || window.jQuery);
