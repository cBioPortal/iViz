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
    template: ' <chart-group :redrawgroups.sync="redrawgroups" :id="group.id" :type="group.type" :mappedpatients="patientsync"' +
    ' :mappedsamples="samplesync" :attributes.sync="group.attributes"' +
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
        completeSamplesList: [],
        selectedPatientsByFilters : [],
        selectedSamplesByFilters : [],
        initialized : false
      }
    }, watch: {
      'groups': function(){
        if(!this.initialized){
          this.initialized = true;
          this.selectedPatientsByFilters = _.keys(iViz.getCasesMap('patient')).sort();
          this.selectedSamplesByFilters = _.keys(iViz.getCasesMap('sample')).sort();
          this.completePatientsList = _.keys(iViz.getCasesMap('patient')).sort();
          this.completeSamplesList = _.keys(iViz.getCasesMap('sample')).sort();
        }
      },
      'messages': function(ChartsIds) {
        if(ChartsIds.length>0){
          _.each(this.groups, function(group) {
            dc.renderAll(group.id);
          });
          this.updateGrid(ChartsIds);
          this.messages.length=0;
        }
      }
    }, methods: {
      sortByNumber: function(a, b){
        var aName = Number(a.element.attributes['data-number'].nodeValue);
        var bName = Number(b.element.attributes['data-number'].nodeValue);
        return ((aName < bName) ? 1 : ((aName > bName) ? -1 : 0));
      },
      updateGrid: function(ChartsIds) {
        var self_ = this;
        if (this.grid_ !== '') {
          _.each(ChartsIds,function(chartId){
            self_.grid_.addItems(  $('#'+chartId) )
          });
          self_.grid_.layout();
        }else{
          self_.grid_ = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: 190,
            rowHeight: 170,
            gutter: 5,
            initLayout: false
          });
          self_.grid_.items.sort(this.sortByNumber);
        }
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
      'clear-all-groups':function(){
        this.selectedPatientsByFilters = [];
        this.selectedSamplesByFilters = [];
        this.$broadcast('clear-group');
      },
      'update-grid': function() {
          this.grid_.layout();
      },'remove-grid-item': function(item){
        this.grid_.remove(item);
        this.grid_.layout();
      },
      'data-loaded': function(msg) {
        // TODO:check for all charts loaded
        this.messages.push(msg);
      },
      'update-all-filters':function(updateType_){
        var _allSelectedPatientIdsByFilters = [];
        var _allSelectedSampleIdsByFilters = [];
        var self_ = this;
        var _hasFilters = false;

        if (self_.customfilter.patientIds.length > 0) {
          _hasFilters = true;
          _allSelectedPatientIdsByFilters = self_.customfilter.patientIds;
        }
        if (self_.customfilter.sampleIds.length > 0) {
          _hasFilters = true;
          _allSelectedSampleIdsByFilters = self_.customfilter.sampleIds;
        }

        _.each(self_.groups, function (group) {
          _.each(group.attributes, function (attributes) {
            if (attributes.show) {
              if (attributes.filter.length > 0) {
                _hasFilters = true;
              }
            }
          });

          var _groupFilteredCases = iViz.getGroupFilteredCases(group.id);
          if (_groupFilteredCases !== undefined && _groupFilteredCases.length > 0) {
            if (updateType_ === group.type) {
              if (updateType_ === 'patient') {
                if (_groupFilteredCases.length !== self_.completePatientsList.length)
                  if (_allSelectedPatientIdsByFilters.length === 0) {
                    _allSelectedPatientIdsByFilters = _groupFilteredCases;
                  } else {
                    _allSelectedPatientIdsByFilters = iViz.util.intersection(_allSelectedPatientIdsByFilters, _groupFilteredCases);
                  }
              } else {
                if (_groupFilteredCases.length !== self_.completeSamplesList.length)
                  if (_allSelectedSampleIdsByFilters.length === 0) {
                    _allSelectedSampleIdsByFilters = _groupFilteredCases;
                  } else {
                    _allSelectedSampleIdsByFilters = iViz.util.intersection(_allSelectedSampleIdsByFilters, _groupFilteredCases);
                  }
              }
            }
          }
        });
        self_.hasfilters = _hasFilters;

        var _resultSelectedSamples = [];
        var _resultSelectedPatients = [];
        if (updateType_ === 'patient') {
          self_.selectedPatientsByFilters = _allSelectedPatientIdsByFilters.sort();
          var _selectedSamplesByFiltersOnly = self_.selectedSamplesByFilters;
          if(_selectedSamplesByFiltersOnly.length ===0){
            _selectedSamplesByFiltersOnly = self_.completeSamplesList;
          }
          if (_allSelectedPatientIdsByFilters.length === 0) {
            self_.patientsync = [];
            self_.samplesync = [];
            _resultSelectedSamples = iViz.util.intersection(self_.completeSamplesList,
              _selectedSamplesByFiltersOnly);
            _resultSelectedPatients = iViz.util.idMapping(iViz.getCasesMap('sample'), _resultSelectedSamples);
          } else {
            var _mappedSelectedSamples = iViz.util.idMapping(iViz.getCasesMap('patient'), _allSelectedPatientIdsByFilters);
            _mappedSelectedSamples.sort();
            _resultSelectedSamples = iViz.util.intersection(_mappedSelectedSamples,
              _selectedSamplesByFiltersOnly);
            _resultSelectedPatients = iViz.util.idMapping(iViz.getCasesMap('sample'), _resultSelectedSamples);
            self_.patientsync = _allSelectedPatientIdsByFilters;
            self_.samplesync = _mappedSelectedSamples;

          }
        } else {
          self_.selectedSamplesByFilters = _allSelectedSampleIdsByFilters.sort();
          var _selectedPatientsByFiltersOnly = self_.selectedPatientsByFilters;
          if(_selectedPatientsByFiltersOnly.length ===0){
            _selectedPatientsByFiltersOnly = self_.completePatientsList;
          }
          if (_allSelectedSampleIdsByFilters.length === 0) {
            self_.patientsync = [];
            self_.samplesync = [];
            _resultSelectedPatients = iViz.util.intersection(self_.completePatientsList,
              _selectedPatientsByFiltersOnly);
            _resultSelectedSamples = iViz.util.idMapping(iViz.getCasesMap('patient'), _resultSelectedPatients);
          } else {
            var _mappedSelectedPatients = iViz.util.idMapping(iViz.getCasesMap('sample'), _allSelectedSampleIdsByFilters);
            _mappedSelectedPatients.sort();
            _resultSelectedPatients = iViz.util.intersection(_mappedSelectedPatients,
              _selectedPatientsByFiltersOnly);
            _resultSelectedSamples = iViz.util.idMapping(iViz.getCasesMap('patient'), _resultSelectedPatients);
            self_.patientsync = _mappedSelectedPatients;
            self_.samplesync = _allSelectedSampleIdsByFilters;
          }
        }

        self_.$nextTick(function () {
          self_.selectedsamples = _resultSelectedSamples;
          self_.selectedpatients = _resultSelectedPatients;
        });
       
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
