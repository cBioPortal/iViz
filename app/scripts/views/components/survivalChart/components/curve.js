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

var survivalCurve = function (_divId, _data, _opts) {

  var _self = this;

  _self.elem_ = '';
  _self.divId_ = _divId;
  _self.data_ = _data;
  var formatAsPercentage_ = d3.format('%');
  
  var leftMargin_ = 60, rightMargin_ = 10,
      topMargin_ = 15, bottomMargin_ = 60;

  _self.elem_ = d3.select('#' + _self.divId_);
  _self.elem_.svg = _self.elem_.append('svg')
    .attr('width', _opts.width)
    .attr('height', _opts.height);

  // init axis
  _self.elem_.xScale = d3.scale.linear()
    .domain([0, d3.max(_.pluck(_self.data_, 'time'))])
    .range([leftMargin_,  _opts.width - rightMargin_]);
  _self.elem_.yScale = d3.scale.linear()
    .domain([-0.03, 1.05]) //fixed to be 0-1
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
    .attr('transform', 'translate(0, ' + (topMargin_ - bottomMargin_ + _opts.height) + ')')
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
    .style('font-weight','bold')
    .text('Months Survival');
  _self.elem_.svg.append('text')
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('x', (topMargin_ - _opts.height) /2)
    .attr('y', leftMargin_ - 45 )
    .style('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight','bold')
    .text('Surviving');

  _self.elem_.dots = [];
  _self.elem_.line = [];

};

survivalCurve.prototype.addCurve = function(_data, _curveIndex, _lineColor) {
  
  var _self = this;
  
  // add an empty/zero point so the curve starts from zero time point
  if (_data[0].time !== 0) {
    _data.unshift({
      status: 0,
      survival_rate: 1,
      time: 0
    });
  }
  
  // init line elem
  _self.elem_.line[_curveIndex] = d3.svg.line()
    .interpolate('step-after')
    .x(function (d) {
      return _self.elem_.xScale(d.time);
    })
    .y(function (d) {
      return _self.elem_.yScale(d.survival_rate);
    });
  
  // draw line
  if (_data !== null && _data.length > 0) {
    _self.elem_.svg.append('path')
      .attr('id', _self.divId_ + '-line')
      .attr('d', _self.elem_.line[_curveIndex](_data))
      .attr('class', 'curve')
      .style('fill', 'none')
      .style('stroke', _lineColor);
  }

  // draw censored dots
  // crossDots specifically for the curve for easier deletion
  // changed two separate lines to a single cross symbol
  _self.elem_.svg.selectAll('path')
    .data(_data)
    .enter()
    .append('line')
    .filter(function (d) {
      return d.status === 0;
    })
    .attr('x1', function(d) { return _self.elem_.xScale(d.time); })
    .attr('y1', function(d) { return _self.elem_.yScale(d.survival_rate) - 5; })
    .attr('x2', function(d) { return _self.elem_.xScale(d.time); })
    .attr('y2', function(d) { return _self.elem_.yScale(d.survival_rate) + 5 ; })
    .attr('class', 'curve')
    .style('stroke-width', 1)
    .style('stroke', _lineColor);

  // draw invisible dots
  _self.elem_.dots[_curveIndex] = _self.elem_.svg.append("g");
  _self.elem_.dots[_curveIndex].selectAll('path')
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
        .style('opacity', .5);

        $(this).qtip(
          {
            content: {text: function() {
              var content =
                'Survival Rate: ' + '<strong>' + _survivalRate + '</strong>' + '<br>' +
                'Months: ' + '<strong>' + _time + '</strong>' + '<br>' +
                'Patient ID: ' + '<strong>' + d.patient_id + '</strong>' + '<br>' +
                'Study: ' + '<strong>' + d.study_id + '</strong>';
              return content;
            }},
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow qtip-wide'},
            show: {
              event: 'mouseover',
              ready: true
            },
            hide: {fixed:true, delay: 100, event: 'mouseout'},
            position: {my:'left bottom',at:'top right'}
          }
        );
    })
    .on('mouseout', function(d) {
      var dot = d3.select(this);
      dot.transition()
        .duration(300)
        .style('opacity', 0);
    })
    .attr('time', function(d) { return d.time; })
    .attr('survival_rate', function(d) { return d.survival_rate; })
    .attr('d', d3.svg.symbol()
      .size(300)
      .type('circle'))
    .attr('transform', function(d){
      return 'translate(' + _self.elem_.xScale(d.time) + ', ' + _self.elem_.yScale(d.survival_rate) + ')';
    })
    .attr('fill', _lineColor)
    .style('opacity', 0)
    .attr('class', 'curve')
    .attr('class', 'invisible_dots');
  
}

survivalCurve.prototype.removeCurves = function() {
  var _self = this;
  _self.elem_.svg.selectAll(".curve").remove();
  _self.elem_.svg.selectAll(".invisible_dots").remove();
}