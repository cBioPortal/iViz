/**
 * Created by kalletlak on 7/8/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
  var headerCaseSelectCustomDialog = {
    // Since we're only creating one modal, give it an ID so we can style it
    id: 'iviz-case-select-custom-dialog',
    content: {
      text: '',
      title: {
        text: 'Custom case selection',
        button: true
      }
    },
    position: {
      my: 'center', // ...at the center of the viewport
      at: 'center',
      target: ''
    },
    show: {
      event: 'click', // Show it on click...
      solo: true // ...and hide all other tooltips...
    },
    hide: false,
    style: 'qtip-light qtip-rounded qtip-wide'
  };
  Vue.component('customCaseInput', {
    template: '<input type="button" id="iviz-header-right-1" ' +
    'class="iviz-header-button" value="Select cases by IDs"/>' +
    '<div class="iviz-hidden" id="iviz-case-select-custom-dialog">' +
    '<b>Please input IDs (one per line)</b><textarea rows="20" cols="50" ' +
    'id="iviz-case-select-custom-input" v-model="casesIdsList"></textarea>' +
    '<br/><label><input type="radio" v-model="caseSelection" ' +
    'value="sample" checked>By sample ID</label><label><input type="radio" ' +
    'v-model="caseSelection" value="patient">' +
    'By patient ID</label><button type="button" @click="SetCasesSelection()" ' +
    'style="float: right;">Select</button></div>',
    props: [],
    data: function() {
      return {
        caseSelection: '',
        casesIdsList: ''
      };
    },
    events: {},
    methods: {
      SetCasesSelection: function() {
        var caseIds = this.casesIdsList.trim().split(/\s+/);
        this.$dispatch('set-selected-cases', this.caseSelection, caseIds);
      }
    },
    ready: function() {
      var _customDialogQtip =
        $.extend(true, {}, headerCaseSelectCustomDialog);
      _customDialogQtip.position.target = $(window);
      _customDialogQtip.content.text = $('#iviz-case-select-custom-dialog');
      $('#iviz-header-right-1').qtip(_customDialogQtip);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window.$ || window.jQuery
);
