export class FooterItem extends HTMLElement {
    connectedCallback() { 
        this.render(); 
    } 
    render() {        
        this.innerHTML = `
            <style>
                footer-item {
                    position: fixed;
                    bottom: 0;                    
                    width: 100%;
                }
                footer {
                    height: 50px;
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: space-between;
                    align-items: center;
                }
                footer a.aFooter {
                    font-weight: 600;
                    color: var(--d-txt);
                    margin: 10px 24px;
                }
                @media (max-width: 1199.98px) {                
                }

                @media (max-width: 991.98px) {
                }

                @media (max-width: 767.98px),
                (orientation: portrait) {
                    footer {
                        height: auto;
                        flex-flow: column;
                    }                      
                }   
                
                @media (max-width: 575.98px) {
                }                
            </style>
            <footer>
                <a class="aFooter" href="https://github.com/axdrv/LLTemplate">lltemplate</a>                
            </footer>
        `;        
    }        
}