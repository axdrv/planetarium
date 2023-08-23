export class PreloadItem extends HTMLElement {
    constructor () {
        super();             
    }
    connectedCallback() {  
        this.innerHTML = `
        <style>
            preloader-item {
                position: fixed;
                top: 0;
                bottom: 0;
                left: 0; 
                right: 0;
                background: var(--l-base);
                z-index: 1001;
            }     
        </style> 
        <div class="preloader f-centered">
            <h1>П</h1>              
        </div>
        `;
        let animateH1Preloader = anime({
            targets: '.preloader h1',
            rotateY: 360,
            translateX: 20,
            duration: 1000,
            direction: 'alternate',
            loop: true,
            easing: 'linear',
            delay: anime.stagger(100, {start: 100})
        })
        document.addEventListener('readystatechange', (event)=>{
            if (event.target.readyState=='complete') {
                animateH1Preloader.remove('.preloader h1')
                let tl = anime.timeline({
                    duration: 400,
                    easing: 'linear', 
                    delay: 200
                });
                tl.add({
                    targets: '.preloader',
                    opacity: 0,                    
                })
                .add({
                    targets: 'preloader-item',
                    opacity: 0,
                    complete: ()=> {
                        document.querySelector('preloader-item').remove();
                    }
                })
            }
        })
    }
}
customElements.define('preloader-item', PreloadItem);
let preloader = document.createElement('preloader-item');
preloader.classList.add('f-centered');
export {preloader}