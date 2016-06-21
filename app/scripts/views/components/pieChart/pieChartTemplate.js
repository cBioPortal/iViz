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
    template: '<div id={{charDivId}} class="grid-item grid-item-h-1 grid-item-w-1" class="study-view-dc-chart study-view-pie-main" ' +
              '@mouseenter="mouseEnter($event)" @mouseleave="mouseLeave($event)">' +
              '<chart-operations :has-chart-title="hasChartTitle" :display-name="displayName" :show-table-icon.sync="showTableIcon" ' +
              ' :show-pie-icon.sync="showPieIcon" :chart-id="chartId" :show-operations="showOperations" :groupid="groupid" ' +
              ':reset-btn-id="resetBtnId" :chart="chartInst" :attributes="attributes"></chart-operations>' +
              '<div class="dc-chart dc-pie-chart" :class="{view: showPieIcon}" align="center" style="float:none' +
              ' !important;" id={{chartId}} ></div>' +
              '<div id={{chartTableId}} :class="{view: showTableIcon}"></div>'+
              '</div>',
    props: [
      'ndx', 'attributes', 'filters', 'groupid','data','options'
    ],
    data: function() {
      return {
        v: {},
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") + '-reset',
        chartId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        chartTableId : 'table-'+ this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        chartInst: '',
        showOperations: false,
        cluster: '',
        _piechart:'',
        hasChartTitle:true,
        showTableIcon:true,
        showPieIcon:false,
        filtersUpdated:false
      }
    },
    watch: {
      'filters': function(newVal, oldVal) {
        if(!this.filtersUpdated) {
          this.filtersUpdated = true;
          if (newVal.length === oldVal.length) {
            if (newVal.length == 0) {
              this.chartInst.filterAll();
            } else {
              var newFilters = $.extend(true, [], newVal);
              var exisitngFilters = $.extend(true, [],
                this.chartInst.filters());
              var temp = _.difference(exisitngFilters, newFilters);
              this.chartInst.filter(temp);
            }
          }else{
            this.chartInst.filterAll();
          }
          this.$dispatch('update-filters');
        }else{
          this.filtersUpdated = false;
        }
      }
    },
    events: {
      'toTableView': function() {
        this._piechart.changeView(this,!this.showTableIcon);
      },
      'closeChart':function(){
        $('#' +this.charDivId).qtip('destroy');
        this.$dispatch('close');
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
        this._piechart.initMainDivQtip();
      }
    },
    ready: function() {
      this.$once('initMainDivQtip',this.initMainDivQtip);
      var opts = {
        chartId : this.chartId,
        charDivId : this.charDivId,
        groupid : this.groupid,
        chartTableId : this.chartTableId,
        transitionDuration : iViz.opts.dc.transitionDuration,
        width: window.style['piechart-svg-width'] | 130,
        height: window.style['piechart-svg-height'] | 130
      };
      this._piechart = new iViz.view.component.pieChart();
      this.chartInst = this._piechart.init(this.ndx, this.attributes, opts);
      var self_ = this;
      this.chartInst.on('filtered', function(_chartInst, _filter) {
        if(!self_.filtersUpdated) {
          self_.filtersUpdated = true;
          var tempFilters_ = $.extend(true, [], self_.filters);
          tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
            self_.attributes.view_type);
          self_.filters = tempFilters_;
          self_.$dispatch('update-filters');
        }else{
          self_.filtersUpdated = false;
        }
      });
      this.$dispatch('data-loaded', true);
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
