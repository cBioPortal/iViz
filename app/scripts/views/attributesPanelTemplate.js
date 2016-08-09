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
(function(Vue, dc, iViz, $) {
  Vue.component('attributesPanel', {
    template:     '<div id ="iviz-attributes-panel" style="right:20px" ><button type="button" class = "panel-button" v-on:click="choose_chart" v-for="panelChart in panelCharts">'+
                '<img v-bind:src="panelChart" alt="panelcharts" style="width:235px;height:156px"></button>'+ 
                '</div>', //the variable sampleChart is a string, cannot use {{}} to reference a string that contains html code, b/c it will not treat it as html code

    props: ['viewtypes', 'attrid'], //bind viewtype here
    data: function() {
      return {
          panelCharts: []
      }; //bind data- triggers component
    }, 
    watch: {

    }, 
    methods: {
        choose_chart:function(){
                this.$parent.addChart(this.attrid);
                $("#iviz-attributes-panel").hide();
                $("#iviz-add-chart").trigger("chosen:updated"); //put this in attributes panel in click event
        }
    },
    events: {
        'openPanel':function(){
//            make an array of corresponding images based on viewtypes
            var self = this;
            var viewtypes = $.extend(true, [], self.viewtypes);
            
            _.each(viewtypes, function(_element, index){
            switch(_element){
                case 'line_chart':
                    viewtypes[index] = 'images/linechart.png';
//                    _element = 'images/linechart.png'
                    break;
                case 'pie_chart':
                    viewtypes[index] = 'images/piechart.png';
//                    _element = 'images/piechart.png';
                    break;
                case 'bar_chart':
                    viewtypes[index] = 'images/barchart.png';
//                    _element = 'images/barchart.png';
                    break;
                case 'table':
                    viewtypes[index] = 'images/tablechart.png';
//                    _element = 'images/tablechart.png';
                    break;
                }
        });   
            this.panelCharts = viewtypes;
            $("#iviz-attributes-panel").show();
        }
    },
    ready:function(){

    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
