/*! Thanks to
	Virtual Sky
	(c) Stuart Lowe, Las Cumbres Observatory Global Telescope
	A browser planetarium using HTML5's <canvas>.
*/
/*
	USAGE: See http://slowe.github.io/VirtualSky/
*/
(function (S) {
	function is(a,b){return typeof a===b;}	

/*! VirtualSky */
function VirtualSky(input){

	this.version = "0.7.7";

	// Identify the default base directory
	this.setDir = function(){
		var d = S('script[src*=virtualsky]').attr('src')[0].match(/^.*\//);
		this.dir = d && d[0] || "";
		return;
	};
	this.getDir = function(pattern){
		if(typeof pattern!=="string") pattern = "virtualsky";
		var d = S('script[src*='+pattern+']').attr('src');
		if(typeof d==="string") d = [d];
		if(d.length < 1) d = [""];
		d = d[0].match(/^.*\//);
		return d && d[0] || "";
	};

	this.setDir();	// Set the default base directory
	this.dir = this.getDir();  // the JS file path	

	this.id = 'bgnd';						// The ID of the canvas/div tag - if none given it won't display
	this.gradient = true;				// Show the sky gradient
	this.magnitude = 7;					// Limit for stellar magnitude
	this.background = "rgba(0,0,0,0)";	// Default background colour is transparent
	this.color = "";					// Default background colour is chosen automatically

	// Constants
	this.d2r = Math.PI/180; //degrees to radians 
	this.r2d = 180.0/Math.PI; //radians to degrees

	// Set location on the Earth
	this.setLongitude(103.33912);
	this.setLatitude(45.18729);

	// Toggles
	this.spin = false;
	this.constellation = { lines: true, boundaries: true, labels: false };	// Display constellations
	this.current = []; //myComment// current constellation drawn via drawConstellation()
	this.currentIdx = -1;
	this.showgalaxy = true;			// Display the Milky Way
	this.gal = { 'processed':false, 'lineWidth': 100 };
	this.showstars = true;				// Display current positions of the stars
	this.showstarlabels = false;		// Display names for named stars
	this.showplanets = true;			// Display current positions of the planets
	this.showplanetlabels = false;		// Display names for planets
	this.scalestars = 1.4;				// A scale factor by which to increase the star sizes
	this.ground = false;
	this.grid = { az: false, eq: false, gal: false, step: 10 };	// Display grids
	
	this.ecliptic = false;				// Display the Ecliptic
	this.meridian = false;				// Display the Meridian
	this.keyboard = true;				// Allow keyboard controls
	this.mouse = true;					// Allow mouse controls
	this.transparent = false;			// Show the sky background or not
	this.fps = 10;						// Number of frames per second when animating
	
	this.lookup = {};
	this.keys = [];
	this.az_step = 0;
	this.az_off = 0;
	this.ra_off = 0;
	this.dc_off = 0;
	this.fov = 30;	
	this.calendarevents = [];
	this.events = {};	// Let's add some default events

	this.callback = { geo:'', mouseenter:'', mouseout:'', cursor: '', click:'' };
	


	// Projection //muComment// refacted in first commit
	this.projection = {
		'stereo': {
			title: 'Stereographic projection',
		}
	};
	this.azel2radec = function(az,el){
		var xt,yt,r,l;
		l = this.latitude.rad;
		xt  =  Math.asin( Math.sin(el) * Math.sin(l) + Math.cos(el) * Math.cos(l) * Math.cos(az) );
		r = ( Math.sin(el) - Math.sin(l) * Math.sin(xt) ) / ( Math.cos(l) * Math.cos(xt) );
		if(r > 1) r = 1;
		yt  =  Math.acos(r);
		if(Math.sin(az) > 0.0) yt  =  Math.PI*2 - yt;
		xt *= this.r2d;
		yt *= this.r2d;
		yt = (this.times.LST*15 - yt + 360)%360.0;
		return { ra: yt, dec: xt };
	};
	this.azel2xy = function(az,el,w,h){
		var f = 0.42;
		var sinel1 = 0;
		var cosel1 = 1;
		var cosaz = Math.cos((az-Math.PI));
		var sinaz = Math.sin((az-Math.PI));
		var sinel = Math.sin(el);
		var cosel = Math.cos(el);
		var k = 2/(1+sinel1*sinel+cosel1*cosel*cosaz);
		return {x:(w/2+f*k*h*cosel*sinaz),y:(h-f*k*h*(cosel1*sinel-sinel1*cosel*cosaz)),el:el};
	}
	this.xy2azel = function(x, y, w, h) {
		var f = 0.42;
		var sinel1 = 0;
		var cosel1 = 1;
		var X = (x - w/2) / h;
		var Y = (h - y)/h;
		var R = f;
		var P = Math.sqrt(X * X + Y * Y);
		var c = 2 * Math.atan2(P, 2*R);
		var el = Math.asin(Math.cos(c)*sinel1 + Y * Math.sin(c) * cosel1 / P);
		var az = Math.PI + Math.atan2(X * Math.sin(c), P * cosel1 * Math.cos(c) - Y * sinel1 * Math.sin(c));
		return [az, el];
	}	

	//myComment// Stars section ra is Right Ascension, dec is Declination.
	this.starsdeep = true;
	this.lookup.star = [];
	this.starnames = {};
	this.paths = [];
	// Data for stars < mag 4.5 or that are a vertex for a constellation line - 20 kB [id, mag, right ascension, declination]
	// index with Hipparcos number
	this.stars = this.convertStarsToRadians([[677,2.1,2.097,29.09],[746,2.3,2.295,59.15],[765,3.9,2.353,-45.75],
					[1067,2.8,3.309,15.18],[1562,3.6,4.857,-8.82],[1599,4.2,5.018,-64.87],[1645,5.4,5.149,8.19],
					[2021,2.8,6.438,-77.25],[2072,3.9,6.551,-43.68],[2081,2.4,6.571,-42.31],[2484,4.4,7.886,-62.96],
					[2920,3.7,9.243,53.9],[3092,3.3,9.832,30.86],[3179,2.2,10.127,56.54],[3419,2,10.897,-17.99],
					[3760,5.9,12.073,7.3],[3821,3.5,12.276,57.82],[3881,4.5,12.454,41.08],[4427,2.1,14.177,60.72],
					[4436,3.9,14.188,38.5],[4577,4.3,14.652,-29.36],[4889,5.5,15.705,31.8],[4906,4.3,15.736,7.89],
					[5165,3.3,16.521,-46.72],[5348,3.9,17.096,-55.25],[5364,3.5,17.147,-10.18],[5447,2.1,17.433,35.62],
					[5742,4.7,18.437,24.58],[6193,4.7,19.867,27.26],[6537,3.6,21.006,-8.18],[6686,2.7,21.454,60.24],
					[6867,3.4,22.091,-43.32],[7007,4.8,22.546,6.14],[7083,3.9,22.813,-49.07],[7097,3.6,22.871,15.35],
					[7588,0.5,24.429,-57.24],[7607,3.6,24.498,48.63],[7884,4.5,25.358,5.49],[8102,3.5,26.017,-15.94],
					[8198,4.3,26.348,9.16],[8645,3.7,27.865,-10.34],[8796,3.4,28.27,29.58],[8832,3.9,28.383,19.29],
					[8833,4.6,28.389,3.19],[8837,4.4,28.411,-46.3],[8886,3.4,28.599,63.67],[8903,2.6,28.66,20.81],
					[9007,3.7,28.989,-51.61],[9236,2.9,29.692,-61.57],[9347,4,30.001,-21.08],[9487,3.8,30.512,2.76],
					[9598,4,30.859,72.42],[9640,2.1,30.975,42.33],[9884,2,31.793,23.46],[10064,3,32.386,34.99],
					[10324,4.4,33.25,8.85],[10559,5.3,33.985,33.36],[10602,3.6,34.127,-51.51],[10826,6.5,34.837,-2.98],
					[11001,4.1,35.437,-68.66],[11345,4.9,36.488,-12.29],[11407,4.2,36.746,-47.7],[11484,4.3,37.04,8.46],
					[11767,2,37.955,89.26],[11783,4.7,38.022,-15.24],[12093,4.9,38.969,5.59],[12387,4.1,39.871,0.33],
					[12390,4.8,39.891,-11.87],[12394,4.1,39.897,-68.27],[12413,4.7,39.95,-42.89],[12484,5.2,40.165,-54.55],
					[12486,4.1,40.167,-39.86],[12706,3.5,40.825,3.24],[12770,4.2,41.031,-13.86],[12828,4.3,41.236,10.11],
					[12843,4.5,41.276,-18.57],[13147,4.5,42.273,-32.41],[13209,3.6,42.496,27.26],[13254,4.2,42.646,38.32],
					[13268,3.8,42.674,55.9],[13531,3.9,43.564,52.76],[13701,3.9,44.107,-8.9],[13847,2.9,44.565,-40.3],
					[13954,4.7,44.929,8.91],[14135,2.5,45.57,4.09],[14146,4.1,45.598,-23.62],[14240,5.1,45.903,-59.74],
					[14328,2.9,46.199,53.51],[14354,3.3,46.294,38.84],[14576,2.1,47.042,40.96],[14668,3.8,47.374,44.86],
					[14879,3.8,48.019,-28.99],[15197,4.8,48.958,-8.82],[15474,3.7,49.879,-21.76],[15510,4.3,49.982,-43.07],
					[15863,1.8,51.081,49.86],[15900,3.6,51.203,9.03],[16083,3.7,51.792,9.73],[16228,4.2,52.267,59.94],
					[16537,3.7,53.233,-9.46],[16611,4.3,53.447,-21.63],[17358,3,55.731,47.79],[17378,3.5,55.812,-9.76],
					[17440,3.8,56.05,-64.81],[17448,3.8,56.08,32.29],[17499,3.7,56.219,24.11],[17529,3.8,56.298,42.58],
					[17573,3.9,56.457,24.37],[17651,4.2,56.712,-23.25],[17678,3.3,56.81,-74.24],[17702,2.9,56.871,24.11],
					[17797,4.3,57.149,-37.62],[17847,3.6,57.291,24.05],[17874,4.2,57.364,-36.2],[17959,4.6,57.59,71.33],
					[18246,2.8,58.533,31.88],[18505,5,59.356,63.07],[18532,2.9,59.463,40.01],[18543,3,59.507,-13.51],
					[18597,4.6,59.686,-61.4],[18614,4,59.741,35.79],[18724,3.4,60.17,12.49],[18907,3.9,60.789,5.99],
					[19343,4,62.165,47.71],[19747,3.9,63.5,-42.29],[19780,3.3,63.606,-62.47],[19893,4.3,64.007,-51.49],
					[19921,4.4,64.121,-59.3],[20042,3.5,64.474,-33.8],[20205,3.6,64.948,15.63],[20455,3.8,65.734,17.54],
					[20535,4,66.009,-34.02],[20648,4.3,66.372,17.93],[20885,3.8,67.144,15.96],[20889,3.5,67.154,19.18],
					[20894,3.4,67.166,15.87],[21060,5.1,67.709,-44.95],[21281,3.3,68.499,-55.04],[21393,3.8,68.888,-30.56],
					[21421,0.9,68.98,16.51],[21444,3.9,69.08,-3.35],[21594,3.9,69.545,-14.3],[21770,4.4,70.14,-41.86],
					[21861,5,70.515,-37.14],[21881,4.3,70.561,22.96],[21949,5.5,70.767,-70.93],[22109,4,71.376,-3.25],
					[22449,3.2,72.46,6.96],[22509,4.3,72.653,8.9],[22549,3.7,72.802,5.61],[22701,4.4,73.224,-5.45],
					[22730,5.3,73.345,2.51],[22783,4.3,73.513,66.34],[22797,3.7,73.563,2.44],[22845,4.6,73.724,10.15],
					[23015,2.7,74.248,33.17],[23123,4.5,74.637,1.71],[23416,3,75.492,43.82],[23453,3.7,75.62,41.08],
					[23685,3.2,76.365,-22.37],[23767,3.2,76.629,41.23],[23875,2.8,76.962,-5.09],[23972,4.3,77.287,-8.75],
					[24244,4.5,78.075,-11.87],[24305,3.3,78.233,-16.21],[24327,4.4,78.308,-12.94],[24436,0.2,78.634,-8.2],
					[24608,0.1,79.172,46],[24674,3.6,79.402,-6.84],[24845,4.3,79.894,-13.18],[24873,5.3,79.996,-12.32],
					[25110,5.1,80.64,79.23],[120412],[25281,3.4,81.119,-2.4],[25336,1.6,81.283,6.35],
					[25428,1.6,81.573,28.61],[25606,2.8,82.061,-20.76],[25859,3.9,82.803,-35.47],[25918,5.2,82.971,-76.34],
					[25930,2.3,83.002,-0.3],[25985,2.6,83.183,-17.82],[26069,3.8,83.406,-62.49],[26207,3.4,83.784,9.93],
					[26241,2.8,83.858,-5.91],[26311,1.7,84.053,-1.2],[26451,3,84.411,21.14],[26549,3.8,84.687,-2.6],
					[26634,2.6,84.912,-34.07],[26727,1.7,85.19,-1.94],[27072,3.6,86.116,-22.45],[27100,4.3,86.193,-65.74],
					[27288,3.5,86.739,-14.82],[27321,3.9,86.821,-51.07],[27366,2.1,86.939,-9.67],[27530,4.5,87.457,-56.17],
					[27628,3.1,87.74,-35.77],[27654,3.8,87.83,-20.88],[27673,4,87.872,39.15],[27890,4.7,88.525,-63.09],
					[27913,4.4,88.596,20.28],[27989,0.5,88.793,7.41],[28103,3.7,89.101,-14.17],[28199,4.4,89.384,-35.28],
					[28328,4,89.787,-42.82],[28358,3.7,89.882,54.28],[28360,1.9,89.882,44.95],[28380,2.6,89.93,37.21],
					[28614,4.1,90.596,9.65],[28691,5.1,90.864,19.69],[28734,4.2,91.03,23.26],[28910,4.7,91.539,-14.94],
					[29038,4.4,91.893,14.77],[29151,5.7,92.241,2.5],[29426,4.5,92.985,14.21],[29651,4,93.714,-6.27],
					[29655,3.3,93.719,22.51],[29807,4.4,94.138,-35.14],[30060,4.4,94.906,59.01],[30122,3,95.078,-30.06],
					[30277,3.9,95.528,-33.44],[30324,2,95.675,-17.96],[30343,2.9,95.74,22.51],[30419,4.4,95.942,4.59],
					[30438,-0.6,95.988,-52.7],[30867,3.8,97.204,-7.03],[30883,4.1,97.241,20.21],[31416,4.5,98.764,-22.96],
					[31592,4,99.171,-19.26],[31681,1.9,99.428,16.4],[31685,3.2,99.44,-43.2],[32246,3.1,100.983,25.13],
					[32349,-1.4,101.287,-16.72],[32362,3.4,101.322,12.9],[32607,3.2,102.048,-61.94],[32759,3.5,102.46,-32.51],
					[32768,2.9,102.484,-50.61],[33018,3.6,103.197,33.96],[33152,3.9,103.533,-24.18],[33160,4.1,103.547,-12.04],
					[33165,6.7,103.554,-23.93],[33347,4.4,104.034,-17.05],[33449,4.3,104.319,58.42],[33579,1.5,104.656,-28.97],
					[33856,3.5,105.43,-27.93],[33977,3,105.756,-23.83],[34045,4.1,105.94,-15.63],[34088,4,106.027,20.57],
					[34444,1.8,107.098,-26.39],[34481,3.8,107.187,-70.5],[34693,4.4,107.785,30.25],[34769,4.2,107.966,-0.49],
					[35037,4,108.703,-26.77],[35228,4,109.208,-67.96],[35264,2.7,109.286,-37.1],[35350,3.6,109.523,16.54],
					[35550,3.5,110.031,21.98],[35904,2.5,111.024,-29.3],[36046,3.8,111.432,27.8],[36145,4.6,111.679,49.21],
					[36188,2.9,111.788,8.29],[36377,3.3,112.308,-43.3],[36850,1.6,113.649,31.89],[36962,4.1,113.981,26.9],
					[37229,3.8,114.708,-26.8],[37279,0.4,114.825,5.22],[37447,3.9,115.312,-9.55],[37504,3.9,115.455,-72.61],
					[37677,3.9,115.952,-28.95],[37740,3.6,116.112,24.4],[37819,3.6,116.314,-37.97],[37826,1.2,116.329,28.03],
					[38146,5.3,117.257,-24.91],[38170,3.3,117.324,-24.86],[38414,3.7,118.054,-40.58],[38827,3.5,119.195,-52.98],
					[39429,2.2,120.896,-40],[39757,2.8,121.886,-24.3],[39794,4.3,121.982,-68.62],[39863,4.4,122.149,-2.98],
					[39953,1.8,122.383,-47.34],[40526,3.5,124.129,9.19],[40702,4,124.631,-76.92],[40843,5.1,125.016,27.22],
					[41037,1.9,125.628,-59.51],[41075,4.3,125.709,43.19],[41307,3.9,126.415,-3.91],[41312,3.8,126.434,-66.14],
					[41704,3.4,127.566,60.72],[42313,4.1,129.414,5.7],[42402,4.5,129.689,3.34],[42515,4,130.026,-35.31],
					[42536,3.6,130.073,-52.92],[42568,4.3,130.154,-59.76],[42570,3.8,130.157,-46.65],[42799,4.3,130.806,3.4],
					[42806,4.7,130.821,21.47],[42828,3.7,130.898,-33.19],[42911,3.9,131.171,18.15],[42913,1.9,131.176,-54.71],
					[43023,3.9,131.507,-46.04],[43103,4,131.674,28.76],[43109,3.4,131.694,6.42],[43234,4.3,132.108,5.84],
					[43409,4,132.633,-27.71],[43783,3.8,133.762,-60.64],[43813,3.1,133.848,5.95],[44066,4.3,134.622,11.86],
					[44127,3.1,134.802,48.04],[44248,4,135.16,41.78],[44382,4,135.612,-66.4],[44471,3.6,135.906,47.16],
					[44511,3.8,136.039,-47.1],[44700,4.6,136.632,38.45],[44816,2.2,136.999,-43.43],[45080,3.4,137.742,-58.97],
					[45101,4,137.82,-62.32],[45238,1.7,138.3,-69.72],[45336,3.9,138.591,2.31],[45556,2.2,139.273,-59.28],
					[45688,3.8,139.711,36.8],[45860,3.1,140.264,34.39],[45941,2.5,140.528,-55.01],[46390,2,141.897,-8.66],
					[46509,4.6,142.287,-2.77],[46651,3.6,142.675,-40.47],[46701,3.2,142.805,-57.03],[46733,3.6,142.882,63.06],
					[46776,4.5,142.996,-1.18],[46853,3.2,143.214,51.68],[46952,4.5,143.556,36.4],[47431,3.9,144.964,-1.14],
					[47508,3.5,145.288,9.89],[47854,3.7,146.312,-62.51],[47908,3,146.463,23.77],[48002,2.9,146.776,-65.07],
					[48319,3.8,147.747,59.04],[48356,4.1,147.87,-14.85],[48402,4.5,148.026,54.06],[48455,3.9,148.191,26.01],
					[48774,3.5,149.216,-54.57],[48926,5.2,149.718,-35.89],[49583,3.5,151.833,16.76],[49593,4.5,151.857,35.24],
					[49641,4.5,151.985,-0.37],[49669,1.4,152.093,11.97],[49841,3.6,152.647,-12.35],[50099,3.3,153.434,-70.04],
					[50191,3.9,153.684,-42.12],[50335,3.4,154.173,23.42],[50371,3.4,154.271,-61.33],[50372,3.5,154.274,42.91],
					[50583,2,154.993,19.84],[50801,3.1,155.582,41.5],[50954,4,156.099,-74.03],[51069,3.8,156.523,-16.84],
					[51172,4.3,156.788,-31.07],[51232,3.8,156.97,-58.74],[51233,4.2,156.971,36.71],[51437,5.1,157.573,-0.64],
					[51576,3.3,158.006,-61.69],[51624,3.8,158.203,9.31],[51839,4.1,158.867,-78.61],[51986,3.8,159.326,-48.23],
					[52419,2.7,160.739,-64.39],[52468,4.6,160.885,-60.57],[52727,2.7,161.692,-49.42],[52943,3.1,162.406,-16.19],
					[53229,3.8,163.328,34.21],[53253,3.8,163.374,-58.85],[53740,4.1,164.944,-18.3],[53910,2.3,165.46,56.38],
					[54061,1.8,165.932,61.75],[54463,3.9,167.147,-58.98],[54539,3,167.416,44.5],[54682,4.5,167.915,-22.83],
					[54872,2.6,168.527,20.52],[54879,3.3,168.56,15.43],[55203,3.8],[55219,3.5,169.62,33.09],
					[55282,3.6,169.835,-14.78],[55425,3.9,170.252,-54.49],[55687,4.8,171.152,-10.86],[55705,4.1,171.221,-17.68],
					[56211,3.8,172.851,69.33],[56343,3.5,173.25,-31.86],[56480,4.6,173.69,-54.26],[56561,3.1,173.945,-63.02],
					[56633,4.7,174.17,-9.8],[57283,4.7,176.191,-18.35],[57363,3.6,176.402,-66.73],[57380,4,176.465,6.53],
					[57399,3.7,176.513,47.78],[57632,2.1,177.265,14.57],[57757,3.6,177.674,1.76],[57936,4.3,178.227,-33.91],
					[58001,2.4,178.458,53.69],[58188,5.2,179.004,-17.15],[59196,2.6,182.09,-50.72],[59199,4,182.103,-24.73],
					[59316,3,182.531,-22.62],[59449,4,182.913,-52.37],[59747,2.8,183.786,-58.75],[59774,3.3,183.857,57.03],
					[59803,2.6,183.952,-17.54],[60000,4.2,184.587,-79.31],[60030,5.9,184.668,-0.79],[60129,3.9,184.976,-0.67],
					[60260,3.6,185.34,-60.4],[60718,0.8,186.65,-63.1],[60742,4.3,186.734,28.27],[60823,3.9,187.01,-50.23],
					[60965,2.9,187.466,-16.52],[61084,1.6,187.791,-57.11],[61174,4.3,188.018,-16.2],[61199,3.8,188.117,-72.13],
					[61281,3.9,188.371,69.79],[61317,4.2,188.436,41.36],[61359,2.6,188.597,-23.4],[61585,2.7,189.296,-69.14],
					[61622,3.9,189.426,-48.54],[61932,2.2,190.379,-48.96],[61941,2.7,190.415,-1.45],[62322,3,191.57,-68.11],
					[62434,1.3,191.93,-59.69],[62956,1.8,193.507,55.96],[63090,3.4,193.901,3.4],[63125,2.9,194.007,38.32],
					[63608,2.9,195.544,10.96],[63613,3.6,195.568,-71.55],[64166,4.9,197.264,-23.12],[64241,4.3,197.497,17.53],
					[64394,4.2,197.968,27.88],[64962,3,199.73,-23.17],[65109,2.8,200.149,-36.71],[65378,2.2,200.981,54.93],
					[65474,1,201.298,-11.16],[65477,4,201.306,54.99],[65936,3.9,202.761,-39.41],[66249,3.4,203.673,-0.6],
					[66657,2.3,204.972,-53.47],[67301,1.9,206.885,49.31],[67459,4,207.369,15.8],[67464,3.4,207.376,-41.69],
					[67472,3.5,207.404,-42.47],[67927,2.7,208.671,18.4],[68002,2.5,208.885,-47.29],[68245,3.8,209.568,-42.1],
					[68282,3.9,209.67,-44.8],[68520,4.2,210.412,1.54],[68702,0.6,210.956,-60.37],[68756,3.7,211.097,64.38],
					[68895,3.3,211.593,-26.68],[68933,2.1,211.671,-36.37],[69427,4.2,213.224,-10.27],[69673,-0.1,213.915,19.18],
					[69701,4.1,214.004,-6],[69996,3.5,214.851,-46.06],[70576,4.3,216.545,-45.38],[70638,4.3,216.73,-83.67],
					[71053,3.6,217.957,30.37],[71075,3,218.019,38.31],[71352,2.3,218.877,-42.16],[71536,4,219.472,-49.43],
					[71681,1.4,219.896,-60.84],[71683,-0,219.902,-60.83],[71795,3.8,220.287,13.73],[71860,2.3,220.482,-47.39],
					[71908,3.2,220.627,-64.98],[71957,3.9,220.765,-5.66],[72105,2.4,221.247,27.07],[72220,3.7,221.562,1.89],
					[72370,3.8,221.965,-79.04],[72607,2.1,222.676,74.16],[72622,2.8,222.72,-16.04],[73273,2.7,224.633,-43.13],
					[73334,3.1,224.79,-42.1],[73555,3.5,225.487,40.39],[73714,3.3,226.018,-25.28],[73807,3.9,226.28,-47.05],
					[74376,3.9,227.984,-48.74],[74395,3.4,228.071,-52.1],[74666,3.5,228.876,33.31],[74785,2.6,229.252,-9.38],
					[74824,4.1,229.379,-58.8],[74946,2.9,229.727,-68.68],[75097,3,230.182,71.83],[75141,3.2,230.343,-40.65],
					[75177,3.6,230.452,-36.26],[75264,3.4,230.67,-44.69],[75323,4.5,230.844,-59.32],[75458,3.3,231.232,58.97],
					[75695,3.7,231.957,29.11],[76127,4.1,233.232,31.36],[76267,2.2,233.672,26.71],[76276,3.8,233.701,10.54],
					[76297,2.8,233.785,-41.17],[76333,3.9,233.882,-14.79],[76470,3.6,234.256,-28.14],[76552,4.3,234.513,-42.57],
					[76600,3.7,234.664,-29.78],[76952,3.8,235.686,26.3],[77055,4.3,236.015,77.79],[77070,2.6,236.067,6.43],
					[77233,3.6,236.547,15.42],[77450,4.1,237.185,18.14],[77512,4.6,237.399,26.07],[77516,3.5,237.405,-3.43],
					[77622,3.7,237.704,4.48],[77634,4,237.74,-33.63],[77760,4.6,238.169,42.45],[77853,4.1,238.456,-16.73],
					[77952,2.8,238.786,-63.43],[78072,3.9,239.113,15.66],[78104,3.9,239.221,-29.21],[78159,4.1,239.397,26.88],
					[78265,2.9,239.713,-26.11],[78384,3.4,240.031,-38.4],[78401,2.3,240.083,-22.62],[78493,5,240.361,29.85],
					[78527,4,240.472,58.57],[78639,4.7,240.804,-49.23],[78820,2.6,241.359,-19.81],[78933,3.9,241.702,-20.67],
					[78970,5.7,241.818,-36.76],[79509,5,243.37,-54.63],[79593,2.7,243.586,-3.69],[79664,3.9,243.859,-63.69],
					[79822,5,244.376,75.76],[79882,3.2,244.58,-4.69],[79992,3.9,244.935,46.31],[80000,4,244.96,-50.16],
					[80112,2.9,245.297,-25.59],[80170,3.7,245.48,19.15],[80331,2.7,245.998,61.51],[80582,4.5,246.796,-47.55],
					[80763,1.1,247.352,-26.43],[80816,2.8,247.555,21.49],[80883,3.8,247.728,1.98],[81065,3.9,248.363,-78.9],
					[81126,4.2,248.526,42.44],[81266,2.8,248.971,-28.22],[81377,2.5,249.29,-10.57],[81693,2.8,250.322,31.6],
					[81833,3.5,250.724,38.92],[81852,4.2,250.769,-77.52],[82080,4.2,251.493,82.04],[82273,1.9,252.166,-69.03],
					[82363,3.8,252.446,-59.04],[82396,2.3,252.541,-34.29],[82514,3,252.968,-38.05],[82545,3.6,253.084,-38.02],
					[82671,4.7,253.499,-42.36],[82729,3.6,253.646,-42.36],[83000,3.2,254.417,9.38],[83081,3.1,254.655,-55.99],
					[83207,3.9,255.072,30.93],[83895,3.2,257.197,65.71],[84012,2.4,257.595,-15.72],[84143,3.3,258.038,-43.24],
					[84345,2.8,258.662,14.39],[84379,3.1,258.758,24.84],[84380,3.2,258.762,36.81],[84606,4.6,259.418,37.29],
					[84880,4.3,260.207,-12.85],[84970,3.3,260.502,-25],[85112,4.2,260.921,37.15],[85258,2.8,261.325,-55.53],
					[85267,3.3,261.349,-56.38],[85670,2.8,262.608,52.3],[85693,4.4,262.685,26.11],[85696,2.7,262.691,-37.3],
					[85727,3.6,262.775,-60.68],[85755,4.8,262.854,-23.96],[85792,2.8,262.96,-49.88],[85822,4.3,263.054,86.59],
					[85829,4.9,263.067,55.17],[85927,1.6,263.402,-37.1],[86032,2.1,263.734,12.56],[86228,1.9,264.33,-43],
					[86263,3.5,264.397,-15.4],[86414,3.8,264.866,46.01],[86565,4.2,265.354,-12.88],[86670,2.4,265.622,-39.03],
					[86742,2.8,265.868,4.57],[86929,3.6,266.433,-64.72],[86974,3.4,266.615,27.72],[87072,4.5,266.89,-27.83],
					[87073,3,266.896,-40.13],[87108,3.8,266.973,2.71],[87261,3.2,267.465,-37.04],[87585,3.7,268.382,56.87],
					[87808,3.9,269.063,37.25],[87833,2.2,269.152,51.49],[87933,3.7,269.441,29.25],[88048,3.3,269.757,-9.77],
					[88192,3.9,270.161,2.93],[88635,3,271.452,-30.42],[88714,3.6,271.658,-50.09],[88771,3.7,271.837,9.56],
					[88794,3.8,271.886,28.76],[88866,4.3,272.145,-63.67],[89341,3.8,273.441,-21.06],[89642,3.1,274.407,-36.76],
					[89931,2.7,275.249,-29.83],[89937,3.5,275.264,72.73],[89962,3.2,275.328,-2.9],[90098,4.3,275.807,-61.49],
					[90139,3.9,275.925,21.77],[90185,1.8,276.043,-34.38],[90422,3.5,276.743,-45.97],[90496,2.8,276.993,-25.42],
					[90568,4.1,277.208,-49.07],[90595,4.7,277.299,-14.57],[90887,5.2,278.089,-39.7],[91117,3.9,278.802,-8.24],
					[91262,0,279.235,38.78],[91792,4,280.759,-71.43],[91875,5.1,280.946,-38.32],[91971,4.3,281.193,37.61],
					[92041,3.2,281.414,-26.99],[92175,4.2,281.794,-4.75],[92202,5.4,281.871,-5.71],[92420,3.5,282.52,33.36],
					[92609,4.2,283.054,-62.19],[92791,4.2,283.626,36.9],[92814,5.1,283.68,-15.6],[92855,2,283.816,-26.3],
					[92946,4.6,284.055,4.2],[92953,5.3,284.071,-42.71],[92989,5.4,284.169,-37.34],[93015,4.4,284.238,-67.23],
					[93085,3.5,284.433,-21.11],[93174,4.8,284.681,-37.11],[93194,3.3,284.736,32.69],[93244,4,284.906,15.07],
					[93506,2.6,285.653,-29.88],[93542,4.7,285.779,-42.1],[93683,3.8,286.171,-21.74],[93747,3,286.353,13.86],
					[93805,3.4,286.562,-4.88],[93825,4.2,286.605,-37.06],[93864,3.3,286.735,-27.67],[94005,4.6,287.087,-40.5],
					[94114,4.1,287.368,-37.9],[94141,2.9,287.441,-21.02],[94160,4.1,287.507,-39.34],[94376,3.1,288.139,67.66],
					[94779,3.8,289.276,53.37],[94820,4.9,289.409,-18.95],[95168,3.9,290.418,-17.85],[95241,4,290.66,-44.46],
					[95294,4.3,290.805,-44.8],[95347,4,290.972,-40.62],[95501,3.4,291.375,3.11],[95771,4.4,292.176,24.66],
					[95853,3.8,292.426,51.73],[95947,3,292.68,27.96],[96406,5.6,294.007,-24.72],[96757,4.4,295.024,18.01],
					[96837,4.4,295.262,17.48],[97165,2.9,296.244,45.13],[97278,2.7,296.565,10.61],[97365,3.7,296.847,18.53],
					[97433,3.8,297.043,70.27],[97649,0.8,297.696,8.87],[97804,3.9,298.118,1.01],[98032,4.1,298.815,-41.87],
					[98036,3.7,298.828,6.41],[98110,3.9,299.077,35.08],[98337,3.5,299.689,19.49],[98412,4.4,299.934,-35.28],
					[98495,4,300.148,-72.91],[98543,4.7,300.275,27.75],[98688,4.4,300.665,-27.71],[98920,5.1,301.29,19.99],
					[99240,3.5,302.182,-66.18],[99473,3.2,302.826,-0.82],[99675,3.8,303.408,46.74],[99848,4,303.868,47.71],
					[100064,3.6,304.514,-12.54],[100345,3,305.253,-14.78],[100453,2.2,305.557,40.26],[100751,1.9,306.412,-56.74],
					[101421,4,308.303,11.3],[101769,3.6,309.387,14.6],[101772,3.1,309.392,-47.29],[101958,3.8,309.91,15.91],
					[102098,1.3,310.358,45.28],[102281,4.4,310.865,15.07],[102395,3.4,311.24,-66.2],[102422,3.4,311.322,61.84],
					[102485,4.1,311.524,-25.27],[102488,2.5,311.553,33.97],[102532,4.3,311.665,16.12],[102618,3.8,311.919,-9.5],
					[102831,4.9,312.492,-33.78],[102978,4.1,312.955,-26.92],[103227,3.7,313.703,-58.45],[103413,3.9,314.293,41.17],
					[103738,4.7,315.323,-32.26],[104060,3.7,316.233,43.93],[104139,4.1,316.487,-17.23],[104521,4.7,317.585,10.13],
					[104732,3.2,318.234,30.23],[104858,4.5,318.62,10.01],[104887,3.7,318.698,38.05],[104987,3.9,318.956,5.25],
					[105140,4.7,319.485,-32.17],[105199,2.5,319.645,62.59],[105319,4.4,319.967,-53.45],[105515,4.3,320.562,-16.83],
					[105570,5.2,320.723,6.81],[105858,4.2,321.611,-65.37],[105881,3.8,321.667,-22.41],[106032,3.2,322.165,70.56],
					[106278,2.9,322.89,-5.57],[106481,4,323.495,45.59],[106985,3.7,325.023,-16.66],[107089,3.7,325.369,-77.39],
					[107310,4.5,326.036,28.74],[107315,2.4,326.046,9.88],[107354,4.1,326.161,25.65],[107556,2.9,326.76,-16.13],
					[107608,5,326.934,-30.9],[108085,3,328.482,-37.36],[108661,5.4,330.209,-28.45],[109074,3,331.446,-0.32],
					[109111,4.5,331.529,-39.54],[109139,4.3,331.609,-13.87],[109176,3.8,331.753,25.35],[109268,1.7,332.058,-46.96],
					[109352,5.6,332.307,33.17],[109422,4.9,332.537,-32.55],[109427,3.5,332.55,6.2],[109492,3.4,332.714,58.2],
					[109937,4.1,333.992,37.75],[110003,4.2,334.208,-7.78],[110130,2.9,334.625,-60.26],[110395,3.9,335.414,-1.39],
					[110538,4.4,335.89,52.23],[110609,4.5,336.129,49.48],[110960,3.6,337.208,-0.02],[110997,4,337.317,-43.5],
					[111022,4.3,337.383,47.71],[111104,4.5,337.622,43.12],[111123,4.8,337.662,-10.68],[111169,3.8,337.823,50.28],
					[111188,4.3,337.876,-32.35],[111497,4,338.839,-0.12],[111954,4.2,340.164,-27.04],[112029,3.4,340.366,10.83],
					[112122,2.1,340.667,-46.88],[112158,2.9,340.751,30.22],[112405,4.1,341.515,-81.38],[112440,4,341.633,23.57],
					[112447,4.2,341.673,12.17],[112623,3.5,342.139,-51.32],[112716,4,342.398,-13.59],[112724,3.5,342.42,66.2],
					[112748,3.5,342.501,24.6],[112961,3.7,343.154,-7.58],[113136,3.3,343.663,-15.82],[113246,4.2,343.987,-32.54],
					[113368,1.2,344.413,-29.62],[113638,4.1,345.22,-52.75],[113726,3.6,345.48,42.33],[113881,2.4,345.944,28.08],
					[113963,2.5,346.19,15.21],[114131,4.3,346.72,-43.52],[114341,3.7,347.362,-21.17],[114421,3.9,347.59,-45.25],
					[114855,4.2,348.973,-9.09],[114971,3.7,349.291,3.28],[114996,4,349.357,-58.24],[115102,4.4,349.706,-32.53],
					[115438,4,350.743,-20.1],[115738,5,351.733,1.26],[115830,4.3,351.992,6.38],[116231,4.4,353.243,-37.82],
					[116584,3.8,354.391,46.46],[116727,3.2,354.837,77.63],[116771,4.1,354.988,5.63],[116928,4.5,355.512,1.78],
					[118268,4,359.828,6.86]]);
	
	

	//myComment// Data for stars mag > 4.5 from external file.
	//uncomment next to load
	this.loadJSON(
		'assets/libs/VirtualSky/stars.json',
		function(data) {
			this.stars = this.stars.concat(this.convertStarsToRadians(data.stars));	
		},
		function () {
			for(i = 0; i < this.stars.length; i++) {
				this.lookup.star.push({'ra':this.stars[i][2],'dec':this.stars[i][3],'label':this.stars[i][0],'mag':this.stars[i][1]});
			}
		}
	)		
	
	// Add the stars to the lookup
	// loadind planets and store them for a while
	this.load('planets',
		'assets/libs/VirtualSky/virtualsky-planets.js',		
	)
	// loadind constellation lines and store them without rendering
	this.loadJSON(
		'assets/libs/VirtualSky/lines_latin.json',
		function(data) {
			this.lines = data.lines;	
		}
	)
	// loadind constellation boundaries and store them without rendering
	this.loadJSON(
		'assets/libs/VirtualSky/boundaries.json',
		function(data) {
			this.boundaries = data.boundaries;	
		}
	)
	// loadind galaxy and store It without rendering
	this.loadJSON(
		'assets/libs/VirtualSky/galaxy.json',
		function(data) {
			this.galaxy = data.galaxy;	
		}
	)	
	//myComment// end of Stars section
	
	// Define extra files (JSON/JS)
	this.file = {
		stars: this.dir+"stars.json",                 // Data for faint stars - 54 kB
		lines: this.dir+"lines_latin.json",           // Data for constellation lines - 12 kB
		boundaries: this.dir+"boundaries.json",       // Data for constellation boundaries - 20 kB
		showers: this.dir+"showers.json",             // Data for meteor showers - 4 kB
		galaxy: this.dir+"galaxy.json",               // Data for milky way - 12 kB
		planets: this.dir+"virtualsky-planets.js" // Plugin for planet ephemeris - 12kB
	};
	this.plugins = input.plugins;
	this.mobile = input.mobile;
	this.hipparcos = {};          // Define our star catalogue
	this.updateClock(new Date()); // Define the 'current' time
	this.fullsky = false;         // Are we showing the entire sky?

	// Define the colours that we will use
	this.colours = {
		'normal' : {
			'txt' : "rgb(255,255,255)",
			'midnight':"rgb(4,4,16)",
			'white':"rgb(255,255,255)",
			'grey':"rgb(100,100,100)",
			'stars':'rgb(0,255,255)',
			'moon':'rgb(150,150,150)',
			'sun':'rgb(255, 215, 0)',
			'cardinal':'rgba(163,228,255, 1)',
			'constellation':"rgba(180,180,255,0.8)",
			'showers':"rgba(100,255,100,0.8)", 
			'galaxy':"rgba(50, 242, 255, 0.02)",
			'az':"rgba(100,100,255,0.4)",
			'eq':"rgba(255,100,100,0.4)",
			'ec':'rgba(255,0,0,0.4)',
			'gal':'rgba(100,200,255,0.4)',
			'meridian':'rgba(25,255,0,0.4)',
			'pointers':'rgb(200,200,200)'
		}		
	};
	// Update the colours
	this.updateColours();

	//myCode//myComment// removed languages object remain and load here only Russian

	this.lang = 'ru';		// default
	this.loadJSON(
		'assets/libs/VirtualSky/lang/ru.json',
		function(data){	
			this.lang = data;	
			this.lang.loaded = true;
			// Update any starnames
			if(data.starnames){
				for(var n in data.starnames){
					if(data.starnames[n]) this.starnames[n] = data.starnames[n];
				}
			}
		},
		function(){},
		function(e){}
	);

	// Define some VirtualSky styles
	var v,a,b,r,s,p,k,c,bs;
	v = '.virtualsky';
	a = '#f0f0f0';
	b = '#fcfcfc';
	k = 'background';
	c = k+'-color';
	p = 'padding';
	this.padding = 4;
	bs = 'box-shadow:0px 0px 20px rgba(255,255,255,0.5);';
	function br(i){ return 'border-radius:'+i+';-moz-border-radius:'+i+';-webkit-border-radius:'+i+';';}
	r = br('0em');
	s = br('3px');

	// Internal variables
	this.dragging = false;
	this.x = "";
	this.y = "";
	this.theta = 0;
	this.skygrad = null;
	this.container = '';
	this.times = this.astronomicalTimes();
	this.createSky();

	// Find out where the Sun and Moon are
	p = this.moonPos(this.times.JD);
	this.moon = p.moon;
	this.sun = p.sun;

	return this;
}
//myComment// begin of loading section
VirtualSky.prototype.load = function(t,file,fn){
	return this.loadJSON(file,function(data){
		this[t] = data[t];
		this.trigger("loaded"+(t.charAt(0).toUpperCase() + t.slice(1)),{data:data});
	},fn);
};
VirtualSky.prototype.loadJSON = function(file,callback,complete,error){
	if(typeof file!=="string") return this;
	var dt = file.match(/\.json$/i) ? "json" : "script";
	if(dt=="script"){
		// If we are loading an external script we need to make sure we initiate
		// it first. To do that we will re-write the callback that was provided.
		var tmp = callback;
		callback = function(data){
			// Initialize any plugins
			for (var i = 0; i < this.plugins.length; ++i){
				if(typeof this.plugins[i].init=="function") this.plugins[i].init.call(this);
			}
			tmp.call(this,data);
		};
	}
	var config = {
		dataType: dt,
		"this": this,
		success: callback,
		complete: complete || function(){},
		error: error || function(){}
	};
	if(dt=="json") config.jsonp = 'onJSONPLoad';
	if(dt=="script") config.cache = true;	// Use a cached version
	S(document).ajax(file,config);
	return this;
};

//myComment// end of loading section

VirtualSky.prototype.htmlDecode = function(input){
	if(!input) return "";
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes[0].nodeValue;
};
VirtualSky.prototype.getPhrase = function(key,key2){
	if(key===undefined) return undefined;
	if(key==="constellations"){
		if(key2 && is(this.lang.constellations[key2],"string"))
			return this.htmlDecode(this.lang.constellations[key2]);
	}else if(key==="planets"){
		if(this.lang.planets && this.lang.planets[key2]) return this.htmlDecode(this.lang.planets[key2]);
		else return this.htmlDecode(this.lang[key2]);
	}else return this.htmlDecode(this.lang[key]);
};


VirtualSky.prototype.resize = function(w,h){
	if(!this.canvas) return;
	if(!w || !h){
		// We have to zap the width of the canvas to let it take the width of the container
		this.canvas.css({'width':0,'height':0});
		w = this.container.outerWidth();
		h = this.container.outerHeight();
		this.canvas.css({'width':w+'px','height':h+'px'});		
	}else{
		// Set the container size
		this.container.css({'width':w+'px','height':h+'px'});
	}
	if(w == this.wide && h == this.tall) return;
	this.setWH(w,h);
	//this.updateSkyGradient();
	this.drawImmediate(this.currentIdx);
	this.container.css({'font-size':this.fontsize()+'px'});
	this.trigger('resize',{vs:this});
};
VirtualSky.prototype.setWH = function(w,h){
	if(!w || !h) return;
	this.c.width = w;
	this.c.height = h;
	this.wide = w;
	this.tall = h;
	this.changeFOV();	
	this.canvas.css({'width':w+'px','height':h+'px'});
};

// Update the sky colours
VirtualSky.prototype.updateColours = function(){
	// We need to make a copy of the correct colour palette otherwise it'll overwrite it
	this.col = JSON.parse(JSON.stringify(this.colours.normal));
	this.col.txt = this.color;
};



VirtualSky.prototype.fontsize = function(){
	var m = Math.min(this.wide,this.tall);
	return (m < 600) ? ((m < 500) ? ((m < 350) ? ((m < 300) ? ((m < 250) ? 9 : 10) : 11) : 12) : 14) : parseInt(this.container.css('font-size'));
};

VirtualSky.prototype.changeFOV = function(delta){
	var fov = this.fov;
	if(delta > 0) fov /= 1.05;
	else if(delta < 0) fov *= 1.05;
	return this.setFOV(fov);
};

VirtualSky.prototype.setFOV = function(fov){
	if(fov > 60 || typeof fov!=="number") this.fov = 60;
	else if(fov < 1) this.fov = 1;
	else this.fov = fov;
	this.maxangle = this.d2r*this.fov*Math.max(this.wide,this.tall)/this.tall;
	this.maxangle = Math.min(this.maxangle,Math.PI/2);
	return this;
};

//myCode// based on boundaries finding which constellation is under cursor
VirtualSky.prototype.detectConstellationUnderCursor = 
function (x, y) {
	//if(this.currentIdx==-1) this.currentIdx=true;
	for (let p = 0; p<this.paths.length; p++) {
		let correctedIndex = p;
		if (p>75) correctedIndex = p-1 //corrected boundary index for drawing constellation with index bigger for 'Ser1'
		if (this.ctx.isPointInPath(this.paths[p], x, y)) {
			if (this.currentIdx == correctedIndex) {return}
			this.currentIdx = correctedIndex
			this.draw(correctedIndex);
		}
	}	
}

VirtualSky.prototype.createSky = function(){ 
	this.container = S('#'+this.id);
	this.times = this.astronomicalTimes();
	if(this.container.length == 0){
		// No appropriate container exists. So we'll make one.
		S('body').append('<div id="'+this.id+'"></div>');
		this.container = S('#'+this.id);
	}
	var _obj = this;
	window.onresize = function(){ _obj.resize(); };	
	
	// If the Javascript function has been passed a width/height
	// those take precedence over the CSS-set values
	this.wide = this.container.width();
	this.tall = this.container.height()-0;

	// Add a <canvas> to it with the original ID
	this.idinner = this.id+'_inner';
	this.container.html('<canvas id="'+this.idinner+'" style="position: absolute;display:block;"></canvas>');
	this.canvas = S('#'+this.idinner);
	this.c = document.getElementById(this.idinner);	
	if(this.c && this.c.getContext){
		this.setWH(this.wide,this.tall);
		var ctx = this.ctx = this.c.getContext('2d');
		ctx.clearRect(0,0,this.wide,this.tall);
		ctx.beginPath();
		var fs = this.fontsize();
		ctx.font = fs+"px Helvetica";
		ctx.fillStyle = 'rgba(100, 100, 100, 1)';
		ctx.lineWidth = 1.5;
		ctx.fill();

		function getXYProperties(e,sky){
			var skyPos = sky.xy2radec(e.x,e.y);
			if(skyPos){
				e.ra = skyPos.ra / sky.d2r;
				e.dec = skyPos.dec / sky.d2r;
			}
			return e;
		}
		function getXY(sky,o,el,e){
			e.x = o.pageX - el.offset().left - window.scrollX;
			e.y = o.pageY - el.offset().top - window.scrollY;
			return getXYProperties(e,sky);
		}
		
		S("#"+this.idinner).on('click',{sky:this},function(e){
			var p = getXY(e.data.sky,e.originalEvent,this,e);
			if(e.data.sky.callback.click) e.data.sky.callback.click.call(e.data.sky,getXY(e.data.sky,e.originalEvent,this,e));
		}).on('mousemove',{sky:this},function(e){
			e.preventDefault();
			var s = e.data.sky;
			var x = e.originalEvent.layerX;
			var y = e.originalEvent.layerY;
			if(!s.dragging) s.detectConstellationUnderCursor(x, y);
			if(s.mouse) s.canvas.css({cursor:'move'});
			if(s.dragging && s.mouse){
				if(typeof s.x=="number"){s.az_off += (s.x-x)/4;}
				s.az_off = s.az_off%360;
				s.x = x;
				s.y = y;	
				s.draw(s.currentIdx);
				s.canvas.css({cursor:'-moz-grabbing'});
			}
			if(typeof s.callback.cursor=="function"){
				var p = getXY(e.data.sky,e.originalEvent,this,e);
				e.data.sky.callback.cursor.call(this,p);
			}
		}).on('mouseover', {sky:this}, function(e) {
		}).on('mousedown',{sky:this},function(e){
			// if(e.originalEvent.buttons === 1){
			// 	e.data.sky.dragging = true;
			// }else if(e.originalEvent.buttons === 2){}
		}).on('mouseup',{sky:this},function(e){
			var s = e.data.sky;
			s.dragging = false;
			s.x = "";
			s.y = "";
			s.theta = "";
		}).on('mouseout',{sky:this},function(e){
			var s = e.data.sky;
			s.currentIdx = -1;
			s.draw(s.currentIdx);
			s.dragging = false;
			s.mouseover = false;
			s.x = "";
			s.y = "";
			if(typeof s.callback.mouseout=="function") s.callback.mouseout.call(s);
		}).on('mouseenter',{sky:this},function(e){			
			var s = e.data.sky;
			s.mouseover = true;
			if(typeof s.callback.mouseenter=="function") s.callback.mouseenter.call(s);
		}).on('touchmove',{sky:this},function(e){
			e.preventDefault();
			var s = e.data.sky;
			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;
			var theta,f,dr;
			if(s.dragging){
				if(typeof s.x=="number"){s.az_off += (s.x-x)/4;}
				s.az_off = s.az_off%360;
				s.x = x;
				s.y = y;
				s.draw(this.currentIdx);
			}
		}).on('touchstart',{sky:this},function(e){
			//e.data.sky.dragging = true;			
		}).on('touchend',{sky:this},function(e){
			e.data.sky.dragging = false;
			e.data.sky.x = "";
			e.data.sky.y = "";
			e.data.sky.theta = "";
		});		
	}
	this.spinIt(16)
};

VirtualSky.prototype.draw = function(ucci){ // from this paths under cursor constellation index
	// Redraw within 20ms. Used to avoid redraw pilling up, introducing vast lag	
	if(this.pendingRefresh !== undefined) return;
	this.pendingRefresh = window.setTimeout(this.drawImmediate.bind(this, ucci), 20);
};

VirtualSky.prototype.drawImmediate = function(idx){
	//myCode cor is special for drawconstellation
	// Don't bother drawing anything if there is no physical area to draw on
	if(this.pendingRefresh !== undefined){
		window.clearTimeout(this.pendingRefresh);
		this.pendingRefresh = undefined;
	}

	if(this.wide <= 0 || this.tall <= 0) return this;
	if(!(this.c && this.c.getContext)) return this;
	
	// Shorthands
	var c = this.ctx;
	c.moveTo(0,0);
	c.clearRect(0,0,this.wide,this.tall);
	c.fillStyle = this.col.midnight;
	c.fillRect(0,0,this.wide,this.tall);
	c.fill();	
	//this.updateSkyGradient();
	c.beginPath();
	c.fillStyle = this.skygrad;
	c.fillRect(0,0,this.wide,this.tall);
	c.closePath();	

	this.drawStars()
		.drawGalaxy()
		.drawPlanets()
		//.drawGridlines("az")
		//.drawGridlines("eq")
		//.drawGridlines("gal")
		.drawConstellationLines(this.mobile)
		.drawBoundaries(this.mobile)
		.drawConstellation(idx);	
		//.drawEcliptic()
		//.drawMeridian();

	

	var txtcolour = (this.color!="") ? (this.color) : this.col.txt;
	var fontsize = this.fontsize();
	
	//c.fillStyle = txtcolour;
	c.lineWidth = 1.5;
	this.container.css({'font-size':this.fontsize()+'px','position':'relative'});
	//console.log(this.lookup.sun[0]);
	return this;
};

//myCode// calculations taken from drawConstellationBoundaries function which is  deleted and can be restored from p.virtualsky.js
VirtualSky.prototype.drawBoundaries = function(m) {
	this.paths = [];
	let bds = this.boundaries;
	this.ctx.lineWidth = (this.constellation.boundaryWidth || 0.75);
	this.ctx.lineCap = "round";
	for (let bd=0; bd<bds.length; bd++) {
		if(m) {colour = 'rgba('+bds[bd].length+', '+bds[bd].length+', '+bds[bd].length+', 0.3)';} else{colour = 'transparent'; }
		colour = 'transparent';
		let oneBD = bds[bd];
		let onePath = new Path2D();		
		this.ctx.strokeStyle = colour;
		this.ctx.fillStyle = colour;
		this.ctx.beginPath();
		var posa,posb,a,b,d,atob,j,ra,dc,dra,ddc,points = [];
		let maxl = this.maxLine(5);
		for(let l = 1; l < oneBD.length; l+=2){
			b = [oneBD[l],oneBD[l+1]];
			if(a){
				atob = a[0]+','+a[1]+'-'+b[0]+','+b[1];
			}
			if(l>1) {
				ra = (b[0]-a[0])%360;
				if(ra > 180) ra = ra-360;
				if(ra < -180) ra = ra+360;
				dc = (b[1]-a[1]);
				dra = ra/2;
				ddc = dc/2;
				for(i = 1; i <= 2; i++){
					ra = a[0]+(i*dra);
					if(ra < 0) ra += 360;
					dc = a[1]+(i*ddc);
					// Convert to J2000
					d = this.fk1tofk5(ra*this.d2r,dc*this.d2r);
					points.push([d[0],d[1]]);
				}
			}
			a = b
		}
		posa = null;
		
		for(let i = 0; i < points.length; i++){
			posb = this.radec2xy(points[i][0],points[i][1]);
			if(i==0 && this.isVisible(posb.el)) {
				if(!this.isPointBad(posb)){ onePath.moveTo(posb.x,posb.y)}}
			if(posa && this.isVisible(posa.el) && this.isVisible(posb.el)){
				if(!this.isPointBad(posa) && !this.isPointBad(posb)){
					// Basic error checking: constellations behind us often have very long lines so we'll zap them
					if(Math.abs(posa.x-posb.x) < maxl && Math.abs(posa.y-posb.y) < maxl){
						onePath.lineTo(posb.x,posb.y);
					}
				}
			}
			if(i==points.length-1) {
				onePath.closePath();				
				this.paths.push(onePath); 
				this.ctx.fill(onePath);
				points = [];
			}
			posa = posb;
		}
	}
	return this;
}
VirtualSky.prototype.drawConstellation = function(idx) {
	if (this.currentIdx==-1 || idx==-1) return;	
	this.ctx.beginPath();
	this.ctx.strokeStyle = this.col.constellation;
	this.ctx.fillStyle = this.col.constellation;
	this.ctx.lineCap = "round";
	this.ctx.lineWidth = (this.constellation.lineWidth || 0.75);	
	this.current = this.lines[idx];
	let maxl = this.maxLine();
	let posa,posb,a,b,l,idx1,idx2,s;
	for(l = 3; l < this.current.length; l+=2){
		a = -1;
		b = -1;
		idx1 = ''+this.current[l]+'';
		idx2 = ''+this.current[l+1]+'';
		if(!this.hipparcos[idx1]){
			for(s = 0; s < this.stars.length; s++){
				if(this.stars[s][0] == this.current[l]){
					this.hipparcos[idx1] = s;
					break;
				}
			}
		}
		if(!this.hipparcos[idx2]){
			for(s = 0; s < this.stars.length; s++){
				if(this.stars[s][0] == this.current[l+1]){
					this.hipparcos[idx2] = s;
					break;
				}
			}
		}
		a = this.hipparcos[idx1];
		b = this.hipparcos[idx2];
		if(a >= 0 && b >= 0 && a < this.stars.length && b < this.stars.length){
			posa = this.radec2xy(this.stars[a][2], this.stars[a][3]);
			posb = this.radec2xy(this.stars[b][2], this.stars[b][3]);
			if(this.isVisible(posa.el) && this.isVisible(posb.el)){
				if(!this.isPointBad(posa) && !this.isPointBad(posb)){
					// Basic error checking: constellations behind us often have very long lines so we'll zap them
					if(Math.abs(posa.x-posb.x) < maxl && Math.abs(posa.y-posb.y) < maxl){
						this.ctx.moveTo(posa.x,posa.y);
						this.ctx.lineTo(posb.x,posb.y);
					}
				}
			}
		}
	}
	this.ctx.stroke();
	this.currentIdx = idx;//send number Constellation Under Cursor
	return this;
}

VirtualSky.prototype.drawConstellationLines = function(m){
	if(!m) return this;
	let colour = this.col.constellation;
	var x = this.ctx;
	x.beginPath();
	x.strokeStyle = colour;
	x.fillStyle = colour;
	this.ctx.lineCap = "round";
	x.lineWidth = (this.constellation.lineWidth || 0.75);
	var fontsize = this.fontsize();
	if(typeof this.lines!=="object") return this;
	var pos,posa,posb,a,b,l,idx1,idx2,s;
	var maxl = this.maxLine();
	for(var c = 0; c < this.lines.length; c++){
		if(this.constellation.lines){
			for(l = 3; l < this.lines[c].length; l+=2){
				a = -1;
				b = -1;
				idx1 = ''+this.lines[c][l]+'';
				idx2 = ''+this.lines[c][l+1]+'';
				if(!this.hipparcos[idx1]){
					for(s = 0; s < this.stars.length; s++){
						if(this.stars[s][0] == this.lines[c][l]){
							this.hipparcos[idx1] = s;
							break;
						}
					}
				}
				if(!this.hipparcos[idx2]){
					for(s = 0; s < this.stars.length; s++){
						if(this.stars[s][0] == this.lines[c][l+1]){
							this.hipparcos[idx2] = s;
							break;
						}
					}
				}
				a = this.hipparcos[idx1];
				b = this.hipparcos[idx2];
				if(a >= 0 && b >= 0 && a < this.stars.length && b < this.stars.length){
					posa = this.radec2xy(this.stars[a][2], this.stars[a][3]);
					posb = this.radec2xy(this.stars[b][2], this.stars[b][3]);
					if(this.isVisible(posa.el) && this.isVisible(posb.el)){
						if(!this.isPointBad(posa) && !this.isPointBad(posb)){
							// Basic error checking: constellations behind us often have very long lines so we'll zap them
							if(Math.abs(posa.x-posb.x) < maxl && Math.abs(posa.y-posb.y) < maxl){
								x.moveTo(posa.x,posa.y);
								x.lineTo(posb.x,posb.y);
							}
						}
					}
				}
			}
		}
		//myComment// turn labels by set this.constellations {labels: false} line 140
		if(this.constellation.labels){
			pos = this.radec2xy(this.lines[c][1]*this.d2r,this.lines[c][2]*this.d2r);
			if(this.isVisible(pos.el)){
				var label = this.getPhrase('constellations',this.lines[c][0]);
				var xoff = (x.measureText) ? -x.measureText(label).width/2 : 0;
				x.fillText(label,pos.x+xoff,pos.y-fontsize/2);
				x.fill();
			}
		}
	}
	x.stroke();
	return this;
};
VirtualSky.prototype.drawGalaxy = function(colour){
	if(!this.galaxy || !this.showgalaxy) return this;
	if(!colour) colour = this.col.galaxy;
	this.ctx.beginPath();
	this.ctx.strokeStyle = colour;
	this.ctx.fillStyle = colour;
	this.ctx.lineWidth = (this.gal.lineWidth || 0.75);
	this.ctx.lineJoin = "round";
	this.ctx.filter = 'blur(14px)';
	var p,pa,pb,i,c,maxl,dx,dy;
	maxl = this.maxLine(5);

	for(c = 0; c < this.galaxy.length; c++){

		// We will convert all the galaxy outline coordinates to radians
		if(!this.gal.processed){
			for(i = 1; i < this.galaxy[c].length; i++) this.galaxy[c][i] *= this.d2r;
		}

		// Get a copy of the current shape
		p = this.galaxy[c].slice(0);

		// Get the colour (first element)
		p.shift();
		// Set the initial point to null
		pa = null;

		// Now loop over joining the points
		for(i = 0; i < p.length; i+=2){
			pb = this.radec2xy(p[i], p[i+1]);
			if(i==0) this.ctx.moveTo(pb.x,pb.y);
			else{
				dx = Math.abs(pa.x-pb.x);
				dy = Math.abs(pa.y-pb.y);
				if(!isNaN(dx) && !isNaN(dy)){
					// Basic error checking: if the line is very long we need to normalize to other side of sky
					if(dx >= maxl || dy >= maxl) this.ctx.moveTo(pb.x,pb.y);
					this.ctx.lineTo(pb.x,pb.y);
				}else{
					this.ctx.moveTo(pb.x,pb.y);
				}
			}
			pa = pb;
		}
	}
	// We've converted the galaxy to radians
	this.gal.processed = true;
	this.ctx.stroke();
	this.ctx.filter = 'blur(0px)';
	return this;
};
VirtualSky.prototype.drawStars = function(){
	if(!this.showstars && !this.showstarlabels) return this;
	var mag,i,p,d;
	var c = this.ctx;
	c.beginPath();
	c.fillStyle = this.col.stars;
	this.az_off = (this.az_off+360)%360;
	var f = 1;
	if(typeof this.scalestars==="number" && this.scalestars!=1) f *= this.scalestars;

	for(i = 0; i < this.stars.length; i++){
		if(this.stars[i][1] < this.magnitude){
			mag = this.stars[i][1];
			p = this.radec2xy(this.stars[i][2], this.stars[i][3]);
			if(this.isVisible(p.el) && !isNaN(p.x) && !this.isPointBad(p)){
				d = 0.8*Math.max(3-mag/2.1, 0.5);
				// Modify the 'size' of the star by how close to the horizon it is
				// i.e. smaller when closer to the horizon
				d *= Math.exp(-(90-p.el)*0.01);
				d *= f;
				c.moveTo(p.x+d,p.y);
				if(this.showstars) c.arc(p.x,p.y,d,0,Math.PI*2,true);
				if(this.showstarlabels && this.starnames[this.stars[i][0]]) this.drawLabel(p.x,p.y,d,"",this.htmlDecode(this.starnames[this.stars[i][0]]));
			}
		}
	}
	c.fill();
	return this;
};
VirtualSky.prototype.drawPlanets = function(){
	if(!this.showplanets && !this.showplanetlabels) return this;
	if(!this.planets || this.planets.length <= 0) return this;
	var ra,dec,mag,pos,p;
	var c = this.ctx;
	var oldjd = this.jd;
	this.jd = this.times.JD;

	var colour = this.col.grey;
	var maxl = this.maxLine();
	this.lookup.planet = [];
	for(p = 0 ; p < this.planets.length ; p++){
		// We'll allow 2 formats here:
		// [Planet name,colour,ra,dec,mag] or [Planet name,colour,[jd_1, ra_1, dec_1, mag_1, jd_2, ra_2, dec_2, mag_2....]]
		if(!this.planets[p]) continue;
		if(this.planets[p].length == 3){
			// Find nearest JD
			if(this.planets[p][2].length%4 == 0){
				if(this.jd > this.planets[p][2][0] && this.jd < this.planets[p][2][(this.planets[p][2].length-4)]){
					var interp = this.interpolate(this.jd,this.planets[p][2]);
					ra = interp.ra;
					dec = interp.dec;
					mag = interp.mag;
				}else{
					continue;	// We don't have data for this planet so skip to the next
				}
			}
		}else{
			ra = this.planets[p][2];
			dec = this.planets[p][3];
		}
		this.lookup.planet.push({'ra':ra*this.d2r,'dec':dec*this.d2r,'label':(this.lang.planets ? this.lang.planets[this.planets[p][0]] : "?")});
		pos = this.radec2xy(ra*this.d2r,dec*this.d2r);

		colour = this.planets[p][1];
		if(typeof colour==="string") c.strokeStyle = colour;

		if((this.showplanets || this.showplanetlabels) && this.isVisible(pos.el) && mag < this.magnitude && !this.isPointBad(pos)){
			var d = 0;
			if(mag !== undefined){
				d = 0.8*Math.max(3-mag/2, 0.5);
				d *= Math.exp(-((90-pos.el)*this.d2r)*0.6);
			}
			if(d < 1.5) d = 1.5;
			this.drawPlanet(pos.x,pos.y,d,colour,this.planets[p][0]);
		}		
	}

	// Sun & Moon
	if(this.showplanets || this.showplanetlabels){

		// Only recalculate the Moon's ecliptic position if the time has changed
		if(oldjd != this.jd){
			p = this.moonPos(this.jd);
			this.moon = p.moon;
			this.sun = p.sun;
		}
		// Draw Moon last as it is closest
		if(this.moon) {
			pos = this.ecliptic2xy(this.moon.lon*this.d2r,this.moon.lat*this.d2r,this.times.LST);
			if(this.isVisible(pos.el) && !this.isPointBad(pos)){
				this.drawMoon(pos.x,pos.y,6,this.col.moon,"moon");
				this.lookup.moon = [this.ecliptic2radec(this.moon.lon*this.d2r,this.moon.lat*this.d2r,this.times.LST)];
				this.lookup.moon[0].label = this.lang.moon;
			}
		}
		// Draw the Sun
		if(this.sun) {
			pos = this.ecliptic2xy(this.sun.lon*this.d2r,this.sun.lat*this.d2r,this.times.LST);
			this.updateSkyGradient(pos.x, pos.y);
			if(this.isVisible(pos.el) && !this.isPointBad(pos)){
				//this.drawPlanet(pos.x,pos.y,5,this.col.sun,"sun");
				this.drawSun(pos.x,pos.y,8);
				this.lookup.sun = [this.ecliptic2radec(this.sun.lon*this.d2r,this.sun.lat*this.d2r,this.times.LST)];
				this.lookup.sun[0].label = this.lang.sun;
			}
		}
	}
	return this;
};
VirtualSky.prototype.drawPlanet = function(x,y,d,colour,label){
	var c = this.ctx;
	c.beginPath();
	c.fillStyle = colour;
	c.strokeStyle = colour;
	c.moveTo(x+d,y+d);
	if(this.showplanets) {
		c.arc(x,y,d,0,Math.PI*2,true)
		}
	label = this.getPhrase('planets',label);
	if(this.showplanetlabels) this.drawLabel(x,y,d,colour,label);
	c.fill();
	return this;
};

VirtualSky.prototype.drawSun = function(x,y,d){		
	let colour = this.col.txt;
	let c = this.ctx;
	let gradient = c.createRadialGradient(x, y, 0, x, y, d);
		gradient.addColorStop(0.11, "gold");
		gradient.addColorStop(0.68, "rgb(255,255,212");
		gradient.addColorStop(0.7, "rgba(0,50,80,0.6");
		gradient.addColorStop(0.85, "rgba(0,50,80,0.1");
		gradient.addColorStop(1, "transparent");
	c.beginPath();
	c.fillStyle = gradient;
	c.moveTo(x+d,y+d);
	c.arc(x,y,d,0,Math.PI*2,true)
	c.fill();
	let label = this.getPhrase('planets','sun');
	this.drawLabel(x,y,d,colour,label);
	
	return this;
};
VirtualSky.prototype.drawMoon = function(x,y,d){		
	let colour = this.col.txt;
	let c = this.ctx;
	let gradient = c.createRadialGradient(x, y, 0, x, y, d);
		gradient.addColorStop(0.79, "lightyellow");
		gradient.addColorStop(0.88, "rgba(0,50,80,0.2");
		gradient.addColorStop(1, "transparent");
	c.beginPath();
	c.fillStyle = gradient;
	c.moveTo(x+d,y+d);
	c.arc(x,y,d,0,Math.PI*2,true)
	c.fill();
	let label = this.getPhrase('planets','sun');
	this.drawLabel(x,y,d,colour,label);
	
	return this;
};
VirtualSky.prototype.updateSkyGradient = function(x, y){
	let s = null;
	let m = Math.max(this.tall, this.wide)
	s = this.ctx.createRadialGradient(x, y, 0, x, y, m);
	s.addColorStop(0, 'royalblue');
	s.addColorStop(0.05, 'royalblue');
	s.addColorStop(1, 'transparent');
	this.skygrad = s;
	return this;
};
VirtualSky.prototype.drawLabel = function(x,y,d,colour,label){
	if(label===undefined) return this;
	var c = this.ctx;
	if(colour.length > 0) c.fillStyle = colour;
	c.lineWidth = 1.5;
	var xoff = d;	
	c.fillText(label,x+xoff,y-(d+2));
	return this;
};

VirtualSky.prototype.drawMeridian = function(colour){
	if(!this.meridian) return this;
	if(!colour || typeof colour!="string") colour = this.col.meridian;
	var c = this.ctx;
	var a, b;
	var minb = 0;
	var maxb = Math.PI/2;
	var step = 2*this.d2r;
	var maxl = this.maxLine();
	c.beginPath();
	c.strokeStyle = colour;
	c.lineWidth = 2;

	var old = {x:-1,y:-1,moved:false};
	for(b = minb, a = 0; b <= maxb ; b+= step) old = joinpoint(this,"az",Math.PI,b,old,maxl);
	for(b = maxb, a = 0; b >= minb ; b-= step) old = joinpoint(this,"az",0,b,old,maxl);

	c.stroke();
	return this;
};

// type can be "az" or "eq"
VirtualSky.prototype.drawGridlines = function(type,step,colour){
	if(!type || !this.grid[type]) return this;
	if(typeof colour!=="string") colour = this.col[type];
	if(typeof step!=="number") step = this.grid.step;

	var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
	c = this.ctx;
	oldx = 0;
	oldy = 0;
	c.beginPath();
	c.strokeStyle = colour;
	c.lineWidth = (this.grid.lineWidth || 1);
	bstep = 2;
	if(type=="az"){
		maxb = 90-bstep;
		minb = 0;
	}else{
		maxb = 90-bstep;
		minb = -maxb;
	}
	maxl = this.maxLine(5);
	old = {x:-1,y:-1,moved:false};
	step *= this.d2r;
	bstep *= this.d2r;
	minb *= this.d2r;
	maxb *= this.d2r;
	// Draw grid lines in elevation/declination/latitude
	for(a = 0 ; a < Math.PI*2 ; a += step){
		old.moved = false;
		for(b = minb; b <= maxb ; b+= bstep) old = joinpoint(this,type,a,b,old,maxl);
	}
	c.stroke();
	c.beginPath();
	if(type=="az"){
		minb = 0;
		maxb = 90-bstep*this.r2d;
	}else{
		minb = -90+step*this.r2d;
		maxb = 90;
	}
	minb *= this.d2r;
	maxb *= this.d2r;
	old = {x:-1,y:-1,moved:false};
	// Draw grid lines in azimuth/RA/longitude
	for(b = minb; b < maxb ; b += step){
		old.moved = false;
		for(a = 0 ; a <= 2*Math.PI ; a += bstep) old = joinpoint(this,type,a,b,old,maxl);
	}
	c.stroke();
	return this;
};

//myComment// CONVERTING SECTION
// Our stars are stored in decimal degrees so we will convert them here
VirtualSky.prototype.convertStarsToRadians = function(stars){
	for(var i = 0; i < stars.length; i++){
		stars[i][2] *= this.d2r;
		stars[i][3] *= this.d2r;
	}
	return stars;
};
// compute horizon coordinates from utc, ra, dec
// ra, dec in radians
// lat, lon in  degrees
// results returned in hrz_altitude, hrz_azimuth
VirtualSky.prototype.coord2horizon = function(ra, dec){
	var ha, alt, az, sd, sl, cl;
	// compute hour angle in degrees
	ha = (Math.PI*this.times.LST/12) - ra;
	sd = Math.sin(dec);
	sl = Math.sin(this.latitude.rad);
	cl = Math.cos(this.latitude.rad);
	// compute altitude in radians
	alt = Math.asin(sd*sl + Math.cos(dec)*cl*Math.cos(ha));
	// compute azimuth in radians
	// divide by zero error at poles or if alt = 90 deg (so we should've already limited to 89.9999)
	az = Math.acos((sd - Math.sin(alt)*sl)/(Math.cos(alt)*cl));
	// choose hemisphere
	if (Math.sin(ha) > 0) az = 2*Math.PI - az;
	return [alt,az];
};

// compute ra,dec coordinates from utc, horizon coords
// ra, dec in radians
// results returned in hrz_altitude, hrz_azimuth
VirtualSky.prototype.horizon2coord = function(coords){
	// Return angle in [0, 2 * PI[
	function Map2PI(angle){
		var n;
		var pipi = Math.PI * 2;
		if(angle < 0.0){
			n = Math.floor(angle / pipi);
			return (angle - n * pipi);
		}else if (angle >= pipi){
			n = Math.floor(angle / pipi);
			return (angle - n * pipi);
		}else  return (angle);
	}

	// Return angle in [-PI, PI[
	function MapPI(angle) {
		var angle2PI = Map2PI(angle);
		if(angle2PI >= Math.PI) return (angle2PI - 2 * Math.PI);
		else return (angle2PI);
	}

	function convertAltAzToALTAZ3D(i){
		var x = Math.sin(i.alt);
		const cs = Math.cos(i.alt);
		var z = cs * Math.cos(i.az);
		var y = cs * Math.sin(i.az);
		return [x, y, z];
	}

	function rotate(xyz/*: number[]*/, axis/*: RotationDefinition*/, angle/*:number*/){
		const axes = [[1,2],[0,2],[0,1]];
		const a = axes[axis.id][0];
		const b = axes[axis.id][1];
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const ret = JSON.parse(JSON.stringify(xyz));	// Minify can't cope with ... notation

		ret[a] = xyz[a] * cos - xyz[b] * sin;
		ret[b] = xyz[b] * cos + xyz[a] * sin;

		return ret;
	}

	function convertALTAZ3DToAltAz(xyz){
		return {'alt':MapPI(Math.asin(xyz[0])),'az':Map2PI(Math.atan2(xyz[1], xyz[2]))};
	}
	const xyz = convertAltAzToALTAZ3D({az: coords[1], alt: coords[0]});
	const rotated = rotate(xyz, {id: 1}, Math.PI/2 + this.latitude.rad);
	const res = convertALTAZ3DToAltAz(rotated);

	return {ra: MapPI(res.az) + (Math.PI*this.times.LST/12), dec: -res.alt};
};

function inrangeAz(a,deg){
	if(deg){
		while(a < 0) a += 360;
		while(a > 360) a -= 360;
	}else{
		var twopi = (2*Math.PI);
		while(a < 0) a += twopi;
		while(a > twopi) a -= twopi;
	}
	return a;
}
function inrangeEl(a,deg){
	if(deg){
		if(a >= 90) a = 89.99999;
		if(a <= -90) a = -89.99999;
	}else{
		if(a >= Math.PI/2) a = (Math.PI/2)*0.999999;
		if(a <= -Math.PI/2) a = (-Math.PI/2)*0.999999;
	}
	return a;
}

VirtualSky.prototype.isVisible = function(el){	
	if(!this.fullsky) return (el > 0);
	else return (this.ground) ? (el > 0) : true;
};
VirtualSky.prototype.isPointBad = function(p){
	return p.x==-1 && p.y==-1;
};
// Return a structure with the Julian Date, Local Sidereal Time and Greenwich Sidereal Time
VirtualSky.prototype.astronomicalTimes = function(clock,lon){
	clock = clock || this.clock;
	lon = lon || this.longitude.deg;
	var JD,JD0,S,T,T0,UT,A,GST,d,LST;
	JD = this.getJD(clock);
	JD0 = Math.floor(JD-0.5)+0.5;
	S = JD0-2451545.0;
	T = S/36525.0;
	T0 = (6.697374558 + (2400.051336*T) + (0.000025862*T*T))%24;
	if(T0 < 0) T0 += 24;
	UT = (((clock.getUTCMilliseconds()/1000 + clock.getUTCSeconds())/60) + clock.getUTCMinutes())/60 + clock.getUTCHours();
	A = UT*1.002737909;
	T0 += A;
	GST = T0%24;
	if(GST < 0) GST += 24;
	d = (GST + lon/15.0)/24.0;
	d = d - Math.floor(d);
	if(d < 0) d += 1;
	LST = 24.0*d;
	return { GST:GST, LST:LST, JD:JD };
};
// Uses algorithm defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.moonPos = function(JD,sun){
	var d2r,lo,Po,No,i,e,l,Mm,N,C,Ev,sinMo,Ae,A3,Mprimem,Ec,A4,lprime,V,lprimeprime,Nprime,lppNp,sinlppNp,y,x,lm,Bm;
	d2r = this.d2r;
	JD = JD || this.times.JD;
	sun = sun || this.sunPos(JD);
	lo = 91.929336;	// Moon's mean longitude at epoch 2010.0
	Po = 130.143076;	// mean longitude of the perigee at epoch
	No = 291.682547;	// mean longitude of the node at the epoch
	i = 5.145396;	// inclination of Moon's orbit
	e = 0.0549;	// eccentricity of the Moon's orbit
	l = (13.1763966*sun.D + lo)%360;
	if(l < 0) l += 360;
	Mm = (l - 0.1114041*sun.D - Po)%360;
	if(Mm < 0) Mm += 360;
	N = (No - 0.0529539*sun.D)%360;
	if(N < 0) N += 360;
	C = l-sun.lon;
	Ev = 1.2739*Math.sin((2*C-Mm)*d2r);
	sinMo = Math.sin(sun.Mo*d2r);
	Ae = 0.1858*sinMo;
	A3 = 0.37*sinMo;
	Mprimem = Mm + Ev -Ae - A3;
	Ec = 6.2886*Math.sin(Mprimem*d2r);
	A4 = 0.214*Math.sin(2*Mprimem*d2r);
	lprime = l + Ev + Ec -Ae + A4;
	V = 0.6583*Math.sin(2*(lprime-sun.lon)*d2r);
	lprimeprime = lprime + V;
	Nprime = N - 0.16*sinMo;
	lppNp = (lprimeprime-Nprime)*d2r;
	sinlppNp = Math.sin(lppNp);
	y = sinlppNp*Math.cos(i*d2r);
	x = Math.cos(lppNp);
	lm = Math.atan2(y,x)/d2r + Nprime;
	Bm = Math.asin(sinlppNp*Math.sin(i*d2r))/d2r;
	if(lm > 360) lm -= 360;
	return { moon: {lon:lm,lat:Bm}, sun:sun };	
};
// Uses algorithm defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.sunPos = function(JD){
	var D,eg,wg,e,N,Mo,v,lon,lat;
	D = (JD-2455196.5);	// Number of days since the epoch of 2010 January 0.0
	// Calculated for epoch 2010.0. If T is the number of Julian centuries since 1900 January 0.5 = (JD-2415020.0)/36525
	eg = 279.557208;	// mean ecliptic longitude in degrees = (279.6966778 + 36000.76892*T + 0.0003025*T*T)%360;
	wg = 283.112438;	// longitude of the Sun at perigee in degrees = 281.2208444 + 1.719175*T + 0.000452778*T*T;
	e = 0.016705;	// eccentricity of the Sun-Earth orbit in degrees = 0.01675104 - 0.0000418*T - 0.000000126*T*T;
	N = ((360/365.242191)*D)%360;
	if(N < 0) N += 360;
	Mo = (N + eg - wg)%360;	// mean anomaly in degrees
	if(Mo < 0) Mo += 360;
	v = Mo + (360/Math.PI)*e*Math.sin(Mo*Math.PI/180);
	lon = v + wg;
	if(lon > 360) lon -= 360;
	lat = 0;
	return {lat:lat,lon:lon,Mo:Mo,D:D,N:N};
};
// Uses method defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.meanObliquity = function(JD){
	if(!JD) JD = this.times.JD;
	var T,T2,T3;
	T = (JD-2451545.0)/36525;	// centuries since 2451545.0 (2000 January 1.5)
	T2 = T*T;
	T3 = T2*T;
	return (23.4392917 - 0.0130041667*T - 0.00000016667*T2 + 0.0000005027778*T3)*this.d2r;
};
// Uses method defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.ecliptic2azel = function(l,b,LST,lat){
	if(!LST){
		this.times = this.astronomicalTimes();
		LST = this.times.LST;
	}
	if(!lat) lat = this.latitude.rad;
	var sl,cl,sb,cb,v,e,ce,se,Cprime,s,ST,cST,sST,B,r,sphi,cphi,A,w,theta,psi;
	sl = Math.sin(l);
	cl = Math.cos(l);
	sb = Math.sin(b);
	cb = Math.cos(b);
	v = [cl*cb,sl*cb,sb];
	e = this.meanObliquity();
	ce = Math.cos(e);
	se = Math.sin(e);
	Cprime = [[1.0,0.0,0.0],[0.0,ce,-se],[0.0,se,ce]];
	s = this.vectorMultiply(Cprime,v);
	ST = LST*15*this.d2r;
	cST = Math.cos(ST);
	sST = Math.sin(ST);
	B = [[cST,sST,0],[sST,-cST,0],[0,0,1]];
	r = this.vectorMultiply(B,s);
	sphi = Math.sin(lat);
	cphi = Math.cos(lat);
	A = [[-sphi,0,cphi],[0,-1,0],[cphi,0,sphi]];
	w = this.vectorMultiply(A,r);
	theta = Math.atan2(w[1],w[0]);
	psi = Math.asin(w[2]);
	return {az:theta,el:psi};
};
// Convert from ecliptic l,b -> RA,Dec
//  l (rad), b (rad), Julian date
VirtualSky.prototype.ecliptic2radec = function(l,b,JD){
	var e = this.meanObliquity();
	var sl = Math.sin(l);
	var cl = Math.cos(l);
	var sb = Math.sin(b);
	var cb = Math.cos(b);
	var tb = Math.tan(b);
	var se = Math.sin(e);
	var ce = Math.cos(e);
	var ra = Math.atan2((sl*ce - tb*se),(cl));
	var dec = Math.asin(sb*ce+cb*se*sl);
	// Make sure RA is positive
	if(ra < 0) ra += Math.PI+Math.PI;
	return { ra:ra, dec:dec };
};
// Convert Ecliptic coordinates to x,y position
//  l (rad), b (rad), local sidereal time
// Returns [x, y (,elevation)]
VirtualSky.prototype.ecliptic2xy = function(l,b,LST){
	LST = LST || this.times.LST;
	var pos;	
	if(this.fullsky){
		pos = this.ecliptic2radec(l,b);
		return this.radec2xy(pos.ra,pos.dec);
	}else{
		pos = this.ecliptic2azel(l,b,LST);
		var el = pos.el*this.r2d;
		pos = this.azel2xy(pos.az-(this.az_off*this.d2r),pos.el,this.wide,this.tall);
		pos.el = el;
		return pos;
	}
	return 0;
};

