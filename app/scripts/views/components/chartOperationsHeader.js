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
 * Created by Karthik Kalletla on 4/14/16.
 */
'use strict';
(function(Vue, iViz, $) {
  Vue.component('chartOperations', {
    template: '<div style="height: 16px; width: 100%; float: left; text-align: center;">' +
    '<div style="height:16px;float:right;" :class="{view:!showOperations}">'+
    '<table id="tab"><tr>' +
    '<td v-if="isPieChart&&showTable">' +
    '<img src="images/table.svg" class="study-view-title-icon hover" @click="changeView()"/>' +
    '</td>' +
    '<td v-if="isPieChart&&!showTable">' +
    '<img src="images/pie.svg" class="study-view-title-icon hover" @click="changeView()"/>' +
    '</td>' +
    '<td>' +
    '<img src="images/reload-alt.svg" @click="reset()" class="study-view-title-icon hover"/>'+
    '</td>' +
    '<td>' +
    '<img src="images/move.svg" class="fa fa-arrows dc-chart-drag" class="study-view-title-icon"/>'+
    /*'<i style="margin-left:2px;" class="fa fa-arrows dc-chart-drag"></i>' +*/
    '</td>' +
    '<td>' +
    '<i class="fa fa-times dc-chart-pointer study-view-title-icon" style="margin-top:-2px;" @click="close()"></i>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</div><div><chartTitleH4 :class="{chartTitleH4hover:showOperations}" v-if="isPieChart&&showTable">{{displayName}}</chartTitleH4></div>'+
    '</div>',
    props: [
      'showOperations', 'resetBtnId', 'chart', 'groupid', 'isPieChart', 'showTable','displayName'
    ],
    methods: {
      reset: function() {
        iViz.shared.resetAll(this.chart, this.groupid)
      },
      close: function() {
        if (this.chart.hasFilter()) {
          iViz.shared.resetAll(this.chart, this.groupid)
        }
        dc.deregisterChart(this.chart, this.groupid);
        this.$dispatch('closeChart')
      },
      changeView:function(){
        this.showTable = !this.showTable;
        this.$dispatch('toTableView');
      }
    }
  });
})(window.Vue, window.iViz,
  window.$ || window.jQuery);
