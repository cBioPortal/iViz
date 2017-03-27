'use strict';
(function(iViz, dc, _, d3, LogRankTest) {
  iViz.view.component.SurvivalCurve = function(_divId, _data, _opts) {
    var _self = this;

    _self.elem_ = '';
    _self.divId_ = _divId;
    _self.data_ = _data;
    _self.opts_ = {
      curves: {}
    };
    _self.opts_ = $.extend(true, _self.opts_, _opts);
    var formatAsPercentage_ = d3.format('%');

    var leftMargin_ = 60;
    var rightMargin_ = 10;
    var topMargin_ = 15;
    var bottomMargin_ = 60;

    _self.elem_ = d3.select('#' + _self.divId_);
    _self.elem_.svg = _self.elem_.append('svg')
      .attr('width', _opts.width)
      .attr('height', _opts.height);

    // init axis
    _self.elem_.xScale = d3.scale.linear()
      .domain([0,
        d3.max(_.pluck(_self.data_, 'time')) +
        d3.max(_.pluck(_self.data_, 'time')) / 15])
      .range([leftMargin_, _opts.width - rightMargin_]);
    _self.elem_.yScale = d3.scale.linear()
      .domain([-0.03, 1.05]) // fixed to be 0-1
      .range([topMargin_ - bottomMargin_ + _opts.height, topMargin_]);
    _self.elem_.xAxis = d3.svg.axis()
      .scale(_self.elem_.xScale)
      .orient('bottom')
      .tickSize(6, 0, 0);
    _self.elem_.yAxis = d3.svg.axis()
      .scale(_self.elem_.yScale)
      .tickFormat(formatAsPercentage_)
      .orient('left')
      .tickSize(6, 0, 0);

    // draw axis
    _self.elem_.svg.append('g')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('stroke', 'black')
      .attr('class', 'survival-curve-x-axis-class')
      .style('shape-rendering', 'crispEdges')
      .attr('transform', 'translate(0, ' +
        (topMargin_ - bottomMargin_ + _opts.height) + ')')
      .call(_self.elem_.xAxis);
    _self.elem_.svg.append('g')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('shape-rendering', 'crispEdges')
      .attr('transform', 'translate(0, ' + topMargin_ + ')')
      .call(_self.elem_.xAxis.orient('bottom').ticks(0));
    _self.elem_.svg.append('g')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('stroke', 'black')
      .attr('class', 'survival-curve-y-axis-class')
      .style('shape-rendering', 'crispEdges')
      .attr('transform', 'translate(' + leftMargin_ + ', 0)')
      .call(_self.elem_.yAxis);
    _self.elem_.svg.append('g')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('shape-rendering', 'crispEdges')
      .attr('transform', 'translate(' + (_opts.width - rightMargin_) + ', 0)')
      .call(_self.elem_.yAxis.orient('left').ticks(0));
    _self.elem_.svg.selectAll('text')
      .style('font-family', 'sans-serif')
      .style('font-size', '11px')
      .style('stroke-width', 0.5)
      .style('stroke', 'black')
      .style('fill', 'black');

    // append axis title
    _self.elem_.svg.append('text')
      .attr('class', 'label')
      .attr('x', leftMargin_ + (_opts.width - leftMargin_) / 2)
      .attr('y', (topMargin_ + _opts.height - 25))
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('Months Survival');
    _self.elem_.svg.append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('x', (topMargin_ - _opts.height) / 2)
      .attr('y', leftMargin_ - 45)
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('Surviving');

    _self.elem_.curves = {};
  };

  iViz.view.component.SurvivalCurve.prototype.addCurve = function(_data,
    _curveIndex,
    _lineColor) {
    var _self = this;

    // add an empty/zero point so the curve starts from zero time point
    if (_data !== null && _data.length !== 0) {
      if (_data[0].time !== 0) {
        _data.unshift({
          status: 0,
          survival_rate: 1,
          time: 0
        });
      }
    }

    if (!_self.elem_.curves.hasOwnProperty(_curveIndex)) {
      _self.elem_.curves[_curveIndex] = {};
      _self.elem_.curves[_curveIndex].curve = _self.elem_.svg.append('g')
        .attr('id', _self.divId_ + '-curve-' + _curveIndex);
      _self.elem_.curves[_curveIndex].line = _self.elem_
        .curves[_curveIndex].curve.append('g')
        .attr('class', 'line');
      _self.elem_.curves[_curveIndex].dots = _self.elem_
        .curves[_curveIndex].curve.append('g')
        .attr('class', 'dots');
      _self.elem_.curves[_curveIndex].invisibleDots = _self.elem_
        .curves[_curveIndex].curve.append('g')
        .attr('class', 'invisibleDots');

      // init line elem
      _self.elem_.curves[_curveIndex].lineElem = d3.svg.line()
        .interpolate('step-after')
        .x(function(d) {
          return _self.elem_.xScale(d.time);
        })
        .y(function(d) {
          return _self.elem_.yScale(d.survival_rate);
        });

      // Init opts for the curve
      _self.opts_.curves[_curveIndex] = {};
    }

    // draw line
    if (_data !== null && _data.length > 0) {
      _self.elem_.curves[_curveIndex].line.append('path')
        .attr('d', _self.elem_.curves[_curveIndex].lineElem(_data))
        .attr('class', 'curve')
        .style('fill', 'none')
        .style('stroke', _lineColor);
    }

    // draw censored dots
    // crossDots specifically for the curve for easier deletion
    // changed two separate lines to a single cross symbol
    _self.elem_.curves[_curveIndex].dots.selectAll('path')
      .data(_data)
      .enter()
      .append('path')
      .filter(function(d) {
        return d.status === 0;
      })
      .attr('transform', function(d) {
        return 'translate(' + _self.elem_.xScale(d.time) + ',' +
          _self.elem_.yScale(d.survival_rate) + ')';
      })
      .attr('d', d3.svg.symbol().type('cross')
        .size(function() {
          return 25;
        })
      )
      .attr('class', 'curve')
      .attr('fill', _lineColor);

    // draw invisible dots
    _self.elem_.curves[_curveIndex].invisibleDots.selectAll('path')
      .data(_data)
      .enter()
      .append('svg:path')
      .on('mouseover', function(d) {
        var dot = d3.select(this);
        var _survivalRate = d3.select(this).attr('survival_rate');
        _survivalRate = parseFloat(_survivalRate).toFixed(2);
        var _time = d3.select(this).attr('time');
        _time = parseFloat(_time).toFixed(2);
        dot.transition()
          .duration(300)
          .style('opacity', '.5');

        $(this).qtip(
          {
            content: {
              text: function() {
                var content =
                  (_.isUndefined(_survivalRate) ? '' :
                    ('Survival Rate: <strong>' +
                    _survivalRate + '</strong><br>')) +
                  (_.isUndefined(_time) ? '' :
                    ('Months: <strong>' + _time + '</strong><br>')) +
                  (d.patient_id ?
                    ('Patient ID: <strong><a href="' + window.cbioURL +
                    window.cbio.util
                      .getLinkToPatientView(d.study_id, d.patient_id) +
                    '" target="_blank">' + d.patient_id + '</a></strong><br>') :
                    '') +
                  (d.study_id ?
                    ('Study: <strong>' + d.study_id + '</strong>') : '');
                return content;
              }
            },
            style: {
              classes: 'qtip-light qtip-rounded qtip-shadow ' +
              'qtip-lightyellow qtip-wide'
            },
            show: {
              event: 'mouseover',
              ready: true
            },
            hide: {fixed: true, delay: 100, event: 'mouseout'},
            position: {my: 'left bottom', at: 'top right'}
          }
        );
      })
      .on('mouseout', function() {
        var dot = d3.select(this);
        dot.transition()
          .duration(300)
          .style('opacity', 0);
      })
      .attr('time', function(d) {
        return d.time;
      })
      .attr('survival_rate', function(d) {
        return d.survival_rate;
      })
      .attr('d', d3.svg.symbol()
        .size(300)
        .type('circle'))
      .attr('transform', function(d) {
        return 'translate(' + _self.elem_.xScale(d.time) + ', ' +
          _self.elem_.yScale(d.survival_rate) + ')';
      })
      .attr('fill', _lineColor)
      .style('opacity', 0)
      .attr('class', 'curve')
      .attr('class', 'invisible_dots');
  };

  iViz.view.component.SurvivalCurve.prototype.removeCurves = function() {
    var _self = this;
    for (var key in _self.elem_.curves) {
      if (_self.elem_.curves.hasOwnProperty(key)) {
        _self.elem_.curves[key].curve.remove();
        delete _self.elem_.curves[key];
      }
    }
  };

  iViz.view.component.SurvivalCurve.prototype.addPval =
    function(_selectedData, _unselectedData) {
      var _self = this;
      _self.elem_.svg.selectAll('.pval').remove();
      _selectedData.splice(0, 1);
      _unselectedData.splice(0, 1);
      var _pVal = LogRankTest.calc(_selectedData, _unselectedData);
      _self.elem_.svg.append('text')
        .attr('class', 'pval')
        .attr('x', _self.opts_.width - 30)
        .attr('y', 30)
        .attr('font-size', 10)
        .style('text-anchor', 'end')
        .text('p = ' + _pVal.toPrecision(2));
    };

  iViz.view.component.SurvivalCurve.prototype.addNoInfo =
    function() {
      var _self = this;
      _self.elem_.svg.selectAll('.noInfo').remove();

      _self.elem_.svg.append('text')
        .attr('class', 'noInfo')
        .attr('x', _self.opts_.width / 2 + 25)
        .attr('y', _self.opts_.height / 2)
        .attr('font-size', 15)
        .style('font-style', 'bold')
        .style('text-anchor', 'middle')
        .text('No data available');
    };

  iViz.view.component.SurvivalCurve.prototype.removeNoInfo = function() {
    var _self = this;
    _self.elem_.svg.selectAll('.noInfo').remove();
  };

  iViz.view.component.SurvivalCurve.prototype.removePval = function() {
    var _self = this;
    _self.elem_.svg.selectAll('.pval').remove();
  };

  iViz.view.component.SurvivalCurve.prototype.highlightCurve =
    function(curveIndex) {
      var _self = this;
      if (_self.elem_.curves.hasOwnProperty(curveIndex)) {
        var opacity = '0.5';
        if (_self.opts_.curves[curveIndex].highlighted) {
          opacity = '0';
          _self.opts_.curves[curveIndex].highlighted = false;
        } else {
          _self.opts_.curves[curveIndex].highlighted = true;
        }
        _self.elem_.curves[curveIndex].invisibleDots
          .selectAll('path')
          .style('opacity', opacity);
      }
    };
})(
  window.iViz,
  window.dc,
  window._,
  window.d3,
  window.LogRankTest
);