// Convert RA,Dec -> X,Y
//  RA (rad), Dec (rad)
// Returns [x, y (,elevation)]
VirtualSky.prototype.radec2xy = function(ra,dec){
	var coords = this.coord2horizon(ra, dec);
	// Only return coordinates above the horizon
	//if(coords[0] > 0){
		var pos = this.azel2xy(coords[1]-(this.az_off*this.d2r),coords[0],this.wide,this.tall);
		return {x:pos.x,y:pos.y,az:coords[1]*this.r2d,el:coords[0]*this.r2d};
	//}
	return 0;
};

// Returns {ra (rad), dec (rad)}
VirtualSky.prototype.xy2radec = function(x, y){
		var azel = this.xy2azel(x, y,this.wide,this.tall);
		if (azel === undefined) {
			return undefined;
		}
		var coords = [azel[1], azel[0] + (this.az_off*this.d2r)];
		return this.horizon2coord(coords);
};

// Convert Galactic -> x,y
//  longitude (rad), latitude (rad)
VirtualSky.prototype.gal2xy = function(l,b){
	var pos = this.gal2radec(l,b);
	return this.radec2xy(pos[0],pos[1]);
};

// Convert Galactic -> J2000
// longitude (rad), latitude (rad)
VirtualSky.prototype.gal2radec = function(l,b){
	// Using SLALIB values
	return this.Transform([l,b], [-0.054875539726, 0.494109453312, -0.867666135858, -0.873437108010, -0.444829589425, -0.198076386122, -0.483834985808, 0.746982251810, 0.455983795705],false);
};

