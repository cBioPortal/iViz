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
    template:     '<div id ="study-view-attributes-panel" style="right:20px" ><button type="button" class = "panel-button" v-for="sampleChart in sampleCharts">'+
                '<img src={{sampleChart}} alt="linechart" style="width:235px;height:156px"></button>'+ 
                '</div>',
//                
//                '<div id ="study-view-attributes-panel" style="right:20px">'+ 
//                '<div><div class = "btn-group" role ="group" aria-label="..." id="panel-charts-1" style="float:left">' +
//                '<button type="button" id="panel-line-chart" class = "panel-button"><img src="images/linechart.png" alt="linechart" style="width:235px;height:156px"></button>' +
//                '<button type="button" id="panel-table" class = "panel-button"><img src="images/tablechart.png" alt="table" style="width:189px;height:161px"></button>' +
//                '</div></div>' +
//                '<div><div class = "btn-group" role ="group" aria-label="..." id="panel-charts-2" style="float:right">' +
//                '<button type="button" id="panel-bar-chart" class = "panel-button"><img src="images/barchart.png" alt="barchart" style="width:235px;height:169px;top:20px"></button>' +
//                '<button type="button" id="panel-pie-chart" class = "panel-button"><img src="images/piechart.png" alt="piechart" style="width:187px;height:171px"></button>' +
//                '</div></div>' +
//                '</div>',
    props: [], //bind viewtype here
    data: function() {
      return {
          sampleCharts: [
              'images/linechart.png',
             'images/barchart.png',
              'images/piechart.png',
              'images/tablechart.png'
          ] 
      }; //bind data- triggers component
    }, 
    watch: {

    }, 
    methods: {

    },
    events: {
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
