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
    ' ><span>{{data.patientsLength}}</span></td><td class="text center"' +
    ' ><span>{{data.samplesLength}}</span></td><td><div class="buttons"' +
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
      this.edit = false;
      this.share = false;
      this.shortenedLink = '---';
    },
    data: function() {
      return {
        edit: false,
        share: false,
        shortenedLink: '---'
      };
    },
    methods: {
      clickEdit: function(_virtualStudy) {
        this.backupName = _virtualStudy.studyName;
        this.backupDesc = _virtualStudy.description;
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
      clickDelete: function(_virtualStudy) {
        if (_.isObject(vcSession)) {
          this.$dispatch('remove-cohort', _virtualStudy);
          vcSession.events.removeVirtualCohort(_virtualStudy);
        }
      },
      clickSave: function(_virtualStudy) {
        this.edit = false;
        if (_virtualStudy.studyName === '') {
          _virtualStudy.studyName = 'My virtual study';
        }
        if (_.isObject(vcSession)) {
          vcSession.events.editVirtualCohort(_virtualStudy);
        }
      },
      clickImport: function(_virtualStudy) {
        this.showmodal = false;
        window.open(window.cbioURL + 'study?cohorts=' + _virtualStudy.virtualCohortID);
      },
      clickShare: function(_virtualStudy) {
        // TODO: Create Bitly URL
        this.shortenedLink = window.cbioURL + 'study?cohorts=' +
          _virtualStudy.virtualCohortID;
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
