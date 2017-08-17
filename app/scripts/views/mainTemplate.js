/**
 * Created by Karthik Kalletla on 4/13/16.
 */
'use strict';
(function(Vue, dc, iViz, Packery, Draggabilly, _) {
  Vue.component('mainTemplate', {
    template: '<chart-group :redrawgroups.sync="redrawgroups" ' +
    ':hasfilters="hasfilters" :id="group.id" :type="group.type" ' +
    ':mappedcases="group.type==\'patient\'?patientsync:samplesync" ' +
    ' :attributes.sync="group.attributes" :clear-group="clearAll"' +
    ' v-for="group in groups" :showed-survival-plot="showedSurvivalPlot"></chart-group> ',
    props: [
      'groups', 'selectedsampleUIDs', 'selectedpatientUIDs', 'hasfilters',
      'redrawgroups', 'customfilter', 'clearAll', 'showedSurvivalPlot'
    ], data: function() {
      return {
        patientsync: [],
        samplesync: [],
        grid_: '',
        completePatientsList: [],
        completeSamplesList: [],
        selectedPatientsByFilters: [],
        selectedSamplesByFilters: [],
        initialized: false,
        renderGroups: [],
        chartsGrid: [],
        windowResizeTimeout: ''
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
      renderGroups: function(groupIds) {
        var _keys = window.cbio.util.uniqueElementsOfArray(groupIds);
        if (_keys.length > 0) {
          _.each(_keys, function(groupid) {
            dc.renderAll(groupid);
          });
          this.renderGroups = [];
        }
      },
      chartsGrid: function(ChartsIds) {
        var _keys = window.cbio.util.uniqueElementsOfArray(ChartsIds);
        if (_keys.length > 0) {
          this.updateGrid(_keys);
          this.chartsGrid = [];
        }
      },
      clearAll: function(flag) {
        if (flag) {
          this.selectedPatientsByFilters = [];
          this.selectedSamplesByFilters = [];
        }
      }
    }, methods: {
      sortByNumber: function(a, b) {
        var _a = this.$root.charts[a.element.attributes['attribute-id'].nodeValue].layout[0];
        var _b = this.$root.charts[b.element.attributes['attribute-id'].nodeValue].layout[0];
        return _b - _a;
      },
      updateGrid: function(ChartsIds) {
        var self_ = this;
        if (this.grid_ === '') {
          self_.grid_ = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: window.iViz.styles.vars.width.one + 5,
            rowHeight: window.iViz.styles.vars.height.one + 5,
            gutter: 5,
            initLayout: false
          });
          self_.updateLayoutMatrix();
          self_.grid_.items.sort(this.sortByNumber);
          _.each(self_.grid_.getItemElements(), function(_gridItem) {
            var _draggie = new Draggabilly(_gridItem, {
              handle: '.dc-chart-drag'
            });
            self_.grid_.bindDraggabillyEvents(_draggie);
          });
          self_.grid_.on( 'dragItemPositioned', function() {
            self_.$dispatch('user-moved-chart');
          });
        } else {
          var chartDivIds = _.pluck(self_.grid_.getItemElements(), 'id');
          _.each(ChartsIds, function(chartId) {
            // make sure that async charts' divId not in current grids
            if (!_.includes(chartDivIds, chartId)) {
              self_.grid_.addItems(document.getElementById(chartId));
              var _draggie = new Draggabilly(document.getElementById(chartId), {
                handle: '.dc-chart-drag'
              });
              self_.grid_.bindDraggabillyEvents(_draggie);
            }
          });
        }
        self_.grid_.layout();
      },
      updateLayoutMatrix: function() {
        var self_ = this;
        var _charts = _.values(this.$root.charts);
        _charts.sort(function(a, b) {
          return iViz.priorityManager.comparePriorities(a.priority, b.priority, false);
        });

        // Group attributes into 2*2 matrix
        var layoutMatrix = [];
        _.each(_charts, function(chart) {
          if (chart.show) {
            layoutMatrix = self_.getLayoutMatrix(layoutMatrix, chart);
          }
        });

        // Layout group base on window width.
        var layoutAttrs = [];
        var layoutB = [];
        var browserWidth = $('#main-grid').width() || 1200;
        var groupsPerRow = Math.floor(browserWidth / 400);
        
        // One group will be at least displayed on the page;
        // Lower than 1 will also create infinite loop of following function
        groupsPerRow = groupsPerRow < 1 ? 1 : groupsPerRow;

        for (var i = 0; i < layoutMatrix.length;) {
          var _group = [];
          for (var j = 0; j < groupsPerRow; j++) {
            _group.push(layoutMatrix[i + j]);
          }
          layoutAttrs.push(_group);
          i = i + groupsPerRow;
        }

        _.each(layoutAttrs, function(group) {
          // Plot first two elements
          _.each(group, function(item) {
            if (item) {
              for (var j = 0; j < 2; j++) {
                layoutB.push(item.matrix[j]);
              }
            }
          });
          // Plot rest third and forth elements
          _.each(group, function(item) {
            if (item) {
              for (var j = 2; j < 4; j++) {
                layoutB.push(item.matrix[j]);
              }
            }
          });
        });
        _.each(_.filter(_.uniq(layoutB).reverse(), function(item) {
          return _.isString(item);
        }), function(attrId, index) {
          self_.$root.charts[attrId].layout[0] = index;
        });
      },
      updateLayout: function() {
        this.updateLayoutMatrix();
        this.grid_.items.sort(this.sortByNumber);
        this.grid_.layout();
      },
      getLayoutMatrix: function(layoutMatrix, chart) {
        var self_ = this;
        var neighborIndex;
        var foundSpace = false;
        var layout = chart.layout;
        var space = layout[1];
        var direction = 'h'; // h or v

        _.some(layoutMatrix, function(layoutItem) {
          if (foundSpace) {
            return true;
          }
          if (layoutItem.notFull) {
            var _matrix = layoutItem.matrix;
            _.some(_matrix, function(item, _matrixIndex) {
              if (space === 2) {
                var _validIndex = false;
                if (direction === 'v') {
                  neighborIndex = _matrixIndex + 2;
                  if (_matrixIndex < 2) {
                    _validIndex = true;
                  }
                } else {
                  neighborIndex = _matrixIndex + 1;
                  if (_matrixIndex % 2 === 0) {
                    _validIndex = true;
                  }
                }
                if (neighborIndex < _matrix.length && _validIndex) {
                  if (item === -1 && _matrix[neighborIndex] === -1) {
                    // Found a place for chart
                    _matrix[_matrixIndex] = _matrix[neighborIndex] = chart.attr_id;
                    foundSpace = true;
                    layoutItem.notFull = !self_.matrixIsFull(_matrix);
                    return true;
                  }
                }
              } else if (space === 1) {
                if (item === -1) {
                  // Found a place for chart
                  _matrix[_matrixIndex] = chart.attr_id;
                  foundSpace = true;
                  if (_matrixIndex === _matrix.length - 1) {
                    layoutItem.notFull = false;
                  }
                  return true;
                }
              } else if (space === 4) {
                if (item === -1 && _matrix[0] === -1 && _matrix[1] === -1 && _matrix[2] === -1 && _matrix[3] === -1) {
                  // Found a place for chart
                  _matrix = [chart.attr_id, chart.attr_id, chart.attr_id, chart.attr_id];
                  layoutItem.notFull = false;
                  foundSpace = true;
                  return true;
                }
              }
            });
            layoutItem.matrix = _matrix;
          }
        });

        if (!foundSpace) {
          layoutMatrix.push({
            notFull: true,
            matrix: [-1, -1, -1, -1]
          });
          layoutMatrix = self_.getLayoutMatrix(layoutMatrix, chart);
        }
        return layoutMatrix;
      },
      matrixIsFull: function(matrix) {
        var full = true;
        _.some(matrix, function(item) {
          if (item === -1) {
            full = false;
            return true;
          }
        });
        return full;
      },
    },
    events: {
      'update-grid': function() {
        this.grid_.layout();
      }, 'remove-grid-item': function(item) {
        var self_ = this;
        if (self_.grid_ === '') {
          self_.grid_ = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: window.iViz.styles.vars.width.one + 5,
            rowHeight: window.iViz.styles.vars.height.one + 5,
            gutter: 5,
            initLayout: false
          });
          self_.updateLayoutMatrix();
          self_.grid_.items.sort(this.sortByNumber);
          _.each(self_.grid_.getItemElements(), function(_gridItem) {
            var _draggie = new Draggabilly(_gridItem, {
              handle: '.dc-chart-drag'
            });
            self_.grid_.bindDraggabillyEvents(_draggie);
          });
          self_.grid_.on( 'dragItemPositioned', function() {
            self_.$dispatch('user-moved-chart');
          });
        }
        this.grid_.remove(item);
        this.grid_.layout();
      },
      'data-loaded': function(groupId, chartDivId) {
        this.chartsGrid.push(chartDivId);
        this.renderGroups.push(groupId);
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

        if (self_.customfilter.patientUids.length > 0 ||
          self_.customfilter.sampleUids.length > 0) {
          _hasFilters = true;
          _selectedCasesByFilters = (updateType_ === 'patient') ?
            self_.customfilter.patientUids : self_.customfilter.sampleUids;
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

        if (_selectedCasesByFilters.length === 0) {
          _selectedCasesByFilters = (updateType_ === 'patient') ?
            self_.completePatientsList : self_.completeSamplesList;
        }
        self_.hasfilters = _hasFilters;

        _selectedCasesByFilters = _selectedCasesByFilters.sort();

        if (updateType_ === 'patient') {
          self_.selectedPatientsByFilters = _selectedCasesByFilters;
          // _selectedCasesByFilters = _selectedCasesByFilters.length === 0 ?
          //   self_.completePatientsList : _selectedCasesByFilters;
          _counterSelectedCasesByFilters =
            this.selectedSamplesByFilters.length === 0 ?
              self_.completeSamplesList : this.selectedSamplesByFilters;
        } else {
          self_.selectedSamplesByFilters = _selectedCasesByFilters;
          // _selectedCasesByFilters = _selectedCasesByFilters.length === 0 ?
          //   self_.completeSamplesList : _selectedCasesByFilters;
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
            _resultCounterSelectedCases).sort();
        var _casesSync = iViz.util.idMapping(iViz.getCasesMap(_counterCaseType),
          _counterSelectedCasesByFilters);
        var _counterCasesSync = _mappedCounterSelectedCases;

        if (updateType_ === 'patient') {
          self_.patientsync = _casesSync;
          self_.samplesync = _counterCasesSync;
          if (self_.hasfilters) {
            self_.selectedsampleUIDs = _resultCounterSelectedCases;
            self_.selectedpatientUIDs = iViz.util.intersection(_selectedCasesByFilters, _resultSelectedCases);
          } else {
            self_.selectedsampleUIDs = self_.completeSamplesList;
            self_.selectedpatientUIDs = self_.completePatientsList;
          }
        } else {
          self_.samplesync = _casesSync;
          self_.patientsync = _counterCasesSync;
          if (self_.hasfilters) {
            self_.selectedsampleUIDs = iViz.util.intersection(_selectedCasesByFilters, _resultSelectedCases);
            self_.selectedpatientUIDs = _resultCounterSelectedCases;
          } else {
            self_.selectedsampleUIDs = self_.completeSamplesList;
            self_.selectedpatientUIDs = self_.completePatientsList;
          }
        }
      },
      'update-custom-filters': function() {
        if (this.customfilter.type === 'patient') {
          this.patientsync = this.customfilter.patientUids;
          this.samplesync = iViz.util.idMapping(iViz.getCasesMap('patient'),
            this.patientsync);
          this.customfilter.sampleUids = this.samplesync;
        } else {
          this.patientsync = iViz.util.idMapping(iViz.getCasesMap('sample'),
            this.customfilter.sampleUids);
          this.samplesync = this.customfilter.sampleUids;
          this.customfilter.patientUids = this.patientsync;
        }

        this.selectedsampleUIDs = this.samplesync;
        this.selectedpatientUIDs = this.patientsync;
      },
      'create-rainbow-survival': function(opts) {
        this.$broadcast('create-rainbow-survival', opts);
        this.$broadcast('resetBarColor', [opts.attrId]);
      },
      'remove-rainbow-survival': function() {
        this.$broadcast('resetBarColor', []);
      }
    },
    ready: function() {
      var self_ = this;
      // Register window resize event.
      $(window).resize(function() {
        clearTimeout(self_.windowResizeTimeout);
        self_.windowResizeTimeout = setTimeout(function() {
          if (!self_.$root.userMovedChart) {
            self_.updateLayout();
          }
        }, 500);
      });
    }
  });
})(window.Vue,
  window.dc,
  window.iViz,
  window.Packery,
  window.Draggabilly,
  window._);
