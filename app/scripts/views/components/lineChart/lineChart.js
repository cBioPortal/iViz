'use strict';
(function(iViz, dc, _, $, d3) {
    iViz.view.component.lineChart = function(target){
        var content = {};    
        content.init = function initD3LineChart(){   
                var margin = {top: 30, right: 20, bottom: 30, left: 50},
                    width = 375 - margin.left - margin.right,
                    height = 270 - margin.top - margin.bottom;
                // Parse the date / time
                var parseDate = d3.time.format("%d-%b-%y").parse;
                // Set the ranges
                var x = d3.time.scale().range([0, width]);
                var y = d3.scale.linear().range([height, 0]);
                // Define the axis
                var xAxis = d3.svg.axis().scale(x)
                    .orient("bottom").ticks(5);
                var yAxis = d3.svg.axis().scale(y)
                    .orient("left").ticks(5);
                // Define the line
                var valueline = d3.svg.line()
                    .x(function(d) { return x(d.date); })
                    .y(function(d) { return y(Number(d.close))});
                // Adds the svg canvas
                var svg = d3.select(target).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", 
                              "translate(" + margin.left + "," + margin.top + ")");
                // Get the data
                d3.tsv("scripts/views/components/lineChart/exampleData.tsv", function(error, data) {
                    data.forEach(function(d) {
                        d.date = parseDate(d.date);
                        d.close = +Number(d.close);
                    });
                    // Scale the range of the data
                    x.domain(d3.extent(data, function(d) { return d.date; }));
                    y.domain([0, d3.max(data, function(d) { return d.close; })]);
                    // Add the valueline path.
                    svg.append("path")
                        .attr("class", "line")
                        .attr("d", valueline(data));
                    // Add the X Axis
                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);
                    // Add the Y Axis
                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);
                }); 
            };
        return content;
    };
})(window.iViz,window.dc,window._,
window.$ || window.jQuery, window.d3);


