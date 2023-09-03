import {default as isMobile} from '/assets/components/modules/isMobile.js'
export class NavItem extends HTMLElement {
    constructor () { //this is template only
        super();
    }
    connectedCallback() {  
        this.render();
        this.init();
    } 
    static get observedAttributes() {
        return ['data-page']; 
    } 
    attributeChangedCallback(attr, prev, next) {
        if(prev !== next) {
          this[`${attr}`] = next;
          //this.render();
          this.updateView(next)
       }
    }
    init() {
        let corners = [
            ["2,50 16,4 149,16 144,47", "23,48 0,12 149,6 144,37"],
            ["4,41 11,22 121,6 148,38 58,53", "24,16 54,14 140,12 146,51 40,50"],
            ["4,41 11,22 148,6 138,42", "12,34 2,18 146,11 128,51"],
            ["2,46 6,8 148,2 145,50", "12,44 12,4 145,4 145,44"]           
        ];
        let cornersReversed = corners.map((coordstr)=>{return coordstr.toReversed()})
        let verts = []; //rebuild corners from string to array with numbers, for circles 
        for (let c=0; c<corners.length; c++) {
            let vertex0 = corners[c][0].replaceAll(' ', ',').split(',').map((el)=>{return Number(el)});
            let vertex1 = corners[c][1].replaceAll(' ', ',').split(',').map((el)=>{return Number(el)});
            verts.push([vertex0, vertex1])
        }
        let lis = this.querySelectorAll('nav li');   
        lis.forEach((el, idx, list)=> {            
            let poly = el.querySelector('polygon');
            let g = el.querySelector('g') 
            if (poly && corners[idx]) poly.setAttribute('points', corners[idx][0])
            for (let i=0; i<verts[idx][0].length/2; i++) {
                let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute('r', 2);
                circle.setAttribute('cx', verts[idx][0][i*2] )
                circle.setAttribute('cy', verts[idx][0][i*2+1] )
                g.appendChild(circle);
            }
            let elVerts = g.querySelectorAll('circle');
                    
            el.addEventListener('mouseenter', ()=> {
                if (el.classList.contains('active')) {return}
                el.classList.add('hover')
                anime({
                    targets: poly,
                    points:[
                        { value: corners[idx] }
                    ],
                    easing: 'easeOutQuad',
                    duration: 200
                });
                
                for (let j=0; j<elVerts.length; j++) {
                    
                    anime({
                        targets: elVerts[j],
                        cx: verts[idx][1][(j*2)],
                        cy: verts[idx][1][(j*2+1)],
                        easing: 'easeOutQuad',
                        duration: 200
                    }) 
                }                
            })
            el.addEventListener('mouseleave', ()=> {
                if (el.classList.contains('active')) {return}
                el.classList.remove('hover');
                anime({
                    targets: poly,
                    points:[
                        { value:  cornersReversed[idx] } 
                    ],
                    easing: 'easeOutQuad',
                    duration: 200
                });
                for (let j=0; j<elVerts.length; j++) {
                    anime({
                        targets: elVerts[j],
                        cx: verts[idx][0][(j*2)],
                        cy: verts[idx][0][(j*2+1)],
                        easing: 'easeOutQuad',
                        duration: 200
                    }) 
                }
            })
        
        })        
    }
    updateView (current) {
        let lis = this.querySelectorAll('nav li');
        lis.forEach(el=> {
            if(el.dataset.page == current) {
                el.classList.add('active');
            } else {
                if(el.classList.contains('active')) {
                    el.classList.remove('active');
                    el.dispatchEvent(new Event('mouseleave')); 
                }
            }                               
        })
    }
    render() {
        this.innerHTML = `
        <style>
            nav {
                display: flex;
                flex-flow: row wrap;
                justify-content: space-between;                
            }
            li, li.active {
                position: relative;
                width: 150px;
                height: 56px;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 2px;
                list-style-type: none;
                padding: 20px;
                margin: 0 8px;
                color: var(--l-txt);
                cursor: pointer;  
                box-sizing: border-box;
                white-space: nowrap;                            
            }
            .nav-li {
                position: absolute;                
                width: 100%;
                height: 100%;                
                z-index: -1;
            }
            li polygon {
                fill: rgba(4, 4, 16, 0.6); 
                transition: fill 400ms ease-in-out; 
            }
            li.active polygon.active, li.hover polygon  {
                fill: royalblue;
                transition: fill 400ms ease-in-out;  
            }
            @media (max-width: 1199.98px) {
                            
            }

            @media (max-width: 991.98px) {

            }
            @media (max-width: 767.98px),
            (orientation: portrait) {
                nav {
                    justify-content: center;
                }
                li, li.active {
                    margin: 5%;
                }                
            }
            @media (max-width: 575.98px) {

            }
            @media (min-aspect-ratio: 2.5) {

            }
        </style> 
        <nav>
            <li data-page="scedule" class="f-centered">
            <svg id="nav-li-scedule" class="nav-li" version="1.1" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">
                <polygon id="nav-li-scedule_polygon" stroke="rgb(0,255,255)" stroke-width="1"/>                     
                <g fill="rgb(0,255,255)" stroke-width="1px">                   
                </g>
            </svg>
                расписание
            </li>
            <li data-page="events" class="f-centered">
            <svg id="nav-li-events" class="nav-li" version="1.1" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">
                <polygon id="nav-li-events_polygon" stroke="rgb(0,255,255)" stroke-width="1"/>
                <g fill="rgb(0,255,255)" stroke-width="1px">
                </g>
            </svg>
                события
            </li>
            <li data-page="news" class="f-centered">
            <svg id="nav-li-news" class="nav-li" version="1.1" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">
                <polygon id="nav-li-news_polygon" stroke="rgb(0,255,255)" stroke-width="1"/>
                <g fill="rgb(0,255,255)" stroke-width="1px">
                </g>
            </svg>
                новости
            </li>
            <li data-page="about" class="f-centered">
            <svg id="nav-li-about" class="nav-li" version="1.1" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">
                <polygon id="nav-li-about_polygon" stroke="rgb(0,255,255)" stroke-width="1"/>
                <g fill="rgb(0,255,255)" stroke-width="1px">
                </g>
            </svg>
                о планетарии
            </li>                             
        </nav>  
        `;             
        
        
    }//render closed
}

 // el.addEventListener('click', (e)=> {
//     lis.forEach((elt)=>{
//         if (elt!==el &&  elt.classList.contains('active')){
//             elt.classList.remove('active');
//             elt.dispatchEvent(new Event('mouseleave'));                                                
//         } else if (elt==el){elt.classList.add('active');}
//     })                    
// })