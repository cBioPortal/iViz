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

var survivalCurve = function (_divId, _data) {

  var elem_ = '';
  var formatAsPercentage_ = d3.format('%');

  // init canvas
  $('#' + _divId).empty();
  elem_ = d3.select('#' + _divId);
  elem_.svg = elem_.append('svg')
    .attr('width', 500)
    .attr('height', 500);
  elem_.curve = elem_.svg.append('g');

  // init axis
  elem_.xScale = d3.scale.linear()
    .domain([0, d3.max(_.pluck(_data, 'time'))])
    .range([70, 420]);
  elem_.yScale = d3.scale.linear()
    .domain([-0.03, 1.05]) //fixed to be 0-1
    .range([380, 30]);
  elem_.xAxis = d3.svg.axis()
    .scale(elem_.xScale)
    .orient('bottom')
    .tickSize(6, 0, 0);
  elem_.yAxis = d3.svg.axis()
    .scale(elem_.yScale)
    .tickFormat(formatAsPercentage_)
    .orient('left')
    .tickSize(6, 0, 0);

  // init lines
  elem_.line = d3.svg.line()
    .interpolate('step-after')
    .x(function (d) {
      return elem_.xScale(d.time);
    })
    .y(function (d) {
      return elem_.yScale(d.survival_rate);
    });

  // draw lines
  if (_data !== null && _data.length > 0) {
    elem_.curve = elem_.svg.append('path')
      .attr('id', _divId + '-line')
      .attr('d', elem_.line(_data))
      .style('fill', 'none')
      .style('stroke', '#006bb3');
  }

  // draw axis
  elem_.svg.append('g')
    .style('stroke-width', 1)
    .style('fill', 'none')
    .style('stroke', 'black')
    .attr('class', 'survival-curve-x-axis-class')
    .style('shape-rendering', 'crispEdges')
    .attr('transform', 'translate(0, 380)')
    .call(elem_.xAxis);
  elem_.svg.append('g')
    .style('stroke-width', 1)
    .style('fill', 'none')
    .style('stroke', 'black')
    .style('shape-rendering', 'crispEdges')
    .attr('transform', 'translate(0, 30)')
    .call(elem_.xAxis.orient('bottom').ticks(0));
  elem_.svg.append('g')
    .style('stroke-width', 1)
    .style('fill', 'none')
    .style('stroke', 'black')
    .attr('class', 'survival-curve-y-axis-class')
    .style('shape-rendering', 'crispEdges')
    .attr('transform', 'translate(70, 0)')
    .call(elem_.yAxis);
  elem_.svg.append('g')
    .style('stroke-width', 1)
    .style('fill', 'none')
    .style('stroke', 'black')
    .style('shape-rendering', 'crispEdges')
    .attr('transform', 'translate(420, 0)')
    .call(elem_.yAxis.orient('left').ticks(0));
  elem_.svg.selectAll('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '11px')
    .style('stroke-width', 0.5)
    .style('stroke', 'black')
    .style('fill', 'black');

  // draw censored dots
  // crossDots specifically for the curve for easier deletion
  // changed two separate lines to a single cross symbol
  elem_.svg.selectAll('path')
    .data(_data)
    .enter()
    .append('line')
    .filter(function (d) {
      return d.status === 0;
    })
    .attr('x1', function(d) { return elem_.xScale(d.time); })  
    .attr('y1', function(d) { return elem_.yScale(d.survival_rate) - 5; })
    .attr('x2', function(d) { return elem_.xScale(d.time); })  
    .attr('y2', function(d) { return elem_.yScale(d.survival_rate) + 5 ; })
    .style('stroke-width', 1)
    .style('stroke', '#006bb3');

  // append axis title
  elem_.svg.append("text")
    .attr("class", "label")
    .attr("x", 250)
    .attr("y", 420)
    .style("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight","bold")
    .text("Months Survival");
  elem_.svg.append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", -200)
    .attr("y", 30)
    .style("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight","bold")
    .text("Surviving");
  
  return {};

};