//  is a two element position (degrees) and rotation matrix
// Output is a two element position (degrees)
VirtualSky.prototype.Transform = function(p, rot, indeg){
	if(indeg){
		p[0] *= this.d2r;
		p[1] *= this.d2r;
	}
	var cp1 = Math.cos(p[1]);
	var m = [Math.cos(p[0])*cp1, Math.sin(p[0])*cp1, Math.sin(p[1])];
	var s = [m[0]*rot[0] + m[1]*rot[1] + m[2]*rot[2], m[0]*rot[3] + m[1]*rot[4] + m[2]*rot[5], m[0]*rot[6] + m[1]*rot[7] + m[2]*rot[8] ];
	var r = Math.sqrt(s[0]*s[0] + s[1]*s[1] + s[2]*s[2]);
	var b = Math.asin(s[2]/r); // Declination in range -90 -> +90
	var cb = Math.cos(b);
	var a = Math.atan2(((s[1]/r)/cb),((s[0]/r)/cb));
	if (a < 0) a += Math.PI*2;
	if(indeg) return [a*this.r2d,b*this.r2d];
	else return [a,b];
};
// Convert from B1875 to J2000
// Using B = 1900.0 + (JD − 2415020.31352) / 365.242198781 and p73 Practical Astronomy With A Calculator
VirtualSky.prototype.fk1tofk5 = function(a,b){
	// Convert from B1875 -> J2000
	return this.Transform([a,b], [0.9995358730015703, -0.02793693620138929, -0.012147682028606801, 0.027936935758478665, 0.9996096732234282, -0.00016976035344812515, 0.012147683047201562, -0.00016968744936278707, 0.9999261997781408]);
};
VirtualSky.prototype.vectorMultiply = function(A,B){
	if(B.length > 0){
		// 2D (3x3)x(3x3) or 1D (3x3)x(3x1)
		if(B[0].length > 0) return [[(A[0][0]*B[0][0]+A[0][1]*B[1][0]+A[0][2]*B[2][0]),(A[0][0]*B[0][1]+A[0][1]*B[1][1]+A[0][2]*B[2][1]),(A[0][0]*B[0][2]+A[0][1]*B[1][2]+A[0][2]*B[2][2])],
									[(A[1][0]*B[0][0]+A[1][1]*B[1][0]+A[1][2]*B[2][0]),(A[1][0]*B[0][1]+A[1][1]*B[1][1]+A[1][2]*B[2][1]),(A[1][0]*B[0][2]+A[1][1]*B[1][2]+A[1][2]*B[2][2])],
									[(A[2][0]*B[0][0]+A[2][1]*B[1][0]+A[2][2]*B[2][0]),(A[2][0]*B[0][1]+A[2][1]*B[1][1]+A[2][2]*B[2][1]),(A[2][0]*B[0][2]+A[2][1]*B[1][2]+A[2][2]*B[2][2])]];
		else return [(A[0][0]*B[0] + A[0][1]*B[1] + A[0][2]*B[2]),(A[1][0]*B[0] + A[1][1]*B[1] + A[1][2]*B[2]),(A[2][0]*B[0] + A[2][1]*B[1] + A[2][2]*B[2])];
	}
};
//VirtualSky.prototype.setFont = function(){ this.ctx.font = this.fontsize()+"px "+this.canvas.css('font-family'); };


