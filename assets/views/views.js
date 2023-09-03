
let views = {};

import { MainView } from '/assets/views/main/main_view.js';
customElements.define('main-view', MainView)

views.main=document.createElement('main-view');

export {views};
