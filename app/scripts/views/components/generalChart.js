/**
 * @author Hongxin Zhang on 6/21/16.
 */
(function(iViz, _) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.GeneralChart = function(chartType) {
    'use strict';
    this.chartType = chartType || 'generalChart';
    this.dataForDownload = {};
    this.getCurrentCategories = function() {
      return [];
    };
    this.getChartType = function() {
      return this.chartType;
    };
    this.setChartType = function(chartType) {
      this.chartType = chartType;
    };
    this.getDownloadData = function(fileType) {
      if (_.isFunction(this.updateDataForDownload)) {
        this.updateDataForDownload(fileType);
      }
      return this.dataForDownload[fileType];
    };
    this.setDownloadData = function(type, content) {
      this.dataForDownload[type] = content;
    };
    this.getDownloadFileTypes = function() {
      return Object.keys(this.dataForDownload);
    };
    this.setDownloadDataTypes = function(types) {
      var _self = this;
      _.each(types, function(type) {
        if (!_self.dataForDownload.hasOwnProperty(type)) {
          _self.dataForDownload[type] = '';
        }
      });
    };
  };
})(window.iViz, window._);
