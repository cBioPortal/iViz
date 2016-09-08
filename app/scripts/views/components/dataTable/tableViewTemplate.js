/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(Vue, dc, iViz, $, QueryByGeneTextArea, _) {
  Vue.component('tableView', {
    template: '<div id={{chartDivId}} ' +
    ':class="[\'grid-item\', classTableHeight, \'grid-item-w-2\']" ' +
    ':data-number="attributes.priority" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':display-name="displayName" :chart-ctrl="chartInst"' +
    ':has-chart-title="true" :groupid="attributes.group_id" :reset-btn-id="resetBtnId" ' +
    ':chart-id="chartId" :attributes="attributes" :filters.sync="attributes.filter"> ' +
    '</chart-operations><div class="dc-chart dc-table-plot" ' +
    ':class="{\'start-loading\': showLoad}" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    '<div id="chart-loader"  :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    '<img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes', 'options'
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
        invisibleDimension: {},
        isMutatedGeneCna: false,
        classTableHeight: 'grid-item-h-2'
      };
    },
    watch: {
      'attributes.filter': function(newVal) {
        if (newVal.length === 0) {
          this.invisibleDimension.filterAll();
          this.selectedRows = [];
        }
        this.$dispatch('update-filters', true);
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
        this.invisibleDimension.dispose();
        this.$dispatch('close', true);
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
      },
      mouseLeave: function() {
        this.showOperations = false;
      },
      submitClick: function(_selectedRowData) {
        var selectedSamplesUnion = [];
        var selectedRowsUids = _.pluck(_selectedRowData, 'uniqueId');
        if (this.isMutatedGeneCna) {
          this.selectedRows = _.union(this.selectedRows, selectedRowsUids);
        } else {
          this.selectedRows = selectedRowsUids;
        }
        _.each(_selectedRowData, function(item) {
          var casesIds = item.caseIds.split(',');
          selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
        });
        if (this.attributes.filter.length === 0 || !this.isMutatedGeneCna) {
          this.attributes.filter = selectedSamplesUnion.sort();
        } else if (this.isMutatedGeneCna) {
          this.attributes.filter =
            iViz.util.intersection(this.attributes.filter, selectedSamplesUnion.sort());
        }
        var filtersMap = {};
        _.each(this.attributes.filter, function(filter) {
          if (filtersMap[filter] === undefined) {
            filtersMap[filter] = true;
          }
        });
        this.invisibleDimension.filterFunction(function(d) {
          return (filtersMap[d] !== undefined);
        });
        if (this.isMutatedGeneCna) {
          this.chartInst.clearSelectedRowData();
        }
      },
      addGeneClick: function(clickedRowData) {
        this.$dispatch('manage-gene', clickedRowData.gene);
        QueryByGeneTextArea.addRemoveGene(clickedRowData.gene);
      },
      setDisplayTitle: function(numOfCases) {
        this.displayName = this.attributes.display_name +
          (this.isMutatedGeneCna ? '(' + numOfCases + ' profiled samples)' : '');
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
      if (['mutated_genes', 'cna_details'].indexOf(_self.attributes.attr_id) === -1) {
        var data = iViz.getGroupNdx(this.attributes.group_id);
        _self.chartInst.init(this.attributes, this.$root.selectedsamples,
          this.$root.selectedgenes, data, this.chartId, callbacks);
        this.setDisplayTitle(this.chartInst.getCases().length);
        if (Object.keys(this.attributes.keys).length <= 3) {
          this.classTableHeight = 'grid-item-h-1';
        }
        _self.showLoad = false;
      } else {
        $.when(iViz.getTableData(_self.attributes.attr_id)).then(function(_data) {
          var data = iViz.getGroupNdx(_self.attributes.group_id);
          _self.chartInst.init(_self.attributes, _self.$root.selectedsamples,
            _self.$root.selectedgenes, data, _self.chartId, callbacks, _data.geneMeta);
          _self.setDisplayTitle(_self.chartInst.getCases().length);
          _self.isMutatedGeneCna = true;
          _self.showLoad = false;
        });
      }
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
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
