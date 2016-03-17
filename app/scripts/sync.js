iViz.sync = (function() {
  return {
  
    // ---- callback function to sync patients charts and sample charts ----
    // @selected_cases: cases selected in the other group
    // @update_type: the type of group charts (patient or sample) that needs to be updated
    call_back: function(mapping, data, update_type) {
    
        var _selected_samples_by_filters_only = iViz.sync.select_by_filters(iViz.sample_charts_inst().filters(), data, "sample");
        var _selected_patients_by_filters_only = iViz.sync.select_by_filters(iViz.patient_charts_inst().filters(), data, "patient");
    
        // find the intersection between two groups
        var mapped_selected_samples = iViz.util.id_mapping(mapping.patient.sample, _selected_patients_by_filters_only);
        iViz.set_selected_samples(_.intersection(mapped_selected_samples, _selected_samples_by_filters_only));
        iViz.set_selected_patients(iViz.util.id_mapping(mapping.sample.patient, iViz.get_selected_samples()));
    
        // sync view
        if (update_type === "sample") {
          iViz.sample_charts_inst().sync(iViz.util.id_mapping(mapping.patient.sample, _selected_patients_by_filters_only));
        } else if (update_type === "patient") {
          iViz.patient_charts_inst().sync(iViz.util.id_mapping(mapping.sample.patient, _selected_samples_by_filters_only));
        }
    
        // update vue
        iViz.vm().filters = [];
        iViz.vm().filters.length = 0;
        _.each(Object.keys(iViz.patient_charts_inst().filters()), function(_key) {
          iViz.vm().filters.push({ text : "<span class='label label-primary'>" + _key + ": " + iViz.patient_charts_inst().filters()[_key] + "</span>" });
        });
        _.each(Object.keys(iViz.sample_charts_inst().filters()), function(_key) {
          iViz.vm().filters.push({ text : "<span class='label label-info'>" + _key + ": " + iViz.sample_charts_inst().filters()[_key] + "</span>" });
        });
        iViz.vm().selected_samples_num = iViz.get_selected_samples().length;
        iViz.vm().selected_patients_num = iViz.get_selected_patients().length;
    
    },
    // select samples or patients based on only samples/patients filters
    select_by_filters: function(_filters, _data, _type) { //_type: sample or patient
      var _dup_selected_cases_arr = [];
      _.each(Object.keys(_filters), function(_filter_attr_id) {
      
        var _single_attr_selected_cases = [];
        var _filters_for_single_attr = _filters[_filter_attr_id];
      
        if (iViz.util.is_range_filter(_filters_for_single_attr)) {
        
          var _filter_range_min = parseFloat(_filters_for_single_attr[0]);
          var _filter_range_max = parseFloat(_filters_for_single_attr[1]);
          _.each(_data, function(_data_obj) {
            if (_data_obj.hasOwnProperty(_filter_attr_id)) {
              if (parseFloat(_data_obj[_filter_attr_id]) <= _filter_range_max && parseFloat(_data_obj[_filter_attr_id]) >= _filter_range_min) {
                _single_attr_selected_cases.push(_type === "sample"? _data_obj.sample_id: _data_obj.patient_id);
              }
            }
          });
        
        } else {
          _.each(_data, function(_data_obj) {
            if (_data_obj.hasOwnProperty(_filter_attr_id)) {
              if ($.inArray(_data_obj[_filter_attr_id], _filters_for_single_attr) !== -1) {
                _single_attr_selected_cases.push(_type === "sample"? _data_obj.sample_id: _data_obj.patient_id);
              }
            }
          });
        }
        _dup_selected_cases_arr.push(_single_attr_selected_cases);
      });
      var _selected_cases_by_filters_only = _.pluck(_data, _type === "sample"? "sample_id": "patient_id");
      if (_dup_selected_cases_arr.length !== 0) {
        _.each(_dup_selected_cases_arr, function(_dup_selected_cases) {
          _selected_cases_by_filters_only = _.intersection(_selected_cases_by_filters_only, _dup_selected_cases);
        });
      }
      return _selected_cases_by_filters_only;
    }
  
  }
}());