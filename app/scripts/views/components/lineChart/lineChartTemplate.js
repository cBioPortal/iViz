/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('lineChart',{
            template:'<div id = {{charDivId}} class="grid-item grid-item-h-2 grid-item-w-2" class="study-view-dc-chart" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
                     '<chart-operations :chart-ctrl="lineChart"  :has-chart-title="hasChartTitle" :display-name="displayName" :chart-id="chartId" '+ //don't need rangeChartId in chart operations b/c chart operations doesn't handle the range chart
                     ':chart="chartInst" :attributes="attributes" :show-operations="showOperations" :filters.sync="filters"></chart-operations><div id={{chartId}}>' +
                     '</div><div id={{rangeChartId}} class= "range-chart-class"></div></div>',  //everything written in template replaces
                                                            //the tag in the html file
                                                            //create an outer div to hold both the line chart and the range chart
                                                            //chartId creates element id for download button
            props: ['ndx', 'data', 'groupid', 'attributes', 'filters'], //groupid puts line chart in the same group as the other charts(interactive with other graphs)
                                                             //attribute contains the 
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
          if (newVal.length === 0) {
            this.chartInst.filter(null);
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
////                   
                    var self_ = this;
                    
        this.rangeChartInst.on('filtered', function(_chartInst, _filter) {
//          if(!self_.filtersUpdated) {
            self_.filtersUpdated = true;
            var tempFilters_ = $.extend(true, [], self_.filters);
            tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
              'bar_chart');
//            if (typeof tempFilters_ !== 'undefined' && tempFilters_.length !== 0) {
//              tempFilters_[0] = tempFilters_[0].toFixed(2);
//              tempFilters_[1] = tempFilters_[1].toFixed(2);
//            }
            self_.filters = tempFilters_;
            self_.chartInst.render();
            self_.$dispatch('update-filters');
//          }else{
//            self_.filtersUpdated = false;
//          }
        });

                }
            },
               
            ready:function(){
                var opts = {
                        groupid:this.groupid,
                        lineChartTarget: "#" + this.chartId,
                        rangeChartTarget: "#" + this.rangeChartId
                    }; 
                this.lineChart = new iViz.view.component.LineChart(this.ndx, opts, this.attributes); //create new instance of a line chart
                this.initChart();                                                        //each time this function is called - will not 
                this.lineChart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);                                                      //reference the same one everytime                                                                                                                                                                                                                                      
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);



