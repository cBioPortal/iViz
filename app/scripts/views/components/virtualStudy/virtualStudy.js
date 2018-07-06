'use strict';
(function(Vue, $, vcSession, iViz, _) {
  Vue.component('virtualStudy', {
    template:
    '<div class="virtual-study">' +
    '<div class="virtual-study-btn">' +
    '<i class="fa fa-bookmark" aria-hidden="true"></i></div></div>',
    props: {
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
      showSaveButton: {
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
    watch: {
      showSaveButton: function(){
        this.createQtip()
      }
    },
    data: function() {
      return {
        savedVS: null
      };
    },
    methods: {
      styleDisplay: function(el, action) {
        el.css('display', action);
      },
      showDialog: function(tooltip) {
        this.styleDisplay(tooltip.find('.dialog'), 'block');
      },
      hideDialog: function(tooltip) {
        this.styleDisplay(tooltip.find('.dialog'), 'none');
      },
      showLoading: function(tooltip) {
        this.styleDisplay(tooltip.find('.saving'), 'block');
      },
      hideLoading: function(tooltip) {
        this.styleDisplay(tooltip.find('.saving'), 'none');
      },
      showShared: function(tooltip) {
        this.styleDisplay(tooltip.find('.shared'), 'block');
      },
      hideShared: function(tooltip) {
        this.styleDisplay(tooltip.find('.shared'), 'none');
      },
      showSaved: function(tooltip) {
        this.styleDisplay(tooltip.find('.saved'), 'block');
      },
      hideSaved: function(tooltip) {
        this.styleDisplay(tooltip.find('.saved'), 'none');
      },
      showFailedInfo: function(tooltip) {
        this.styleDisplay(tooltip.find('.failed'), 'block');
      },
      hideFailedInfo: function(tooltip) {
        this.styleDisplay(tooltip.find('.failed'), 'none');
      },
      showAfterClipboard: function(tooltip) {
        this.styleDisplay(tooltip.find('.after-clipboard'), 'block');
      },
      hideAfterClipboard: function(tooltip) {
        this.styleDisplay(tooltip.find('.after-clipboard'), 'none');
      },
      updateFailedMessage: function(tooltip, message) {
        tooltip.find('.failed .message')
          .html(message)
      },
      updateSavedMessage: function(tooltip, message) {
        tooltip.find('.saved .message')
          .html(message)
      },
      updateSavingMessage: function(tooltip, message) {
        tooltip.find('.saving .message')
          .html(message)
      },
      updateOriginStudiesDescription: function(tooltip, message) {
        tooltip.find('.origin-studies-frame')
          .html(message);
      },
      disableBtn: function(el, action) {
        el.attr('disabled', action);
      },
      disableSaveCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.save-cohort'), true);
      },
      enableSaveCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.save-cohort'), false);
      },
      disableShareCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.share-cohort'), true);
      },
      enableShareCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.share-cohort'), false);
      },
      getFilteredOriginStudies: function() {
        var selectedStudiesDisplayName = window.iviz.datamanager.getCancerStudyDisplayName(this.stats.origin);
        var filteredOriginStudies = {
          studies: [],
          count: 0
        };
        var selectedStudies = {};
        _.each(this.stats.studies, function(study) {
          selectedStudies[study.id] = study.samples;
          filteredOriginStudies.count += study.samples.length;
        });
        filteredOriginStudies.studies = this.stats.origin.map(function(studyId) {
          var _studyData = iviz.datamanager.getStudyById(studyId);
          var _count = 0;
          if (_.isObject(_studyData) && _studyData.studyType === 'vs') {
            _.each(_studyData.data.studies, function(_study) {
              _count += _.intersection(_study.samples, selectedStudies[_study.id]).length;
            });
          } else {
            _count = selectedStudies.hasOwnProperty(studyId) ? selectedStudies[studyId].length : 0;
          }
          return {
            id: studyId,
            name: selectedStudiesDisplayName[studyId],
            count: _count
          };
        }).filter(function(t) {
          return t.count > 0;
        });
        return filteredOriginStudies;
      },
      getDefaultVSDescription: function(filteredOriginStudies) {
        var self = this;
        var filters = {};
        var vm = iViz.vue.manage.getInstance();
        _.each(self.stats.filters, function(_filters, _type) {
          _.each(_filters, function(filter, attrId) {
            filters[attrId] = {
              filter: filter
            };
          });
        });
        var attrs = vm.getChartsByAttrIds(Object.keys(filters));
        _.each(attrs, function(attr) {
          filters[attr.attr_id].attrId = attr.attr_id;
          filters[attr.attr_id].attrName = attr.display_name;
          filters[attr.attr_id].viewType = attr.view_type;
        });

        if (filters.hasOwnProperty(vm.customfilter.id)) {
          filters[vm.customfilter.id].attrId = vm.customfilter.id;
          filters[vm.customfilter.id].attrName = vm.customfilter.display_name;
          filters[vm.customfilter.id].viewType = 'custom';
        }
        return vcSession.utils.generateVSDescription(filteredOriginStudies, _.values(filters));
      },
      saveCohort: function() {
        var _self = this;
        _self.updateStats = true;
        _self.$nextTick(function() {
          _self.addNewVC = true;
        });
      },
      createQtip: function() {
        var self_ = this;
        var previousSelection = {};
        $('.virtual-study').qtip(iViz.util.defaultQtipConfig(
          (self_.showSaveButton ? 'Save/' : '') + 'Share Virtual Study'));
        $('.virtual-study-btn').qtip({
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow ' +
            'iviz-virtual-study-btn-qtip'
          },
          show: false,
          hide: false,
          position: {
            my: 'top center',
            at: 'bottom center',
            viewport: $(window)
          },
          events: {
            render: function(event, api) {
              var tooltip = $('.iviz-virtual-study-btn-qtip .qtip-content');
              tooltip.find('.save-cohort').click(function() {
                self_.hideDialog(tooltip);
                self_.showLoading(tooltip);
                self_.updateSavingMessage(tooltip, 'Saving virtual study...');
                self_.hideSaved(tooltip)

                api.reposition();

                var cohortName = tooltip.find('.cohort-name').val() ?
                  tooltip.find('.cohort-name').val() : tooltip.find('.cohort-name').attr('placeholder');
                var cohortDescription =
                  tooltip.find('textarea').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;
                  self_.$nextTick(function() {
                    var _selectedSamplesNum = 0;
                    if (_.isObject(self_.stats.studies)) {
                      _.each(self_.stats.studies, function(studyCasesMap) {
                        _selectedSamplesNum += studyCasesMap.samples.length;
                      });
                      self_.selectedSamplesNum = _selectedSamplesNum;
                    }

                    vcSession.events.saveCohort(self_.stats,
                      cohortName, cohortDescription || '', true)
                      .done(function(response) {
                        self_.savedVS = response;
                        self_.updateSavedMessage(tooltip, '<span>Virtual study <i>' + cohortName +
                          '</i> is saved.</span>' +
                          '<div class="btn-group" role="group">' +
                          '<button type="button" class="btn btn-default btn-xs view-vs">View</button>' +
                          '<button type="button" class="btn btn-default btn-xs query-vs">Query</button>' +
                          '</div>');
                        tooltip.find('.saved .message').find('a').click(function(event) {
                          event.preventDefault();
                          window.open(window.cbioURL + 'study?id=' +
                            self_.savedVS.id);
                        });
                        tooltip.find('.saved .message .view-vs').click(function(event) {
                          event.preventDefault();
                          window.open(window.cbioURL + 'study?id=' +
                            self_.savedVS.id);
                        });
                        tooltip.find('.saved .message .query-vs').click(function(event) {
                          event.preventDefault();
                          window.open(window.cbioURL + 'index.do?cancer_study_id=' + self_.savedVS.id)
                        });
                      })
                      .fail(function() {
                        self_.hideSaved(tooltip);
                        self_.updateFailedMessage(tooltip,
                          '<i class="fa fa-exclamation-triangle"></i>' +
                          '<span class="left-space">' +
                          'Failed to save virtual study, ' +
                          'please try again later.</span>');
                        self_.showFailedInfo(tooltip);
                      })
                      .always(function() {
                        self_.showSaved(tooltip);
                        self_.hideLoading(tooltip);
                        self_.hideDialog(tooltip);

                        tooltip.find('.cohort-name').val('');
                        tooltip.find('textarea').val('');

                        api.reposition();
                      });
                  });
                }
              });
              tooltip.find('.share-cohort').click(function() {
                self_.hideDialog(tooltip);
                self_.hideShared(tooltip);
                self_.showLoading(tooltip);
                self_.updateSavingMessage(tooltip, 'Generating the virtual study link');

                var cohortName = tooltip.find('.cohort-name').val() ?
                  tooltip.find('.cohort-name').val() : tooltip.find('.cohort-name').attr('placeholder');
                var cohortDescription =
                  tooltip.find('textarea').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;

                  self_.$nextTick(function() {
                    if (_.isObject(self_.stats.studies)) {
                      // When a user clicks copy, it will trigger saving the current virtual cohort and return the url 
                      // to the user. When a user want to see the cohort url, he/she needs to click Share button. 
                      // We always show the url to user but we don't need to same virtual cohort every time 
                      // if it is same with the previous saved cohort.
                      var currentSelection = cohortName + cohortDescription + JSON.stringify(self_.stats.studies) + JSON.stringify(self_.stats);

                      if (currentSelection !== previousSelection) {
                        vcSession.events.saveCohort(self_.stats,
                          cohortName, cohortDescription || '', false)
                          .done(function(response) {
                            self_.savedVC = response;
                            tooltip.find('.cohort-link').html(
                              '<a class="virtual-study-link" href="' + window.cbioURL +
                              'study?id=' + self_.savedVC.id + '" onclick="window.open(\'' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '\')">' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '</a>');

                            self_.hideLoading(tooltip);
                            self_.showShared(tooltip);
                            previousSelection = currentSelection;
                          })
                          .fail(function() {
                            self_.hideLoading(tooltip);
                            self_.hideDialog(tooltip);
                            self_.updateFailedMessage(tooltip,
                              '<i class="fa fa-exclamation-triangle"></i>' +
                              '<span class="left-space">' +
                              'Failed to share virtual study, ' +
                              'please try again later.</span>')
                            self_.showFailedInfo(tooltip);
                          });
                      } else {
                        self_.hideLoading(tooltip);
                        self_.showShared(tooltip);
                      }
                    }
                  });
                }
              });
              tooltip.find('.copy-cohort-btn').click(function() {
                self_.hideDialog(tooltip);
                self_.hideShared(tooltip);
                self_.hideLoading(tooltip);

                api.reposition();

                // Copy virtual study link to clipboard
                var temp = $("<input>");
                $("body").append(temp);
                temp.val(tooltip.find('.virtual-study-link').attr('href')).select();
                // execCommand('copy') allows to run commands to copy the contents of selected editable region.
                document.execCommand("copy");
                // Check if users copy url successfully
                if (temp.val() === tooltip.find('.virtual-study-link').attr('href')) {
                  self_.hideShared(tooltip);
                  self_.showAfterClipboard(tooltip);
                  api.reposition();
                }
                temp.remove();
              });
              this.createdQtip = true;
            },
            show: function() {
              var tooltip = $('.iviz-virtual-study-btn-qtip .qtip-content');
              var showThis = this;
              self_.updateSavingMessage(tooltip, 'Loading');
              self_.updateStats = true;
              self_.$nextTick(function() {
                self_.updateStats = false;
                tooltip.find('.cohort-name').val('');
                tooltip.find('.cohort-name')
                  .attr('placeholder', vcSession.utils.VSDefaultName(self_.stats.studies));
                self_.hideDialog(tooltip);
                self_.showLoading(tooltip);
                var filteredOriginStudies = this.getFilteredOriginStudies();
                var defaultVSDescription = self_.getDefaultVSDescription(filteredOriginStudies);
                tooltip.find('textarea').val(defaultVSDescription);

                if (filteredOriginStudies.studies.length > 0) {
                  filteredOriginStudies.studies.map(function(study) {
                    var studyMetaData = iviz.datamanager.getStudyById(study.id);
                    study.description = studyMetaData.studyType === 'vs' ? studyMetaData.data.description : studyMetaData.description;
                    return study;
                  });
                  self_.updateOriginStudiesDescription(tooltip, cbio.util.getOriginStudiesDescriptionHtml(filteredOriginStudies.studies));
                  $('.origin-studies-frame [data-toggle="collapse"]').click(function(a, b) {
                    $($(this).attr('data-target')).collapse('toggle');
                  });
                  $('.origin-studies-frame .panel-title a').click(function() {
                    window.open($(this).attr('href'));
                  });
                }
                self_.showDialog(tooltip);
                self_.hideLoading(tooltip);
                self_.hideShared(tooltip);
                self_.hideSaved(tooltip);
                self_.hideFailedInfo(tooltip);
                self_.hideAfterClipboard(tooltip);

                // Tell the tip itself to not bubble up clicks on it
                $($(showThis).qtip('api').elements.tooltip).click(function() {
                  return false;
                });
              });
            },
            visible: function() {
              // Tell the document itself when clicked to hide the tip and then unbind
              // the click event (the .one() method does the auto-unbinding after one time)
              $(document).one("click", function() {
                $(".virtual-study-btn").qtip('hide');
              });
            }
          },
          content: '<div><div class="dialog"><div class="input-group">' +
          '<input type="text" class="form-control cohort-name" ' +
          'placeholder="Virtual study Name"> <span class="input-group-btn">' +
          (self_.showSaveButton ? '<button class="btn btn-default save-cohort" type="button">Save</button>' : '') +
          (self_.showShareButton ? '<button class="btn btn-default share-cohort" type="button">Share</button>' : '') +
          '</span>' +
          '</div><div>' +
          '<textarea classe="form-control" rows="10" ' +
          'placeholder="Virtual study description (Optional)"></textarea>' +
          '<div class="origin-studies-frame"></div>' +
          '</div></div>' +
          '<div class="saving" style="display: none;">' +
          '<i class="fa fa-spinner fa-spin"></i>' +
          '<span class="message"></span></div>' +
          '<div class="saved" style="display: none;">' +
          '<span class="message"></span>' +
          '</div>' +
          '<div class="shared" style="display: none;"><span class="cohort-link"></span>' +
          '<button class="btn btn-default btn-xs copy-cohort-btn" ' +
          'type="button">Copy</button></div>' +
          '<div class="after-clipboard" style="display: none;">' +
          '<span class="message">The URL has been copied to clipboard.</span>' +
          '</div>' +
          '<div class="failed" style="display: none;">' +
          '<span class="message"></span></div>' +
          '</div>'
        });
        $('.virtual-study-btn').click(function() {
          $('.virtual-study-btn').qtip('show');
        });
      }
    },
    ready: function() {
      this.createQtip();
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession, window.iViz, window._);