/* Functions responding to events */

iViz.event = (function() {
  return {

    reset_all: function(_chart_inst, _reset_btn_id) {
      d3.select("a#" + _reset_btn_id).on("click", function () {
        _chart_inst.filterAll();
        dc.redrawAll();
      });
    },
    filtered: function(_chart_inst, _attr_obj, _filters, type) {
      _chart_inst.on("filtered", function (_chart_inst, filter) {
    
        if (filter === null) { //filter comes in as null when clicking "reset"
      
          //remove all filters applied to this particular attribute
          _filters[_attr_obj.attr_id] = [];
          _filters[_attr_obj.attr_id].length = 0;
          delete _filters[_attr_obj.attr_id];
      
          // call callback function to handle the sync between chart groups
          iViz.sync.call_back(type === "patient" ? "sample" : "patient");
      
        } else {
      
          if (_attr_obj.view_type === "bar_chart") {
        
            //delay event trigger for bar charts
            dc.events.trigger(function() {
              _filters[_attr_obj.attr_id] = filter;
          
              // call callback function to handle the sync between chart groups
              iViz.sync.call_back(type === "patient" ? "sample" : "patient");
            }, 0);
        
          } else if (_attr_obj.view_type === "pie_chart") {
        
            // update existing filter category
            if (_filters.hasOwnProperty(_attr_obj.attr_id)) {
              //add filter
              if ($.inArray(filter, _filters[_attr_obj.attr_id]) === -1) {
                _filters[_attr_obj.attr_id].push(filter);
                //remove filter
              } else {
                _filters[_attr_obj.attr_id] = _.filter(_filters[_attr_obj.attr_id], function (d) {
                  return d !== filter;
                });
                if (_filters[_attr_obj.attr_id].length === 0) {
                  delete _filters[_attr_obj.attr_id];
                }
              }
          
            } else {
              // add new filter category
              _filters[_attr_obj.attr_id] = [filter];
            }
        
            // call callback function to handle the sync between chart groups
            iViz.sync.call_back(type === "patient" ? "sample" : "patient");
        
          }
        }
    
      }); // --- closing active filter recording
    }
    
  }
}());