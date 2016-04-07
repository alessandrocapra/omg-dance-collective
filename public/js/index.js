var Omg = function(){
	this.button = document.getElementById('movebutton');
	this.cameraPreview = document.getElementById('camera');
	this.gifContainer = document.getElementById('grid');
	this.background = document.getElementById('background');
	this.serverUrl = 'https://www.omgdancecollective.gq';
	this.wsUrl = 'wss://www.omgdancecollective.gq/ws';
	//this.serverUrl = 'http://localhost:8080';
	//this.wsUrl = 'ws://localhost:8080/ws';
	this.dimensions =  { width: 340, height: 240 }
	this.wait = false;
	this.timeouts = {};
};

Omg.prototype.init = function(){
	var rec = this;

	getUserMedia({
	    audio: false,
	    video: true,
	    width: rec.dimensions.width,
	    height: rec.dimensions.height,
	    mode: "callback",
	    swffile: "js/fallback/jscam.swf",
	    quality: 80,
			el: rec.cameraPreview.id

	  }, function(stream) {
			rec.stream = stream;


			var vendorURL = window.URL || window.webkitURL;
			rec.cameraPreview.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;

			rec.cameraPreview.onerror = function (e, o) {
				console.log( e, o );
					alert('error in trasmitting data');
			};
			rec.button.onclick = function(){ rec.start(); };
			rec.button.innerHTML = 'Start Recording';
			rec.recordVideo = RecordRTC(stream,  {
			   	type: 'webm',
			   	video: rec.dimensions,
	    		canvas: rec.dimensions,
		    	frameRate: 150,
		    	quality: 1,
					disableLogs : false
			});
	}, function(error) {
		if( error.message )
			alert( error.message );
		else
			alert( 'browser/webcam not supported' );
	});

}

Omg.prototype.start = function(){
	var rec = this,
		counter = 5,
		func = function(){
			rec.button.innerHTML = 'Dance!! ' + counter;
			rec.background.currentTime = 0;
			if( !counter ){
				rec.stop();
				clearTimeout( rec.timeouts['start'] );
			}
			else {
				rec.timeouts['start'] = setTimeout( func , 1000 );
			}
			counter--;
		};
	rec.recordVideo.startRecording();
	rec.timeouts['start'] = setTimeout( func , 1000 );

};

Omg.prototype.stop = function(){
	var rec = this,
		tracks = rec.stream.getTracks(),
		parent = rec.button.parentElement;

	rec.cameraPreview.style.display = 'none';
	parent.removeChild( rec.button );
	for( var i in parent.children ){
		if( parent.children.hasOwnProperty( i ) )
			parent.children[i].style.display = 'block';
	}
	parent.addEventListener( 'click', function( event ){
		switch( event.target.id ){
			case 'join':
				window.location.href = '#gif-containerer';
			break;

			case 'again':
				location.reload();
				break;

			case 'share':
				FB.ui({
					  method: 'share',
					  href: location.href,
					}, function(response){});
				break;
		}
	});

	rec.recordVideo.stopRecording();
	if( typeof rec.stream.stop === 'function' )
		rec.stream.stop();
	else{
		for( var i in tracks ){
			if( tracks.hasOwnProperty( i ) )
				tracks[i].stop();
		}
	}
	rec.recordVideo.getDataURL( function( videoDataURL ) {
        rec.postFiles( videoDataURL );
    });
};

Omg.prototype.postFiles = function( videoDataURL ){
	var rec = this,
		files = {
			video : videoDataURL
    },
    request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
        }
    };
    request.open( 'POST', this.serverUrl + '/video' );
    request.send( JSON.stringify( files ) );
};

Omg.prototype.showGifs = function(){
	var rec = this,
		request = new XMLHttpRequest();
		gifStr = [];

		if( !rec.wait ){
			rec.wait = true;
			request.onreadystatechange = function() {
				var gifs, gifStr = [], j;
	      if (request.readyState == 4 && request.status == 200) {
	        gifs = JSON.parse(request.responseText);
					if( !gifs.length ){
						window.removeEventListener( 'scroll', scrollForNewGifs );
					}
					j = 0;
					for( var i in gifs ){
						if( gifs.hasOwnProperty( i ) ){
							if( j == 0 )
								gifStr.push( '<div class="row">' );
							gifStr.push( rec.getGifStr( gifs[i] ) );
							if( j == 3 ){
								gifStr.push('</div>');
								j = 0;
							}
							else
								j++;
						}
					}
					if( j == 3 )
						gifStr.push('</div>');
					rec.gifContainer.innerHTML = rec.gifContainer.innerHTML + gifStr.join('');
					rec.wait = false;

	      }
	    };

	    request.open( 'GET', this.serverUrl + '/gifs?start=' + rec.gifContainer.getElementsByTagName('IMG').length );
	    request.send( );
		}
};
Omg.prototype.scrollForNewGifs = function(){
	var rec = this;
	if( typeof rec.timeouts['gif'] !== 'undefined' || rec.timeouts['gif'] ){
		clearTimeout( rec.timeouts['gif'] );
	}

	rec.timeouts['gif'] = setTimeout( function(){
		if ( window.innerHeight + window.scrollY > rec.gifContainer.offsetHeight + rec.gifContainer.offsetTop )
				rec.showGifs();
				rec.timeouts['gif'] = false;
		}, 900 );

};

Omg.prototype.getGifStr = function( fileName ){
	var rec = this,
		rand = Math.floor( (Math.random() * 2));
	return '<div class="col-sm-3 rotate' + rand * 180  + '"><img src="gif/' + fileName + '" alt=""></div>';
};

Omg.prototype.startWSClient = function(){
	var rec = this, connection;
	if( !'WebSocket' in window )
		return false;
	connection = new WebSocket( this.wsUrl, 'gif' );
	connection.onmessage = function(e){
	   rec.gifContainer.innerHTML = rec.gifContainer.innerHTML + rec.getGifStr( e.data );
	}
}
omg = new Omg();

omg.button.onclick = function(){
	omg.background.play();
	omg.init()
};


omg.showGifs();
var scrollForNewGifs = function(){ omg.scrollForNewGifs(); };
window.addEventListener( 'scroll', scrollForNewGifs );
omg.startWSClient();

//facebook loader
window.fbAsyncInit = function() {
    FB.init({
      appId      : '387240961410803',
      xfbml      : true,
      version    : 'v2.5'
    });
  };
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
