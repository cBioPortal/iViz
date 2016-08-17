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
    template:     '<div id ="iviz-attributes-panel">'+//TODO: div changes size depending on number of charts/include default option is...
                '<div id ="iviz-attributes-panel-text"><p>How would you like to visualize your data?</p>' +
                '<p>The default is: <span>{{default_chart}}</span></p></div>'+
                '<div id="iviz-attributes-panel-button-template" v-bind:style="panel_size">'+
                '<img v-on:click="choose_chart(panelChart.selected_chart)" v-for="panelChart in panelCharts" v-bind:src="panelChart.src" alt="panelcharts" '+
                'id="iviz-attributes-panel-button">'+ 
                '</div></div>', //cannot use {{}} to reference a string that contains html code, b/c it will not treat it as html code

    props: ['viewtypes', 'attrid', 'datatype'], //bind viewtype here, component triggers b/c data is bound
    data: function() {
      return {
          panelCharts: [],
          default_chart:'',
          panel_size: {
              width:'',
              height: ''
          }
      };
    }, 
    watch: {

    }, 
    methods: {
        choose_chart:function(selected_chart){
                this.$parent.addChart(this.attrid, selected_chart);
                $("#iviz-attributes-panel").hide();
                $("#iviz-add-chart").trigger("chosen:updated");
        }
    },
    events: {
        'openPanel':function(){//make an array of corresponding chart images based on viewtypes
        var self = this;
        var viewtypes = $.extend(true, [], self.viewtypes); //make a copy of viewtypes, which contains the array of possible viewtypes, first element is the selected chart
            _.each(viewtypes, function(_element, index){
                var panelObj = {
                    src: '',
                    selected_chart: '',
                };
                switch(_element){
                case 'overtime_chart':
                    panelObj.src = 'images/overtimechart.png';
                    panelObj.selected_chart = 'overtimechart';  
                    viewtypes[index] = panelObj;
                    break;
                case 'line_chart':    
                    panelObj.src = 'images/linechart.png';
                    panelObj.selected_chart = 'linechart'; 
                    viewtypes[index] = panelObj;
                    break;
                case 'pie_chart':
                    panelObj.src = 'images/piechart.png';
                    panelObj.selected_chart = 'piechart';
                    viewtypes[index] = panelObj;
                    break;
                case 'bar_chart':
                    panelObj.src = 'images/barchart.png';
                    panelObj.selected_chart = 'barchart';
                    viewtypes[index] = panelObj;
                    break;
                case 'table':
                    panelObj.src = 'images/table.png';
                    panelObj.selected_chart = 'table';
                    viewtypes[index] = panelObj;
                    break;
                case 'survival':
                    panelObj.src = 'images/survival.png';
                    panelObj.selected_chart = 'survival';
                    viewtypes[index] = panelObj;
                    break;
                }                         
        });   
            self.panelCharts = viewtypes; //using push makes panelCharts have too many buttons b/c panelCharts is not being reset each time
                                          //above method replaces elements in viewtypes each time, so it is updated
                                          
            switch (self.datatype){//sets default chart
                case 'OVERTIME':
                    self.default_chart = 'the accumulation line chart';
                    break;
                case 'DATE':
                    self.default_chart = 'the line chart';
                    break;
                case 'STRING':
                    self.default_chart = 'the pie chart';
                    break;
                case 'NUMBER':
                    self.default_chart = 'the bar chart';
                    break;
                case 'SURVIVAL':
                    self.default_chart = 'the survival chart';
                    break;
                default:
                    self.default_chart = 'table';
                    break;
            }    
            switch (this.panelCharts.length){ //panel dimensions change based on # of charts
                case 1:
                case 2:
                    this.panel_size.width = '500px';
                    this.panel_size.height = '200px';
                    break;
                case 3:
                case 4:
                    this.panel_size.width = '500px';
                    this.panel_size.height = '350px';
                    break;
                case 5:
                case 6:
                     this.panel_size.width = '500px';
                     this.panel_size.height = '500px';
                     break;
            }
            $("#iviz-attributes-panel").show();
        }
    },
    ready:function(){

    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
