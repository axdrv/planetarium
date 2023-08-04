
import {preloader} from '/assets/layout/preloader.js';
import {initLayout} from '/assets/layout/layout.js';
import {sections} from '/assets/sections/sections.js';
import {modules} from '/assets/components/modules/modules.js';
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
}

document.addEventListener('DOMContentLoaded', () => {
    init(); 
    planetarium = S.virtualsky();
});

// window.addEventListener('resize', ()=>{

// });
window.addEventListener('scroll', ()=>{
});
window.addEventListener('click', ()=>{
});

