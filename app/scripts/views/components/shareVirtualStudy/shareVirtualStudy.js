/**
 * Share virtual cohort component
 * Created by Jing Su on 9/25/2017
 */

'use strict';
(function(Vue, $, vcSession, iViz) {
  Vue.component('shareVirtualStudy', {
    template:
    '<div v-if="showShareButton" class="share-virtual-study">' +
    '<div class="share-cohort-btn">' +
    '<i class="fa fa-share-alt" alt="Share Virtual Study"></i></div></div>',
    props: {
      selectedPatientsNum: {
        type: Number,
        default: 0
      },
      selectedSamplesNum: {
        type: Number,
        default: 0
      },
      stats: {
        type: Object
      },
      updateStats: {
        type: Boolean,
        default: false
      },
      showShareButton: {
        type: Boolean,
        default: false
      },
      createdQtip: {
        type: Boolean,
        default: false
      }
    },
    data: function() {
      return {
        savedVC: null
      };
    },
    watch: {
      'showShareButton': function(showShareButton) {
        // In case static qtip will be created multiple times.
        if (showShareButton && !this.createdQtip) {
          this.createQtip();
          this.createdQtip = true;
        }
      }
    }, 
    methods: {
      saveCohort: function() {
        var _self = this;
        _self.updateStats = true;
        _self.$nextTick(function() {
          _self.addNewVC = true;
        });
      }, 
      createQtip: function () {
        var self_ = this;
        var previousSelectedCases = {};
          $('.share-virtual-study').qtip(iViz.util.defaultQtipConfig('Share Virtual Study'));
          $('.share-cohort-btn').qtip({
            style: {
              classes: 'qtip-light qtip-rounded qtip-shadow ' +
              'iviz-share-cohort-btn-qtip'
            },
            show: {event: 'click', ready: false},
            hide: false,
            position: {
              my: 'top center',
              at: 'bottom center',
              viewport: $(window)
            },
            events: {
              render: function(event, api) {
                var tooltip = $('.iviz-share-cohort-btn-qtip .qtip-content');

                tooltip.find('.share-cohort').click(function() {
                  tooltip.find('.shared').css('display', 'none');
                  tooltip.find('.dialog').css('display', 'none');
                  tooltip.find('.saving').css('display', 'none');
                  api.reposition();

                  // Copy virtual study link to clipboard
                  var temp = $("<input>");
                  $("body").append(temp);
                  temp.val(tooltip.find('.virtual-study-link').attr('href')).select();
                  // execCommand('copy') allows to run commands to copy the contents of selected editable region.
                  document.execCommand("copy");
                  // Check if users copy url successfully
                  if (temp.val() === tooltip.find('.virtual-study-link').attr('href')) {
                    tooltip.find('.shared').css('display', 'block');
                    tooltip.find('.dialog').css('display', 'none');
                    api.reposition();
                  }
                  temp.remove();
                });

              },
              show: function() {
                var tooltip = $('.iviz-share-cohort-btn-qtip .qtip-content');
                tooltip.find('.dialog').css('display', 'block');
                tooltip.find('.saving').css('display', 'block');
                tooltip.find('.shared').css('display', 'none');

                var cohortName = $('#study_name').val();
                var cohortDescription = $('#study_desc').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;

                  self_.$nextTick(function() {
                    var saveCohort = false;

                    if (_.isObject(self_.stats.selectedCases)) {
                      var selectedCasesMap = {};
                      _.each(self_.stats.selectedCases, function(study){
                        selectedCasesMap[study.studyID] = study;
                      });

                      // When a user clicks copy, it will trigger saving the current virtual cohort and return the url 
                      // to the user. When a user want to see the cohort url, he/she needs to click Share button. 
                      // We always show the url to user but we don't need to same virtual cohort every time 
                      // if it is same with the previous saved cohort.
                      if (_.isEmpty(previousSelectedCases)) {
                        saveCohort = true;
                      } else {
                        _.every(selectedCasesMap, function(selectedCase){
                          if(previousSelectedCases[selectedCase.studyID]){
                            var previousCase = previousSelectedCases[selectedCase.studyID];
                            if (previousCase.patients.length !== selectedCase.patients.length ||
                              previousCase.samples.length !== selectedCase.samples.length) {
                              saveCohort = true;
                            } else if (previousCase.patients.length ===
                              selectedCase.patients.length) {
                              var differentPatients = _.difference(previousCase.patients,
                                selectedCase.patients);
                              if (differentPatients.length > 0) {
                                saveCohort = true;
                              }
                            } else if (previousCase.samples.length ===
                              selectedCase.samples.length) {
                              var differentSamples = _.difference(previousCase.samples,
                                selectedCase.samples);
                              if (differentSamples.length > 0) {
                                saveCohort = true;
                              }
                            }
                          }
                          return !saveCohort;
                        });
                      }


                      if (saveCohort) {
                        var _selectedSamplesNum = 0;
                        var _selectedPatientsNum = 0;
                        _.each(self_.stats.selectedCases, function (studyCasesMap) {
                          _selectedSamplesNum += studyCasesMap.samples.length;
                          _selectedPatientsNum += studyCasesMap.patients.length;
                        });
                        self_.selectedSamplesNum = _selectedSamplesNum;
                        self_.selectedPatientsNum = _selectedPatientsNum;

                        vcSession.events.saveCohort(self_.stats,
                          cohortName, cohortDescription || '')
                          .done(function (response) {
                            var deepCopySelectedCases = JSON.parse(
                              JSON.stringify(self_.stats.selectedCases));
                            self_.savedVC = response;
                            tooltip.find('.cohort-link').html(
                              '<a class="virtual-study-link" href="' + window.cbioURL +
                              'study?id=' + self_.savedVC.id + '" onclick="window.open(\'' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '\')">' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '</a>');
                            tooltip.find('.saving').css('display', 'none');
                            tooltip.find('.cohort-link').css('display', 'block');
                            _.each(deepCopySelectedCases, function(study){
                              previousSelectedCases[study.studyID] = study;
                            });
                          })
                          .fail(function () {
                            tooltip.find('.failedMessage').html(
                              '<i class="fa fa-exclamation-triangle"></i>' +
                              '<span class="left-space">' +
                              'Failed to save virtual study, ' +
                              'please try again later.</span>');
                            tooltip.find('.failed').css('display', 'block');
                            tooltip.find('.dialog').css('display', 'none');
                          });
                      } else {
                        // Hide saving icon if current study is same as previous.
                        tooltip.find('.saving').css('display', 'none');
                      }
                    }
                  });
                }

                // Tell the tip itself to not bubble up clicks on it
                $($(this).qtip('api').elements.tooltip).click(function() { return false; });

                // Tell the document itself when clicked to hide the tip and then unbind
                // the click event (the .one() method does the auto-unbinding after one time)
                $(document).one("click", function() { $(".share-cohort-btn").qtip('hide'); });
              }
            },
            content: '<div><div class="dialog"><div class="input-group">' +
            '<span class="cohort-link" style="display: none;"></span>' +
            '<div class="saving" style="display: none;">' +
            '<i class="fa fa-spinner fa-spin"></i> Saving virtual study</div>' +
            '<span class="input-group-btn"><button class="btn btn-default share-cohort" ' +
            'type="button">Copy</button></span>' +
            '</div></div>' +
            '<div class="failed" style="display: none;">' +
            '<span class="failedMessage"></span></div>' +
            '<div class="shared" style="display: none;">' +
            '<span class="sharedMessage">The URL has been copied to clipboard.</span>' +
            '</div></div>'
          });
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession, window.iViz);
