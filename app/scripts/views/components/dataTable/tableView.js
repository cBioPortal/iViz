/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an 'as is' basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Created by Karthik Kalletla on 6/20/16.
 */
'use strict';
(function(iViz, dc, _, $) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.tableView = function() {
    var content = {};
    var chartId_, geneData_, data_;
    var type_ = '';
    var attr_ = [];
    var selectedRows = [];
    var selectedGenes = [];
    var callbacks_ = {};
    var sequencedSampleIds = [];
    var selectedSamples = [];
    var allSamplesIds = [];
    var reactTableData = {};
    var initialized = false;
    var patientDataIndices = {};
    var selectedRowData = [];

    content.getCases = function() {
      return _.intersection(selectedSamples, sequencedSampleIds);
    };

    content.getSelectedRowData = function() {
      return selectedRowData;
    };
    content.clearSelectedRowData = function() {
      selectedRowData = [];
    };


    content.init =
      function(_attributes, _selectedSamples, _selectedGenes, _indices,
               _data, _chartId, _callbacks) {
        initialized = false;
        allSamplesIds = _attributes.options.allCases;
        selectedSamples = _selectedSamples;
        sequencedSampleIds = _attributes.options.sequencedCases;
        selectedGenes = _selectedGenes;
        chartId_ = _chartId;
        patientDataIndices = _indices;
        data_ = _data;
        geneData_ = _attributes.gene_list;
        type_ = _attributes.type;
        callbacks_ = _callbacks;
        if (iViz.util.tableView.compare(allSamplesIds, _selectedSamples)) {
          initReactTable(true);
        } else {
          content.update(_selectedSamples);
        }
      };

    content.update = function(_selectedSamples, _selectedRows) {
      var selectedGenesMap_ = [];
      var includeMutationCount = false;
      if (_selectedRows !== undefined)
        selectedRows = _selectedRows;
      if ((!initialized) || (!iViz.util.tableView.compare(selectedSamples, _selectedSamples))) {
        initialized = true;
        selectedSamples = _selectedSamples;
        if (!iViz.util.tableView.compare(allSamplesIds, _selectedSamples)) {
          _.each(_selectedSamples, function(caseId) {
            var caseIndex_ = patientDataIndices[caseId];
            var caseData_ = data_[caseIndex_];
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
            }
            _.each(tempData_, function(geneIndex) {
              if (selectedGenesMap_[geneIndex] === undefined) {
                selectedGenesMap_[geneIndex] = {};
                if (includeMutationCount) {
                  selectedGenesMap_[geneIndex].num_muts = 1;
                }
                selectedGenesMap_[geneIndex].caseIds = [caseId];
              } else {
                if (includeMutationCount) {
                  selectedGenesMap_[geneIndex].num_muts =
                    selectedGenesMap_[geneIndex].num_muts + 1;
                }
                selectedGenesMap_[geneIndex].caseIds.push(caseId);
              }
            });
          });
          initReactTable(true,selectedGenesMap_);
        } else {
          initReactTable(true);
        }
      }else{
        initReactTable(false);
      }
    };

    content.updateGenes = function(genes) {
      selectedGenes = genes;
      initReactTable(false);
    };

    function initReactTable(_reloadData,_selectedGenesMap) {
      if(_reloadData)
        reactTableData = initReactData(_selectedGenesMap);
      var _opts = {
        input: reactTableData,
        filter: "ALL",
        download: "NONE",
        downloadFileName: "data.txt",
        showHide: false,
        hideFilter: true,
        scroller: true,
        resultInfo: false,
        groupHeader: false,
        fixedChoose: false,
        uniqueId: 'uniqueId',
        rowHeight: 25,
        tableWidth: 373,
        maxHeight: 290,
        headerHeight: 26,
        groupHeaderHeight: 40,
        autoColumnWidth: false,
        columnMaxWidth: 300,
        columnSorting: false,
        selectedRows: selectedRows,
        selectedGene: selectedGenes,
        rowClickFunc: reactRowClickCallback,
        geneClickFunc: reactGeneClickCallback,
        selectButtonClickCallback: reactSubmitClickCallback,
        // sortBy: "name",
        // sortDir: "DESC",
        tableType: type_
      };
      var testElement = React.createElement(EnhancedFixedDataTableSpecial,
        _opts);

      ReactDOM.render(testElement, document.getElementById(chartId_));
    }

    function mutatedGenesData(_selectedGenesMap) {
      var genes = [];
      var numOfCases_ = content.getCases().length;
      if (geneData_) {
        $.each(geneData_, function(index, item) {
          var datum = {};
          datum.gene = item.gene;
          if (_selectedGenesMap !== undefined) {
            if (_selectedGenesMap[item.index] !== undefined) {
              datum.caseIds = _.uniq(_selectedGenesMap[item.index].caseIds);
              datum.samples = datum.caseIds.length;
              switch (type_) {
                case 'mutatedGene':
                  datum.numOfMutations = _selectedGenesMap[item.index].num_muts;
                  datum.sampleRate = (numOfCases_ <= 0 ? 0 :
                      ((datum.samples / Number(numOfCases_) * 100).toFixed(
                        1))) + '%';
                  datum.uniqueId = datum.gene;
                  break;
                case 'cna':
                  datum.cytoband = item.cytoband;
                  datum.altType = item.cna;
                  datum.altrateInSample = ((numOfCases_ <= 0 ? 0 :
                      (datum.samples / numOfCases_ * 100).toFixed(1))) + '%';
                  datum.uniqueId = datum.gene + '-' + datum.altType;
                  break;
              }
            } else {
              return;
            }
          } else {
            datum.caseIds = _.uniq(item.caseIds);
            //if(!initialLoaded)
            datum.samples = datum.caseIds.length;
            switch (type_) {
              case 'mutatedGene':
                datum.numOfMutations = item.num_muts;
                datum.sampleRate = (numOfCases_ <= 0 ? 0 :
                    ((datum.samples / Number(numOfCases_) * 100).toFixed(1))) +
                  '%';
                datum.uniqueId = datum.gene;
                break;
              case 'cna':
                datum.cytoband = item.cytoband;
                datum.altType = item.cna;
                datum.altrateInSample = ((numOfCases_ <= 0 ? 0 :
                    (datum.samples / numOfCases_ * 100).toFixed(1))) + '%';
                datum.uniqueId = datum.gene + '-' + datum.altType;
                break;
            }
          }

          if (item.qval !== null) {
            var qval = Number(item.qval);
            if (qval === 0) {
              datum.qval = 0;
            } else {
              datum.qval = qval.toExponential(1);
            }
          } else {
            datum.qval = '';
          }

          genes.push(datum);
        })
      }
      /*if(!initialLoaded){
        initialLoaded = true;
      }*/
      return genes;

    }

    function initReactData(_selectedGenesMap) {
      attr_ = iViz.util.tableView.getAttributes(type_);
      var result = {
        data: [],
        attributes: attr_
      };
      var _mutationData = mutatedGenesData(_selectedGenesMap);
      _.each(_mutationData, function(item, index) {
        for (var key in item) {
          var datum = {
            attr_id: key,
            uniqueId: item.uniqueId,
            attr_val: key === 'caseIds' ? item.caseIds.join(',') : item[key]
          };
          result.data.push(datum);
        }
      });
      return result;

    }

    function reactSubmitClickCallback(){
      var selectedSamplesUnion = _.pluck(selectedRowData,'caseIds');
      $.each(selectedRowData, function(index,item){
        var casesIds = item.caseIds.split(',');
        selectedSamplesUnion = selectedSamplesUnion.concat(casesIds);
      });
      // selectedRowData = [];
      callbacks_.submitClick(_.unique(selectedSamplesUnion));

    }

    function reactRowClickCallback(data, selected, _selectedRows) {
      if(selected){
        selectedRowData.push(data);
      }
      else{
        selectedRowData = _.filter(selectedRowData, function(index,item){
          if(item.uniqueId === selected.uniqueId){
            return false;
          }return true
        })
      }
      callbacks_.rowClick(selectedRowData.length>0);
     /* var selectedRows_ = [];
      _.each(_selectedRows, function(item) {
        selectedRows_.push(item.uniqueId)
      });
      selectedRows = selectedRows_;
      if (callbacks_.hasOwnProperty('rowClick')) {
        callbacks_.rowClick(_selectedRows, data, selected);
      }*/
    }

    function reactGeneClickCallback(selectedRow, selected) {
      callbacks_.addGeneClick(selectedRow);
    }

    return content;
  };


  iViz.util.tableView = (function() {
    var content = {};
    content.compare = function(arr1, arr2) {
      if (arr1.length != arr2.length) return false;
      for (var i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) == -1)
          return false;
      }
      return true;
    };

    content.getAttributes = function(type) {
      var _attr = [];
      switch (type) {
        case 'mutatedGene':
          _attr = [
            {
              "attr_id": "gene",
              "display_name": "Gene",
              "datatype": "STRING",
              "column_width": 100
            }, {
              "attr_id": "numOfMutations",
              "display_name": "# Mut",
              "datatype": "NUMBER",
              "column_width": 90
            },
            {
              "attr_id": "samples",
              "display_name": "#",
              "datatype": "NUMBER",
              "column_width": 90
            },
            {
              "attr_id": "sampleRate",
              "display_name": "Freq",
              "datatype": "PERCENTAGE",
              "column_width": 93
            },
            {
              "attr_id": "caseIds",
              "display_name": "Cases",
              "datatype": "STRING",
              "show": false
            },
            {
              "attr_id": "uniqueId",
              "display_name": "uniqueId",
              "datatype": "STRING",
              "show": false
            },
            {
              "attr_id": "qval",
              "datatype": "NUMBER",
              "display_name": "MutSig",
              "show": false
            }
          ];
          break;
        case 'cna':
          _attr = [
            {
              "attr_id": "gene",
              "display_name": "Gene",
              "datatype": "STRING",
              "column_width": 80
            },
            {
              "attr_id": "cytoband",
              "display_name": "Cytoband",
              "datatype": "STRING",
              "column_width": 90
            },
            {
              "attr_id": "altType",
              "display_name": "CNA",
              "datatype": "STRING",
              "column_width": 55
            },
            {
              "attr_id": "samples",
              "display_name": "#",
              "datatype": "NUMBER",
              "column_width": 70
            },
            {
              "attr_id": "altrateInSample",
              "display_name": "Freq",
              "datatype": "PERCENTAGE",
              "column_width": 78
            },
            {
              "attr_id": "caseIds",
              "display_name": "Cases",
              "datatype": "STRING",
              "show": false
            },
            {
              "attr_id": "uniqueId",
              "display_name": "uniqueId",
              "datatype": "STRING",
              "show": false
            },
            {
              "attr_id": "qval",
              "datatype": "NUMBER",
              "display_name": "Gistic",
              "show": false
            }
          ];
          break;
      }
      return _attr;
    };
    return content;
  })();
})(window.iViz,
  window.dc,
  window._,
  window.$ || window.jQuery);