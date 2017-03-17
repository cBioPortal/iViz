'use strict';
(function(Vue) {
  Vue.component('editableField', {
    // template: '#editable-field',
    props: ['name', 'edit', 'type'],
    template: '<div v-if="edit"><div v-if="type==\'text\'"><input' +
    ' type="text" v-model="name" placeholder="My Virtual' +
    ' Study"/></div><div v-if="type==\'textarea\'"><textarea rows="4"' +
    ' cols="50" v-model="name"></textarea></div></div><div' +
    ' style="white-space: pre-line !important;"' +
    ' v-else="edit"><span>{{ name }}</span></div>'
  });
})(window.Vue);
