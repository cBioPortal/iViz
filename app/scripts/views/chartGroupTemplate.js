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
  var settings_ = {
    pieChart: {
      width: 150,
      height: 150,
      innerRadius: 15
    },
    barChart: {
      width: 400,
      height: 180
    },
    transitionDuration: iViz.opts.dc.transitionDuration
  };
  Vue.component('chartGroup', {
    template: ' <div is="individual-chart"' +
    ' :ndx="ndx" :groupid="groupid"' +
    ' :attributes.sync="attribute" v-for="attribute in attributes"></div>',
    props: [
      'attributes', 'type', 'mappedsamples', 'id',
      'mappedpatients', 'groupid', 'redrawgroups', 'hasfilters','customCaseSelect'
    ], created: function() {
      //TODO: update this.data
      var data_ = iViz.getAttrData(this.type);
      var ndx_ = crossfilter(data_);
      var invisibleBridgeChart_ = iViz.bridgeChart.init(ndx_, settings_,
        this.type, this.id);
      this.groupid = this.id;
      this.ndx = ndx_;
      this.chartInvisible = invisibleBridgeChart_;
    }, destroyed: function() {
      this.chartInvisible.resetSvg();
      var id_ = this.type + '_' + this.id + '_id_chart_div';
      $('#' + id_).remove();
      dc.chartRegistry.clear(this.groupid);
    },
    data: function() {
      return {
        syncPatient: true,
        syncSample: true
      }
    },
    watch: {
      'mappedsamples': function(val) {
        if (this.type === 'sample') {
          if (this.syncSample) {
            this.updateInvisibleChart(val);
          }else {
            this.syncSample = true;
            /*if(!this.hasfilters){
              this.updateInvisibleChart(val);
            }*/
          }
        }
       // this.redrawgroups.push(true);
      },
      'mappedpatients': function(val) {
        if (this.type === 'patient') {
          if (this.syncPatient) {
            this.updateInvisibleChart(val);
          } else {
            this.syncPatient = true;
            /*if(!this.hasfilters){
              this.updateInvisibleChart(val);
            }*/
          }
        }
     //   this.redrawgroups.push(true);
      }
    },
    events: {
      'update-filters': function() {
        this.syncPatient = false;
        this.syncSample = false;
        var _hasfilters = false;
        var _filters = [], _caseSelect = [];

        if(this.customCaseSelect.length>0) {
          _hasfilters = true;
          _caseSelect = this.customCaseSelect;
        }
        $.each(this.attributes, function (index, attributes) {
          if (attributes.show) {
            if (attributes.filter.length > 0) {
              _hasfilters = true;
              if (attributes.view_type === 'scatter_plot') {
                if(_caseSelect.length!==0){
                  _caseSelect = _.intersection(_caseSelect,attributes.filter);
                }else{
                  _caseSelect = attributes.filter;
                }
              } else if (attributes.view_type === 'table') {
                if(_caseSelect.length!==0){
                  _caseSelect = _.intersection(_caseSelect,attributes.filter);
                }else{
                  _caseSelect = attributes.filter;
                }
              } else {
                _filters[attributes.attr_id] = attributes.filter;
              }
            }
          }
        });
        this.hasfilters = _hasfilters;
        var filteredCaseData_ = iViz.getAttrData(this.type);
        if(_caseSelect.length !== 0){
          filteredCaseData_ = iViz.sync.selectByCases(this.type, filteredCaseData_, _caseSelect)
        }
        
        filteredCaseData_ = iViz.sync.selectByFilters(_filters, filteredCaseData_);
        var attrId = this.type==='patient'?'patient_id':'sample_id';
        iViz.setGroupFilteredCases(this.id, _.pluck(filteredCaseData_,attrId).sort());
        this.$dispatch('update-all-filters', this.type);
      },
      'update-cases': function(_caseIds) {
        this.syncPatient = false;
        this.syncSample = false;
        if(_caseIds.length>0){
          this.hasfilters = true;
        }else{
          this.hasfilters = false;
        }
        var _selectedCases = iViz.getGroupFilteredCases(this.id);
        if(_selectedCases !==undefined && _selectedCases.length>0){
          _selectedCases = iViz.util.intersection(_selectedCases,_caseIds);
        }else{
          _selectedCases = _caseIds;
        }
        if(_selectedCases.length===0){
          
        }
        
        iViz.setGroupFilteredCases(this.id, _selectedCases);
        this.chartInvisible.replaceFilter([_selectedCases]);
        dc.redrawAll(this.id)
        this.$dispatch('update-all-filters', this.type);
      },
      'update-samples-from-table':function() {
        this.$dispatch('update-all-filters', this.type);
      }
    },
    methods: {
      updateInvisibleChart: function(val) {
        this.chartInvisible.replaceFilter([val]);
        this.redrawgroups.push(this.id);
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
