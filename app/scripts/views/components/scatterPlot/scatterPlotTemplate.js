/**
 * @author Yichao Sun on 5/11/16.
 */
'use strict';
(function(Vue, dc, iViz, _) {
  Vue.component('scatterPlot', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-2 grid-item-w-2" ' +
    ':data-number="attributes.priority" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations"' +
    ' :display-name="displayName" :has-chart-title="true" :groupid="attributes.group_id"' +
    ' :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" ' +
    ':chart-id="chartId"' +
    ' :attributes="attributes" :filters.sync="attributes.filter"></chart-operations>' +
    ' <div :class="{\'start-loading\': showLoad}" ' +
    'class="dc-chart dc-scatter-plot" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    ' <div id="chart-loader"  :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    ' <img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes'
    ],
    data: function() {
      return {
        chartDivId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-div',
        resetBtnId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)| /g, ''),
        displayName: this.attributes.display_name,
        showOperations: false,
        selectedSamples: [],
        chartInst: {},
        hasFilters: false,
        showLoad: true,
        invisibleDimension: {}
      };
    },
    watch: {
      'attributes.filter': function(newVal) {
        if (newVal.length === 0) {
          this.invisibleDimension.filterAll();
        }
        this.$dispatch('update-filters', true);
      }
    },
    events: {
      'show-loader': function() {
        this.showLoad = true;
      },
      'update-special-charts': function(hasFilters) {
        var attrId =
          this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
        var _selectedCases =
          _.pluck(this.invisibleDimension.top(Infinity), attrId);

        this.selectedSamples = _selectedCases;
        if (hasFilters) {
          this.chartInst.update(_selectedCases);
        } else {
          this.chartInst.update([]);
        }
        this.attachPlotlySelectedEvent();
        this.showLoad = false;
      },
      'closeChart': function() {
        this.invisibleDimension.dispose();
        this.$dispatch('close');
      },
      'addingChart': function(groupId, val) {
        if (this.attributes.group_id === groupId) {
          if (this.attributes.filter.length > 0) {
            if (val) {
              this.invisibleDimension.filterAll();
            } else {
              var filtersMap = {};
              _.each(this.attributes.filter, function(filter) {
                if (filtersMap[filter] === undefined) {
                  filtersMap[filter] = true;
                }
              });
              this.invisibleDimension.filterFunction(function(d) {
                return (filtersMap[d] !== undefined);
              });
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
      attachPlotlySelectedEvent: function() {
        var _self = this;
        var data = iViz.getGroupNdx(_self.attributes.group_id);

        document.getElementById(this.chartId).on('plotly_selected',
          function(_eventData) {
            if (typeof _eventData !== 'undefined') {
              var _selectedData = [];
              // create hash map for (overall) data with cna_fraction + mutation
              // count as key, dataObj as value (performance concern)
              var _CnaFracMutCntMap = {};
              _.each(data, function(_dataObj) {
                var _key = _dataObj.cna_fraction + '||' + _dataObj.mutation_count;
                _CnaFracMutCntMap[_key] = _dataObj;
              });
              _.each(_eventData.points, function(_pointObj) {
                if (_pointObj.x) {
                  _selectedData.push(
                    _CnaFracMutCntMap[_pointObj.x + '||' + _pointObj.y]);
                }
              });
              var _selectedCases = _.pluck(_selectedData, 'sample_id').sort();
              _self.selectedSamples = _selectedCases;
              _self.attributes.filter = _selectedCases;

              var filtersMap = {};
              _.each(_selectedCases, function(filter) {
                if (filtersMap[filter] === undefined) {
                  filtersMap[filter] = true;
                }
              });
              _self.invisibleDimension.filterFunction(function(d) {
                return (filtersMap[d] !== undefined);
              });
              dc.redrawAll(_self.attributes.group_id);
            }
          });
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
      var attrId =
        this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
      this.invisibleDimension = this.ndx.dimension(function(d) {
        return d[attrId];
      });

      var data = iViz.getGroupNdx(this.attributes.group_id);
      _self.chartInst = new iViz.view.component.ScatterPlot();
      _self.chartInst.init(data, _opts);
      _self.chartInst.setDownloadDataTypes(['pdf', 'svg']);

      _self.attachPlotlySelectedEvent();
      _self.showLoad = false;
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(window.Vue,
  window.dc,
  window.iViz,
  window._
);
