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
    ' Virtual Cohort" value="My Virtual Cohort"></div><br><div' +
    ' class="form-group"><label' +
    ' for="description">Decription:</label><textarea class="form-control popup-textarea"' +
    ' rows="4" cols="50"' +
    ' v-model="description"></textarea></div></div><div' +
    ' slot="footer"><button type="button" class="btn btn-default"' +
    ' @click="addNewVc = false">Cancel</button><button type="button"' +
    ' class="btn' +
    ' btn-default"@click="saveCohort()">Save</button></div></modaltemplate>',
    props: ['selectedSamplesNum',
      'selectedPatientsNum',
      'userid',
      'stats', 'addNewVc', 'updateStats'],
    data: function() {
      return {
        name: 'My Virtual Cohort',
        description: ''
      };
    },
    watch: {
      addNewVc: function() {
        this.name = 'My Virtual Cohort';
        this.description = '';
      }
    },
    methods: {
      saveCohort: function() {
        if (_.isObject(vcSession)) {
          var self_ = this;
          self_.updateStats = true;
          self_.$nextTick(function() {
            vcSession.events.saveCohort(self_.stats,
              self_.selectedPatientsNum, self_.selectedSamplesNum, self_.userid, self_.name,
              self_.description || '');
            self_.addNewVc = false;
            jQuery.notify('Added to new Virtual Study', 'success');
          });
        }
      }
    }
  });
})(window.Vue, window.vcSession, window._);
