var dc_charts = function (meta, data) {

  var settings = {
    pie_chart: {
      width: 150,
      height: 150,
      inner_radius: 15
    },
    bar_chart: {
      width: 400,
      height: 180
    }
  };

  var meta, data;
  this.meta = meta;
  this.data = data;

  var ndx = crossfilter(data),
      chart_inst_arr = [];

  var applied_filters_arr = [];

  _.each(meta, function (_attr_obj) {

    if ($.inArray(_attr_obj.view_type, ["pie_chart", "bar_chart"]) !== -1) {

      var _chart_div_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-div",
          _reset_btn_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-reset",
          _chart_id = "chart-" + _attr_obj.attr_type + "_" + _attr_obj.attr_id;

      var dim = ndx.dimension(function (d) { return d[_attr_obj.attr_id]; }),
          countPerFunc = dim.group().reduceCount(), _chart_inst;

      // append html element
      // TODO: replace with template
      $("#main-grid").append(
        "<div id='" + _chart_div_id + "'>" +
        "<a id='" + _reset_btn_id + "'>Reset</a>" +
        "<div class='dc-chart' id='" + _chart_id + "'></div>" +
        "</div>"
      );


      // init and define dc chart instances based on chart types
      switch (_attr_obj.view_type) {

        case "pie_chart":

          $("#" + _chart_div_id).addClass("grid-item");
          $("#" + _chart_id).addClass("dc-pie-chart");

          _chart_inst = dc.pieChart("#" + _chart_id);
          _chart_inst.width(settings.pie_chart.width)
            .height(settings.pie_chart.height)
            .dimension(dim)
            .group(countPerFunc)
            .innerRadius(settings.pie_chart.inner_radius);

          $("#" + _chart_id).append("<p class='text-center'>" + _attr_obj.display_name + "</p>");



          break;

        case "bar_chart":

          //eliminate NA(s), and parse to float
          var _bar_chart_data = _.map(_.filter(_.pluck(data, _attr_obj.attr_id), function (d) {
            return d !== "NA"
          }), function (d) {
            return parseFloat(d);
          });
          var _min = d3.min(_bar_chart_data), _max = d3.max(_bar_chart_data);

          $("#" + _chart_div_id).addClass("grid-item");
          $("#" + _chart_div_id).addClass("grid-item--width2");
          $("#" + _chart_id).addClass("dc-bar-chart");

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

          //active filter recording
          _chart_inst.on("filtered", function (_chart_inst, filter) {
            console.log(filter);
          });

          break;

        case "scatter_plots":
          break;
        case "table":
          break;

      }

      //active filter recording
      _chart_inst.on("filtered", function (_chart_inst, filter) {
        var _filter_str = _attr_obj.attr_id + ": " + filter;
        if ($.inArray(_filter_str, applied_filters_arr) === -1) {
          applied_filters_arr.push(_filter_str);
        } else {
          var _index = applied_filters_arr.indexOf(_filter_str);
          applied_filters_arr.splice(_index, 1);
        }
      });

      //active individual reset button
      d3.select("a#" + _reset_btn_id).on("click", function () {
        _chart_inst.filterAll();
        dc.redrawAll();
      });

      chart_inst_arr.push(_chart_inst);
    }

  });

  return {
    getFilters: function() {
      return applied_filters_arr;
    }
  }

};


