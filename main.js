
import {preloader} from '/assets/layout/preloader.js';
import {initLayout} from '/assets/layout/layout.js';
import {sections} from '/assets/sections/sections.js';
import {modules} from '/assets/components/modules/modules.js';
let isMobile = modules[1];

let body = document.body,
    main = document.querySelector('main'),
    planetarium;
body.appendChild(preloader);

//Functions
function init() {    
    initLayout(main);
    // sections.forEach(section=> {
    //     main.appendChild(section)
    // })
    setSizes();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    planetarium = S.virtualsky({
            mobile: isMobile().any
    });
});

window.addEventListener('resize', ()=> {setSizes()});
window.addEventListener('scroll', ()=>{
});
window.addEventListener('click', ()=>{
});
function setSizes () {
    let hMargin = document.querySelector('.hmargin');
    let h = document.documentElement.clientHeight;
    body.dataset.page !== 'main' ? hMargin.style.marginTop='10px' : hMargin.style.marginTop = h/20 + 'px';
}
