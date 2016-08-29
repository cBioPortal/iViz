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
 * @author Yichao Sun on 5/11/16.
 */
'use strict';
(function(Vue, dc, iViz) {
  Vue.component('scatterPlot', {
    template: '<div id={{chartDivId}} class="grid-item grid-item-h-2 grid-item-w-2" data-number="8" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
      '<chart-operations :show-operations="showOperations"' +
    ' :display-name="displayName" :has-chart-title="true" :groupid="attributes.group_id"' +
    ' :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" :chart="chartInst" :chart-id="chartId"' +
    ' :attributes="attributes" :filters.sync="attributes.filter"></chart-operations>' +
    ' <div :class="{\'start-loading\': showLoad}" class="dc-chart dc-scatter-plot" align="center" style="float:none !important;" id={{chartId}} ></div>' +
    ' <div id={{invisibleChartDivId}} style="display: none;"></div>' +
    ' <div id="chart-loader"  :class="{\'show-loading\': showLoad}" class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    ' <img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes', 'options'
    ],
    data: function() {
      return {
        chartDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, "") + '-div',
        invisibleChartDivId:'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, "") + 'invisible-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, "") + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)| /g, ""),
        displayName: this.attributes.display_name,
        showOperations: false,
        selectedSamples: [],
        chartInst: {},
        hasFilters:false,
        showLoad:true,
        invisibleChart:{},
        addingChart:false
      };
    },
    watch: {
      'attributes.filter': function(newVal,oldVal) {
        if(newVal.length === 0 ){
          this.invisibleChart.filterAll();
          dc.redrawAll(this.attributes.group_id);
        }
        this.updateFilters();
      }
    },
    events: {
      'show-loader':function(){
        this.showLoad = true;
      },
      'update-special-charts': function() {
        var attrId = this.attributes.group_type==='patient'?'patient_id':'sample_id';
        var _selectedCases = _.pluck(this.invisibleChart.dimension().top(Infinity),attrId);
        var data = iViz.getGroupNdx(this.attributes.group_id);
        if (_selectedCases.length !== data.length) {
          this.selectedSamples=_selectedCases;
          this.chartInst.update(_selectedCases);
        } else {
          this.selectedSamples=_selectedCases;
          this.chartInst.update([]);
        }
        this.showLoad = false;
      },
      'closeChart':function(){
        if(this.attributes.filter.length>0){
          this.attributes.filter = [];
          this.updateFilters();
        }
        dc.deregisterChart(this.invisibleChart, this.attributes.group_id);
        this.invisibleChart.dimension().dispose();
        this.$dispatch('close');
      },
      'adding-chart':function(groupId,val){
        if(this.attributes.group_id === groupId){
          if(this.attributes.filter.length>0){
            if(val){
              this.addingChart=val;
              this.chartInst.filter(null);
            }else{
              this.chartInst.filter([this.attributes.filter]);
              this.addingChart=val;
            }
          }
        }
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      },
      updateFilters: function(){
        this.$dispatch('update-filters');
      }
    },
    ready: function() {
      
      var _self = this;
      _self.showLoad = true;
      var _opts = {
        chartId: this.chartId,
        chartDivId: this.chartDivId,
        title: this.attributes.display_name
      };
      var attrId = this.attributes.group_type==='patient'?'patient_id':'sample_id';
      var invisibleDimension  = this.ndx.dimension(function (d) { return d[attrId]; });
      this.invisibleChart = new iViz.invisibleChart(invisibleDimension,this.invisibleChartDivId, this.attributes.group_id);
      var data = iViz.getGroupNdx(this.attributes.group_id);
      _self.chartInst = new iViz.view.component.ScatterPlot();
      _self.chartInst.init(data, _opts);
      _self.chartInst.setDownloadDataTypes(['pdf', 'svg']);
      document.getElementById(this.chartId).on('plotly_selected', function(_eventData) {
        if (typeof _eventData !== 'undefined') {
          var _selectedData = [];
          // create hash map for (overall) data with cna_fraction + mutation count as key, dataObj as value (performance concern)
          var _CnaFracMutCntMap = {};
          _.each(data, function(_dataObj) {
            var _key = _dataObj['cna_fraction'] + "||" + _dataObj['mutation_count'];
            _CnaFracMutCntMap[_key] = _dataObj;
          });
          _.each(_eventData.points, function(_pointObj) {
            if (_pointObj.x) {
              _selectedData.push(_CnaFracMutCntMap[_pointObj.x + "||" + _pointObj.y]);
            }
          });
          var _selectedCases =  _.pluck(_selectedData, "sample_id").sort();
          _self.selectedSamples =_selectedCases;
          _self.attributes.filter =_selectedCases;

          _self.invisibleChart.replaceFilter([_self.attributes.filter]);
          dc.redrawAll(_self.attributes.group_id);
        }
      });
      _self.showLoad = false;
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
