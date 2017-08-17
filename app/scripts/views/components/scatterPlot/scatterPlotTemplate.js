/**
 * @author Yichao Sun on 5/11/16.
 */
'use strict';
(function(Vue, dc, iViz, _) {
  Vue.component('scatterPlot', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-2 grid-item-w-2" ' +
    ':attribute-id="attributes.attr_id" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations"' +
    ' :display-name="displayName" :has-chart-title="true" :groupid="attributes.group_id"' +
    ' :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" ' +
    ':chart-id="chartId"' +
    ' :attributes="attributes" :filters.sync="attributes.filter"></chart-operations>' +
    ' <div :class="{\'start-loading\': showLoad}" ' +
    'class="dc-chart dc-scatter-plot" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    ' <div :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader">' +
    ' <img src="images/ajax-loader.gif" alt="loading"></div>' +
    '<div v-if="failedToInit" class="error-panel" align="center">' +
    '<error-handle v-if="failedToInit" :error-message="errorMessage"></error-handle>' +
    '</div></div>',
    props: [
      'ndx', 'attributes'
    ],
    data: function() {
      return {
        chartDivId:
          iViz.util.getDefaultDomId('chartDivId', this.attributes.attr_id),
        resetBtnId:
          iViz.util.getDefaultDomId('resetBtnId', this.attributes.attr_id),
        chartId:
          iViz.util.getDefaultDomId('chartId', this.attributes.attr_id),
        displayName: this.attributes.display_name,
        showOperations: false,
        selectedSamples: [],
        chartInst: {},
        hasFilters: false,
        showLoad: true,
        errorMessage: {
          dataInvalid: false,
          noData: false,
          failedToLoadData: false
        },
        failedToInit: false,
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
        this.hasFilters = hasFilters;
        if (this.dataLoaded) {
          var attrId =
            this.attributes.group_type === 'patient' ? 'patient_uid' : 'sample_uid';
          var _selectedCases =
            _.pluck(this.invisibleDimension.top(Infinity), attrId);

          this.selectedSamples = _selectedCases;
          if (hasFilters) {
            this.chartInst.update(_selectedCases);
          } else {
            this.chartInst.update([]);
          }
          this.attachPlotlySelectedEvent();
        }
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
              var _selectedCases = _.pluck(_selectedData, 'sample_uid').sort();
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

      // make scatterplot can be closed even if ajax fails
      var attrId =
        _self.attributes.group_type === 'patient' ? 'patient_uid' : 'sample_uid';
      _self.invisibleDimension = _self.ndx.dimension(function(d) {
        return d[attrId];
      });
      
      $.when(iViz.getScatterData(_self))
        .then(function(_scatterData, _hasCnaFractionData, _hasMutationCountData) {
          if (!_hasCnaFractionData || !_hasMutationCountData) {
            if (_self.attributes.addChartBy === 'default') {
              _self.attributes.show = false;
              _self.$dispatch('remove-chart', _self.attributes.attr_id,  _self.attributes.group_id);//rearrange layout
            } 
            _self.errorMessage.noData = true;
            _self.failedToInit = true;
          } else {
            var _opts = {
              chartId: _self.chartId,
              chartDivId: _self.chartDivId,
              title: _self.attributes.display_name,
              width: window.iViz.styles.vars.scatter.width,
              height: window.iViz.styles.vars.scatter.height
            };
            
            _self.chartInst = new iViz.view.component.ScatterPlot();
            _self.chartInst.setDownloadDataTypes(['pdf', 'svg', 'tsv']);
            _self.chartInst.init(_scatterData, _opts);

            _self.dataLoaded = true;
            var _selectedCases =
              _.pluck(_self.invisibleDimension.top(Infinity), attrId);
            if (_self.hasFilters) {
              _self.chartInst.update(_selectedCases);
            }
            _self.attachPlotlySelectedEvent();
          }
         
          _self.showLoad = false;
        }, function() {
          _self.showLoad = false;
          _self.errorMessage.failedToLoadData = true;
          _self.failedToInit = true;
        });
      
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(window.Vue,
  window.dc,
  window.iViz,
  window._
);
