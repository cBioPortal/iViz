/**
 * Created by Yichao Sun on 5/11/16.
 */

'use strict';
(function(iViz, _, d3, $, Plotly, cbio) {
  iViz.view.component.ScatterPlot = function() {
    var content = this;
    var chartId_;
    var data_;
    var groups_ = [];
    var opts_;
    var layout_;
    var getQtipString = function(_data) {
      var toReturn = 'Cancer Study:' + _data.study_id + '<br>Sample Id: ' +
        _data.sample_id + '<br>CNA fraction: ';
      if (isNaN(_data.cna_fraction)) {
        toReturn += _data.cna_fraction;
      } else {
        toReturn += cbio.util.toPrecision(_data.cna_fraction, 2, 0.001);
      }
      toReturn += '<br>Mutation count: ' + _data.mutation_count;
      return toReturn;
    };

    content.init = function(_data, opts) {
      opts_ = $.extend(true, {}, opts);
      chartId_ = opts_.chartId;
      data_ = _.filter(_data, function(datum) {
        return !isNaN(datum.cna_fraction) && !isNaN(datum.mutation_count);
      });
      var _xArr = _.pluck(data_, 'cna_fraction');
      var _yArr = _.pluck(data_, 'mutation_count');
      var _qtips = [];
      _.each(data_, function(_dataObj) {
        _qtips.push(getQtipString(_dataObj));
      });
      var trace = {
        x: _xArr,
        y: _yArr,
        text: _qtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 7,
          color: '#2986e2',
          line: {color: 'white'}
        }
      };
      var data = [trace];
      var _marginX = (d3.max(_xArr) - d3.min(_xArr)) * 0.05;
      var _marginY = (d3.max(_yArr) - d3.min(_yArr)) * 0.05;
      layout_ = {
        xaxis: {
          title: 'Fraction of copy number altered genome',
          range: [d3.min(_xArr) - _marginX, d3.max(_xArr) + _marginX],
          zeroline: false,
          showline: true,
          tickangle: -45
        },
        yaxis: {
          title: '# of mutations',
          range: [d3.min(_yArr) - _marginY, d3.max(_yArr) + _marginY],
          zeroline: false,
          showline: true
        },
        hovermode: 'closest',
        dragmode: 'select',
        showlegend: false,
        width: opts_.width || 370,
        height: opts_.height || 320,
        margin: {
          l: 60,
          r: 10,
          b: 50,
          t: 30,
          pad: 0
        }
      };
      Plotly.plot(document.getElementById(chartId_), data, layout_, {
        displaylogo: false,
        modeBarButtonsToRemove: ['sendDataToCloud', 'pan2d',
          'zoomIn2d', 'zoomOut2d', 'resetScale2d',
          'hoverClosestCartesian', 'hoverCompareCartesian', 'toImage']
      });

      // link to sample view
      var _plotsElem = document.getElementById(chartId_);
      _plotsElem.on('plotly_click', function(data) {
        var _pts_study_id =
          data.points[0].data.study_id[data.points[0].pointNumber];
        var _pts_sample_id =
          data.points[0].data.sample_id[data.points[0].pointNumber];
        window.open(
          cbio.util.getLinkToSampleView(_pts_study_id, _pts_sample_id));
      });

      groups_ = [{
        name: 'Unselected',
        data: _data
      }];

      initCanvasDownloadData();
    };

    // update selected samples (change color)
    content.update = function(_sampleIds) {
      var _selectedData = [];
      var _unselectedData = [];

      var _tmpSelectedSampleIdMap = {};
      _.each(_sampleIds, function(_sampleId) {
        _tmpSelectedSampleIdMap[_sampleId] = '';
      });
      _.each(data_, function(_dataObj) {
        if (_tmpSelectedSampleIdMap.hasOwnProperty(_dataObj.sample_id)) {
          _selectedData.push(_dataObj);
        } else {
          _unselectedData.push(_dataObj);
        }
      });

      document.getElementById(chartId_).data = [];
      var _unselectedDataQtips = [];
      var _selectedDataQtips = [];

      _.each(_unselectedData, function(_dataObj) {
        _unselectedDataQtips.push(getQtipString(_dataObj));
      });
      _.each(_selectedData, function(_dataObj) {
        _selectedDataQtips.push(getQtipString(_dataObj));
      });

      groups_ = [];
      if (_selectedData.length > 0) {
        groups_.push({
          name: 'Selected',
          data: _selectedData
        })
      }
      if (_unselectedData.length > 0) {
        groups_.push({
          name: 'Unselected',
          data: _unselectedData
        })
      }
      document.getElementById(chartId_).data[0] = {
        x: _.pluck(_unselectedData, 'cna_fraction'),
        y: _.pluck(_unselectedData, 'mutation_count'),
        text: _unselectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 6,
          color: '#2986e2',
          line: {color: 'white'}
        }
      };
      document.getElementById(chartId_).data[1] = {
        x: _.pluck(_selectedData, 'cna_fraction'),
        y: _.pluck(_selectedData, 'mutation_count'),
        text: _selectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 6,
          color: 'red',
          line: {color: 'white'}
        }
      };

      Plotly.newPlot(document.getElementById(chartId_), document.getElementById(chartId_).data, layout_);

    };

    content.updateDataForDownload = function(fileType) {
      if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      } else if (fileType === 'tsv') {
        initTsvDownloadData();
      }
    };

    function initTsvDownloadData() {
      var _title = opts_.title || 'Mutation Count vs. CNA';
      var _data = ['Patient ID', 'Sample ID', 'Mutation Count', 'CNA', 'Group'];

      _data = [_data.join('\t')];
      _.each(groups_, function(group) {
        _.each(group.data, function(item) {
          var _patientIds = iViz.getPatientIds(item.sample_id);
          var _txt = (_.isArray(_patientIds) ? _patientIds.join(', ') : 'NA') +
            '\t' + item.sample_id + '\t' + item.mutation_count + '\t' +
            item.cna_fraction + '\t' + group.name;
          _data.push(_txt);
        });
      });

      content.setDownloadData('tsv', {
        fileName: _title,
        data: _data.join('\n')
      });
    }

    function initCanvasDownloadData() {
      content.setDownloadData('svg', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
      content.setDownloadData('pdf', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
    }
  };

  iViz.view.component.ScatterPlot.prototype =
    new iViz.view.component.GeneralChart('scatterPlot');
  iViz.view.component.ScatterPlot.constructor =
    iViz.view.component.ScatterPlot;
  iViz.util.scatterPlot = (function() {
  })();
})(window.iViz,
  window._,
  window.d3,
  window.jQuery || window.$,
  window.Plotly,
  window.cbio
);
