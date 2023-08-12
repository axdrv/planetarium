//components file defines components that around whole document
import { BackgroundItem } from '/assets/layout/bgnd/background_item.js';
customElements.define('background-item', BackgroundItem);
// import { HeaderItem } from '/assets/layout/header/header_item.js';
// customElements.define('header-item', HeaderItem)
//import { FooterItem } from '/assets/layout//footer/footer_item.js';
//customElements.define('footer-item', FooterItem)

export function initLayout(main) {  
    main.before(document.createElement('background-item'));
    //main.before(document.createElement('header-item'));
    // main.after(document.createElement('footer-item'))
}

