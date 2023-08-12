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
                z-index: 11;              
            }
            header {
                position: relative;
                width: 100%;
            }
            .logonav {
                display: flex;
                justify-content: flex-start;
            }
            .logo {
                /* width: fit-content; */
            }
            header h1 {
                color: var(--l-txt);
                width: 31rem;
                font-size: 3rem;
                width: fit-content;
            }                       
            header h6 {
                width: max-content;
                text-align: justify;
                color: var(--l-txt);
                padding: 0 0 0 4px;
                letter-spacing: 0.3rem;
            }
            nav a,  nav a:hover, nav a:visited {
                position: relative;
                display: inline-block;
                padding: 10px;
                margin: 10px;
                background-color: rgba(4, 4, 16, 0.6); 
                text-decoration: none;
                /* border: solid 0.75px  */
            }        
            @media (max-width: 1199.98px) {
                
            }

            @media (max-width: 991.98px) {
            }

            @media (max-width: 767.98px),
            (orientation: portrait) {
                header {
                    height: 77px;
                }                
                header h1 {                    
                    color: var(--l-txt);
                    font-size: 2.5rem;
                }
                .logonav {
                    display: block;
                }
            }
            @media (max-width: 575.98px) {
            }
        </style>
           
        <header>
            <div class="hmargin"></div>
            <div class="logonav">
                <div class="logo">
                    <h6>е в п а т о р и й с к и й</h6>
                    <h1>ПЛАНЕТАРИЙ</h1>
                </div>                
            </div>
                     
        </header>
        `;        
    }    
}