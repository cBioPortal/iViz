iViz.util = (function() {
  return {
    
    id_mapping: function(_mapping_obj, _input_cases) {
      var _selected_mapping_cases = [];
      _selected_mapping_cases.length = 0;
      _.each(_input_cases, function(_case) {
        _.each(_mapping_obj[_case], function(_id) {
          _selected_mapping_cases.push(_id);
        });
      });
      return _.uniq(_selected_mapping_cases);
    },
    
    is_range_filter: function(_filter_obj) {
      if (_filter_obj.filterType !== undefined) {
        if (_filter_obj.filterType === "RangedFilter") return true;
      } return false;
    }

  }
}());