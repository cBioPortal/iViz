/**
 * Created by kalletlak on 7/19/16.
 */
'use strict';
(function(Vue, dc, $, vcSession) {
  Vue.component('sessionComponent', {
    template: '<div id="cohort-component"><button v-if="showSaveButton" type="button" class="btn btn-default" ' +
    '@click="addNewVC = true" id="save_cohort_btn">Save Cohort </button> <button v-if="showManageButton" type="button" ' +
    'class="btn btn-default" @click="manageCohorts()"> <i class="fa fa-bars"></i> </button> ' +
    '<add-vc :add-new-vc.sync="addNewVC" :selected-samples-num="selectedSamplesNum" ' +
    ':selected-patients-num="selectedPatientsNum" :userid="userid" :stats="stats"></add-vc> ' +
    '<modaltemplate :show.sync="showVCList" size="modal-xlg"> <div slot="header"> ' +
    '<h4 class="modal-title">Virtual Cohorts</h4> </div> <div slot="body"> ' +
    '<table class="table table-bordered table-hover table-condensed"> ' +
    '<thead> <tr style="font-weight: bold"> <td style="width:20%">Name</td>' +
    ' <td style="width:40%">Description</td> <td style="width:10%">Patients</td> ' +
    '<td style="width:10%">Samples</td> <td style="width:20%">Operations</td> </tr> ' +
    '</thead> <tr is="editable-row" :data="virtualCohort" :showmodal.sync="showVCList" ' +
    'v-for="virtualCohort in virtualCohorts"> </tr> </table> </div> <div slot="footer"> ' +
    '</div> </modaltemplate> </div> </nav> </div>',
    props: [
    'selectedPatientsNum', 'selectedSamplesNum', 'userid', 'showSaveButton', 'showManageButton','stats'
    ],
    data: function() {
      return{
        showVCList:false,
        addNewVC:false,
        virtualCohorts:[]
      }
    },events:{
      'remove-cohort':function(cohort){
        this.virtualCohorts.$remove(cohort);
      }
    }, methods:{
       manageCohorts : function(){
        this.showVCList = true;
          if(this.userid !== undefined && this.userid !== 'DEFAULT'){
            this.virtualCohorts =  vcSession.model.loadUserVirtualCohorts();
          }else{
            this.virtualCohorts = vcSession.utils.getVirtualCohorts();
          }
       }
    }
  });
})(window.Vue, window.dc,
  window.$ || window.jQuery, window.vcSession);
