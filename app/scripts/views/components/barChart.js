iViz.view.component.barChart = function() {

  return {
    init: function(ndx, data, _attr_obj, settings, _chart_id) {
      
      var _bar_chart_data = _.map(_.filter(_.pluck(data, _attr_obj.attr_id), function (d) {
        return d !== "NA"
      }), function (d) {
        return parseFloat(d);
      });
      var dim = ndx.dimension(function (d) { return d[_attr_obj.attr_id]; }),
          countPerFunc = dim.group().reduceCount(), _chart_inst;
      var _min = d3.min(_bar_chart_data), _max = d3.max(_bar_chart_data);
  
      _chart_inst = dc.barChart("#" + _chart_id);
      _chart_inst.width(settings.bar_chart.width)
        .height(settings.bar_chart.height)
        .gap(2)
        .dimension(dim)
        .group(countPerFunc)
        .x(d3.scale.linear().domain([_min * 1.1 - _max * 0.1, _max]))
        .elasticY(true)
        .centerBar(true)
        .xAxisLabel(_attr_obj.display_name)
        .margins({top: 10, right: 20, bottom: 50, left: 50});
      
      return _chart_inst;
  
    }
  }
  
}();