/**
 * Created by Hongxin Zhang on 4/24/17.
 */
'use strict';
(function(Vue, iViz) {
  Vue.component('errorHandle', {
    template: '<span v-if="errorMessage.dataInvalid" class="data-invalid">Data invalid' +
    '<span v-if="emailContact">, please contact <span v-html="emailContact"></span>' +
    '</span></span>' + 
    '<span v-if="errorMessage.noData" class="no-data">No data available</span>' +
    '<span v-if="errorMessage.failedToLoadData" class="failed-load-data">Failed to load data, refresh the page may help</span>',
    props: [
      'errorMessage'
    ], 
    data: function() {
      return {
        emailContact: ''
      };
    },
    ready: function() {
      if (iViz.opts.emailContact) {
        this.emailContact = iViz.opts.emailContact;
      }
    }
  });
})(window.Vue,
  window.iViz);
