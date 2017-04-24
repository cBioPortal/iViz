/**
 * @author Hongxin Zhang on 3/10/16.
 */

'use strict';
(function(iViz, d3, dc, _, $, React, ReactDOM, EnhancedFixedDataTableSpecial) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.PieChart = function(ndx, attributes, opts, cluster) {
    var content = this;
    var v = {};

    v.chart = '';

    v.data = {
      color: $.extend(true, [], iViz.util.getColors()),
      category: ''
    };

    /* HTML options*/
    v.opts = {};

    v.opts = $.extend(true, v.opts, opts);
    v.data = $.extend(true, v.data, attributes);
    v.data.ndx = ndx;

    var labels = {};
    var reactTableData = {};
    reactTableData.attributes = [{
      attr_id: 'name',
      display_name: v.data.display_name,
      datatype: 'STRING',
      column_width: 235
    }, {
      attr_id: 'color',
      display_name: 'Color',
      datatype: 'STRING',
      show: false
    }, {
      attr_id: 'cases',
      display_name: '#',
      datatype: 'NUMBER',
      column_width: 70
    }, {
      attr_id: 'sampleRate',
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
    var currentView = 'pie';
    var updateQtip = false;
    var qtipRendered = false;
    var isFiltered = false;

    /**
     * Only will be initialized at first time. Label name as key, contains color.
     * @type {{}}
     */
    var labelInitData = {};

    var dcGroup_ = '';
    var dcDimension_ = '';

    initDCPieChart();

    content.getChart = function() {
      return v.chart;
    };

    content.changeView = function(vm, toTableView) {
      currentView = toTableView ? 'table' : 'pie';
      var chartDivDom = $('#' + v.opts.chartDivId);
      chartDivDom.css('z-index', 16000);

      // qtip wont be needed in table view
      chartDivDom.qtip('destroy', true);

      if (currentView === 'table') {
        if (qtipRendered) {
          updateReactTable();
        } else {
          updatePieLabels();
        }
        animateTable('#' + v.opts.chartDivId, 'table', function() {
          vm.$dispatch('update-grid');
          $('#' + v.opts.chartDivId).css('z-index', '');
        });
      } else {
        animateTable('#' + v.opts.chartDivId, 'pie', function() {
          vm.$dispatch('update-grid');
          $('#' + v.opts.chartDivId).css('z-index', '1');
        });
        content.initMainDivQtip();
      }
    };

    content.initMainDivQtip = function() {
      $('#' + v.opts.chartDivId).qtip({
        id: v.opts.chartDivId + '-qtip',
        style: {
          classes: 'qtip-light qtip-rounded qtip-shadow forceZindex qtip-max-width iviz-pie-qtip iviz-pie-label-qtip'
        },
        show: {event: 'mouseover', delay: 300, ready: true},
        hide: {fixed: true, delay: 300, event: 'mouseleave'},
        // hide: false,
        position: {my: 'left center', at: 'center right', viewport: $(window)},
        content: '<div id="qtip-' + v.opts.chartDivId + '-content-react">Loading....</div>',
        events: {
          show: function() {
            if (updateQtip) {
              updateQtip = false;
              updatePieLabels();
            }
          },
          render: function() {
            qtipRendered = true;
            updatePieLabels();
          }
        }
      });
    };

    content.updateDataForDownload = function(fileType) {
      if (fileType === 'tsv') {
        initTsvDownloadData();
      } else if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

    content.filtered = function() {
      updateTables();
      isFiltered = true;
      updateQtip = false;
    };

    content.getCurrentCategories = function(sortBy) {
      var categories = [];

      sortBy = sortBy || 'value';
      _.each(_.sortBy(dcGroup_.top(Infinity), sortBy), function(label) {
        var _labelDatum = {};
        var _labelValue = Number(label.value);
        if (_labelValue > 0) {
          _labelDatum.id = labelInitData[label.key].id;
          _labelDatum.index = labelInitData[label.key].index;
          _labelDatum.name = label.key;
          _labelDatum.color = labelInitData[label.key].color;
          _labelDatum.cases = _labelValue;
          categories.push(_labelDatum);
        }
      });
      return categories;
    };

    function getCurrentSampleSizeFromCategories(categories) {
      var currentSampleSize = 0;
      for (var key in categories) {
        if (categories.hasOwnProperty(key)) {
          currentSampleSize += categories[key].cases;
        }
      }
      return currentSampleSize;
    }

    /**
     * This is the function to initialize dc pie chart instance.
     */
    function initDCPieChart() {
      if (v.opts.hasOwnProperty('chartId') &&
        v.data.hasOwnProperty('ndx') &&
        v.data.hasOwnProperty('attr_id')) {
        var width = v.opts.width || 130;
        var height = v.opts.height;
        var radius = (width - 20) / 2;
        var color = $.extend(true, [], v.data.color);

        v.chart = dc.pieChart('#' + v.opts.chartId, v.opts.groupid);

        v.data.attrKeys = cluster.group().all().map(function(d) {
          return d.key;
        });

        v.data.category = iViz.util.pieChart.getCategory(v.data.attr_id,
          v.data.attrKeys);

        v.data.attrKeys.sort(function(a, b) {
          return a < b ? -1 : 1;
        });

        var NAIndex = v.data.attrKeys.indexOf('NA');
        if (NAIndex !== -1) {
          color.splice(NAIndex, 0, '#CCCCCC');
        }

        // Initial labels data with colors.
        _.each(v.data.attrKeys, function(attr, index) {
          labelInitData[attr] = {
            attr: attr,
            color: color[index],
            id: attr,
            index: index
          };
        });

        dcDimension_ = cluster;
        dcGroup_ = cluster.group();

        v.chart
          .width(width)
          .height(height)
          .radius(radius)
          .dimension(dcDimension_)
          .group(dcGroup_)
          .transitionDuration(v.opts.transitionDuration || 400)
          .ordinalColors(color)
          .label(function(d) {
            return d.value;
          })
          .ordering(function(d) {
            return d.key;
          });
        v.chart.on('preRedraw', function() {
          removeMarker();
        });
        v.chart.on('postRedraw', function() {
          // TODO:commented this because this is taking much time to redraw
          // after applying filter, need to find different way
          if (isFiltered) {
            updateQtip = false;
            isFiltered = false;
          } else {
            updateQtip = true;
            if (currentView === 'table') {
              updatePieLabels();
            }
          }
        });
      } else {
        // TODO:
        /**
         * Need a handler if no dimension ID passed.
         */
      }
    }

    function initTsvDownloadData() {
      var data = [v.data.display_name + '\tCount'];

      _.each(labels, function(label, key) {
        data.push(label.name + '\t' + label.cases);
      });

      content.setDownloadData('tsv', {
        fileName: v.data.display_name || 'Pie Chart',
        data: data.join('\n')
      });
    }

    function initCanvasDownloadData() {
      content.setDownloadData('svg', {
        title: v.data.display_name,
        chartDivId: v.opts.chartDivId,
        chartId: v.opts.chartId,
        fileName: v.data.display_name,
        labels: labels
      });
      content.setDownloadData('pdf', {
        title: v.data.display_name,
        chartDivId: v.opts.chartDivId,
        chartId: v.opts.chartId,
        fileName: v.data.display_name,
        labels: labels
      });
    }

    function animateTable(target, view, callback) {
      var width = window.iViz.styles.vars.width.one;
      var height = window.iViz.styles.vars.height.one;

      if (view === 'table') {
        width = window.iViz.styles.vars.width.two;
        height = window.iViz.styles.vars.height.two;
        if (Object.keys(labels).length <= 3) {
          height = window.iViz.styles.vars.height.one;
        }
      }

      $(target).animate({
        height: height,
        width: width,
        duration: 300,
        queue: false
      }, 300, function() {
        if (_.isFunction(callback)) {
          callback();
        }
      });
    }

    function updatePieLabels() {
      updateCurrentLabels();
      initReactData();
      updateTables();
    }

    function updateTables() {
      if (currentView === 'pie' && qtipRendered) {
        updateQtipReactTable();
      }
      if (currentView === 'table') {
        updateReactTable();
      }
    }

    function updateReactTable() {
      var data = $.extend(true, {}, reactTableData);
      initReactTable(v.opts.chartTableId, data, {
        tableWidth: window.iViz.styles.vars.specialTables.width
      });
    }

    function updateQtipReactTable() {
      var data = $.extend(true, {}, reactTableData);
      data.attributes[0].column_width = 140;
      initReactTable('qtip-' + v.opts.chartDivId + '-content-react', data, {
        tableWidth: 300,
        pieLabelMouseEnterFunc: pieLabelMouseEnter,
        pieLabelMouseLeaveFunc: pieLabelMouseLeave
      });
    }

    function updateCurrentLabels() {
      var _labels = content.getCurrentCategories();
      var _currentSampleSize = getCurrentSampleSizeFromCategories(_labels);

      labels = {};
      _.each(_labels, function(label) {
        label.sampleRate = (_currentSampleSize <= 0 ? 0 : (Number(label.cases) * 100 / _currentSampleSize).toFixed(1).toString()) + '%';
        labels[label.id] = label;
      });
    }

    function initReactData() {
      var _data = [];
      _.each(labels, function(item) {
        for (var key in item) {
          if (item.hasOwnProperty(key)) {
            var datum = {
              attr_id: key,
              uniqueId: item.id,
              attr_val: item[key]
            };
            _data.push(datum);
          }
        }
      });
      reactTableData.data = _data;
    }

    function removeMarker() {
      $('#' + v.opts.chartId).find('svg g .mark').remove();
    }

    function drawMarker(_slice) {
      var _path = $(_slice).find('path');
      var _pointsInfo = _path
        .attr('d')
        .split(/[\s,MLHVCSQTAZ]/);

      var _pointsInfo1 = _path
        .attr('d')
        .split(/[A]/);

      var _fill = _path
        .attr('fill');

      var _x1 = Number(_pointsInfo[1]);
      var _y1 = Number(_pointsInfo[2]);
      var _x2 = Number(_pointsInfo[8]);
      var _y2 = Number(_pointsInfo[9]);
      var _r = Number(_pointsInfo[3]);

      if ((_x1 - _x2 !== 0 || _y1 - _y2 !== 0) && _pointsInfo1.length === 2) {
        var _pointOne = Math.atan2(_y1, _x1);
        var _pointTwo = Math.atan2(_y2, _x2);

        if (_pointOne < -Math.PI / 2) {
          _pointOne = Math.PI / 2 + Math.PI * 2 + _pointOne;
        } else {
          _pointOne = Math.PI / 2 + _pointOne;
        }

        if (_pointTwo < -Math.PI / 2) {
          _pointTwo = Math.PI / 2 + Math.PI * 2 + _pointTwo;
        } else {
          _pointTwo = Math.PI / 2 + _pointTwo;
        }

        // The value of point two should always bigger than the value
        // of point one. If the point two close to 12 oclick, we should
        // change it value close to 2PI instead of close to 0
        if (_pointTwo > 0 && _pointTwo < 0.0000001) {
          _pointTwo = 2 * Math.PI - _pointTwo;
        }

        if (_pointTwo < _pointOne) {
          console.log('%cError: the end angle should always bigger' +
            ' than start angle.', 'color: red');
        }

        var _arc = d3.svg.arc()
          .innerRadius(_r + 3)
          .outerRadius(_r + 5)
          .startAngle(_pointOne)
          .endAngle(_pointTwo);

        d3.select('#' + v.opts.chartId + ' svg g').append('path')
          .attr('d', _arc)
          .attr('fill', _fill)
          .attr('class', 'mark');
      }
    }

    function pieLabelMouseEnter(data) {
      var _slice = getPieSlice(data);
      
      $(_slice).css({
        'fill-opacity': '.5',
        'stroke-width': '3'
      });

      drawMarker(_slice);
    }

    function pieLabelMouseLeave(data) {
      var _slice = getPieSlice(data);

      $(_slice).css({
        'fill-opacity': '1',
        'stroke-width': '1px'
      });
      
      removeMarker();
    }

    function getPieSlice(data) {
      var _color = data.color;
      var _slice;

      $('#' + v.opts.chartId + ' svg g.pie-slice').each(function(index, item) {
        var _sliceColor = $(item).find('path').attr('fill');
        if (_sliceColor === _color) {
          _slice = item;
          $(item).css({
            'fill-opacity': '1',
            'stroke-width': '1px'
          });
        }
      });
      return _slice;
    }

    function initReactTable(targetId, inputData, opts) {
      var selectedRows = v.chart.filters();

      var opts_ = $.extend({
        input: inputData,
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
        tableWidth: 373,
        maxHeight: 290,
        headerHeight: 26,
        groupHeaderHeight: 40,
        autoColumnWidth: false,
        columnMaxWidth: 300,
        columnSorting: false,
        tableType: 'pieLabel',
        selectedRows: selectedRows,
        rowClickFunc: pieLabelClick
      }, opts);

      // Check whether the react table has been initialized
      if (v.renderedReactTable) {
        // Get sort settings from the initialized react table
        var sort_ = v.renderedReactTable.getCurrentSort();
        opts_ = $.extend(opts_, sort_);
      }

      var testElement = React.createElement(EnhancedFixedDataTableSpecial, opts_);

      v.renderedReactTable = ReactDOM.render(testElement, document.getElementById(targetId));
    }

    function pieLabelClick(selectedData) {
      v.chart.onClick({
        key: labels[selectedData.uniqueid].name,
        value: labels[selectedData.uniqueid].value
      });
    }
  };

  iViz.view.component.PieChart.prototype = new iViz.view.component.GeneralChart('pieChart');
  iViz.view.component.PieChart.constructor = iViz.view.component.PieChart;

  // Utils designed for pie chart.
  iViz.util.pieChart = (function() {
    var util = {};
    var v = {};

    v.category = ['w1', 'h1']; // Size class name for chart

    v.labelLT = 5; // Label length threshold
    v.labelHeaderLT = 4; // Label header length threshold

    // If the name lenght bigger the threshold, it will be truncated.
    v.labelWLT = 30; // Label length threshold for wider table
    v.labelHeaderWLT = 20; // Label header length threshold for wider table

    util.getCategory = function(attr, attrKeys) {
      var category = $.extend(true, {}, v.category);
      var maxAttrL = 0;

      _.each(attrKeys, function(key) {
        if (key.length > maxAttrL) {
          maxAttrL = key.length;
        }
      });

      category[0] = maxAttrL <= v.labelLT ? 'w1' : 'w2';

      // Default settings for special attribtues.
      if (['CANCER_TYPE', 'CANCER_TYPE_DETAILED'].indexOf(attr) !== -1) {
        category[0] = 'w2';
      }

      category[1] = attrKeys.length > 10 ? 'h2' : 'h1';

      return category;
    };

    return util;
  })();
})(window.iViz,
  window.d3,
  window.dc,
  window._,
  window.$ || window.jQuery,
  window.React,
  window.ReactDOM,
  window.EnhancedFixedDataTableSpecial
);