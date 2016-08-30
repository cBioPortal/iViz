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
    ' :ndx="ndx" ' +
    ' :attributes.sync="attribute" v-for="attribute in attributes"></div>',
    props: [
      'attributes', 'type', 'id', 'redrawgroups', 'mappedcases', 'clearGroupFlag'
    ], created: function() {
      //TODO: update this.data
      var _self = this;
      var ndx_ = crossfilter(iViz.getGroupNdx(this.id));
      this.invisibleBridgeDimension =  ndx_.dimension(function (d) { return d[_self.type+'_id']; });
      this.ndx = ndx_;
      this.invisibleChartFilters = [];

      if(this.mappedcases !== undefined && this.mappedcases.length>0){
        this.$nextTick(function(){
          _self.updateInvisibleChart(_self.mappedcases);
        });
      }
    },
    destroyed: function() {
      dc.chartRegistry.clear(this.id);
    },
    data: function() {
      return {
        clearGroup:false,
        syncCases: true
      }
    },
    watch: {
      'mappedcases': function (val) {
        if (this.syncCases) {
          this.updateInvisibleChart(val);
        } else {
          this.syncCases = true;
        }
      }
    },
    events: {
      'add-chart-to-group': function(groupId,attrId){
        if(this.id === groupId){
          this.$broadcast('adding-chart', this.id, true);
          if(this.invisibleChartFilters.length>0) {
            this.invisibleBridgeDimension.filterAll();
          }
          this.ndx.remove();
          this.ndx.add(iViz.getGroupNdx(this.id));
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
          this.$broadcast('adding-chart',this.id,false);
        }
      },
      /*
      *This event is invoked whenever there is a filter update on any chart
      * STEPS involved
      * 
      * 1. Clear filters on invisible group bridge chart
      * 2. Get all the filtered cases fot that particular chart group
      * 3. If those filtered cases length not same as original cases length then save that case list in the groupFilterMap
      * 4. Apply back invisible group bridge chart filters
      * 
       */
      'update-filters': function() {
        if(!this.clearGroupFlag){
          this.syncCases = false;
          if(this.invisibleChartFilters.length>0) {
            this.invisibleBridgeDimension.filterAll();
          }
          var filteredCases = _.pluck(this.invisibleBridgeDimension.top(Infinity),this.type+'_id').sort();
          //hackey way to check if filter selected filter cases is same as original case list
          if(filteredCases.length !== this.ndx.size()){
            iViz.setGroupFilteredCases(this.id, this.type, filteredCases);
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
        var _groupCases = iViz.getGroupFilteredCases();
        var _selectedCases = val;
        var _self = this;
        _.each(_groupCases,function(_group, id){
          if(_group !== undefined && _group.type === _self.type && (_self.id.toString() !== id)){
            _selectedCases = iViz.util.intersection(_selectedCases,_group.cases);
          }
        });
        this.invisibleChartFilters = [];
        this.invisibleBridgeDimension.filterAll();
        if(_selectedCases.length>0){
          this.invisibleChartFilters = _selectedCases;
          var filtersMap = {};
          _.each(_selectedCases,function(filter){
            if(filtersMap[filter] === undefined){
              filtersMap[filter] = true;
            }
          });
          this.invisibleBridgeDimension.filterFunction(function(d){
            return (filtersMap[d] !== undefined);
          });
        }
        this.redrawgroups.push(this.id);
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
