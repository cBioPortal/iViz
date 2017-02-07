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
    toMainPage: function(studyId, selectedCases) {
      submitForm(window.cbioURL + 'index.do', {
        'cancer_study_id': studyId,
        'case_ids': selectedCases.join(' '),
        'case_set_id': -1
      });
    },
    toQueryPage: function(studyId, selectedCases,
                          selectedGenes, mutationProfileId, cnaProfileId) {
      submitForm(window.cbioURL + 'index.do', {
        cancer_study_id: studyId,
        case_ids: selectedCases.join(' '),
        case_set_id: -1,
        gene_set_choice: 'user-defined-list',
        gene_list: selectedGenes,
        cancer_study_list: studyId,
        Z_SCORE_THRESHOLD: 2.0,
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: mutationProfileId,
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: cnaProfileId,
        clinical_param_selection: null,
        data_priority: 0,
        tab_index: 'tab_visualize',
        Action: 'Submit'
      });
    }
  }
})();
