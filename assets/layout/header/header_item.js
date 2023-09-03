import {default as isMobile} from '/assets/components/modules/isMobile.js'
import {NavItem} from '/assets/layout/header/nav_item.js';
customElements.define('nav-item', NavItem)
export class HeaderItem extends HTMLElement {
    constructor () {
        super();
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
                display: flex;
                flex-flow: column;
            } 
            #logo {
                flex-grow: 0;
                width: max-content;
                margin: 24px 70px;
                cursor: pointer;
            }
            #logo.collapsed {
                margin: 0px 50px;
            }          
            
            #logo h1, #logo h6 {
                color: var(--l-txt);
                margin: 0;                
            } 
            #logo h1 {
                font-size: 3rem;
            }                       
            #logo h6 {
                font-size: 0.9rem;
                padding: 0 0 0 4px;
                letter-spacing: 0.4rem;
            }
            #logo p {
                font-size: 0.9rem;
                font-weight: bold;
                color: var(--l-txt);
                display: flex;
                margin-top: 36px;
                justify-content: space-between;
            }
            #logo.collapsed p {
               display: none;               
            }            
            
            #logo, #logo.collapsed {
                transition: margin 100ms linear;
            }
            #logo h1, #logo h6, #logo p, #logo.collapsed h1, #logo.collapsed h6, #logo.collapsed p {
                transition: font-size 100ms linear;
            }
            #logo p, #logo.collapsed p {
                transition: margin-top 100ms linear;
            }
            nav-item {
                padding: 10px 0;
                flex-grow: 1;
            } 

            @media (max-width: 1199.98px) {
                            
            }

            @media (max-width: 991.98px) {

            }

            @media (max-width: 767.98px),
            (orientation: portrait) {
                #logo {
                    margin: 24px auto;                    
                }
                #logo.collapsed {
                    margin: 0 auto;
                }                
                #logo.collapsed h1 {
                    font-size: 1.8rem;
                }                       
                #logo.collapsed h6 {
                    font-size: 0.4rem;
                    letter-spacing: 0.2rem;
                }
                nav-item {
                    align-items: center;
                }
            }
            @media (max-width: 575.98px) {
            }
            @media (min-aspect-ratio: 2.5) {
                header {
                    flex-flow: row wrap;
                    justify-content: space-between;
                }
                #logo, #logo.collapsed {
                    margin: 0 10px;
                }
                #logo h1 {
                font-size: 2.2rem;
                }                       
                #logo h6 {
                    font-size: 0.7rem;
                    padding: 0 0 0 4px;
                    letter-spacing: 0.3rem;
                }
                #logo p {
                    display: none;  
                }
            }
        </style>
        <header>
            <div id="logo" data-page="main">
                <h6>е в п а т о р и й с к и й</h6>
                <h1>ПЛАНЕТАРИЙ</h1>
                <p><span>   Д о   </span><span>   з в ё з д    </span><span>   р у к о й   </span><span>   п о д а т ь !   </span></p>
            </div>
            <nav-item data-page="main"></nav-item>
        </header>        
        `;
        let header = this.querySelector('header');
        let navItem = this.querySelector('nav-item');
        let logo = this.querySelector('#logo');
        header.addEventListener('click', e=> {
            if(!e.target.dataset.page || e.target.dataset.page == 'main') {
                navItem.dataset.page = 'main'; 
                logo.classList.remove('collapsed')
            } else {
                navItem.dataset.page = e.target.dataset.page
                logo.classList.add('collapsed');
            }
        })                     
    }
}