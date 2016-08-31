/**
 * Created by Yichao Sun on 5/18/16.
 */

'use strict';
(function(iViz, _) {
  iViz.view.component.Survival = function() {
    var content_ = this;
    var data_ = {};
    var opts_ = {};

    content_.init = function(_data, _opts, _selectedPatientList) {
      opts_ = $.extend(true, {}, _opts);
      $('#' + opts_.chartId).empty();
      data_ = _data;
      var _dataProxy = new iViz.data.SurvivalChartProxy(_data, opts_.attrId);
      this.chartInst_ =
        new iViz.view.component
          .SurvivalCurve(opts_.chartId, _dataProxy.get(), opts_);
      this.update(_selectedPatientList, opts_.chartId, opts_.attrId);
    };

    // _attrId here indicates chart type (OS or DFS)
    content_.update = function(_selectedPatients, _chartId, _attrId) {
      // remove previous curves
      this.chartInst_.removeCurves();

      // separate selected and unselected data
      var _selectedData = [];
      var _unselectedData = [];
      var _tmpSelectedPatientIdMap = {};
      _.each(_selectedPatients, function(_patientId) {
        _tmpSelectedPatientIdMap[_patientId] = '';
      });
      _.each(Object.keys(iViz.getCaseIndices(opts_.type)),
        function(_patientId) {
          var _index = iViz.getCaseIndices(opts_.type)[_patientId];
          if (_tmpSelectedPatientIdMap.hasOwnProperty(_patientId)) {
            _selectedData.push(data_[_index]);
          } else {
            _unselectedData.push(data_[_index]);
          }
        });

      // settings for different curves
      var _selectedDataProxy =
        new iViz.data.SurvivalChartProxy(_selectedData, _attrId);
      var _unselectedDataProxy =
        new iViz.data.SurvivalChartProxy(_unselectedData, _attrId);

      // add curves
      if (_unselectedDataProxy.get().length === 0) {
        this.chartInst_.addCurve(_selectedDataProxy.get(), 0, '#2986e2');
        this.chartInst_.removePval();
      } else {
        this.chartInst_.addCurve(_selectedDataProxy.get(), 0, 'red');
        this.chartInst_.addCurve(_unselectedDataProxy.get(), 1, '#2986e2');
        this.chartInst_.addPval(
          _selectedDataProxy.get(), _unselectedDataProxy.get());
      }
    };

    content_.updateDataForDownload = function(fileType) {
      if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

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
  };
  iViz.view.component.Survival.prototype =
    new iViz.view.component.GeneralChart('survivalPlot');
  iViz.view.component.Survival.constructor = iViz.view.component.Survival;
})(
  window.iViz,
  window._
);
