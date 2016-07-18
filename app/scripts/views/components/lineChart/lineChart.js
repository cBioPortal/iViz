'use strict';
(function(iViz, dc, _, $, d3) {
    iViz.view.component.lineChart = function(){
        var content = {};    
        content.init = function (){
            $(document).ready(function(){
                $.get('scripts/views/components/lineChart/exampleData.json', function(data){
                    
                    var lineChart = dc.lineChart("#line-chart"); //initialize line chart
                                   
                    var parseDate = d3.time.format("%d-%b-%y").parse;
                    data.forEach(function(d) {
                    d.date = parseDate(d.date);}); //parse strings into Date objects

                    var patientData = crossfilter(data);//create an object that holds the data
                    
                    var dateDimension = patientData.dimension(function(d){
                        return d.date;//figure out data format
                    });//create date dimension
                    
                    var dateByFrequency = dateDimension.group();//create date group
                    
                    lineChart.width(400).height(300)
                            .dimension(dateDimension)
                                .group(dateByFrequency)
                            .transitionDuration(1000)
                            .margins({top: 30, right: 50, bottom: 25, left: 40})
                            .mouseZoomable(true)
                            .elasticY(true)
                            .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.date; })))
                            .xAxis();
                    
                    lineChart.render(); //need to render to draw the actual chart
                });
            }); 
        };
        return content;
    };
})(window.iViz,window.dc,window._,
window.$ || window.jQuery, window.d3);





