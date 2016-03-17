var iViz = (function() {

  var patient_charts_inst, sample_charts_inst;
  var selected_patients = [], selected_samples = [];
  var data, vm, grid;

  return {
    init: function() {

      $("#main-grid").empty();

      // TODO: replace with wrapper to assemble data from web APIs
      $.ajax({url: "data/converted/mixed_tcga.json"})
        .then(function (_data) {

          data = _data;

          // ---- fill the empty slots in the data matrix ----
          _.each(data.groups.patient.data, function(_data_obj) {
            _.each(_.pluck(data.groups.patient.attr_meta, "attr_id"), function (_attr_id) {
              if (!_data_obj.hasOwnProperty(_attr_id)) {
                _data_obj[_attr_id] = "NA";
              }
            });
          });
          _.each(data.groups.sample.data, function(_data_obj) {
            _.each(_.pluck(data.groups.sample.attr_meta, "attr_id"), function (_attr_id) {
              if (!_data_obj.hasOwnProperty(_attr_id)) {
                _data_obj[_attr_id] = "NA";
              }
            });
          });

          // ----  init and define dc chart instances ----
          patient_charts_inst = new dc_charts(
            data.groups.patient.attr_meta,
            data.groups.patient.data,
            data.groups.group_mapping,
            "patient"
          );
          sample_charts_inst = new dc_charts(
            data.groups.sample.attr_meta,
            data.groups.sample.data,
            data.groups.group_mapping,
            "sample"
          );

          // ---- render dc charts ----
          grid = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: 250,
            rowHeight: 250,
            gutter: 5
          });

          _.each(grid.getItemElements(), function (gridItem) {
            var draggie = new Draggabilly(gridItem, {
              handle: '.dc-chart-drag'
            });
            grid.bindDraggabillyEvents(draggie);
          });

          dc.renderAll();
          grid.layout();
          
          // ---- attach event listener for saving cohort ----
          $("#save_cohort_btn").click(function (){
          });

          // ---- attach event listener for importing cohort ----
          $("#import_cohort_btn").click(function (){
          });

          // ---- set default selected cases ----
          selected_patients = _.pluck(data.groups.patient.data, "patient_id");
          selected_samples = _.pluck(data.groups.sample.data, "sample_id");

          // --- using vue to show filters in header ---
          if (typeof vm === "undefined") {
            vm = new Vue({
              el: '#main-header',
              data: {
                filters: [],
                selected_samples_num: _.pluck(data.groups.sample.data, "sample_id").length,
                selected_patients_num: _.pluck(data.groups.patient.data, "patient_id").length
              }
            });
          } else {
            vm.filters = [];
            vm.selected_samples_num = _.pluck(data.groups.sample.data, "sample_id").length;
            vm.selected_patients_num = _.pluck(data.groups.patient.data, "patient_id").length;
          }

        });
    }, // ---- close init function ----
    
    stat: function() {
      var result = {};
      result["filters"] = {};
      
      // extract and reformat selected cases
      var _selected_cases = [];
  
      _.each(selected_samples, function(_selected_sample) {
    
        var _index = data.groups.sample.data_indices.sample_id[_selected_sample];
        var _study_id = data.groups.sample.data[_index]["study_id"];
    
        // extract study information
        if ($.inArray(_study_id, _.pluck(_selected_cases, "studyID")) !== -1) {
          _.each(_selected_cases, function(_result_obj) {
            if (_result_obj["studyID"] === _study_id) {
              _result_obj["samples"].push(_selected_sample);
            }
          });
        } else {
          _selected_cases.push({"studyID": _study_id, "samples": [_selected_sample]});
        }
    
        //map samples to patients
        _.each(_selected_cases, function(_result_obj) {
          _result_obj["patients"] = iViz.util.id_mapping(data.groups.group_mapping.sample.patient, _result_obj["samples"]);
        });
    
      });
  
      result.filters["patients"] = patient_charts_inst.filters();
      result.filters["samples"] = sample_charts_inst.filters();
      result["selected_cases"] = _selected_cases;
      
      return result;
    },
    
    vm: function() {
      return vm;
    },
    view: {
      component: {},
      grid: {
        get: function () {
          return grid;
        },
        layout: function () {
          grid.layout();
        }
      }
    },
    util: {},
    opts: {
      dc: {
        transitionDuration: 400
      }
    },
    get_data: function(_type) {
      return (_type === "patient")? data.groups.patient.data: data.groups.sample.data;
    },
    get_mapping: function() {
      return data.groups.group_mapping;
    },
    patient_charts_inst: function() {
      return patient_charts_inst;
    },
    sample_charts_inst: function() {
      return sample_charts_inst;
    },
    set_selected_samples: function(_input) {
      selected_samples = _input;
    },
    get_selected_samples: function() {
      return selected_samples;
    },
    set_selected_patients: function(_input) {
      selected_patients = _input;
    },
    get_selected_patients: function() {
      return selected_patients;
    }

  }
}());




