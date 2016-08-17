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
 * Created by James Xu on 8/5/16.fr
 */
/**
 * 
 */
(function(Vue, dc, iViz, $, d3){
  Vue.component('overtimeChart',{
    template:'<div id = {{charDivId}} class="grid-item grid-item-h-2 grid-item-w-2" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
    '<chart-operations :chart-ctrl="overtimeChart"  :has-chart-title="hasChartTitle" :display-name="displayName" :chart-id="chartId" '+
    ':chart="chartInst" :attributes="attributes" :show-operations="showOperations" :filters.sync="filters"></chart-operations>' +
    '<div id = {{overtimeLineId}} class = "iviz-overtime-line-class"></div><div id={{chartId}} class="iviz-overtime-chart"></div></div>',  //everything written in template replaces html
    props: ['ndx', 'data', 'groupid', 'attributes', 'filters'], //groupid, a dc mechanism, allows interactivity between charts within the same dc group;
                                                                //iviz controls filtering across groups
    data:function() {
      return {
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
        displayName: this.attributes.display_name,
        hasChartTitle: true,
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        overtimeLineId:'overtime-line-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        chartInst:'',
        showOperations: false,
        filtersUpdated:false,
        overtimeChart: '',
        overtimeLineData: [],
      };
    },
    watch:{
      'filters': function(newVal, oldVal) {
          if(!this.filtersUpdated) {
          this.filtersUpdated = true;
          if (newVal.length == 0) {
            this.chartInst.filterAll();
            dc.redrawAll(this.groupid);
            this.$dispatch('update-filters');
          }
        } else{
          this.filtersUpdated = false;
        }
      }
    },
    events:{
      'closeChart':function(){
        this.$dispatch('close');
      }
    },
    methods:{
      mouseEnter: function() {
        this.showOperations = true;

      },
      mouseLeave: function() {
        this.showOperations = false;
      },
      initChart: function (){
        this.chartInst = this.overtimeChart.init();
        this.overtimeChart.drawOvertimeLine(this.chartInst);
          var self_ = this;
        
        //do this when chart is filtered
        this.chartInst.on('filtered', function(_chartInst, _filter) {
            //redraw the overtime line
            $('#' + self_.overtimeLineId).empty();  
            self_.overtimeChart.drawOvertimeLine(self_.chartInst);
            
            if(!self_.filtersUpdated) {
            self_.filtersUpdated = true;
            var tempFilters_ = $.extend(true, [], self_.filters);
            tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
              self_.attributes.view_type[0]);
            if (typeof tempFilters_ !== 'undefined' && tempFilters_.length !== 0) {
              tempFilters_[0] = tempFilters_[0];
              tempFilters_[1] = tempFilters_[1];
            }
            self_.filters = tempFilters_;
            self_.$dispatch('update-filters');
          }else{
            self_.filtersUpdated = false;
          }
        });
        
        //redraws overtimeline when other charts are changed
        this.chartInst.on('postRedraw', function(){
            $('#' + self_.overtimeLineId).empty(); 
            self_.overtimeChart.drawOvertimeLine(self_.chartInst);


        });
      },
    },
    ready:function(){
      var opts = {
        groupid:this.groupid,
        overtimeBarChartTarget: "#" + this.chartId,
        overtimeLineTarget: "#" + this.overtimeLineId
      };
      this.overtimeChart = new iViz.view.component.OvertimeChart(this.ndx, opts, this.attributes); 
      this.initChart();
      this.overtimeChart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);
      this.$dispatch('data-loaded', true);                                                                                                                                                                                                                                 
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery, window.d3);




