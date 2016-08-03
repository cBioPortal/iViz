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
  Vue.component('chartGroup', {
    template: ' <div is="individual-chart"' +
    ' :ndx="ndx" :groupid="groupid"' +
    ' :attributes.sync="attribute" v-for="attribute in attributes"></div>',
    props: [
      'attributes', 'type', 'mappedsamples', 'id',
      'mappedpatients', 'groupid', 'redrawgroups'
    ], created: function() {
      //TODO: update this.data
      var data_ = iViz.getAttrData(this.type);
      var ndx_ = crossfilter(data_);
      var attrId = this.type==='patient'?'patient_id':'sample_id';
      this.invisibleBridgeDimension =  ndx_.dimension(function (d) { return d[attrId]; });
      this.groupid = this.id;
      this.ndx = ndx_;
      this.invisibleChartFilters = [];
    }, destroyed: function() {
      dc.chartRegistry.clear(this.groupid);
    },
    data: function() {
      return {
        syncPatient: true,
        syncSample: true,
        clearGroup:false
      }
    },
    watch: {
      'mappedsamples': function(val) {
        if (this.type === 'sample') {
          if (this.syncSample) {
            this.updateInvisibleChart(val);
          }else {
            this.syncSample = true;
          }
        }
      },
      'mappedpatients': function(val) {
        if (this.type === 'patient') {
          if (this.syncPatient) {
            this.updateInvisibleChart(val);
          } else {
            this.syncPatient = true;
          }
        }
      }
    },
    events: {
      'clear-group':function(){
        this.clearGroup = true;
        this.invisibleBridgeDimension.filterAll();
        this.invisibleChartFilters = [];
        iViz.deleteGroupFilteredCases(this.id);
        this.$broadcast('clear-chart-filters');
        var self_ = this;
        this.$nextTick(function(){
          self_.clearGroup = false;
        });
      },
      'update-filters': function() {
        if(!this.clearGroup){
          this.syncPatient = false;
          this.syncSample = false;
          var _filters = [], _caseSelect = [];
          var attrId = this.type==='patient'?'patient_id':'sample_id';
          if(this.invisibleChartFilters.length>0) {
            this.invisibleBridgeDimension.filterAll();
          }
          var filteredCases = _.pluck(this.invisibleBridgeDimension.top(Infinity),attrId).sort();
          //hackey way to check if filter selected filter cases is same as original case list
          if(filteredCases.length !== this.ndx.size()){
            iViz.setGroupFilteredCases(this.id, filteredCases);
          }else{
            iViz.deleteGroupFilteredCases(this.id)
          }


          if(this.invisibleChartFilters.length>0){
            var filtersMap = {};
            _.each(this.invisibleChartFilters,function(filter){
              if(filtersMap[filter] === undefined){
                filtersMap[filter] = true;
              }
            });
            this.invisibleBridgeDimension.filterFunction(function(d){
              return (filtersMap[d] !== undefined);
            });
          }
          this.$dispatch('update-all-filters', this.type);
        }
      }
    },
    methods: {
      updateInvisibleChart: function(val) {
        this.invisibleChartFilters = val;
        var filtersMap = {};
        if(val.length>0){
          _.each(val,function(filter){
            if(filtersMap[filter] === undefined){
              filtersMap[filter] = true;
            }
          });
          this.invisibleBridgeDimension.filterFunction(function(d){
            return (filtersMap[d] !== undefined);
          });
        }else{
          this.invisibleBridgeDimension.filterAll();
        }
        this.redrawgroups.push(this.id);
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
