/**
 * Created by kalletlak on 7/8/16.
 */
'use strict';
(function(Vue, dc, iViz, _, $) {
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
      at: 'top center',
      target: $(window),
      adjust: {
        y: 400
      }
    },
    show: {
      event: 'click', // Show it on click...
      solo: true // ...and hide all other tooltips...
    },
    hide: false,
    style: 'qtip-light qtip-rounded qtip-wide'
  };
  Vue.component('customCaseInput', {
    template: '<div style="display: inline-flex"><input type="button" id="custom-case-input-button" ' +
    'class="iviz-header-button" value="Select cases by IDs"/>' +
    '<div class="iviz-hidden" id="iviz-case-select-custom-dialog">' +
    '<b>Please input IDs (one per line)</b></br>' +
    '<span @click="updateCaseIds()" ' +
    'style="text-decoration: underline;cursor: pointer">' +
    'Use selected samples/patients</span><br/><br/>' +
    '<textarea rows="20" cols="50" ' +
    'id="iviz-case-select-custom-input" v-model="casesIdsList"></textarea>' +
    '<br/><label><input type="radio" v-model="caseSelection" ' +
    'value="sample" checked @click="clearCaseIds(\'sample\')">By sample ID</label><label><input type="radio" ' +
    'v-model="caseSelection" value="patient" @click="clearCaseIds(\'patient\')">' +
    'By patient ID</label><button type="button" @click="setCasesSelection()" ' +
    'style="float: right;">Select</button></div></div>',
    props: {
      stats: {
        type: Object
      },
      updateStats: {
        type: Boolean,
        default: false
      }
    },
    data: function() {
      return {
        caseSelection: '',
        tooltip: '',
        casesIdsList: ''
      };
    },
    events: {},
    methods: {
      setCasesSelection: function() {
        var caseIds = this.casesIdsList.trim().split(/\n/);
        this.$dispatch('set-selected-cases', this.caseSelection, _.uniq(caseIds));
        this.tooltip.qtip('api').hide();
      },
      clearCaseIds: function() {
        this.casesIdsList = '';
      },
      updateCaseIds: function(type) {
        this.updateStats = true;
        this.$nextTick(function() {
          if (!type) {
            type = this.caseSelection;
          }
          var cases = [];
          _.each(this.stats.studies, function(t) {
            var targetGroup = type === 'patient' ? t.patients : t.samples;
            _.each(targetGroup, function(caseId) {
              cases.push(t.id + ':' + caseId);
            });
          });
          this.casesIdsList = cases.join('\n');
        });
      }
    },
    ready: function() {
      var self_ = this;
      var _customDialogQtip =
        $.extend(true, {}, headerCaseSelectCustomDialog);
      _customDialogQtip.position.target = $(window);
      _customDialogQtip.content.text = $('#iviz-case-select-custom-dialog');
      _customDialogQtip.events = {
        hide: function() {
          self_.casesIdsList = '';
        }
      };
      self_.tooltip = $('#custom-case-input-button').qtip(_customDialogQtip);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window._,
  window.$ || window.jQuery
);
