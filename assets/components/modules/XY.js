//In this exported object all the logic consern geometry and elements coordinates 
export let XY = {
    dh: document.documentElement.scrollHeight,//document height 
    wh: document.documentElement.clientHeight,//window height    
    hlf: document.documentElement.clientHeight/2, // Use half of the screen uses in scrollHandler function in main.js when need activate animated sections.
    quarter: document.documentElement.clientHeight/4,
    k: 0,//coefficient nullifies difference between dh and max Y offset. i.e. when you need max pageYoffset same with document height do some 'let offset = window.pageYOffset*XY.k;'  in a module imported XY.js
    initXY () {
        this.dh = document.documentElement.scrollHeight;
        this.wh = document.documentElement.clientHeight;
        this.hlf = document.documentElement.clientHeight/2;
        this.quarter = document.documentElement.clientHeight/4;
        this.k = (1/((this.dh/this.wh)-1))+1;
        if (!isFinite(this.k)) this.k=0;        
    }   
}