import {sections} from '/assets/sections/sections.js';
export class HeaderItem extends HTMLElement {
    constructor () {
        super();
        this.onscene = '';
        this.sectionheader = '';
        this.headeropen = '';
    }
    connectedCallback() {
        this.render();             
    }
    static get observedAttributes() {
        return ['onscene', 'sectionheader', 'headeropen'];
    }
    attributeChangedCallback(attr, prev, next) {
        if(prev !== next) {
            this[`${attr}`] = next;
            this.render();
        }
    }
      
    render() { 
        this.innerHTML = `
        <style>
            header-item {
                position: fixed;
                top: 0;
                text-align: center;
                z-index: 11;
                box-shadow: 1px 1px 8px 8px #88888888;
                
            }
            .header {
                width: 100%;
            }
                       
                      
            @media (max-width: 1199.98px) {
                
            }

            @media (max-width: 991.98px) {
            }

            @media (max-width: 767.98px),
            (orientation: portrait) {
                header {
                    height: 77px;
                    box-shadow: 1px 1px 4px 10px #88888888;                
                }
                .headerMenu {
                    justify-content: flex-start;
                }
                .headerMenu>p {
                    padding-left: 24px;
                }   
            }
            @media (max-width: 575.98px) {
            }
        </style>
           
        <div class="header">
            <h3>Шаблон для лендингов</h3>
        </div>
        `;
        
    }    
}