// When provided with an array of Julian dates, ra, dec, and magnitude this will interpolate to the nearest
// data = [jd_1, ra_1, dec_1, mag_1, jd_2, ra_2, dec_2, mag_2....]
VirtualSky.prototype.interpolate = function(jd,data){
	var mindt = jd;	// Arbitrary starting value in days
	var mini = 0;	// index where we find the minimum
	for(var i = 0 ; i < data.length ; i+=4){
		// Find the nearest point to now
		var dt = (jd-data[i]);
		if(Math.abs(dt) < Math.abs(mindt)){ mindt = dt; mini = i; }
	}
	var dra,ddec,dmag,pos_2,pos_1,fract;
	if(mindt >= 0){
		pos_2 = mini+1+4;
		pos_1 = mini+1;
		fract = mindt/Math.abs(data[pos_2-1]-data[pos_1-1]);
	}else{
		pos_2 = mini+1;
		pos_1 = mini+1-4;
		fract = (1+(mindt)/Math.abs(data[pos_2-1]-data[pos_1-1]));
	}
	// We don't want to attempt to find positions beyond the edges of the array
	if(pos_2 > data.length || pos_1 < 0){
		dra = data[mini+1];
		ddec = data[mini+2];
		dmag = data[mini+3];
	}else{
		dra = (Math.abs(data[pos_2]-data[pos_1]) > 180) ? (data[pos_1]+(data[pos_2]+360-data[pos_1])*fract)%360 : (data[pos_1]+(data[pos_2]-data[pos_1])*fract)%360;
		ddec = data[pos_1+1]+(data[pos_2+1]-data[pos_1+1])*fract;
		dmag = data[pos_1+2]+(data[pos_2+2]-data[pos_1+2])*fract;
	}
	return { ra: dra, dec:ddec, mag:dmag};
};

