import {preloader} from '/assets/layout/preloader.js';
import {layout} from '/assets/layout/layout.js';
import {views} from '/assets/views/views.js';
import {modules} from '/assets/components/modules/modules.js';
let isMobile = modules[1];

let body = document.body,
    main = document.querySelector('main'),
    planetarium;
body.appendChild(preloader);

//Functions
function init() {  
   body.appendChild(layout.background);
   body.appendChild(layout.header);
   body.appendChild(layout.footer);
    // views.forEach(section=> {
    //     main.appendChild(section)
    // })
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    planetarium = S.virtualsky({
            mobile: isMobile().any
    });   
});

window.addEventListener('resize', ()=> {});
window.addEventListener('scroll', ()=>{});
window.addEventListener('click', ()=>{});

