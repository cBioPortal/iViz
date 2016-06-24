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
    var chartId_ , geneData_, data_;
    var type_='';
    var attr_=[];
    var selectedRows = [];
    var selectedGenes = [];
    var callbacks_ = {};
    var sequencedSampleIds = [];
    var selectedSamples = [];
    var allSamplesIds = [];

    content.getCases = function(){
      return _.intersection(selectedSamples,sequencedSampleIds);
    };

    content.init = function (_selectedSamples,_geneData,_data, _chartId,_type,_callbacks) {
      _.each(_geneData, function (item, index) {
        sequencedSampleIds = sequencedSampleIds.concat(item.caseIds);
      });
      sequencedSampleIds = _.uniq(sequencedSampleIds);
      allSamplesIds = _selectedSamples;
      selectedSamples = _selectedSamples;
      chartId_ = _chartId;
      data_ = _data;
      geneData_ = _geneData;
      type_ = _type;
      callbacks_ = _callbacks;
      initReactTable();
    };

    content.update = function(_selectedSamples,_selectedRows){
      var updatedGenes_ = [];
      var includeMutationCount = false;
      if(_selectedRows !== undefined)
        selectedRows = _selectedRows;
      if(!iViz.util.tableView.compare(selectedSamples,_selectedSamples)){
        selectedSamples = _selectedSamples;
      if(!iViz.util.tableView.compare(allSamplesIds,_selectedSamples)){
          _.each(data_,function(item, index){
            var sampleId = item.sample_id;
            if(_selectedSamples.indexOf(sampleId)!==-1){
              var tempData_ = '';
              switch(type_){
                case 'mutatedGene':
                  tempData_ = item.mutated_genes;
                  includeMutationCount = true;
                  break;
                case 'cna':
                  tempData_ = item.cna_details;
                  includeMutationCount = false;
                  break;
              }
              _.each(tempData_,function(geneIndex){
                if(updatedGenes_[geneIndex] === undefined){
                  updatedGenes_[geneIndex] = {};
                  if(includeMutationCount){
                    updatedGenes_[geneIndex].num_muts = 1;
                  }
                  updatedGenes_[geneIndex].caseIds = [sampleId];
                }else{
                  if(includeMutationCount){
                    updatedGenes_[geneIndex].num_muts = updatedGenes_[geneIndex].num_muts+1;
                  }
                  updatedGenes_[geneIndex].caseIds.push(sampleId);
                }
              });
            }
          });
          initReactTable(updatedGenes_);
        }else{
          initReactTable();
        }
      }
    };

    content.updateGenes = function(genes){
      selectedGenes = genes;
      initReactTable();
    };

    function initReactTable(_updatedMutatedGenes) {
      var _data = initReactData(_updatedMutatedGenes);
      var _opts = {
        input: _data,
        filter: "ALL",
        download: "NONE",
        downloadFileName: "data.txt",
        showHide: false,
        hideFilter: true,
        scroller: true,
        resultInfo: false,
        groupHeader: false,
        fixedChoose: false,
        uniqueId: "uniqueId",
        rowHeight: 25,
        tableWidth: 375,
        maxHeight: 290,
        headerHeight: 26,
        groupHeaderHeight: 40,
        autoColumnWidth: false,
        columnMaxWidth: 300,
        columnSorting: false,
        selectedRow: selectedRows,
        selectedGene: selectedGenes,
        rowClickFunc: reactRowClickCallback,
        geneClickFunc: reactGeneClickCallback,
        tableType: type_
      };
      var testElement = React.createElement(EnhancedFixedDataTableSpecial, _opts);

      ReactDOM.render(testElement, document.getElementById(chartId_));
    }

    function mutatedGenesData(selectedSamples) {
      var genes = [];
      var numOfCases_ = content.getCases().length;
      if (geneData_) {
        _.each(geneData_, function (item, index) {
          var datum = {};
          datum.gene = item.gene;
          if(selectedSamples !== undefined){
            if(selectedSamples[item.index]!==undefined){
              datum.caseIds = _.uniq(selectedSamples[item.index].caseIds);
              datum.samples = datum.caseIds.length;
              switch(type_){
                case 'mutatedGene':
                  datum.numOfMutations = selectedSamples[item.index].num_muts;
                  datum.sampleRate = (numOfCases_ <= 0 ? 0 :
                      ((datum.samples / Number(numOfCases_) * 100).toFixed(1))) + '%';
                  datum.uniqueId = datum.gene;
                  break;
                case 'cna':
                  datum.cytoband = item.cytoband;
                  datum.altType = item.cna;
                  datum.altrateInSample = ((numOfCases_ <= 0 ? 0 :
                      (datum.samples / numOfCases_ * 100).toFixed(1))) + '%';
                  datum.uniqueId = datum.gene+'-'+ datum.altType;
                  break;
              }
            }else{
              return;
            }
          }else{
            datum.caseIds = _.uniq(item.caseIds);
            datum.samples = datum.caseIds.length;
            switch(type_){
              case 'mutatedGene':
                datum.numOfMutations = item.num_muts;
                datum.sampleRate = (numOfCases_ <= 0 ? 0 :
                    ((datum.samples / Number(numOfCases_) * 100).toFixed(1))) + '%';
                datum.uniqueId = datum.gene;
                break;
              case 'cna':
                datum.cytoband = item.cytoband;
                datum.altType = item.cna;
                datum.altrateInSample = ((numOfCases_ <= 0 ? 0 :
                    (datum.samples / numOfCases_ * 100).toFixed(1))) + '%';
                datum.uniqueId = datum.gene+'-'+ datum.altType;
                break;
            }
          }

          if (item.qval!==null) {
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
      return genes;
    }

    function initReactData(_updatedMutatedGenes) {
      attr_ = iViz.util.tableView.getAttributes(type_);
      var result = {
        data: [],
        attributes: attr_
      };
      var _mutationData = mutatedGenesData(_updatedMutatedGenes);
      _.each(_mutationData, function (item, index) {
        for(var key in item) {
          var datum = {
            attr_id : key,
            uniqueId: item.uniqueId,
            attr_val: key === 'caseIds' ? item.caseIds.join(',') : item[key]
          };
          result.data.push(datum);
        }
      });
      return result;
    }

    function reactRowClickCallback(data, selected, _selectedRows) {
      var selectedRows_ = [];
      _.each(_selectedRows,function(item){
        selectedRows_.push(item.uniqueId)
      });
      selectedRows = selectedRows_;
      if(callbacks_.hasOwnProperty('rowClick')) {
        callbacks_.rowClick( _selectedRows, data, selected);
      }
    }

    function reactGeneClickCallback(selectedRow, selected) {
      callbacks_.addGeneClick(selectedRow);
    }
    return content;
  };


  iViz.util.tableView = (function() {
    var content = {};
    content.compare = function(arr1,arr2) {
      if (arr1.length != arr2.length) return false;
      for (var i = 0; i < arr2.length; i++) {
        if(arr1.indexOf(arr2[i]) == -1)
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
              "column_width": 95
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
              "column_width": 80
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