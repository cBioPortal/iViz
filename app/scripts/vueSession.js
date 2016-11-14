'use strict';
var vcSessionsManagement = (function(Vue) {
  var vmInstance_;

  return {
    init: function() {
      vmInstance_ = new Vue({
        el: '#cohort-component',
        data: {
          loadUserSpecificCohorts: false,
          showSaveButton: true,
          showManageButton: true,
          cohortData: {},
          stats: {},
          updateStats: false,
          showShareButton: true
        },
        watch: {
          updateStats: function(newVal) {
            if (newVal) {
              var self_ = this;
              $.ajax({
                url: '/data/sample.json',
                dataType: 'json',
                async: false,
                success: function(_data) {
                  self_.stats = _data;
                  self_.updateStats = false;
                }
              });
            }
          }
        }
      });
    },
    getInstance: function() {
      if (typeof vmInstance_ === 'undefined') {
        this.init();
      }
      return vmInstance_;
    }
  };
})(window.Vue);
