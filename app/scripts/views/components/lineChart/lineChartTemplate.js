/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('lineChart',{
            template:'<div id = "line-chart" class="grid-item grid-item-h-2 grid-item-w-2" class="study-view-dc-chart">' +
                     '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName"> ' +
                     '</chart-operations><div id ="the-line-chart"></div>' +
                     '<div id="range-chart" class= "range-chart-class"></div></div>',  //everything written in template replaces
                                                            //the tag in the html file
                                                            //create an outer div to hold both the line chart and the range chart
            props: ['ndx', 'data', 'groupid'], //groupid puts line chart in the same group as the other charts(interactive with other graphs)
            data:function() {
                return {
                    displayName: "Line Chart",
                    hasChartTitle: true
                };
            },
            watch:{    
            },
            events:{    
            },
            methods:{   
            },
            ready:function(){
                var opts = {
                 groupid:this.groupid,
                 lineChartTarget: "#the-line-chart",
                 rangeChartTarget: "#range-chart"
                }; //imports groupid functionality
                new iViz.view.component.lineChart(this.ndx, this.data, opts).init(); //create new instance of a line chart
                                                                        //each time this function is called - will not 
                                                                        //reference the same one everytime                                                                                                                                                                                                                                      
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);



