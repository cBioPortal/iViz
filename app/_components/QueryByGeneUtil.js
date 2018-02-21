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
    /*
    * Input parameter
    * cohortIds : list of input queried id
    * stats : object containing study statistics(filters, selected study samples)
    * geneIds : selected genes
    * includeCases : indicates whether to include custom samples in the form.
    *                this is true for shared virtual study
    */
    query: function(cohortIds, stats, geneIds, includeCases) {
      var formOps = {
        cancer_study_list: cohortIds,
        cancer_study_id:'all'
      }

      if(geneIds !== undefined && geneIds !== ''){
        formOps['tab_index'] = 'tab_visualize';
        formOps['Action'] = 'Submit';
        formOps['data_priority'] = 0;
        formOps['gene_list'] = encodeURIComponent(geneIds);

        var physicalStudies = _.pluck(stats.studies,'id')

        if(cohortIds.length === 1 && physicalStudies.length === 1 && physicalStudies[0] === cohortIds[0]){
          //TODO: what if window.mutationProfileId is null
          formOps['genetic_profile_ids_PROFILE_MUTATION_EXTENDED'] = window.mutationProfileId;
          //TODO: what if window.cnaProfileId is null
          formOps['genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'] = window.cnaProfileId;
          formOps['case_set_id'] = cohortIds[0]+'_all'
        } else {
          formOps['case_set_id'] = 'all'
        }
      }

      //check if there are filters
      if ((JSON.stringify(stats.filters) !== JSON.stringify({patients:{},samples:{}})) || includeCases) {
        var studySamples = [];
        _.each(stats.studies, function(study) {
          _.each(study.samples, function(sampleId) {
            studySamples.push(study.id + ":" + sampleId);
          });
        });
        formOps['case_set_id'] = -1;
        formOps['case_ids'] = studySamples.join('+');
      }
      if(includeCases){
        formOps['cancer_study_list'] = _.pluck(stats.studies,'id')
      }
      submitForm(window.cbioURL + 'index.do', formOps);
    }
  }
})();
