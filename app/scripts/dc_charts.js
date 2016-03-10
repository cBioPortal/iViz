var dc_charts = function (meta, data, type, selection_callback_func) {

  var settings = {
    pie_chart: {
      width: 150,
      height: 150,
      inner_radius: 15
    },
    bar_chart: {
      width: 400,
      height: 180
    },
    transitionDuration: iViz.opts.dc.transitionDuration
  };

  var filters = {}, selected_cases = [];

  var ndx = crossfilter(data);

  // ---- a separate sample/patient id chart for sync use only ----

  var dim_hide, countPerFunc_hide;
  if (type === "patient") {
    dim_hide = ndx.dimension(function (d) { return d.patient_id; }),
    countPerFunc_hide = dim_hide.group().reduceCount();
  } else if (type === "sample") {
    dim_hide = ndx.dimension(function (d) { return d.sample_id; }),
    countPerFunc_hide = dim_hide.group().reduceCount();
  }
  $("#main-bridge").append(
    "<div class='grid-item' id='" + type + "_id_chart_div'>" +
    "<div class='dc-chart dc-pie-chart' id='" + type +"_id_chart'></div>" +
    "</div>"
  );
  var _chart_invisible = dc.pieChart("#" + type + "_id_chart");
  _chart_invisible.width(settings.pie_chart.width)
    .height(settings.pie_chart.height)
    .dimension(dim_hide)
    .group(countPerFunc_hide)
    .innerRadius(settings.pie_chart.inner_radius);

  // ---- automatically create charts by iterate attributes meta ----

  _.each(meta, function (_attr_obj) {

    if ($.inArray(_attr_obj.view_type, ["pie_chart", "bar_chart"]) !== -1) { //TODO: remove this, should be able to handle all view types

      var _chart_div_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-div",
          _reset_btn_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-reset",
          _chart_id = "chart-" + _attr_obj.attr_type + "_" + _attr_obj.attr_id;

      // append html element
      // TODO: replace with template
      $("#main-grid").append(
        "<div id='" + _chart_div_id + "'>" +
        "<a id='" + _reset_btn_id + "'>Reset</a>" +
        "<i class='fa fa-arrows dc-chart-drag'></i>" +
        "<div class='dc-chart' id='" + _chart_id + "'></div>" +
        "</div>"
      );

      // init and define dc chart instances based on chart types
      switch (_attr_obj.view_type) {

        case "pie_chart":

          $("#" + _chart_div_id).addClass("grid-item");
          $("#" + _chart_id).addClass("dc-pie-chart");

          var _pie_chart = new iViz.view.component.pieChart();
          var _data = $.extend(true, {}, _attr_obj);
          
          _data.ndx = ndx;
          _pie_chart.init(_data, {
            divId: _chart_id,
            width: settings.pie_chart.width,
            height: settings.pie_chart.height,
            transitionDuration: settings.transitionDuration
          });
          _chart_inst = _pie_chart.getChart();

          $("#" + _chart_id).append("<p class='text-center'>" + _attr_obj.display_name + "</p>");

          break;

        case "bar_chart":

          //eliminate NA(s), and parse to float
          var _bar_chart_data = _.map(_.filter(_.pluck(data, _attr_obj.attr_id), function (d) {
            return d !== "NA"
          }), function (d) {
            return parseFloat(d);
          });
          var dim = ndx.dimension(function (d) { return d[_attr_obj.attr_id]; }),
            countPerFunc = dim.group().reduceCount(), _chart_inst;
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

          break;

        case "scatter_plots":
          break;
        case "table":
          break;

      }

      // ---- activate individual reset button ----

      d3.select("a#" + _reset_btn_id).on("click", function () {
        _chart_inst.filterAll();
        dc.redrawAll();
      });

      // ---- activate filter recording ----

      _chart_inst.on("filtered", function (_chart_inst, filter) {

        // add or remove filters
        if (filter === null) { //filter comes in as null when clicking "reset"
          //remove all filters applied to this particular attribute
          filters[_attr_obj.attr_id] = [];
          filters[_attr_obj.attr_id].length = 0;
          delete filters[_attr_obj.attr_id];
        } else {
          if (filters.hasOwnProperty(_attr_obj.attr_id)) {
            if ($.inArray(filter, filters[_attr_obj.attr_id]) === -1) { //add filter
              filters[_attr_obj.attr_id].push(filter);
            } else {
              filters[_attr_obj.attr_id] = _.filter(filters[_attr_obj.attr_id], function(d) { return d !== filter; }); //remove filter
              if (filters[_attr_obj.attr_id].length === 0) {
                delete filters[_attr_obj.attr_id];
              }
            }
          } else {
            filters[_attr_obj.attr_id] = [filter];
          }
        }

        // call callback function to handle the sync between chart groups
        selection_callback_func(type === "patient" ? "sample" : "patient");

      }); // --- closing active filter recording

    }

  });

  return {
    get_selected_cases: function() {
      return selected_cases;
    },
    reset: function () {
      dc.redrawAll();
      iViz.view.grid.layout();
    },
    sync: function(_selected_cases) {
      _chart_invisible.filter(null);
      _.each(_selected_cases, function(_case_id) {
        _chart_invisible.filter(_case_id);
      });
    },
    filters: function() {
      return filters;
    }
  }

};


