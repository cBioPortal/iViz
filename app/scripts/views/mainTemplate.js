/**
 * Created by Karthik Kalletla on 4/13/16.
 */
'use strict';
(function(Vue, dc, iViz, Packery, Draggabilly, _, $) {
  Vue.component('mainTemplate', {
    template: '<chart-group :redrawgroups.sync="redrawgroups" :id="group.id" ' +
    ':type="group.type" ' +
    ':mappedcases="group.type==\'patient\'?patientsync:samplesync" ' +
    ' :attributes.sync="group.attributes"' +
    ' v-for="group in groups"></chart-group> ',
    props: [
      'groups', 'selectedsamples', 'selectedpatients', 'hasfilters',
      'redrawgroups', 'customfilter'
    ], data: function() {
      return {
        messages: [],
        patientsync: [],
        samplesync: [],
        grid_: '',
        completePatientsList: [],
        completeSamplesList: [],
        selectedPatientsByFilters: [],
        selectedSamplesByFilters: [],
        initialized: false
      };
    }, watch: {
      groups: function() {
        if (!this.initialized) {
          this.initialized = true;
          this.selectedPatientsByFilters =
            _.keys(iViz.getCasesMap('patient')).sort();
          this.selectedSamplesByFilters =
            _.keys(iViz.getCasesMap('sample')).sort();
          this.completePatientsList =
            _.keys(iViz.getCasesMap('patient')).sort();
          this.completeSamplesList =
            _.keys(iViz.getCasesMap('sample')).sort();
        }
      },
      messages: function(ChartsIds) {
        if (ChartsIds.length > 0) {
          _.each(this.groups, function(group) {
            dc.renderAll(group.id);
          });
          this.updateGrid(ChartsIds);
          this.messages.length = 0;
        }
      }
    }, methods: {
      sortByNumber: function(a, b) {
        var aName = Number(a.element.attributes['data-number'].nodeValue);
        var bName = Number(b.element.attributes['data-number'].nodeValue);
        return aName - bName;
      },
      updateGrid: function(ChartsIds) {
        var self_ = this;
        if (this.grid_ === '') {
          self_.grid_ = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: 190,
            rowHeight: 170,
            gutter: 5,
            initLayout: false
          });
          self_.grid_.items.sort(this.sortByNumber);
        } else {
          _.each(ChartsIds, function(chartId) {
            self_.grid_.addItems($('#' + chartId));
          });
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
      'clear-all-groups': function() {
        this.selectedPatientsByFilters = [];
        this.selectedSamplesByFilters = [];
        this.$broadcast('clear-group');
      },
      'update-grid': function() {
        this.grid_.layout();
      }, 'remove-grid-item': function(item) {
        this.grid_.remove(item);
        this.grid_.layout();
      },
      'data-loaded': function(msg) {
        // TODO:check for all charts loaded
        this.messages.push(msg);
      },
      /*
       * This method is to find out the selected cases and the cases
       * to be synced between groups.
       *
       * STEPS involved
       * 1. Check if there are any custom case filter.
       * If yes update filter case list.
       * 2. Loop thorough groups and do the following
       *   a. Check for filters in each attribute and set _hasFilters flag
       *   b. Capture all filters for that(input) particular
       *      type group(patient/sample)
       * 3. Check of empty selected and counter selected cases
       *    and update accordingly
       * 4. Get the counter mapped cases for the selected cases
       * 5. Find the result counter selected cases
       * 6. Find the result selected cases
       * 7. Find the cases to sync
       * 8. Set the results according to the type of the update(patient/sample)
       *
       * Note: If the filter update is from patient group then its counter
       * would be sample and if filter update is from sample group then
       * its counter would be patient
       */
      'update-all-filters': function(updateType_) {
        var _selectedCasesByFilters = [];
        var _counterSelectedCasesByFilters = [];
        var self_ = this;
        var _hasFilters = false;
        var _caseType = (updateType_ === 'patient') ? 'patient' : 'sample';
        var _counterCaseType =
          (updateType_ === 'patient') ? 'sample' : 'patient';

        if (self_.customfilter.patientIds.length > 0 ||
          self_.customfilter.sampleIds.length > 0) {
          _hasFilters = true;
          _selectedCasesByFilters = self_.customfilter.patientIds.length > 0 ?
            self_.customfilter.patientIds : self_.customfilter.sampleIds;
        }
        _.each(self_.groups, function(group) {
          _.each(group.attributes, function(attributes) {
            if (attributes.show) {
              if (attributes.filter.length > 0) {
                _hasFilters = true;
              }
            }
          });
          if (group.type === updateType_) {
            var _groupFilteredCases =
              iViz.getGroupFilteredCases(group.id) === undefined ?
                [] : iViz.getGroupFilteredCases(group.id).cases;
            if (_groupFilteredCases.length > 0) {
              if (_selectedCasesByFilters.length === 0) {
                _selectedCasesByFilters = _groupFilteredCases;
              } else {
                _selectedCasesByFilters =
                  iViz.util.intersection(_selectedCasesByFilters,
                    _groupFilteredCases);
              }
            }
          }
        });
        self_.hasfilters = _hasFilters;
        if (updateType_ === 'patient') {
          self_.selectedPatientsByFilters = _selectedCasesByFilters.sort();
          _selectedCasesByFilters = _selectedCasesByFilters.length === 0 ?
            self_.completePatientsList : _selectedCasesByFilters;
          _counterSelectedCasesByFilters =
            this.selectedSamplesByFilters.length === 0 ?
              self_.completeSamplesList : this.selectedSamplesByFilters;
        } else {
          self_.selectedSamplesByFilters = _selectedCasesByFilters.sort();
          _selectedCasesByFilters = _selectedCasesByFilters.length === 0 ?
            self_.completeSamplesList : _selectedCasesByFilters;
          _counterSelectedCasesByFilters =
            this.selectedPatientsByFilters.length === 0 ?
              self_.completePatientsList : this.selectedPatientsByFilters;
        }

        var _mappedCounterSelectedCases =
          iViz.util.idMapping(iViz.getCasesMap(_caseType),
            _selectedCasesByFilters);
        _mappedCounterSelectedCases.sort();
        var _resultCounterSelectedCases =
          iViz.util.intersection(_mappedCounterSelectedCases,
            _counterSelectedCasesByFilters);
        var _resultSelectedCases =
          iViz.util.idMapping(iViz.getCasesMap(_counterCaseType),
            _resultCounterSelectedCases);
        var _casesSync = iViz.util.idMapping(iViz.getCasesMap(_counterCaseType),
          _counterSelectedCasesByFilters);
        var _counterCasesSync = _mappedCounterSelectedCases;

        if (updateType_ === 'patient') {
          self_.patientsync = _casesSync;
          self_.samplesync = _counterCasesSync;
          self_.selectedsamples = _resultCounterSelectedCases;
          self_.selectedpatients = _resultSelectedCases;
        } else {
          self_.samplesync = _casesSync;
          self_.patientsync = _counterCasesSync;
          self_.selectedsamples = _resultSelectedCases;
          self_.selectedpatients = _resultCounterSelectedCases;
        }
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

        this.selectedsamples = this.samplesync;
        this.selectedpatients = this.patientsync;
      }
    }
  });
})(window.Vue,
  window.dc,
  window.iViz,
  window.Packery,
  window.Draggabilly,
  window._,
  window.$ || window.jQuery);
