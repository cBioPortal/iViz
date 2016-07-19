/**
 * Created by kalletlak on 7/19/16.
 */

'use strict';
var vcSession = (function(Vue, dc, _) {
  var vmInstance_;

  return {
    init: function () {
      vmInstance_ = new Vue({
        el: '#cohort-component1',
        data: {
          selectedPatientsNum: 0,
          selectedSamplesNum: 0,
          userid:"DEFAULT",
          showSaveButton : true,
          showManageButton : true
        },methods: {
          initialize: function() {
            this.selectedPatientsNum = 0;
            this.selectedSamplesNum = 0;
            this.showSaveButton = true;
            this.showManageButton = false;
          }
        }, ready: function() {
        }
      });
    },
    getInstance: function() {
      if (typeof vmInstance_ === 'undefined') {
        this.init();
      }
      return vmInstance_;
    }
  }
})(window.Vue, window.dc,window._);