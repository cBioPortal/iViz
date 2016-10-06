'use strict';
(function(Vue) {
  Vue.component('modaltemplate', {
    template: '<div class="modal-mask" v-show="show" transition="modal"' +
    ' @click="show = false"><div class="modal-dialog"' +
    ' v-bind:class="size" @click.stop><div class="modal-content"><div' +
    ' class="modal-header"><button type="button" class="close"' +
    ' @click="close"><span>x</span></button><slot' +
    ' name="header"></slot></div><div class="modal-body"><slot' +
    ' name="body"></slot></div><div slot="modal-footer"' +
    ' class="modal-footer"><slot name="footer"></slot></div></div></div></div>',
    props: [
      'show', 'size'
    ],
    methods: {
      close: function() {
        this.show = false;
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
})(window.Vue);
