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
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {

  Vue.component('pieChart', {
    template: '<div id={{chartDivId}} class="grid-item grid-item-h-1 grid-item-w-1" data-number="6" ' +
              '@mouseenter="mouseEnter($event)" @mouseleave="mouseLeave($event)">' +
              '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName" :show-table-icon.sync="showTableIcon" ' +
              ' :show-pie-icon.sync="showPieIcon" :chart-id="chartId" :show-operations="showOperations" :groupid="attributes.group_id" ' +
              ':reset-btn-id="resetBtnId" :chart-ctrl="piechart" :chart="chartInst" :filters.sync="attributes.filter" :attributes="attributes"></chart-operations>' +
              '<div class="dc-chart dc-pie-chart" :class="{view: showPieIcon}" align="center" style="float:none' +
              ' !important;" id={{chartId}} ></div>' +
              '<div id={{chartTableId}} :class="{view: showTableIcon}"></div>'+
              '</div>',
    props: [
      'ndx', 'attributes'
    ],
    data: function() {
      return {
        v: {},
        chartDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, "") + '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, "") + '-reset',
        chartId: 'chart-' + this.attributes.attr_id.replace(/\(|\)| /g, ""),
        chartTableId : 'table-'+ this.attributes.attr_id.replace(/\(|\)| /g, ""),
        displayName: this.attributes.display_name,
        chartInst: '',
        component: '',
        showOperations: false,
        cluster: '',
        piechart:'',
        hasChartTitle:true,
        showTableIcon:true,
        showPieIcon:false,
        filtersUpdated:false,
        addingChart:false
      }
    },
    watch: {
      'attributes.filter': function(newVal, oldVal) {
        if(!this.filtersUpdated) {
          this.filtersUpdated = true;
          if (newVal.length === 0) {
            this.chartInst.filterAll();
          }else{
            if (newVal.length === oldVal.length) {
                this.chartInst.filter(newVal);
            }
            else{
              var temp = newVal.length > 1? [newVal]: newVal;
              this.chartInst.replaceFilter(temp);
            }
          }
          dc.redrawAll(this.attributes.group_id);
          this.$dispatch('update-filters');
        }else{
          this.filtersUpdated = false;
        }
      }
    },
    events: {
      'toTableView': function() {
        this.piechart.changeView(this, !this.showTableIcon);
      },
      'closeChart':function(){
        $('#' +this.chartDivId).qtip('destroy');
        dc.deregisterChart(this.chartInst, this.attributes.group_id);
        this.chartInst.dimension().dispose();
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
      mouseEnter: function(event) {
        this.showOperations = true;
        this.$emit('initMainDivQtip');
      }, mouseLeave: function(event) {
        if(event.relatedTarget===null){
          this.showOperations = false;
        }
        if((event.relatedTarget!==null)&&(event.relatedTarget.nodeName!=='CANVAS')){
          this.showOperations = false;
        }
      },initMainDivQtip : function(){
        this.piechart.initMainDivQtip();
      }
    },
    ready: function() {
      
      var _self = this;

      // check if there's data for this attribute  
      //var _hasData = false;
      var _attrId = _self.attributes.attr_id;
      var _cluster = _self.ndx.dimension(function(d) {
        if (typeof d[_attrId] === 'undefined') d[_attrId] = 'NA';
        return d[_attrId];
      });
      
        _self.$once('initMainDivQtip', _self.initMainDivQtip);
        var opts = {
          chartId : _self.chartId,
          chartDivId : _self.chartDivId,
          groupid : _self.attributes.group_id,
          chartTableId : _self.chartTableId,
          transitionDuration : iViz.opts.dc.transitionDuration,
          width: window.style['piechart-svg-width'] | 130,
          height: window.style['piechart-svg-height'] | 130
        };
        _self.piechart = new iViz.view.component.PieChart(_self.ndx, _self.attributes, opts, _cluster);
        _self.piechart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);
        _self.chartInst = _self.piechart.getChart();
        _self.chartInst.on('filtered', function(_chartInst, _filter) {
          if(!_self.addingChart){
            if(!_self.filtersUpdated) {
              _self.filtersUpdated = true;
              var tempFilters_ = $.extend(true, [], _self.attributes.filter);
              tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
                _self.attributes.view_type);
              _self.attributes.filter = tempFilters_;
              _self.$dispatch('update-filters');
            }else{
              _self.filtersUpdated = false;
            }
          }
          // Trigger pie chart filtered event.
          _self.piechart.filtered();
        });
        _self.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
