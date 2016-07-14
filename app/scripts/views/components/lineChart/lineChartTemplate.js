/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
(function(Vue, dc, iViz, $){
    Vue.component('lineChart',{
            template:'<div class="grid-item grid-item-h-1 grid-item-w-1" ' +
                     'class="study-view-dc-chart study-view-pie-main">' +
                     '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName">' +
                     '</chart-operations></div>',
            props: [],
            data:function(l) {
                l="Line Chart";
                return {
                    displayName: l,
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
            }
    });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);