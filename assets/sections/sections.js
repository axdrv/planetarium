// Adding sections into <main> in order defined in this file 

let sections = [];
//////////////////////////////
import { IntroSection } from '/assets/sections/intro/intro_section.js';
customElements.define('intro-section',IntroSection)
/////////////////////////////////
sections.push(
    document.createElement('intro-section')
);// push other sections after comma in order you nedd this appear
/////////////////////////////
export {sections};
//then import sections array at 'main.js'