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
(function (Vue, iViz, $) {
  Vue.component('chartOperations', {
    template: '<div style="height: 16px; width: 100%; float: left; text-align: center;">' +
              '<div style="height:16px;float:right;" :class="{view:!showOperations}">' +
              '<table id="tab"><tr>' +
              '<td v-show="isPieChart&&showTable">' +
              '<img src="images/table.svg" class="study-view-title-icon hover" @click="changeView()"/>' +
              '</td>' +
              '<td v-show="isPieChart&&!showTable">' +
              '<img src="images/pie.svg" class="study-view-title-icon hover" @click="changeView()"/>' +
              '</td>' +
              '<td>' +
              '<img v-show="hasFilters" src="images/reload-alt.svg" @click="reset()" class="study-view-title-icon hover"/>' +
              '</td>' +
              '<td><div id="{{chartId}}-download-icon-wrapper">' +
              '<img src="images/in.svg" class="study-view-title-icon hover" id="{{chartId}}-download"/>' +
              '</div></td>' +
              '<td>' +
              '<img src="images/move.svg" class="dc-chart-drag" class="study-view-title-icon"/>' +
              '</td>' +
              '<td>' +
              '<i class="fa fa-times dc-chart-pointer study-view-title-icon" style="margin-top:-2px;" @click="close()"></i>' +
              '</td>' +
              '</tr>' +
              '</table>' +
              '</div><div><chartTitleH4  id="{{chartId}}-title" :class="{chartTitleH4hover:showOperations}" v-show="isPieChart&&showTable">{{displayName}}</chartTitleH4></div>' +
              '</div>',
    props: [
      'showOperations', 'resetBtnId', 'chart', 'groupid', 'isPieChart', 'showTable', 'displayName', 'chartId'
    ],
    data: function () {
      return {
        hasFilters: false
      }
    },
    watch: {
      showOperations: function () {
        if (typeof this.chart !== 'undefined' && 
            this.chart !== '') {
          if (typeof this.chart.filters !== 'undefined' && this.chart.filters.length > 0) {
            this.hasFilters = true;
          } else {
            this.hasFilters = false;
          }
        }
      }
    },
    methods: {
      close: function () {
        if (this.chart.hasFilter()) {
          iViz.shared.resetAll(this.chart, this.groupid)
        }
        dc.deregisterChart(this.chart, this.groupid);
        this.$dispatch('closeChart')
      },
      changeView: function () {
        this.showTable = !this.showTable;
        this.$dispatch('toTableView');
      }
    }, ready: function () {
      $('#' + this.chartId + '-download').qtip('destroy', true);
      $('#' + this.chartId + '-download-icon-wrapper').qtip('destroy', true);
      var chartId = this.chartId;

      $('#' + this.chartId + '-title').qtip({
        id: '#' + this.chartId + "-title-qtip",
        content: {text: this.displayName},
        style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
        show: {event: "mouseover"},
        hide: {fixed: true, delay: 100, event: "mouseout"},
        position: {my: 'right bottom', at: 'top left', viewport: $(window)}
      });

      $('#' + this.chartId + '-download-icon-wrapper').qtip({
        style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
        show: {event: "mouseover", delay: 0},
        hide: {fixed: true, delay: 300, event: "mouseout"},
        position: {my: 'bottom left', at: 'top right', viewport: $(window)},
        content: {
          text: "Download"
        }
      });

      $('#' + this.chartId + '-download').qtip({
        id: '#' + this.chartId + "-download-qtip",
        style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
        show: {event: "click", delay: 0},
        hide: {fixed: true, delay: 300, event: "mouseout"},
        position: {my: 'top center', at: 'bottom center', viewport: $(window)},
        content: {
          text: "<div style='display:inline-block;'>" +
          "<button id='" + this.chartId + "-pdf' style=\"width:50px\">PDF</button>" +
          "</div>" +
          "<br>" +
          "<div style='display:inline-block;'>" +
          "<button id='" + this.chartId + "-svg' style=\"width:50px\">SVG</button>" +
          "</div>" +
          "<br>" +
          "<div style='display:inline-block;'>" +
          "<button id='" + this.chartId + "-tsv' style=\"width:50px\">TXT</button>" +
          "</div>"
        }, events: {
          show: function () {
            $('#' + chartId + '-download-icon-wrapper').qtip('api').hide();
          },
          render: function (event, api) {
            $("#" + chartId + "-pdf", api.elements.tooltip).click(function () {
              console.log('download pdf')
            });
            $("#" + chartId + "-svg", api.elements.tooltip).click(function () {
              console.log('download svg')
            });
            $("#" + chartId + "-tsv").click(function () {
              console.log('download tsv')
            });
          }
        }
      });
    }
  });
})(window.Vue, window.iViz,
  window.$ || window.jQuery);