// Function to join the dots
function joinpoint(s,type,a,b,old,maxl){
	var x,y,show,c,pos;
	c = s.ctx;
	if(type=="az") pos = s.azel2xy((a-s.az_off*s.d2r),b,s.wide,s.tall);
	else if(type=="eq") pos = s.radec2xy(a,b);
	else if(type=="ec") pos = s.ecliptic2xy(a,b,s.times.LST);
	else if(type=="gal") pos = s.gal2xy(a,b);
	x = pos.x;
	y = pos.y;
	if(type=="az") show = true;
	else show = ((s.isVisible(pos.el)) ? true : false);
	if(show && isFinite(x) && isFinite(y)){
		if(type=="az"){
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > s.tall/2) c.moveTo(x,y);
			c.lineTo(x,y);
			old.moved = true;
		}else{
			// If the last point on s contour is more than a canvas width away
			// it is probably supposed to be behind us so we won't draw a line
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > maxl){
				c.moveTo(x,y);
				old.moved = true;
			}else c.lineTo(x,y);
		}
		old.x = x;
		old.y = y;
	}
	return old;
}

VirtualSky.prototype.maxLine = function(f){
	if(typeof f!=="number") f = 3;
	return this.tall/f;
};

// Expects a latitude,longitude string (comma separated)
VirtualSky.prototype.setGeo = function(pos){
	if(typeof pos!=="string") return this;
	pos = pos.split(',');
	this.setLatitude(pos[0]);
	this.setLongitude(pos[1]);
	return this;
};

