/**
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, crossfilter, _) {
  Vue.component('chartGroup', {
    template: ' <div is="individual-chart" ' +
    ':clear-chart="clearGroup" :ndx="ndx"   :attributes.sync="attribute" ' +
    ':showed-survival-plot="showedSurvivalPlot"  v-for="attribute in attributes"></div>',
    props: [
      'attributes', 'type', 'id', 'redrawgroups', 'mappedcases', 'clearGroup', 'hasfilters', 'showedSurvivalPlot'
    ], created: function() {
      // TODO: update this.data
      var _self = this;
      var ndx_ = crossfilter(iViz.getGroupNdx(this.id));
      this.invisibleBridgeDimension = ndx_.dimension(function(d) {
        return d[_self.type + '_id'];
      });
      this.ndx = ndx_;
      this.invisibleChartFilters = [];

      if (this.mappedcases !== undefined && this.mappedcases.length > 0) {
        this.$nextTick(function() {
          _self.updateInvisibleChart(_self.mappedcases);
        });
      }
    }, destroyed: function() {
      dc.chartRegistry.clear(this.groupid);
    },
    data: function() {
      return {
        syncCases: true
      };
    },
    watch: {
      mappedcases: function(val) {
        if (this.syncCases) {
          this.updateInvisibleChart(val);
        } else {
          this.syncCases = true;
        }
      },
      clearGroup: function(flag) {
        if (flag) {
          var self_ = this;
          self_.invisibleBridgeDimension.filterAll();
          self_.invisibleChartFilters = [];
          iViz.deleteGroupFilteredCases(self_.id);
        }
      }
    },
    events: {
      'add-chart-to-group': function(groupId) {
        if (this.id === groupId) {
          this.$broadcast('addingChart', this.id, true);
          if (this.invisibleChartFilters.length > 0) {
            this.invisibleBridgeDimension.filterAll();
          }
          this.ndx.remove();
          this.ndx.add(iViz.getGroupNdx(this.id));
          if (this.invisibleChartFilters.length > 0) {
            var filtersMap = {};
            _.each(this.invisibleChartFilters, function(filter) {
              if (filtersMap[filter] === undefined) {
                filtersMap[filter] = true;
              }
            });
            this.invisibleBridgeDimension.filterFunction(function(d) {
              return (filtersMap[d] !== undefined);
            });
          }
          this.$broadcast('addingChart', this.id, false);
        }
      },
      /*
       *This event is invoked whenever there is a filter update on any chart
       * STEPS involved
       *
       * 1. Clear filters on invisible group bridge chart
       * 2. Get all the filtered cases fot that particular chart group
       * 3. If those filtered cases length not same as original cases length
       *    then save that case list in the groupFilterMap
       * 4. Apply back invisible group bridge chart filters
       */
      'update-filters': function(redrawGroup) {
        if (!this.clearGroup) {
          if (redrawGroup) {
            dc.redrawAll(this.id);
          }
          this.syncCases = false;
          if (this.invisibleChartFilters.length > 0) {
            this.invisibleBridgeDimension.filterAll();
          }
          var filteredCases = _.pluck(
            this.invisibleBridgeDimension.top(Infinity),
            this.type + '_id').sort();
          // Hacked way to check if filter selected filter cases is same
          // as original case list

          var _hasFilter = false;
          _.every(this.attributes, function(attribute) {
            if (attribute.filter.length > 0) {
              _hasFilter = true;
              return false;
            }
            return true;
          });
          if (_hasFilter) {
            iViz.setGroupFilteredCases(this.id, this.type, filteredCases);
          } else {
            iViz.deleteGroupFilteredCases(this.id);
          }

          if (this.invisibleChartFilters.length > 0) {
            var filtersMap = {};
            _.each(this.invisibleChartFilters, function(filter) {
              if (filtersMap[filter] === undefined) {
                filtersMap[filter] = true;
              }
            });
            this.invisibleBridgeDimension.filterFunction(function(d) {
              return (filtersMap[d] !== undefined);
            });
          }
          this.$dispatch('update-all-filters', this.type);
        }
      }
    },
    methods: {
      updateInvisibleChart: function(val) {
        var _groupCases = iViz.getGroupFilteredCases();
        var _selectedCases = val;
        var _self = this;
        _.each(_groupCases, function(_group, id) {
          if (_group !== undefined && _group.type === _self.type &&
            (_self.id.toString() !== id)) {
            _selectedCases =
              iViz.util.intersection(_selectedCases, _group.cases);
          }
        });
        this.invisibleChartFilters = [];
        this.invisibleBridgeDimension.filterAll();
        if (this.hasfilters) {
          this.invisibleChartFilters = _selectedCases;
          var filtersMap = {};
          _.each(_selectedCases, function(filter) {
            if (filtersMap[filter] === undefined) {
              filtersMap[filter] = true;
            }
          });
          this.invisibleBridgeDimension.filterFunction(function(d) {
            return (filtersMap[d] !== undefined);
          });
        }
        this.redrawgroups.push(this.id);
      }
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window.crossfilter,
  window._
);
