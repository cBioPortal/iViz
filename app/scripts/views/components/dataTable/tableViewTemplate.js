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
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
  Vue.component('tableView', {
    template: '<div id={{chartDivId}} class="grid-item grid-item-h-2 grid-item-w-2" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" :display-name="displayName" ' +
    ':has-chart-title="true" :groupid="groupid" :reset-btn-id="resetBtnId" :chart="chartInst" ' +
    ':chart-id="chartId" :attributes="attributes" :filters.sync="filters" :filters.sync="filters"></chart-operations>' +
    '<div class="dc-chart dc-table-plot" :class="{hideLoading: showLoad}" align="center" style="float:none !important;" id={{chartId}} >' +

    '</div>',
    props: [
      'data', 'ndx', 'attributes', 'options', 'filters', 'groupid','indices'
    ],
    data: function() {
      return {
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        showOperations: false,
        chartInst: {},
        showLoad:true,
        showLoading:'show-loading',
        hideLoading:'hide-loading',
        selectedRows:[]
      };
    },
    watch: {
      'filters': function(newVal) {
        if(newVal.length === 0 ){
          this.selectedRows=[];
        }
        this.updateFilters();
      }
    },
    events: {
      'gene-list-updated':function(genes){
        genes = $.extend(true,[],genes);
        this.chartInst.updateGenes(genes);
      },
      'selected-sample-update': function(_selectedSamples) {
        this.chartInst.update(_selectedSamples, this.selectedRows);
        this.setDisplayTitle(this.chartInst.getCases().length);
      },
      'closeChart':function(){
        if(this.filters.length>0){
          this.filters = [];
          this.updateFilters();
        }
        this.$dispatch('close',true);
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      },
      mouseLeave: function() {
        this.showOperations = false;
      },
      submitClick:function(_selectedRowData){
        var selectedSamplesUnion = [];
        var selectedRowsUids = _.pluck(_selectedRowData,'uniqueId');
        this.selectedRows = _.union(this.selectedRows,selectedRowsUids);
        $.each(_selectedRowData, function(index,item){
          var casesIds = item.caseIds.split(',');
          selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
        });
        if(this.filters.length === 0 ){
          this.filters = selectedSamplesUnion;
        }else{
          this.filters = _.intersection(this.filters,selectedSamplesUnion);
        }
        this.chartInst.clearSelectedRowData();
      },
      addGeneClick: function(clickedRowData) {
        this.$dispatch('manage-gene',clickedRowData.gene);
      },
      setDisplayTitle: function(numOfCases) {
        this.displayName = this.attributes.display_name+'('+numOfCases+' profiled samples)';
      },
      updateFilters: function(){
        this.$dispatch('update-samples-from-table');
      }

    },
    ready: function() {
      var _self = this;
      var callbacks = {};
      var _selectedSampleList = this.$parent.$parent.$parent.selectedsamples;
      var _selectedGenes = this.$parent.$parent.$parent.$parent.selectedgenes;

      callbacks.addGeneClick = this.addGeneClick;
      callbacks.submitClick = this.submitClick;
      _self.chartInst = new iViz.view.component.tableView();

      if(_selectedSampleList.length === 0){
        _selectedSampleList = this.attributes['allCases'];
      }
      _self.chartInst.init(this.attributes, _selectedSampleList, _selectedGenes, this.indices, this.data, this.chartId, callbacks);
      this.setDisplayTitle(this.chartInst.getCases().length);
      this.$dispatch('data-loaded', true);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);