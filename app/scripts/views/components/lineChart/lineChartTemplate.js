/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
Vue.component('lineChart',{
        template:'<chart-operations :display-name="displayName"></chart-operations>',
        props: [],
        data:{
            displayName: "Line Chart"
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

var vm= new Vue({
    el:'#linechart'
});

