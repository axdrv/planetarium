export class NavHeader extends HTMLElement {
    constructor () { //this is template only
        super();             
    }
    connectedCallback() {  
        this.render();
    } 
    static get observedAttributes() {
        return []; 
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
            li {
                position: relative;
            }

        </style> 
        <nav>
            <li href="">
            <svg id = "news_li" width="92" height="60" version="1.1" viewBox="0 0 92 60" xmlns="http://www.w3.org/2000/svg">
                <polygon fill="rgba(4, 4, 16, 0.6)" points="2,22 6,4 77,2 88,57" stroke="rgb(0,255,255)" stroke-width=".75"/>
                <g fill="rgb(0,255,255)" stroke="none">
                <ellipse cx="2" cy="22" rx="1" ry="1"/>
                <ellipse cx="6" cy="4" rx="1" ry="1"/>
                <ellipse cx="77" cy="2" rx="1" ry="1"/>
                <ellipse cx="88" cy="57" rx="1" ry="1"/>
                </g>
            </svg>
                расписание
            </li>
            <li href="">
                события
            </li>
            <li href="">
                новости
            </li>
            <li href="">
                о планетарии
            </li>
            <li href="">
                цены
            </li>                    
        </nav>  
        `;
    }
}