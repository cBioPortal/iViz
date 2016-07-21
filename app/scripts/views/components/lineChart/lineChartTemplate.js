/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('lineChart',{
            template:'<div id = "line-chart" class="grid-item grid-item-h-2 grid-item-w-2" class="study-view-dc-chart" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
                     '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName" :chart-id="chartId" '+ //don't need rangeChartId in chart operations b/c chart operations doesn't handle the range chart
                     ':attributes="attributes" :show-operations="showOperations"></chart-operations><div id={{chartId}}>' +
                     '</div><div id={{rangeChartId}} class= "range-chart-class"></div></div>',  //everything written in template replaces
                                                            //the tag in the html file
                                                            //create an outer div to hold both the line chart and the range chart
                                                            //chartId creates element id for download button
            props: ['ndx', 'data', 'groupid', 'attributes'], //groupid puts line chart in the same group as the other charts(interactive with other graphs)
                                                             //attribute contains the 
            data:function() {
                return {
                    displayName: this.attributes.display_name,
                    hasChartTitle: true,
                    chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
                    showOperations: false,
                    rangeChartId: 'range-chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, "")
//                    charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div'
                };
            },
            watch:{    
            },
            events:{  
//                'closeChart':function(){
//                $('#' +this.charDivId).qtip('destroy');
//                this.$dispatch('close');
//                }     
            },
            methods:{
                mouseEnter: function() {
                            this.showOperations = true;

                },
                mouseLeave: function() {
                              this.showOperations = false;
                            }
                },
            ready:function(){
                var opts = {
                 groupid:this.groupid,
                 lineChartTarget: "#" + this.chartId,
                 rangeChartTarget: "#" + this.rangeChartId
                }; 
                
                new iViz.view.component.LineChart(this.ndx, this.data, opts, this.attributes).init(); //create new instance of a line chart
                                                                        //each time this function is called - will not 
                                                                      //reference the same one everytime                                                                                                                                                                                                                                      
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);



