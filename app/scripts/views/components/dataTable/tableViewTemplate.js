/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(Vue, dc, iViz, $, QueryByGeneTextArea, _) {
  Vue.component('tableView', {
    template: '<div id={{chartDivId}} ' +
    ':class="[\'grid-item\', classTableHeight, \'grid-item-w-2\', \'react-table\']" ' +
    ':data-number="attributes.priority" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':display-name="displayName" :chart-ctrl="chartInst"' +
    ':has-chart-title="true" :groupid="attributes.group_id" ' +
    ':reset-btn-id="resetBtnId" :chart-id="chartId" :attributes="attributes" ' +
    ':show-survival-icon.sync="showSurvivalIcon"' +
    ':show-download-icon="!failedToInit"' +
    ':filters.sync="attributes.filter"> ' +
    '</chart-operations><div class="dc-chart dc-table-plot" ' +
    ':class="{\'start-loading\': showLoad}" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    '<div id="chart-loader"  :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    '<img src="images/ajax-loader.gif" alt="loading"></div>' +
    '<div :class="{\'error-init\': failedToInit}" ' +
    'style="display: none;">' +
    '<span class="content">Failed to load data, refresh the page may help</span></div></div>',
    props: [
      'ndx', 'attributes', 'options', 'showedSurvivalPlot'
    ],
    data: function() {
      return {
        chartDivId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-div',
        resetBtnId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-reset',
        chartId: 'chart-new-' +
        this.attributes.attr_id.replace(/\(|\)| /g, ''),
        displayName: '',
        showOperations: false,
        chartInst: {},
        failedToInit: false,
        showLoad: true,
        selectedRows: [],
        invisibleDimension: {},
        isMutatedGeneCna: false,
        classTableHeight: 'grid-item-h-2',
        madeSelection: false,
        showSurvivalIcon: false,
        genePanelMap: {},
        numOfSurvivalCurveLimit: iViz.opts.numOfSurvivalCurveLimit || 20
      };
    },
    watch: {
      'attributes.filter': function(newVal) {
        if (newVal.length === 0) {
          this.invisibleDimension.filterAll();
          this.selectedRows = [];
        }
        this.$dispatch('update-filters', true);
      },
      'showedSurvivalPlot': function() {
        this.showRainbowSurvival();
      }
    },
    events: {
      'show-loader': function() {
        if (!this.failedToInit && (!this.madeSelection || this.isMutatedGeneCna)) {
          this.showLoad = true;
        }
      },
      'gene-list-updated': function(genes) {
        genes = $.extend(true, [], genes);
        this.chartInst.updateGenes(genes);
      },
      'update-special-charts': function() {
        // Do not update chart if the selection is made on itself
        if(!this.failedToInit) {
          if (this.madeSelection && !this.isMutatedGeneCna) {
            this.madeSelection = false;
          } else {
            var attrId =
              this.attributes.group_type === 'patient' ?
                'patient_id' : 'sample_id';
            var _selectedCases =
              _.pluck(this.invisibleDimension.top(Infinity), attrId);
            this.chartInst.update(_selectedCases, this.selectedRows);
            this.setDisplayTitle(this.chartInst.getCases().length);
            this.showLoad = false;
            this.showRainbowSurvival();
          }
        }
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
      },
      getRainbowSurvival: function() {
        var groups = [];
        var categories = this.chartInst.getCurrentCategories();
        var dataForCategories = iViz.util.getCaseIdsGroupByCategories(
          this.attributes.group_type,
          this.invisibleDimension,
          this.attributes.attr_id
        );
        _.each(categories, function(category) {
          if (dataForCategories.hasOwnProperty(category.name) &&
            // Remove pie chart NA group by default
            category.name !== 'NA') {
            groups.push({
              name: category.name,
              caseIds: dataForCategories[category.name],
              curveHex: category.color
            });
          }
        });
        this.$dispatch('create-rainbow-survival', {
          attrId: this.attributes.attr_id,
          subtitle: ' (' + this.attributes.display_name + ')',
          groups: groups,
          groupType: this.attributes.group_type
        });
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
        var selectedRowsUids = _.pluck(_selectedRowData, 'uniqueid');

        this.madeSelection = true;

        if (this.isMutatedGeneCna) {
          this.selectedRows = _.union(this.selectedRows, selectedRowsUids);
          _.each(_selectedRowData, function(item) {
            var casesIds = item.caseids.split(',');
            selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
          });
          if (this.attributes.filter.length === 0) {
            this.attributes.filter = selectedSamplesUnion.sort();
          } else {
            this.attributes.filter =
              iViz.util.intersection(this.attributes.filter, selectedSamplesUnion.sort());
          }
        } else {
          this.selectedRows = selectedRowsUids;
          this.attributes.filter = this.selectedRows;
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
        var arr = [];
        if (this.isMutatedGeneCna) {
          arr.push(this.attributes.display_name);
          if (!isNaN(numOfCases)) {
            arr.push(' (' + numOfCases + ' profiled samples)');
          }
        }
        this.displayName = arr.join('');
      },
      processTableData: function(_data) {
        var data = iViz.getGroupNdx(this.attributes.group_id);
        var opts = {
          width: window.iViz.styles.vars.specialTables.width,
          height: window.iViz.styles.vars.specialTables.height,
          chartId: this.chartId
        };
        this.chartInst.init(this.attributes, opts, this.$root.selectedsamples,
          this.$root.selectedgenes, data, {
            addGeneClick: this.addGeneClick,
            submitClick: this.submitClick
          }, this.isMutatedGeneCna ? _data.geneMeta : null, this.invisibleDimension, this.genePanelMap);
        this.setDisplayTitle(this.chartInst.getCases().length);
        if (!this.isMutatedGeneCna &&
          Object.keys(this.attributes.keys).length <= 3) {
          this.classTableHeight = 'grid-item-h-1';
        }
        this.showLoad = false;
      },
      showRainbowSurvival: function() {
        var categories = this.chartInst.getCurrentCategories();
        if (this.showedSurvivalPlot && !this.isMutatedGeneCna && _.isArray(categories) &&
          categories.length > 1 &&
          categories.length <= this.numOfSurvivalCurveLimit) {
          this.showSurvivalIcon = true;
        } else {
          this.showSurvivalIcon = false;
        }
      }
    },
    ready: function() {
      var _self = this;
      _self.showLoad = true;
      var callbacks = {};
      var attrId = this.attributes.attr_id;

      this.isMutatedGeneCna =
        ['mutated_genes', 'cna_details']
          .indexOf(_self.attributes.attr_id) !== -1;

      if (this.isMutatedGeneCna) {
        attrId = this.attributes.group_type === 'patient' ?
          'patient_id' : 'sample_id';
      }

      this.invisibleDimension = this.ndx.dimension(function(d) {
        if (typeof d[attrId] === 'undefined' ||
          ['na', 'n/a', 'N/A'].indexOf(d[attrId]) !== -1) {
          d[attrId] = 'NA';
        }
        return d[attrId];
      });
      callbacks.addGeneClick = this.addGeneClick;
      callbacks.submitClick = this.submitClick;
      _self.chartInst = new iViz.view.component.TableView();
      _self.chartInst.setDownloadDataTypes(['tsv']);
      if (_self.isMutatedGeneCna) {
        $.when(iViz.getTableData(_self.attributes.attr_id))
          .then(function(_tableData) {
            $.when(window.iviz.datamanager.getGenePanelMap())
              .then(function(_genePanelMap) {
                // create gene panel map
                _self.genePanelMap = _genePanelMap;
                _self.processTableData(_tableData);
              }, function() {
                _self.genePanelMap = {};
                _self.processTableData(_tableData);
              });
          }, function() {
            _self.setDisplayTitle();
            if (!_self.isMutatedGeneCna &&
              Object.keys(_self.attributes.keys).length <= 3) {
              _self.classTableHeight = 'grid-item-h-1';
            }
            _self.failedToInit = true;
            _self.showLoad = false;
          });
      } else {
        _self.processTableData();
      }
      this.showRainbowSurvival();
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
