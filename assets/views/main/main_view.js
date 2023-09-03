export class MainView extends HTMLElement {
    constructor () {
        super();
        this.intro = "С НОВЫМ ГОДОМ!";        
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
        this.innerHTML =
        `<h1>Hello LLT</h1>
        `
        ;       
    }
}