window.QueryByGeneUtil = (function() {
  // add the field
  function submitForm(url, fields) {
    var formOpts = {
      action: url,
      method: 'post',
      // Could not figure out why Sarafi won't allow to open a new tab for query page
      target: !cbio.util.browser.safari ? '_blank' : ''
    };
    var $form = $('<form>', formOpts);

    $.each(fields, function(key, val) {
      $('<input>').attr({
        type: 'hidden',
        name: key,
        value: val
      }).appendTo($form);
    });

    // Firefox requires form to be attached to document body.
    $form.appendTo(document.body);

    $form.submit();
  }

  return {
    toMainPage: function(studyIds, selectedCases) {
      var _arr = [];
      var formOps = {
        cancer_study_list: studyIds
      };

      if (_.isObject(selectedCases)) {
        _.each(selectedCases, function(_obj) {
          var _studyId = _obj.id;
          _.each(_obj.samples, function(_sampleId) {
            _arr.push(_studyId + ":" + _sampleId);
          });
        });

        formOps = {
          cancer_study_list: selectedCases.map(function(t) {
            return t.id
          }),
          cancer_study_id: 'all',
          case_set_id: -1,
          case_ids: _arr.join('+')
        };
      }
      submitForm(window.cbioURL + 'index.do', formOps);
    },
    toQueryPageSingleCohort: function(studyId, selectedCases,
                                      selectedGenes, mutationProfileId, cnaProfileId) {
      var _arr = [];
      _.each(selectedCases, function(_obj) {
        var _studyId = _obj.id;
        _.each(_obj.samples, function(_sampleId) {
          _arr.push(_studyId + ":" + _sampleId);
        });
      });
      submitForm(window.cbioURL + 'index.do', {
        cancer_study_list: selectedCases.map(function(x) {
          return x.id
        }),
        cancer_study_id: 'all',
        case_ids: _arr.join('+'),
        case_set_id: -1,
        gene_set_choice: 'user-defined-list',
        gene_list: encodeURIComponent(selectedGenes),
        Z_SCORE_THRESHOLD: 2.0,
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: mutationProfileId,
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: cnaProfileId,
        clinical_param_selection: null,
        data_priority: 0,
        tab_index: 'tab_visualize',
        Action: 'Submit'
      });
    },
    toMultiStudiesQueryPage: function(_selectedCases, _selectedGenes) {
      var _arr = [];
      _.each(_selectedCases, function(study) {
        _.each(study.samples, function(_sampleId) {
          _arr.push(study.id + ":" + _sampleId);
        });
      });
      submitForm(window.cbioURL + 'index.do', {
        cancer_study_list: _selectedCases.map(function(x) {
          return x.id
        }),
        cancer_study_id: 'all',
        gene_list: encodeURIComponent(_selectedGenes),
        case_set_id: -1,
        case_ids: _arr.join('+'),
        tab_index: 'tab_visualize',
        Action: 'Submit'
      });
    }
  }
})();
