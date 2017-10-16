/**
 * Created by Hongxin Zhang on 4/24/17.
 */
'use strict';
(function(Vue) {
  Vue.component('error', {
    template: '<div id="{{containerId}}" >' +
    '<span class="className">{{{message}}}</span>' +
    '</div>',
    props: {
      containerId: {
        type: String,
        default: new Date().getTime() + '-error'
      },
      message: {
        type: String,
        default: ''
      },
      className: {
        type: String,
        default: 'error-message'
      }
    }
  });
})(window.Vue);
