export class BackgroundItem extends HTMLElement {
    constructor () {
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
        background-item {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;            
            bottom: 0;
            background: #04041b;
            overflow: hidden;
        }
        </style>
        <div id="bgnd" style="position: fixed; width: 100%; height: 100%;"></div> 
        `;        
    } 
}