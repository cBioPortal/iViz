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
 * Created by James Xu on 8/5/16.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('lineChart',{
            template:'<div id = {{charDivId}} class="grid-item grid-item-h-2 grid-item-w-2"  @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
                     '<chart-operations :chart-ctrl="lineChart"  :has-chart-title="hasChartTitle" :display-name="displayName" :chart-id="chartId" '+ //don't need rangeChartId in chart operations b/c chart operations doesn't handle the range chart
                     ':chart="chartInst" :attributes="attributes" :show-operations="showOperations" :filters.sync="filters"></chart-operations><div id={{chartId}}>' +
                     '</div><div id={{rangeChartId}} class= "range-chart-class"></div></div>',  //everything written in template replaces
                                                            //the tag in the html file
                                                            //create an outer div to hold both the line chart and the range chart
                                                            //chartId creates element id for download button
            props: ['ndx', 'data', 'groupid', 'attributes', 'filters'], //groupid, a dc mechanism, allows interactivity between charts within the same dc group;
                                                                            //iviz controls filtering across groups
            data:function() {
                return {
                    charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
                    displayName: this.attributes.display_name,
                    hasChartTitle: true,
                    chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
                    chartInst:'',
                    rangeChartInst: '',
                    showOperations: false,
                    rangeChartId: 'range-chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
                    filtersUpdated:false,
                    lineChart: ''
                };
            },
            //this = line chart template
            //this.chartInst = dc line chart
            watch:{
              'filters': function(newVal, oldVal) {
                if(!this.filtersUpdated) {
                  this.filtersUpdated = true;
                  if (newVal.length == 0) {
                    this.rangeChartInst.filterAll();
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
                   var chartInstances =  this.lineChart.init();
                   this.rangeChartInst = chartInstances.rangeChart;
                    this.chartInst = chartInstances.lineChart; //returns chartinstances
                  var self_ = this;
                  this.chartInst.on('filtered', function(_chartInst, _filter) {
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
                  this.chartInst.on('postRedraw', function(_chartInst) {
                    // This is temporary fix, may need to find the reason why range chart is not synchronized
                    if(_chartInst.filters().length !== self_.rangeChartInst.filters().length) {
                      _chartInst.filterAll();
                    }
                  });
                },
                
   },    
            ready:function(){
                var opts = {
                        groupid:this.groupid,
                        lineChartTarget: "#" + this.chartId,
                        rangeChartTarget: "#" + this.rangeChartId
                    }; 
                this.lineChart = new iViz.view.component.LineChart(this.ndx, opts, this.attributes); //create new instance of a line chart
                this.initChart();                                                        //each time this function is called - will not 
                this.lineChart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);   
                this.$dispatch('data-loaded', true);//loads data into line chart when it is added                                                                                                                                                                                                                                  
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);