//  latitude (deg)
VirtualSky.prototype.setLatitude = function(l){
	this.latitude = {'deg':parseFloat(l),'rad':inrangeEl(parseFloat(l)*this.d2r)};
	return this;
};

//  longitude (deg)
VirtualSky.prototype.setLongitude = function(l){
	this.longitude = {'deg':parseFloat(l),'rad':parseFloat(l)*this.d2r};
	while(this.longitude.rad <= -Math.PI) this.longitude.rad += 2*Math.PI;
	while(this.longitude.rad > Math.PI) this.longitude.rad -= 2*Math.PI;
	return this;
};

VirtualSky.prototype.setRADec = function(r,d){
	return this.setRA(r).setDec(d);
};

VirtualSky.prototype.setRA = function(r){
	this.ra_off = (r%360)*this.d2r;
	return this;
};

VirtualSky.prototype.setDec = function(d){
	this.dc_off = d*this.d2r;
	return this;
};

// Pan the view to the specified RA,Dec
//  RA (deg), Dec (deg), duration (seconds)
VirtualSky.prototype.panTo = function(ra,dec,s){
	if(!s) s = 1000;
	if(typeof ra!=="number" || typeof dec!=="number") return this;
	this.panning = { s: { ra:this.ra_off*this.r2d, dec:this.dc_off*this.r2d }, e: { ra: ra, dec: dec}, duration: s, start: new Date() };
	this.panning.dr = this.panning.e.ra-this.panning.s.ra;
	this.panning.dd = this.panning.e.dec-this.panning.s.dec;
	if(this.panning.dr > 180) this.panning.dr = -(360-this.panning.dr);
	if(this.panning.dr < -180) this.panning.dr = (360+this.panning.dr);
	return this.panStep();
};

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function( callback ){ window.setTimeout(callback, 1000 / 60); };
})();

