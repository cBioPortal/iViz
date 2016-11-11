'use strict';
(function(Vue, $, vcSession) {
  Vue.component('sessionComponent', {
    template: '<div id="cohort-component"><button  class="cohort-save-button"' +
      ' v-if="showSaveButton" type="button" class="btn btn-default"' +
      ' @click="addNewVC = true" id="save_cohort_btn">Save Cohort </button>' +
      ' <button class="cohort-manage-button"' +
      ' v-if="showManageButton" type="button" class="btn btn-default"' +
      ' @click="manageCohorts()"> Manage Cohorts</i> </button>' +
      ' <add-vc :add-new-vc.sync="addNewVC"' +
      ' :selected-samples-num="selectedSamplesNum"' +
      ' :selected-patients-num="selectedPatientsNum" :userid="userid"' +
      ' :stats="stats" :update-stats.sync="updateStats"></add-vc>' +
      ' <modaltemplate :show.sync="showVCList" size="modal-xlg"> <div' +
      ' slot="header"> <h4 class="modal-title">Virtual Cohorts</h4> </div>' +
      ' <div slot="body"> <table class="table table-bordered table-hover' +
      ' table-condensed"> <thead> <tr style="font-weight: bold"> <td' +
      ' style="width:20%">Name</td> <td style="width:40%">Description</td>' +
      ' <td style="width:10%">Patients</td> <td' +
      ' style="width:10%">Samples</td> <td' +
      ' style="width:20%">Operations</td> </tr> </thead> <tr' +
      ' is="editable-row" :data="virtualCohort"' +
      ' :showmodal.sync="showVCList" :show-share-button="showShareButton" v-for="virtualCohort in' +
      ' virtualCohorts"> </tr> </table> </div> <div slot="footer"> </div>' +
      ' </modaltemplate> </div> </nav> </div>',
    props: [
      'selectedPatientsNum', 'selectedSamplesNum', 'userid', 'showSaveButton', 'showManageButton', 'stats', 'updateStats', 'showShareButton'
    ],
    data: function() {
      return {
        showVCList: false,
        addNewVC: false,
        virtualCohorts: []
      };
    }, events: {
      'remove-cohort': function(cohort) {
        this.virtualCohorts.$remove(cohort);
      }
    }, methods: {
      manageCohorts: function() {
        var self = this;
        self.showVCList = true;
        if (self.userid !== undefined && self.userid !== '' &&
          self.userid.length > 0 && self.userid !== 'DEFAULT') {
          $.when(vcSession.model.loadUserVirtualCohorts(self.userid)).then(function(_virtualCohorts) {
            self.virtualCohorts = _virtualCohorts;
          });
        } else {
          this.virtualCohorts = vcSession.utils.getVirtualCohorts();
        }
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession);
