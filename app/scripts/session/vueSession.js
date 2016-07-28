/**
 * Created by kalletlak on 7/19/16.
 */

'use strict';
var vcSession = (function(Vue, dc, _) {
  var vmInstance_;

  return {
    init: function () {
      vmInstance_ = new Vue({
        el: '#cohort-component',
        data: {
          selectedPatientsNum: 0,
          selectedSamplesNum: 0,
          userid:"DEFAULT",
          showSaveButton : true,
          showManageButton : true,
          cohortData:{},
          stats:{}
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