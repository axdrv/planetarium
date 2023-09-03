
let layout = {};
import { BackgroundItem } from '/assets/layout/bgnd/background_item.js';
customElements.define('background-item', BackgroundItem);
import { HeaderItem } from '/assets/layout/header/header_item.js';
customElements.define('header-item', HeaderItem)
import { FooterItem } from '/assets/layout//footer/footer_item.js';
customElements.define('footer-item', FooterItem)
layout.background = document.createElement('background-item', BackgroundItem)
layout.header = document.createElement('header-item', HeaderItem)
layout.footer = document.createElement('footer-item', FooterItem)
export {layout} 

