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
 * Created by Yichao Sun on 5/18/16.
 */

'use strict';
(function(iViz, _) {
  iViz.view.component.Survival = function() {
    var content_ = this;
    var data_ = {};
    var opts_ = {};

    content_.dataForDownload = {};
    content_.init = function(_data, _opts, _selectedPatientList) { //_attrId here indicates chart type (OS or DFS)
      opts_ = $.extend(true, {}, _opts);
      $('#' + opts_.chartId).empty();
      data_ = _data;
      var _dataProxy = new survivalChartProxy(_data, opts_.attrId);
      this.chartInst_ = new survivalCurve(opts_.chartId, _dataProxy.get(), opts_);
      this.update(_selectedPatientList, opts_.chartId, opts_.attrId);
    };

    content_.update = function(_selectedPatients, _chartId, _attrId) {

      // remove previous curves
      this.chartInst_.removeCurves();

      // separate selected and unselected data
      var _selectedData = [], _unselectedData = [];
      var _tmpSelectedPatientIdMap = {};
      _.each(_selectedPatients, function(_patientId) {
        _tmpSelectedPatientIdMap[_patientId] = '';
      });
      _.each(Object.keys(iViz.getCaseIndices(opts_.type)), function(_patientId) {
        var _index = iViz.getCaseIndices(opts_.type)[_patientId];
        if (_tmpSelectedPatientIdMap.hasOwnProperty(_patientId)) {
          _selectedData.push(data_[_index]);
        } else {
          _unselectedData.push(data_[_index]);
        }
      });
      
      // settings for different curves
      var _selectedDataProxy = new survivalChartProxy(_selectedData, _attrId);
      var _unselectedDataProxy = new survivalChartProxy(_unselectedData, _attrId);

      // add curves
      if (_unselectedDataProxy.get().length === 0) {
        this.chartInst_.addCurve(_selectedDataProxy.get(), 0, "#006bb3");
        this.chartInst_.removePval();
      } else {
        this.chartInst_.addCurve(_selectedDataProxy.get(), 0, "red");
        this.chartInst_.addCurve(_unselectedDataProxy.get(), 1, "#006bb3");
        this.chartInst_.addPval(_selectedDataProxy.get(), _unselectedDataProxy.get());
      }
    }

    content_.updateDataForDownload = function(fileType) {
      if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    }
    
    function initCanvasDownloadData() {
      content_.setDownloadData('svg', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
      content_.setDownloadData('pdf', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
    }

    // return content_;
  };
  iViz.view.component.Survival.prototype = new iViz.view.component.GeneralChart('survivalPlot');
  iViz.view.component.Survival.constructor = iViz.view.component.Survival;
})(window.iViz, window._);
