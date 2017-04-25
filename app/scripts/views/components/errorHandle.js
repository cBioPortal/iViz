/**
 * Created by Hongxin Zhang on 4/24/17.
 */
'use strict';
(function(Vue, iViz) {
  Vue.component('errorHandle', {
    template: '<span class="data-invalid">Data invalid' +
    '<span v-if="emailContact">, please contact <span v-html="emailContact"></span>' +
    '</span></span>',
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
