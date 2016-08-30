/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(Vue, dc, iViz, $, QueryByGeneTextArea, _) {
  Vue.component('tableView', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-2 grid-item-w-2" ' +
    ':data-number="attributes.priority" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':display-name="displayName" :chart-ctrl="chartInst"' +
    ':has-chart-title="true" :groupid="groupid" :reset-btn-id="resetBtnId" ' +
    ':chart-id="chartId" :attributes="attributes" :filters.sync="filters" ' +
    ':filters.sync="filters"></chart-operations>' +
    '<div class="dc-chart dc-table-plot" ' +
    ':class="{\'start-loading\': showLoad}" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    '<div id="chart-loader"  :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    '<img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes', 'options', 'filters', 'groupid'
    ],
    data: function() {
      return {
        chartDivId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-div',
        resetBtnId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-reset',
        chartId: 'chart-new-' +
        this.attributes.attr_id.replace(/\(|\)| /g, ''),
        displayName: this.attributes.display_name,
        showOperations: false,
        chartInst: {},
        showLoad: true,
        selectedRows: [],
        invisibleDimension: {}
      };
    },
    watch: {
      filters: function(newVal) {
        if (newVal.length === 0) {
          this.invisibleDimension.filterAll();
          dc.redrawAll(this.groupid);
          this.selectedRows = [];
        }
        this.updateFilters();
      }
    },
    events: {
      'show-loader': function() {
        this.showLoad = true;
      },
      'gene-list-updated': function(genes) {
        genes = $.extend(true, [], genes);
        this.chartInst.updateGenes(genes);
      },
      'update-special-charts': function() {
        var attrId =
          this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
        var _selectedCases =
          _.pluck(this.invisibleDimension.top(Infinity), attrId);
        this.chartInst.update(_selectedCases, this.selectedRows);
        this.setDisplayTitle(this.chartInst.getCases().length);
        this.showLoad = false;
      },
      'closeChart': function() {
        if (this.filters.length > 0) {
          this.filters = [];
          this.updateFilters();
        }
        this.invisibleDimension.dispose();
        this.$dispatch('close', true);
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      },
      mouseLeave: function() {
        this.showOperations = false;
      },
      submitClick: function(_selectedRowData) {
        var selectedSamplesUnion = [];
        var selectedRowsUids = _.pluck(_selectedRowData, 'uniqueId');
        this.selectedRows = _.union(this.selectedRows, selectedRowsUids);
        _.each(_selectedRowData, function(item) {
          var casesIds = item.caseIds.split(',');
          selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
        });
        if (this.filters.length === 0) {
          this.filters = selectedSamplesUnion.sort();
        } else {
          this.filters =
            iViz.util.intersection(this.filters, selectedSamplesUnion.sort());
        }
        var filtersMap = {};
        _.each(this.filters, function(filter) {
          if (filtersMap[filter] === undefined) {
            filtersMap[filter] = true;
          }
        });
        this.invisibleDimension.filterFunction(function(d) {
          return (filtersMap[d] !== undefined);
        });
        dc.redrawAll(this.groupid);
        this.chartInst.clearSelectedRowData();
      },
      addGeneClick: function(clickedRowData) {
        this.$dispatch('manage-gene', clickedRowData.gene);
        QueryByGeneTextArea.addRemoveGene(clickedRowData.gene);
      },
      setDisplayTitle: function(numOfCases) {
        this.displayName = this.attributes.display_name +
          '(' + numOfCases + ' profiled samples)';
      },
      updateFilters: function() {
        this.$dispatch('update-filters');
      }

    },
    ready: function() {
      var _self = this;
      _self.showLoad = true;
      var callbacks = {};
      var attrId =
        this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
      this.invisibleDimension = this.ndx.dimension(function(d) {
        return d[attrId];
      });

      callbacks.addGeneClick = this.addGeneClick;
      callbacks.submitClick = this.submitClick;
      _self.chartInst = new iViz.view.component.TableView();
      _self.chartInst.setDownloadDataTypes(['tsv']);

      var data = iViz.getAttrData(this.attributes.group_type);
      _self.chartInst.init(this.attributes, this.$root.selectedsamples,
        this.$root.selectedgenes, data, this.chartId, callbacks);
      this.setDisplayTitle(this.chartInst.getCases().length);
      _self.showLoad = false;
      this.$dispatch('data-loaded', this.chartDivId);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window.$ || window.jQuery,
  window.QueryByGeneTextArea,
  window._
);