// Animation step for the panning
VirtualSky.prototype.panStep = function(){
	var ra,dc;
	var now = new Date();
	var t = (now - this.panning.start)/this.panning.duration;
	ra = this.panning.s.ra + (this.panning.dr)*(t);
	dc = this.panning.s.dec + (this.panning.dd)*(t);

	// Still animating
	if(t < 1){
		// update and draw
		this.setRADec(ra,dc).draw(this.currentIdx);
		var _obj = this;
		// request new frame
		requestAnimFrame(function() { _obj.panStep(); });
	}else{
		// We've ended
		this.setRADec(this.panning.e.ra,this.panning.e.dec).draw(this.currentIdx);
	}
	return this;
};

VirtualSky.prototype.start = function(){
	// Clear existing interval
	if(interval!==undefined) clearInterval(interval);
	interval = window.setInterval(function(sky){ sky.setClock('now'); },1000,this);
};

VirtualSky.prototype.changeAzimuth = function(inc){
	this.az_off += (typeof inc==="number") ? inc : 5;
	this.draw(this.currentIdx);
	return this;
};
VirtualSky.prototype.moveIt = function(){
	// Send 'this' context to the setTimeout function so we can redraw
	this.timer_az = window.setTimeout(function(mysky){ mysky.az_off += mysky.az_step; mysky.draw(this.currentIdx); mysky.moveIt(); },100,this);
	return this;
};
VirtualSky.prototype.spinIt = function(tick,wait){
	if(typeof tick==="number") this.spin = (tick == 0) ? 0 : (this.spin+tick);
	else{
		var t = 1.0/this.fps; //fps=10 default
		var s = 2;
		// this.spin is the number of seconds to update the clock by
		if(this.spin == 0) this.spin = (tick == "up") ? t : -t;
		else{
			if(Math.abs(this.spin) < 1) s *= 2;
			if(this.spin > 0) this.spin = (tick == "up") ? (this.spin*s) : (this.spin/s);
			else if(this.spin < 0) this.spin = (tick == "up") ? (this.spin/s) : (this.spin*s);
			if(this.spin < t && this.spin > -t) this.spin = 0;
		}
	}
	if(this.interval_time!==undefined)
		clearInterval(this.interval_time);
	if(this.spin != 0)
		this.advanceTime(this.spin,wait);
	return this;
};
// Increment the clock by the amount specified
VirtualSky.prototype.advanceTime = function(by,wait){
	if(by===undefined){
		this.updateClock(new Date());
	}else{
		by = parseFloat(by);
		if(!wait) wait = 1000/this.fps; // ms between frames fps=10 default
		var fn = function(vs,by){ vs.setClock(by); };
		clearInterval(this.interval_time);
		clearInterval(this.interval_calendar);
		this.interval_time = window.setInterval(fn,wait,this,by);
		// Whilst animating we'll periodically check to see if the calendar events need calling
		this.interval_calendar = window.setInterval(function(vs){ vs.calendarUpdate(); },1000,this);
	}
	return this;
};
// Send a Javascript Date() object and update the clock
VirtualSky.prototype.updateClock = function(d){
	this.clock = d;
	this.times = this.astronomicalTimes();
};
// Call any calendar-based events
VirtualSky.prototype.calendarUpdate = function(){
	for(var e = 0; e < this.calendarevents.length; e++){
		if(is(this.calendarevents[e],"function")) this.calendarevents[e].call(this);
	}
	return this;
};
VirtualSky.prototype.setClock = function(seconds){
	if(seconds === undefined){
		return this;
	}if(typeof seconds==="string"){
		seconds = convertTZ(seconds);
		if(seconds==="now") this.updateClock(new Date());
		else this.updateClock(new Date(seconds));
	}else if(typeof seconds==="object"){
		this.updateClock(seconds);
	}else{
		this.updateClock(new Date(this.clock.getTime() + seconds*1000));
	}	
	this.draw(this.currentIdx);
	return this;
};
VirtualSky.prototype.getOffset = function(el){
	var _x = 0;
	var _y = 0;
	while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.parentNode;
	}
	return { top: _y, left: _x };
};
VirtualSky.prototype.getJD = function(clock) {
	// The Julian Date of the Unix Time epoch is 2440587.5
	if(!clock) clock = this.clock;
	return ( clock.getTime() / 86400000.0 ) + 2440587.5;
};

