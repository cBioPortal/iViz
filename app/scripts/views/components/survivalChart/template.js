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
 * @author Yichao Sun on 5/18/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
  Vue.component('survival', {
    template: '<div id={{chartDivId}} class="grid-item grid-item-h-2 grid-item-w-2" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
              '<chart-operations :show-operations="showOperations" :has-chart-title="hasChartTitle" :display-name="displayName" :groupid="groupid" :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" :chart="chartInst" :chart-id="chartId" :attributes="attributes"></chart-operations>' +
              '<div :class="{\'start-loading\': showLoad}" class="dc-chart dc-scatter-plot" align="center" style="float:none !important;" id={{chartId}} ></div>' +
              '<div id="chart-loader"  :class="{\'show-loading\': showLoad}" class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    '<img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes', 'options', 'filters', 'groupid'
    ],
    created: function() {
    },
    data: function() {
      return {
        chartDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        chartInst: '',
        showOperations: false,
        fromWatch: false,
        fromFilter: false,
        hasChartTitle:true,
        showLoad:true
      };
    },
    events: {
      'show-loader':function(){
        this.showLoad = true;
      },
      'survival-update': function(_selectedPatients) {
        this.chartInst.update(_selectedPatients, this.chartId, this.attributes.attr_id);
        this.showLoad = false;
      },
      'closeChart':function(){
        this.$dispatch('close');
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      }
    },
    ready: function() {
      var _self = this;
      _self.showLoad = true;
      var _opts = {
        width: window.style.vars.survivalWidth,
        height: window.style.vars.survivalHeight,
        chartId: this.chartId,
        attrId: this.attributes.attr_id,
        title: this.attributes.display_name,
        type: this.attributes.group_type
      };
      var _selectedPatientList = this.$parent.$parent.$parent.selectedpatients;
      _self.chartInst = new iViz.view.component.Survival();
      _self.chartInst.setDownloadDataTypes(['pdf', 'svg']);

      var data = iViz.getAttrData(this.attributes.group_type);
      _self.chartInst.init(data, _opts, _selectedPatientList);
      _self.showLoad = false;
      this.$dispatch('data-loaded', true);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
