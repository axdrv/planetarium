export class ChangeNameAround extends HTMLElement {
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

        </style> 
        <section>

        </section>        
        `;
    }
}