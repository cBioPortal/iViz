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
 * Created by Karthik Kalletla on 4/13/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
  Vue.component('mainTemplate', {
    template: ' <chart-group :hasfilters="hasfilters"  :redrawgroups.sync="redrawgroups"   :id="group.id"   :type.sync="group.type" :mappedpatients.sync="patientsync"' +
    ' :mappedsamples.sync="samplesync" :attributes.sync="group.attributes"' +
    ' v-for="group in groups"></chart-group> ',
    props: [
      'groups', 'selectedsamples', 'selectedpatients', 'hasfilters', 'redrawgroups', 'customfilter'
    ], data: function() {
      return {
        messages: [],
        patientsync: [],
        samplesync: [],
        grid_: '',
        completePatientsList: [],
        completeSamplesList: []
      }
    }, watch: {
      'groups': function(){
        this.completePatientsList = _.keys(iViz.getCasesMap('patient'));
          this.completeSamplesList = _.keys(iViz.getCasesMap('sample'));
      },
      /*'patientmap':function(val){
        this.completePatientsList =  _.keys(val);
      },
      'samplemap' : function(val){
        this.completeSamplesList =  _.keys(val);
      },*/
      'messages': function(val) {
        _.each(this.groups, function(group) {
          dc.renderAll(group.id);
        });
        this.updateGrid();
      }
    }, methods: {
      getFilteredData:function(type,data,caseIds){
        var caseIndices = iViz.getCaseIndices(type);
        var resultData_ = [];
        $.each(caseIds, function(key,val){
          resultData_.push(data[caseIndices[val]]);
        });
        return resultData_;
      },
      updateGrid: function() {
        if (this.grid_ !== '') {
          this.grid_.destroy();
        }
        this.grid_ = new Packery(document.querySelector('.grid'), {
          itemSelector: '.grid-item',
          columnWidth: 190,
          rowHeight: 170,
          gutter: 5
        });
        var self_ = this;
        _.each(self_.grid_.getItemElements(), function(_gridItem) {
          var _draggie = new Draggabilly(_gridItem, {
            handle: '.dc-chart-drag'
          });
          self_.grid_.bindDraggabillyEvents(_draggie);
        });
        self_.grid_.layout();
      }
    },
    events: {
      'update-grid': function(reload) {
        if(reload){
          this.updateGrid()
        }else{
          this.grid_.layout();
        }
      },
      'data-loaded': function(msg) {
        // TODO:check for all charts loaded
        this.messages.push(msg);
      },
      'update-all-filters': function(updateType) {
        var _selectedPatientsByFiltersOnly = this.completePatientsList;
        var _selectedSamplesByFiltersOnly = this.completeSamplesList;
        var _hasFilters = false;
        var _patientSelect = [];
        var _sampleSelect = [];
        var _filterMap = {};
        $.each(this.groups, function(key,group) {
          var filters_ = [], _scatterPlotSel = [], _tableSel = [];
          $.each(group.attributes, function(index, attributes) {
            if(attributes.show){
              if (attributes.filter.length > 0) {
                _hasFilters = true;
                if (attributes.view_type === 'scatter_plot') {
                  _sampleSelect.concat(attributes.filter);
                } else if (attributes.view_type === 'table') {
                  _sampleSelect.concat(attributes.filter);
                } else{
                  filters_[attributes.attr_id] = attributes.filter;
                }
              }
            }
          });
          if(Object.keys(filters_).length>0) {
            if (_filterMap[group.type] !== undefined) {
              var tempFilters = _filterMap[group.type].filters;
              tempFilters.push(filters_);
              _filterMap[group.type].filters = tempFilters;
            } else {
              _filterMap[group.type] = {};
              _filterMap[group.type].filters = filters_;
            }
          }
        });

        if(this.customfilter.patientIds.length>0||this.customfilter.sampleIds.length>0) {
          this.hasfilters = true;
          _patientSelect.concat(this.customfilter.patientIds);
          _sampleSelect.concat(this.customfilter.sampleIds);
        }
        var filteredSampleData = iViz.getAttrData('sample');
        var filteredPatientData = iViz.getAttrData('patient');
        
        if(_sampleSelect.length !== 0){
          filteredSampleData = this.getFilteredData('sample',filteredSampleData,_sampleSelect)
        }

        if(_patientSelect.length !== 0){
          filteredPatientData = this.getFilteredData('patient',filteredSampleData,_patientSelect)
        }



        $.each(_filterMap,function(key,val){
          if(key === 'sample'){
            filteredSampleData = iViz.sync.selectByFilters(val.filters, filteredSampleData, key);
          }else if(key === 'patient'){
            filteredPatientData = iViz.sync.selectByFilters(val.filters, filteredPatientData, key);
          }
        });
        this.hasfilters = _hasFilters;
        
        _selectedSamplesByFiltersOnly = _.pluck(filteredSampleData, 'sample_id');
        _selectedPatientsByFiltersOnly = _.pluck(filteredPatientData, 'patient_id');
        var mappedSelectedSamples = iViz.util.idMapping(iViz.getCasesMap('patient'),
          _selectedPatientsByFiltersOnly);
        mappedSelectedSamples.sort();
        _selectedSamplesByFiltersOnly.sort();
        var resultSelectedSamples = iViz.util.intersection(mappedSelectedSamples,
          _selectedSamplesByFiltersOnly);
        var resultSelectedPatients = iViz.util.idMapping(iViz.getCasesMap('sample'),
          resultSelectedSamples);
        if (updateType === 'patient') {
          this.patientsync = resultSelectedPatients;
          this.samplesync = iViz.util.idMapping(iViz.getCasesMap('patient'),
            _selectedPatientsByFiltersOnly);
        } else {
          this.patientsync = iViz.util.idMapping(iViz.getCasesMap('sample'),
            _selectedSamplesByFiltersOnly);
          this.samplesync = resultSelectedSamples;
        }
        this.selectedsamples = resultSelectedSamples;
        this.selectedpatients = resultSelectedPatients;
      },
      'update-custom-filters': function() {
        if (this.customfilter.type === 'patient') {
          this.patientsync = this.customfilter.patientIds;
          this.samplesync = iViz.util.idMapping(iViz.getCasesMap('patient'),
            this.patientsync);
          this.customfilter.sampleIds = this.samplesync;
        } else {
          this.patientsync = iViz.util.idMapping(iViz.getCasesMap('sample'),
            this.customfilter.sampleIds);
          this.samplesync = this.customfilter.sampleIds;
          this.customfilter.patientIds = this.patientsync;
        }
        
        this.selectedsamples =  this.samplesync;
        this.selectedpatients = this.patientsync;
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
