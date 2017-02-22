'use strict';
(function(Vue, vcSession, _) {
  Vue.component('addVc', {
    template: '<modaltemplate :show.sync="addNewVc" size="modal-lg"><div' +
    ' slot="header"><h3 class="modal-title">Save Virtual' +
    ' Cohorts</h3></div><div slot="body"><div' +
    ' class="form-group"><label>Number of Samples' +
    ' :&nbsp;</label><span>{{selectedSamplesNum}}</span></div><br><div' +
    ' class="form-group"><label>Number of Patients' +
    ' :&nbsp;</label><span>{{selectedPatientsNum}}</span></div><br><div' +
    ' class="form-group"><label for="name">Name:</label><input' +
    ' type="text" class="form-control" v-model="name"  placeholder="My' +
    ' Virtual Cohort"></div><br><div' +
    ' class="form-group"><label' +
    ' for="description">Decription:</label><textarea placeholder="Virtual Cohort Description" class="form-control popup-textarea"' +
    ' rows="4" cols="50"' +
    ' v-model="description"></textarea></div></div><div' +
    ' slot="footer"><button type="button" class="btn btn-default"' +
    ' @click="addNewVc = false">Cancel</button><button type="button"' +
    ' class="btn btn-default" v-if="selectedSamplesNum>0 || selectedPatientsNum>0" @click="saveCohort()">Save</button></div></modaltemplate>',
    props: ['stats', 'addNewVc'],
    data: function() {
      return {
        name: ' ',
        description: '',
        selectedSamplesNum: 0,
        selectedPatientsNum: 0
      };
    },
    watch: {
      addNewVc: function() {
        this.name = '';
        this.description = '';
        var _selectedSamplesNum = 0;
        var _selectedPatientsNum = 0;
        if (_.isObject(this.stats.selectedCases)) {
          _.each(this.stats.selectedCases, function(studyCasesMap) {
            _selectedSamplesNum += studyCasesMap.samples.length;
            _selectedPatientsNum += studyCasesMap.patients.length;
          });
          this.selectedSamplesNum = _selectedSamplesNum;
          this.selectedPatientsNum = _selectedPatientsNum;
        }
      }
    },
    methods: {
      saveCohort: function() {
        if (_.isObject(vcSession)) {
          var self_ = this;
          vcSession.events.saveCohort(self_.stats, self_.name || 'My Virtual Cohort',
            self_.description || '');
          self_.addNewVc = false;
          jQuery.notify('Added to new Virtual Study', 'success');
        } else {
          // TODO: if we need to consider whether vcSession is available,
          // should we have similar notify as well like
          // jQuery.notify('Session service is not available', 'Warning');
        }
      }
    }
  });
})(window.Vue, window.vcSession, window._);
