/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(iViz, dc, _, React, ReactDOM, EnhancedFixedDataTableSpecial) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.TableView = function() {
    var content = this;
    var chartId_;
    var data_ = [];
    var type_ = '';
    var attr_ = [];
    var attributes_ = [];
    var geneData_ = [];
    var selectedRows = [];
    var selectedGenes = [];
    var callbacks_ = {};
    var sequencedSampleIds = [];
    var selectedSamples = [];
    var allSamplesIds = [];
    var reactTableData = {};
    var initialized = false;
    var caseIndices = {};
    var selectedRowData = [];
    var selectedGeneData = [];
    var displayName = '';
    var categories_ = {};
    var reactData_;
    var isMutatedGeneCna = false;
    var dimension = {};
    var group = {};
    var labelInitData = {};
    var opts = {};
    var genePanelMap = {};
    var renderedReactTable;

    // Category based color assignment. Avoid color changing
    var assignedColors = {
      NA: '#cccccc'
    };
    var colors = $.extend(true, [], iViz.util.getColors());

    content.getCases = function() {
      return iViz.util.intersection(selectedSamples, sequencedSampleIds);
    };

    content.getSelectedRowData = function() {
      return selectedRowData;
    };

    content.clearSelectedRowData = function() {
      selectedRowData = [];
    };

    content.init =
      function(_attributes, _opts, _selectedSamples, _selectedGenes,
               _data, _callbacks, _geneData, _dimension, _genePanelMap) {
        initialized = false;
        allSamplesIds = _selectedSamples;
        selectedSamples = _selectedSamples;
        selectedSamples.sort();
        sequencedSampleIds = _attributes.options.sequencedCases;
        sequencedSampleIds.sort();
        selectedGenes = _selectedGenes;
        chartId_ = _opts.chartId;
        opts = _opts;
        genePanelMap = _genePanelMap;
        caseIndices = iViz.getCaseIndices(_attributes.group_type);
        data_ = _data;
        geneData_ = _geneData;
        type_ = _attributes.type;
        displayName = _attributes.display_name || 'Table';
        attributes_ = _attributes;
        callbacks_ = _callbacks;
        isMutatedGeneCna = ['mutatedGene', 'cna'].indexOf(type_) !== -1;
        if (!isMutatedGeneCna) {
          dimension = _dimension;
          group = dimension.group();
          initPieTableData();
        }
        initReactTable(true);
      };

    content.update = function(_selectedSamples, _selectedRows) {
      var selectedMap_ = {};
      var includeMutationCount = false;
      if (_selectedRows !== undefined) {
        selectedRows = _selectedRows;
      }
      if (selectedRows.length === 0) {
        selectedRowData = [];
      }
      _selectedSamples.sort();
      if ((!initialized) ||
        (!iViz.util.compare(selectedSamples, _selectedSamples))) {
        initialized = true;
        selectedSamples = _selectedSamples;
        if (iViz.util.compare(allSamplesIds, selectedSamples)) {
          initReactTable(true);
        } else {
          _.each(_selectedSamples, function(caseId) {
            var caseIndex_ = caseIndices[caseId];
            if (_.isNumber(caseIndex_)) {
              var caseData_ = data_[caseIndex_];
              if (_.isObject(caseData_)) {
                var tempData_ = '';
                switch (type_) {
                case 'mutatedGene':
                  tempData_ = caseData_.mutated_genes;
                  includeMutationCount = true;
                  break;
                case 'cna':
                  tempData_ = caseData_.cna_details;
                  includeMutationCount = false;
                  break;
                default:
                  var category = caseData_[attributes_.attr_id];
                  if (!category) {
                    category = 'NA';
                  }
                  if (!selectedMap_.hasOwnProperty(category)) {
                    selectedMap_[category] = [];
                  }
                  selectedMap_[category].push(caseId);
                  break;
                }
                if (isMutatedGeneCna) {
                  _.each(tempData_, function(geneIndex) {
                    if (selectedMap_[geneIndex] === undefined) {
                      selectedMap_[geneIndex] = {};
                      if (includeMutationCount) {
                        selectedMap_[geneIndex].num_muts = 1;
                      }
                      selectedMap_[geneIndex].caseIds = [caseId];
                    } else {
                      if (includeMutationCount) {
                        selectedMap_[geneIndex].num_muts += 1;
                      }
                      selectedMap_[geneIndex].caseIds.push(caseId);
                    }
                  });
                }
              }
            }
          });
          initReactTable(true, selectedMap_, selectedSamples);
        }
      } else {
        initReactTable(false);
      }
    };

    content.updateGenes = function(genes) {
      selectedGenes = genes;
      initReactTable(false);
    };

    content.updateDataForDownload = function(fileType) {
      if (fileType === 'tsv') {
        initTsvDownloadData();
      }
    };

    content.getCurrentCategories = function() {
      return _.values(categories_);
    };

    function initReactTable(_reloadData, _selectedMap, _selectedSampleIds) {
      if (_reloadData) {
        reactTableData = initReactData(_selectedMap, _selectedSampleIds);
      }
      var _opts = {
        input: reactTableData,
        filter: 'ALL',
        download: 'NONE',
        downloadFileName: 'data.txt',
        showHide: false,
        hideFilter: true,
        scroller: true,
        resultInfo: false,
        groupHeader: false,
        fixedChoose: false,
        uniqueId: 'uniqueId',
        rowHeight: 25,
        tableWidth: opts.width,
        maxHeight: opts.height,
        headerHeight: 26,
        groupHeaderHeight: 40,
        autoColumnWidth: false,
        columnMaxWidth: 300,
        columnSorting: false,
        sortBy: 'cases',
        selectedRows: selectedRows,
        rowClickFunc: function(data, selected) {
          reactRowClickCallback(data, selected);
          reactSubmitClickCallback();
        },
        // sortBy: 'name',
        // sortDir: 'DESC',
        tableType: type_
      };
      if (isMutatedGeneCna) {
        _opts = _.extend(_opts, {
          rowClickFunc: reactRowClickCallback,
          selectedGene: selectedGenes,
          geneClickFunc: reactGeneClickCallback,
          selectButtonClickCallback: reactSubmitClickCallback
        });
      }

      // Check whether the react table has been initialized
      if (renderedReactTable) {
        // Get sort settings from the initialized react table
        var sort_ = renderedReactTable.getCurrentSort();
        _opts = $.extend(_opts, sort_);
      }

      var testElement = React.createElement(EnhancedFixedDataTableSpecial,
        _opts);

      renderedReactTable = ReactDOM.render(testElement, document.getElementById(chartId_));
    }

    function initRegularTableData() {
      var data = [];
      _.each(categories_, function(category, name) {
        for (var key in category) {
          if (category.hasOwnProperty(key)) {
            var datum = {
              attr_id: key,
              uniqueId: name,
              attr_val: key === 'caseIds' ? category.caseIds.join(',') : category[key]
            };
            data.push(datum);
          }
        }
      });
      reactData_ = data;
    }

    function getColor(key) {
      if (!assignedColors.hasOwnProperty(key)) {
        var _color = colors.shift();
        if (!_color) {
          _color = iViz.util.getRandomColorOutOfLib();
        }
        assignedColors[key] = _color;
      }
      return assignedColors[key];
    }

    function initPieTableData() {
      _.each(group.all(), function(attr, index) {
        labelInitData[attr.key] = {
          attr: attr,
          color: getColor(attr.key),
          id: attr.key,
          index: index
        };
      });
    }

    function updateCategories() {
      var _labels = {};
      var _currentSampleSize = 0;
      _.each(group.top(Infinity), function(label) {
        var _labelDatum = {};
        var _labelValue = Number(label.value);
        if (_labelValue > 0) {
          _labelDatum.id = labelInitData[label.key].id;
          _labelDatum.index = labelInitData[label.key].index;
          _labelDatum.name = label.key;
          _labelDatum.color = labelInitData[label.key].color;
          _labelDatum.cases = _labelValue;
          _currentSampleSize += _labelValue;
          _labels[_labelDatum.id] = _labelDatum;
        }
      });

      _.each(_labels, function(label) {
        label.caseRate = iViz.util.calcFreq(Number(label.cases), _currentSampleSize);
      });
      categories_ = _labels;
    }

    function mutatedGenesData(_selectedGenesMap, _selectedSampleIds) {

      genePanelMap = window.iviz.datamanager.updateGenePanelMap(genePanelMap, _selectedSampleIds);

      selectedGeneData.length = 0;
      var numOfCases_ = content.getCases().length;

      if (geneData_) {
        _.each(geneData_, function(item, index) {
          var datum = {};
          var freq = 0;
          datum.gene = item.gene;
          if (_selectedGenesMap === undefined) {
            datum.caseIds = iViz.util.unique(item.caseIds);
            datum.cases = datum.caseIds.length;
            datum.uniqueId = index;
            if (typeof genePanelMap[item.gene] !== 'undefined') {
              freq = iViz.util.calcFreq(datum.cases, genePanelMap[item.gene]["sample_num"]);
            } else {
              freq = iViz.util.calcFreq(datum.cases, numOfCases_);
            }
            switch (type_) {
              case 'mutatedGene':
                datum.numOfMutations = item.num_muts;
                datum.sampleRate = freq;
                break;
              case 'cna':
                datum.cytoband = item.cytoband;
                datum.altType = item.cna;
                datum.altrateInSample = freq;
                break;
              default:
                break;
            }
          } else {
            if (_selectedGenesMap[item.index] === undefined) {
              return;
            }
            datum.caseIds =
              iViz.util.unique(_selectedGenesMap[item.index].caseIds);
            datum.cases = datum.caseIds.length;
            if (typeof genePanelMap[item.gene] !== 'undefined') {
              freq = iViz.util.calcFreq(datum.cases, genePanelMap[item.gene]["sample_num"]);
            } else {
              freq = iViz.util.calcFreq(datum.cases, numOfCases_);
            }
            switch (type_) {
              case 'mutatedGene':
                datum.numOfMutations = _selectedGenesMap[item.index].num_muts;
                datum.sampleRate = freq;
                datum.uniqueId = datum.gene;
                break;
              case 'cna':
                datum.cytoband = item.cytoband;
                datum.altType = item.cna;
                datum.altrateInSample = freq;
                datum.uniqueId = datum.gene + '-' + datum.altType;
                break;
              default:
                break;
            }
          }

          if (item.qval === null) {
            datum.qval = '';
          } else {
            var qval = Number(item.qval);
            if (qval === 0) {
              datum.qval = 0;
            } else {
              datum.qval = qval.toExponential(1);
            }
          }
          selectedGeneData.push(datum);
        });
      }
      return selectedGeneData;
    }

    function initReactData(_selectedMap, _selectedSampleIds) {
      attr_ = iViz.util.tableView.getAttributes(type_);
      var result = {
        data: [],
        attributes: attr_
      };

      if (isMutatedGeneCna) {
        var _mutationData = mutatedGenesData(_selectedMap, _selectedSampleIds);
        _.each(_mutationData, function(item) {
          for (var key in item) {
            if (item.hasOwnProperty(key)) {
              var datum = {
                attr_id: key,
                uniqueId: item.uniqueId,
                attr_val: key === 'caseIds' ? item.caseIds.join(',') : item[key]
              };
              result.data.push(datum);
            }
          }
        });
      } else {
        categories_ = {};
        result.attributes[0].display_name = displayName;
        updateCategories(_selectedMap);
        initRegularTableData();
        result.data = reactData_;
      }
      return result;
    }

    function reactSubmitClickCallback() {
      callbacks_.submitClick(selectedRowData);
    }

    function reactRowClickCallback(data, selected) {
      if (selected) {
        selectedRowData.push(data);
      } else {
        selectedRowData = _.filter(selectedRowData, function(item) {
          return (item.uniqueId !== data.uniqueId);
        });
      }
    }

    function reactGeneClickCallback(selectedRow) {
      callbacks_.addGeneClick(selectedRow);
    }

    function initTsvDownloadData() {
      var attrs =
        iViz.util.tableView.getAttributes(type_).filter(function(attr) {
          return attr.attr_id !== 'uniqueId' && (_.isBoolean(attr.show) ? attr.show : true);
        });
      var downloadOpts = {
        fileName: displayName,
        data: ''
      };
      var rowsData;

      if (isMutatedGeneCna) {
        rowsData = selectedGeneData;
      } else {
        rowsData = _.values(categories_);
      }
      rowsData = _.sortBy(rowsData, function(item) {
        return -item.cases;
      });

      if (_.isArray(attrs) && attrs.length > 0) {
        var data = [attrs.map(
          function(attr) {
            if (attr.attr_id === 'name') {
              attr.display_name = displayName;
            }
            return attr.display_name;
          }).join('\t')];

        _.each(rowsData, function(row) {
          var _tmp = [];
          _.each(attrs, function(attr) {
            _tmp.push(row[attr.attr_id] || '');
          });
          data.push(_tmp.join('\t'));
        });

        downloadOpts.data = data.join('\n');
      }
      content.setDownloadData('tsv', downloadOpts);
    }
  };

  iViz.view.component.TableView.prototype =
    new iViz.view.component.GeneralChart('table');

  iViz.util.tableView = (function() {
    var content = {};
    content.compare = function(arr1, arr2) {
      if (arr1.length !== arr2.length) {
        return false;
      }
      for (var i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) === -1) {
          return false;
        }
      }
      return true;
    };

    content.getAttributes = function(type) {
      var _attr = [];
      switch (type) {
        case 'mutatedGene':
          _attr = [
            {
              attr_id: 'gene',
              display_name: 'Gene',
              datatype: 'STRING',
              column_width: 110
            }, {
              attr_id: 'numOfMutations',
              display_name: '# Mut',
              datatype: 'NUMBER',
              column_width: 95
            },
            {
              attr_id: 'cases',
              display_name: '#',
              datatype: 'NUMBER',
              column_width: 95
            },
            {
              attr_id: 'sampleRate',
              display_name: 'Freq',
              datatype: 'PERCENTAGE',
              column_width: 93
            },
            {
              attr_id: 'caseIds',
              display_name: 'Cases',
              datatype: 'STRING',
              show: false
            },
            {
              attr_id: 'uniqueId',
              display_name: 'uniqueId',
              datatype: 'STRING',
              show: false
            },
            {
              attr_id: 'qval',
              datatype: 'NUMBER',
              display_name: 'MutSig',
              show: false
            }
          ];
          break;
        case 'cna':
          _attr = [
            {
              attr_id: 'gene',
              display_name: 'Gene',
              datatype: 'STRING',
              column_width: 85
            },
            {
              attr_id: 'cytoband',
              display_name: 'Cytoband',
              datatype: 'STRING',
              column_width: 100
            },
            {
              attr_id: 'altType',
              display_name: 'CNA',
              datatype: 'STRING',
              column_width: 55
            },
            {
              attr_id: 'cases',
              display_name: '#',
              datatype: 'NUMBER',
              column_width: 75
            },
            {
              attr_id: 'altrateInSample',
              display_name: 'Freq',
              datatype: 'PERCENTAGE',
              column_width: 78
            },
            {
              attr_id: 'caseIds',
              display_name: 'Cases',
              datatype: 'STRING',
              show: false
            },
            {
              attr_id: 'uniqueId',
              display_name: 'uniqueId',
              datatype: 'STRING',
              show: false
            },
            {
              attr_id: 'qval',
              datatype: 'NUMBER',
              display_name: 'Gistic',
              show: false
            }
          ];
          break;
        default:
          _attr = [
            {
              attr_id: 'name',
              display_name: 'Unknown',
              datatype: 'STRING',
              column_width: 230
            }, {
              attr_id: 'color',
              display_name: 'Color',
              datatype: 'STRING',
              show: false
            }, {
              attr_id: 'cases',
              display_name: '#',
              datatype: 'NUMBER',
              column_width: 75
            }, {
              attr_id: 'caseRate',
              display_name: 'Freq',
              datatype: 'PERCENTAGE',
              column_width: 90
            }, {
              attr_id: 'caseIds',
              display_name: 'Cases',
              datatype: 'STRING',
              show: false
            }, {
              attr_id: 'uniqueId',
              display_name: 'uniqueId',
              datatype: 'STRING',
              show: false
            }];
          break;
      }
      return _attr;
    };
    return content;
  })();
})(
  window.iViz,
  window.dc,
  window._,
  window.React,
  window.ReactDOM,
  window.EnhancedFixedDataTableSpecial
);
