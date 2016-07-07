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
  Vue.component('chartGroup', {
    template: ' <div is="individual-chart"' +
    ' :ndx="ndx" :data="data"  :groupid="groupid"' +
    ' :attributes.sync="attribute" v-for="attribute in attributes" :indices="indices"></div>',
    props: [
      'data', 'attributes', 'type', 'mappedsamples', 'id',
      'mappedpatients', 'groupid', 'redrawgroups', 'hasfilters', 'indices'
    ], created: function() {
      var ndx_ = crossfilter(this.data);
      var invisibleBridgeChart_ = iViz.bridgeChart.init(ndx_, settings_,
        this.type, this.id);
      this.groupid = this.id;
      this.ndx = ndx_;
      this.chartInvisible = invisibleBridgeChart_;
    }, destroyed: function() {
      this.chartInvisible.resetSvg();
      var id_ = this.type + '_' + this.id + '_id_chart_div';
      $('#' + id_).remove()
      dc.chartRegistry.clear(this.groupid);
    },
    data: function() {
      return {
        syncPatient: true,
        syncSample: true
      }
    },
    watch: {
      'mappedsamples': function(val) {
        if (this.type === 'sample') {
          if (this.syncSample) {
            this.updateInvisibleChart(val);
          }else {
            this.syncSample = true;
            if(!this.hasfilters){
              this.updateInvisibleChart(val);
            }
          }
        }
        this.redrawgroups.push(true);
      },
      'mappedpatients': function(val) {
        if (this.type === 'patient') {
          if (this.syncPatient) {
            this.updateInvisibleChart(val);
          } else {
            this.syncPatient = true;
            if(!this.hasfilters){
              this.updateInvisibleChart(val);
            }
          }
        }
        this.redrawgroups.push(true);
      }
    },
    events: {
      'update-filters': function() {
        this.syncPatient = false;
        this.syncSample = false;
        this.$dispatch('update-all-filters', this.type);
      },
      'update-samples': function(_sampleIds) {
        this.syncPatient = false;
        this.syncSample = false;
        this.chartInvisible.filter(null);
        this.chartInvisible.filter([_sampleIds]);
        this.$dispatch('update-all-filters', this.type);
      },
      'update-samples-from-table':function(_sampleIds) {
        //this.chartInvisible.filter(null);
       // this.chartInvisible.filter([_sampleIds]);
        this.$dispatch('update-all-filters', this.type);
      }
    },
    methods: {
      updateInvisibleChart: function(val) {
        this.chartInvisible.filter(null);
        this.chartInvisible.filter([val]);
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
