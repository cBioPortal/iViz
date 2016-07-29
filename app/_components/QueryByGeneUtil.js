function QueryByGeneUtil() {

    // add the field
    function addFormField(formId, itemName, itemValue) {
        $('<input>').attr({
            type: 'hidden',
            value: itemValue,
            name: itemName
        }).appendTo(formId)
    }

    // fields required for the study-view and their defaults to be able to query
    this.addStudyViewFields = function (cancerStudyId, mutationProfileId, cnaProfileId) {
        var formId = "#iviz-form";
        addFormField(formId, "gene_set_choice", "user-defined-list");
        addFormField(formId, "gene_list", QueryByGeneTextArea.getGenes());

        addFormField(formId, "cancer_study_list", cancerStudyId);
        addFormField(formId, "Z_SCORE_THRESHOLD", 2.0);
        addFormField(formId, "genetic_profile_ids_PROFILE_MUTATION_EXTENDED", mutationProfileId);
        addFormField(formId, "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION", cnaProfileId);
        addFormField(formId, "clinical_param_selection", null);
        addFormField(formId, "data_priority", 0);
        addFormField(formId, "tab_index", "tab_visualize");
        addFormField(formId, "Action", "Submit");
    }
}
