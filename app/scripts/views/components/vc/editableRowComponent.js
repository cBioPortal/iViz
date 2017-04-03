'use strict';
(function(Vue, vcSession, $, Clipboard, _) {
  var clipboard = null;
  $(document).on('mouseleave', '.btn-share', function(e) {
    $(e.currentTarget).removeClass('tooltipped tooltipped-s');
    $(e.currentTarget).removeAttr('aria-label');
  });
  Vue.component('editableRow', {
    template: '<tr><td class="text center" ><editable-field' +
    ' :name.sync="data.studyName" :edit="edit" type="text"/></td><td' +
    ' class="text center" ><editable-field :name.sync="data.description"' +
    ' :edit="edit" type="textarea"/></td><td class="text center"' +
    ' ><span>{{selectedSamplesNum}}</span></td><td class="text center"' +
    ' ><span>{{selectedPatientsNum}}</span></td><td><div class="buttons"' +
    ' :class="{view: !edit}"><button class="btn btn-info"' +
    ' @click="clickSave(data)"><em class="fa' +
    ' fa-save"></em></button><button class="btn btn-default"' +
    ' @click="clickCancel()"><em class="fa' +
    ' fa-times"></em></button></div><div class="buttons" :class="{view:' +
    ' !share}"><div class="input-group"> <input type="text"' +
    ' id="link-to-share" class="form-control"v-model="shortenedLink"' +
    ' disabled><span class="input-group-btn"><button class="btn' +
    ' btn-default btn-share custom-btn"  data-clipboard-action="copy"' +
    ' data-clipboard-text={{shortenedLink}}><em class="fa fa-clipboard"' +
    ' alt="Copy to clipboard"></em></button><button class="btn' +
    ' btn-default custom-btn" @click="clickCancel()"><em class="fa' +
    ' fa-times"></em></button></span></div></div><div class="buttons"' +
    ' :class="{view: edit||share}"><button class="btn btn-info"' +
    ' @click="clickEdit(data)"><em class="fa' +
    ' fa-pencil"></em></button><button class="btn btn-danger"' +
    ' @click="clickDelete(data)"><em class="fa' +
    ' fa-trash"></em></button><button v-show="showShareButton" class="btn btn-success"' +
    ' @click="clickShare(data)"><em class="fa' +
    ' fa-share-alt"></em></button><button class="btn btn-default"' +
    ' @click="clickImport(data)">Visualize</button></div></td></tr>',
    props: [
      'data', 'showmodal', 'showShareButton'
    ], created: function() {
      var _selectedSamplesNum = 0;
      var _selectedPatientsNum = 0;
      console.log(this.data);
      if (_.isObject(this.data.selectedCases)) {
        _.each(this.data.selectedCases, function(studyCasesMap) {
          _selectedSamplesNum += studyCasesMap.samples.length;
          _selectedPatientsNum += studyCasesMap.patients.length;
        });
        this.selectedSamplesNum = _selectedSamplesNum;
        this.selectedPatientsNum = _selectedPatientsNum;
      }
      this.edit = false;
      this.share = false;
      this.shortenedLink = '---';
    },
    data: function() {
      return {
        edit: false,
        share: false,
        shortenedLink: '---',
        selectedSamplesNum: 0,
        selectedPatientsNum: 0
      };
    },
    methods: {
      clickEdit: function(_virtualCohort) {
        this.backupName = _virtualCohort.studyName;
        this.backupDesc = _virtualCohort.description;
        this.edit = true;
      },
      clickCancel: function() {
        if (this.edit) {
          this.data.studyName = this.backupName;
          this.data.description = this.backupDesc;
          this.edit = false;
        } else if (this.share) {
          this.share = false;
        }
      },
      clickDelete: function(_virtualCohort) {
        if (_.isObject(vcSession)) {
          this.$dispatch('remove-cohort', _virtualCohort);
          vcSession.events.removeVirtualCohort(_virtualCohort);
        }
      },
      clickSave: function(_virtualCohort) {
        this.edit = false;
        if (_virtualCohort.studyName === '') {
          _virtualCohort.studyName = 'My virtual cohort';
        }
        if (_.isObject(vcSession)) {
          vcSession.events.editVirtualCohort(_virtualCohort);
        }
      },
      clickImport: function(_virtualCohort) {
        this.showmodal = false;
        // TODO: from my test cases, I have some visual cohorts stored in my
        // localstorage without virtualCohortID. Should we hide Visualize AND share
        // buttons if the id is not available or virtual study will always have
        // a virtualCohortID? What if the session service is not available?
        // This back to my previous question, if the virtual cohort is not
        // available in database and API returnS 404, should we insert to
        // databAse, or delete from localstorage?
        window.open(window.cbioURL + 'study?cohorts=' + _virtualCohort.virtualCohortID);
      },
      clickShare: function(_virtualCohort) {
        // TODO: Create Bitly URL
        this.shortenedLink = window.cbioURL + 'study?cohorts=' +
          _virtualCohort.virtualCohortID;
        this.share = true;
        // Check if ClipBoard instance is present, If yes re-initialize the
        // instance.
        if (clipboard instanceof Clipboard) {
          clipboard.destroy();
        }
        initializeClipBoard();
      }
    }
  });
  /**
   * This method add tooltip when copy button is clicked
   * @param {Object} elem trigger object
   * @param {String} msg message to show
   */
  function showTooltip(elem, msg) {
    $(elem).addClass('tooltipped tooltipped-s');
    $(elem).attr('aria-label', msg);
  }

  /**
   * Initialize Clipboard instance
   */
  function initializeClipBoard() {
    var classname = document.getElementsByClassName('btn-share');
    clipboard = new Clipboard(classname);
    clipboard.on('success', function(e) {
      showTooltip(e.trigger, 'Copied');
    });
    clipboard.on('error', function(e) {
      showTooltip(e.trigger, 'Unable to copy');
    });
  }
})(window.Vue, window.vcSession,
  window.$ || window.jQuery, window.Clipboard, window._);
