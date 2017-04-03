'use strict';
(function(Vue, vcSession, _) {
  Vue.component('listModal', {
    template: '<div class="modal-mask" v-show="show" transition="modal"' +
    ' @click="show = false"><div class="modal-list-container"' +
    ' @click.stop><ul class="vc-list-group"><li' +
    ' class="vc-list-group-item" v-for="value in vclist"><div' +
    ' v-on:click="addToVC(value.virtualCohortID)"' +
    ' class="vc-list-content">{{ value.studyName }}</div></li><li' +
    ' class="vc-list-group-item"><div v-on:click="addNewVC()"' +
    ' class="vc-list-content">Add to New Virtual' +
    ' Cohort</div></li></ul></div></div><add-vc' +
    ' :add-new-vc.sync="showPopup" :selected-patients-num=0' +
    ' :selected-samples-num=1 :cancer-study-id="cancerStudyId"' +
    ' :sample="sample"></add-vc>',
    props: {
      show: {
        type: Boolean,
        required: true,
        twoWay: true
      },
      vclist: {
        type: Array
      },
      sample: {
        type: String
      },
      cancerStudyId: {
        type: String
      },
      showPopup: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      close: function() {
        this.show = false;
      },
      addToVC: function(virtualCohortID) {
        if (_.isObject(vcSession)) {
          var _message = vcSession.events.addSampleToVirtualCohort(
            virtualCohortID,
            this.cancerStudyId, this.sample);
          var msgToShow = 'Error while adding sample';
          if (_message === 'success') {
            msgToShow = 'Added sample Virtual Cohort';
          } else if (_message === 'warn') {
            msgToShow = 'Sample already present is Virtual Cohort';
          }
          jQuery.notify(msgToShow, _message);
          this.close();
        }
      },
      addNewVC: function() {
        this.showPopup = true;
        this.close();
      }
    },
    ready: function() {
      var _this = this;
      document.addEventListener('keydown', function(e) {
        if (_this.show && e.keyCode === 27) {
          _this.close();
        }
      });
    }
  });
})(window.Vue, window.vcSession, window._);
