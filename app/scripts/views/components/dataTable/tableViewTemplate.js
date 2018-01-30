/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(Vue, dc, iViz, $, QueryByGeneTextArea, _) {
  Vue.component('tableView', {
    template: '<div id={{chartDivId}} ' +
    ':class="[\'grid-item\', classTableHeight, \'grid-item-w-2\', \'react-table\']" ' +
    ':attribute-id="attributes.attr_id" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':display-name="displayName" :chart-ctrl="chartInst"' +
    ':has-chart-title="true" :groupid="attributes.group_id" ' +
    ':reset-btn-id="resetBtnId" :chart-id="chartId" :attributes="attributes" ' +
    ':show-survival-icon.sync="showSurvivalIcon"' +
    ':show-download-icon="!failedToInit"' +
    ':filters.sync="attributes.filter"> ' +
    '</chart-operations><div class="dc-chart dc-table-plot" ' +
    'v-show="!showLoad" :class="{\'show-loading-bar\': showLoad}" ' +
    'align="center" id={{chartId}} ></div>' +
    '<div v-show="showLoad" class="progress-bar-parent-div" :class="{\'show-loading-bar\': showLoad}">' +
    '<progress-bar :div-id="loadingBar.divId" :status="loadingBar.status" :opts="loadingBar.opts"></progress-bar></div>' +
    '<div :class="{\'error-init\': failedToInit}" ' +
    'style="display: none;">' +
    '<span class="content">Failed to load data, refresh the page may help</span></div></div>',
    props: [
      'ndx', 'attributes', 'options', 'showedSurvivalPlot'
    ],
    data: function() {
      return {
        chartDivId:
          iViz.util.getDefaultDomId('chartDivId', this.attributes.attr_id),
        resetBtnId:
          iViz.util.getDefaultDomId('resetBtnId', this.attributes.attr_id),
        chartId:
          iViz.util.getDefaultDomId('chartId', this.attributes.attr_id),
        displayName: '',
        showOperations: false,
        chartInst: {},
        failedToInit: false,
        showLoad: true,
        selectedRows: [],
        invisibleDimension: {},
        isMutatedGeneCna: ['mutated_genes', 'cna_details']
          .indexOf(this.attributes.attr_id) !== -1,
        classTableHeight: 'grid-item-h-2',
        madeSelection: false,
        showSurvivalIcon: false,
        genePanelMap: {},
        numOfSurvivalCurveLimit: iViz.opts.numOfSurvivalCurveLimit || 20,
        dataLoaded: false,
        loadedStudies: 0,
        totalNumOfStudies: 0,
        loadingBar :{
          status: 0,
          divId: iViz.util.getDefaultDomId('progressBarId', this.attributes.attr_id),
          opts: {},
          infinityInterval: null
        },
        // this is used to set dc invisibleDimension filters
        // In case of MutatedGeneCna plot this would be case uids
        // and for other talbe charts this would be row uid
        chartFilters:[]
      };
    },
    watch: {
      'attributes.filter': function(newVal) {
        if (newVal.length === 0) {
          this.invisibleDimension.filterAll();
          this.selectedRows = [];
          this.chartFilters = [];
        }
        this.$dispatch('update-filters', true);
      },
      'loadedStudies': function() {
        this.loadingBar.status = this.loadedStudies / (this.totalNumOfStudies || 1);
      },
      'showLoad': function(newVal) {
        if (newVal) {
          this.initialInfinityLoadingBar();
        } else {
          if (this.loadingBar.infinityInterval) {
            window.clearInterval(this.loadingBar.infinityInterval);
            this.loadingBar.infinityInterval = null;
          }
        }
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
        if(this.isMutatedGeneCna) {
          genes = $.extend(true, [], genes);
          this.chartInst.updateGenes(genes);
        }
      },
      'update-special-charts': function() {
        // Do not update chart if the selection is made on itself
        if (!this.failedToInit) {
          if (this.madeSelection && !this.isMutatedGeneCna) {
            this.madeSelection = false;
          } else if (this.dataLoaded) {
            var attrId =
              this.attributes.group_type === 'patient' ?
                'patient_uid' : 'sample_uid';
            var _selectedCases =
              _.pluck(this.invisibleDimension.top(Infinity), attrId);
            this.chartInst.update(_selectedCases, this.selectedRows);
            this.setDisplayTitle(this.chartInst.getCases().length);
            this.showRainbowSurvival();
            this.showLoad = false;
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
              _.each(this.chartFilters, function(filter) {
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
          if (dataForCategories.hasOwnProperty(category.name)) {
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
          this.attributes.filter.push(selectedRowsUids.join(','))
          _.each(_selectedRowData, function(item) {
            var casesIds = item.case_uids.split(',');
            selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
          });
          if(this.chartFilters.length === 0) {
            this.chartFilters = selectedSamplesUnion.sort();
          } else {
            this.chartFilters =
              iViz.util.intersection(this.chartFilters, selectedSamplesUnion.sort());
          }
        } else {
          this.selectedRows = selectedRowsUids;
          this.attributes.filter = this.selectedRows;
          this.chartFilters = this.selectedRows
        }
        var filtersMap = {};
        _.each(this.chartFilters, function(filter) {
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

        this.dataLoaded = true;

        this.chartInst.init(this.attributes, opts, this.$root.selectedsampleUIDs,
          this.$root.selectedgenes, data, {
            addGeneClick: this.addGeneClick,
            submitClick: this.submitClick
          }, this.isMutatedGeneCna ? _data.geneMeta : null, this.invisibleDimension, this.genePanelMap);

        var attrId =
          this.attributes.group_type === 'patient' ?
            'patient_uid' : 'sample_uid';
        var _selectedCases =
          _.pluck(this.invisibleDimension.top(Infinity), attrId);
        if (_selectedCases.length > 0) {
          this.chartInst.update(_selectedCases, this.selectedRows);
          this.showRainbowSurvival();
        }

        this.setDisplayTitle(this.chartInst.getCases().length);
        if (!this.isMutatedGeneCna &&
          Object.keys(this.attributes.keys).length <= 3) {
          this.classTableHeight = 'grid-item-h-1';
          this.attributes.layout[1] = 2;
          this.attributes.layout[2] = 'h';
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
      },
      initialInfinityLoadingBar: function() {
        var self = this;
        self.loadingBar.opts = {
          duration: 300,
          step: function(state, bar) {
            bar.setText('Loading...');
          }
        };
        self.loadingBar.status = 0.5;
        self.loadingBar.infinityInterval = setInterval(function() {
          self.loadingBar.status += 0.5;
        }, 800);
      }
    },
    ready: function() {
      var _self = this;
      var callbacks = {};
      var attrId = this.attributes.attr_id;

      if (this.isMutatedGeneCna) {
        attrId = this.attributes.group_type === 'patient' ?
          'patient_uid' : 'sample_uid';
      }

      this.invisibleDimension = this.ndx.dimension(function(d) {
        if (iViz.util.strIsNa(d[attrId], false)) {
          d[attrId] = 'NA';
        }
        return d[attrId];
      });

      callbacks.addGeneClick = this.addGeneClick;
      callbacks.submitClick = this.submitClick;
      _self.chartInst = new iViz.view.component.TableView();
      _self.chartInst.setDownloadDataTypes(['tsv']);
      if (_self.isMutatedGeneCna) {
        var progressBarText = '';
        if (_self.attributes.attr_id === 'mutated_genes') {
          _self.totalNumOfStudies = Object.keys(iviz.datamanager.mutationProfileIdsMap).length;
          progressBarText = 'mutated genes (';
        } else {
          _self.totalNumOfStudies = Object.keys(iviz.datamanager.cnaProfileIdsMap).length;
          progressBarText = 'copy number alteration genes (';
        }

        _self.loadingBar.opts = {
          step: function(state, bar) {
            bar.setText('Loading ' + progressBarText + Math.round(bar.value() * 100) + '%)');
          }
        };

        $.when(iViz.getTableData(_self.attributes.attr_id, function() {
          _self.loadedStudies++;
        })).then(function(_tableData) {
          $.when(window.iviz.datamanager.getGenePanelMap(_tableData.allGenes, _tableData.allSamples))
            .then(function(_genePanelMap) {
              // create gene panel map
              this.dataLoaded = true;
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
          _self.initialInfinityLoadingBar();
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