// Bind events
VirtualSky.prototype.on = function(ev,fn){
	if(typeof ev!=="string" || typeof fn!=="function") return this;
	if(this.events[ev]) this.events[ev].push(fn);
	else this.events[ev] = [fn];
	return this;
};
VirtualSky.prototype.bind = function(ev,fn){
	return this.on(ev,fn);
};
// Trigger a defined event with arguments. This is meant for internal use
// sky.trigger("zoom",args)
VirtualSky.prototype.trigger = function(ev,args){
	if(typeof ev!=="string") return;
	if(typeof args!=="object") args = {};
	var o = [];
	var _obj = this;
	if(typeof this.events[ev]==="object")
		for(i = 0 ; i < this.events[ev].length ; i++)
			if(typeof this.events[ev][i]==="function")
				o.push(this.events[ev][i].call(_obj,args));
	if(o.length > 0) return o;
};

// Some useful functions
function convertTZ(s){
	function formatHour(h){
		var s = (h >= 0 ? "+" : "-");
		h = Math.abs(h);
		var m = (h - Math.floor(h))*60;
		h = Math.floor(h);
		return s+(h < 10 ? "0"+h : h)+(m < 10 ? "0"+m : m);
	}
	var tzs = { A:1, ACDT:10.5, ACST:9.5, ADT:-3, AEDT:11, AEST:10, AKDT:-8, AKST:-9,
		AST:-4, AWST:8, B:2, BST:1, C:3, CDT:-5, CEDT:2, CEST:2, CET:1, CST:-6, CXT:7,
		D:4, E:5, EDT:-4, EEDT:3, EEST:3, EET:2, EST:-5, F:6, G:7, GMT:0, H:8, HAA:-3,
		HAC:-5, HADT:-9, HAE:-4, HAP:-7, HAR:-6, HAST:-10, HAT:-2.5, HAY:-8, HNA:-4, HNC:-6,
		HNE:-5, HNP:-8, HNR:-7, HNT:-3.5, HNY:-9, I:9, IST:9, JST:9, K:10, L:11,
		M:12, MDT:-6, MESZ:2, MEZ:1, MST:-7, N:-1, NDT:-2.5, NFT:11.5, NST:-3.5, O:-2, P:-3,
		PDT:-7, PST:-8, Q:-4, R:-5, S:-6, T:-7, U:-8, UTC:0, UT:0, V:-9, W:-10, WEDT:1, WEST:1,
		WET:0, WST:8, X:-11, Y:-12, Z:0 };
	// Get location of final space character
	var i = s.lastIndexOf(' ');
	// Replace the time zone with the +XXXX version
	if(i > 0 && tzs[s.substr(i+1)]){
		return s.substring(0,i)+" "+formatHour(tzs[s.substr(i+1)]);
	}
	return s;
}
	

S.virtualsky = function(input) {
	input.plugins = S.virtualsky.plugins;
	return new VirtualSky(input);
};

S.virtualsky.plugins = [];
})(S);