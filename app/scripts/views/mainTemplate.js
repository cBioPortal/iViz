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
    ' :mappedsamples.sync="samplesync" :attributes.sync="group.attributes" :indices="group.indices"' +
    ' v-for="group in groups"></chart-group> ',
    props: [
      'groups', 'selectedsamples', 'selectedpatients', 'samplemap', 'patientmap', 'hasfilters', 'redrawgroups', 'customfilter'
    ], data: function() {
      return {
        messages: [],
        patientsync: [],
        samplesync: [],
        grid_: '',
        completePatientsList: [],
        completeSamplesList:[]
      }
    }, watch: {
      'patientmap':function(val){
        this.completePatientsList =  _.keys(val);
      },
      'samplemap' : function(val){
        this.completeSamplesList =  _.keys(val);
      },
      'messages': function(val) {
        _.each(this.groups, function(group) {
          dc.renderAll(group.id);
        });
        this.updateGrid();
      }
    }, methods: {
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
        _patientSelect.push(_selectedPatientsByFiltersOnly);
        _sampleSelect.push(_selectedSamplesByFiltersOnly);
        var _filterMap = {};
        $.each(this.groups, function(key,group) {
          var filters_ = [], _scatterPlotSel = [], _tableSel = [];
          $.each(group.attributes, function(index, attributes) {
            if(attributes.show){
              if (attributes.filter.length > 0) {
                _hasFilters = true;
                if (attributes.view_type === 'scatter_plot') {
                  _sampleSelect.push(attributes.filter);
                } else if (attributes.view_type === 'table') {
                  _sampleSelect.push(attributes.filter);
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
              _filterMap[group.type].data = iViz.getAttrData(group.type);
              _filterMap[group.type].filters = filters_;
            }
          }
        });

        $.each(_filterMap,function(key,val){
          var  _selectedCases = iViz.sync.selectByFilters(val.filters, val.data, key);
          if(key === 'sample'){
            _sampleSelect.push(_selectedCases);
          }else if(key === 'patient'){
            _patientSelect.push(_selectedCases)
          }
        });
        this.hasfilters = _hasFilters;
        if(this.customfilter.patientIds.length>0||this.customfilter.sampleIds.length>0) {
          this.hasfilters = true;
          _patientSelect.push(this.customfilter.patientIds);
          _sampleSelect.push(this.customfilter.sampleIds);
        }
        
        _selectedSamplesByFiltersOnly = _.intersection.apply(_, _sampleSelect);
        _selectedPatientsByFiltersOnly = _.intersection.apply(_, _patientSelect);
        var mappedSelectedSamples = iViz.util.idMapping(this.patientmap,
          _selectedPatientsByFiltersOnly);
        var resultSelectedSamples = _.intersection(mappedSelectedSamples,
          _selectedSamplesByFiltersOnly);
        var resultSelectedPatients = iViz.util.idMapping(this.samplemap,
          resultSelectedSamples);
        if (updateType === 'patient') {
          this.patientsync = resultSelectedPatients;
          this.samplesync = iViz.util.idMapping(this.patientmap,
            _selectedPatientsByFiltersOnly);
        } else {
          this.patientsync = iViz.util.idMapping(this.samplemap,
            _selectedSamplesByFiltersOnly);
          this.samplesync = resultSelectedSamples;
        }
        this.selectedsamples = resultSelectedSamples;
        this.selectedpatients = resultSelectedPatients;
      },
      'update-custom-filters': function() {
        if (this.customfilter.type === 'patient') {
          this.patientsync = this.customfilter.patientIds;
          this.samplesync = iViz.util.idMapping(this.patientmap,
            this.patientsync);
          this.customfilter.sampleIds = this.samplesync;
        } else {
          this.patientsync = iViz.util.idMapping(this.samplemap,
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
