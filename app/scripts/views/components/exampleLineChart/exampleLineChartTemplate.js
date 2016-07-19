/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('exampleLineChart',{
            template:'<div id = "example-line-chart" class="grid-item grid-item-h-2 grid-item-w-2" class="study-view-dc-chart">' +
                     '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName"> ' +
                     '</chart-operations></div>', //everything written in template replaces
                                                                     //the tag in the html file
            props: [],
            data:function() {
                return {
                    displayName: "Example Line Chart",
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
                new iViz.view.component.exampleLineChart("#example-line-chart").init(); //create new instance of a line chart
                                                                        //each time this function is called - will not 
                                                                        //reference the same one everytime                                                                                                                                                                                                                                      
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);