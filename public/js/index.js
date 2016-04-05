navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var Omg = function(){
	this.button = document.getElementById('movebutton');
	this.cameraPreview = document.getElementById('camera');
	this.gifContainer = document.getElementById('gif-container');
	this.background = document.getElementById('background');
	this.serverUrl = 'https://www.omgdancecollective.gq';
	this.wsUrl = 'wss://www.omgdancecollective.gq/ws';
	this.serverUrl = 'http://localhost:8080';
	this.wsUrl = 'ws://localhost:8080/ws';
	this.dimensions =  { width: 340, height: 240 }
	this.wait = false;
};

Omg.prototype.init = function(){
	var rec = this;

	navigator.getUserMedia({
    audio: false,
    video: rec.dimensions
  }, function(stream) {
		rec.stream = stream;
		rec.button.onclick = function(){ rec.start(); };
		rec.button.innerHTML = 'Start Recording';
		rec.cameraPreview.src = window.URL.createObjectURL(stream);
		rec.cameraPreview.play();
		rec.recordVideo = RecordRTC(stream,  {
		   	type: 'webm',
		   	video: rec.dimensions,
    		canvas: rec.dimensions,
	    	frameRate: 150,
	    	quality: 1
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
		counter = 3,
		func = function(){
			rec.button.innerHTML = 'Dance!! ' + counter;
			rec.background.currentTime = 0;
			counter--;
			if( !counter ){
				rec.stop();
				clearTimeout( timeout );
			}
			else {
				timeout = setTimeout( func , 1000 );
			}
		};
	rec.recordVideo.startRecording();
	timeout = setTimeout( func , 1000 );

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
				var gifs, gifStr = [];
				rec.wait = false;
	      if (request.readyState == 4 && request.status == 200) {
	        gifs = JSON.parse(request.responseText);
					if( !gifs.length ){
						window.removeEventListener( 'scroll', scrollForNewGifs );
					}
					for( var i in gifs ){
						if( gifs.hasOwnProperty( i ) ){
							gifStr.push( rec.getGifStr( gifs[i] ) );
						}
					}
					rec.gifContainer.innerHTML = rec.gifContainer.innerHTML + gifStr.join('');
	      }
	    };
	    request.open( 'GET', this.serverUrl + '/gifs?start=' + rec.gifContainer.children.length );
	    request.send( );
		}
};
Omg.prototype.scrollForNewGifs = function(){
	var rec = this;
	if ( window.innerHeight + window.scrollY > rec.gifContainer.offsetHeight + rec.gifContainer.offsetTop )
		rec.showGifs();
}

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
if( navigator.getUserMedia )
	omg.button.onclick = function(){ omg.init() };
else{
	omg.button.parentElement.removeChild( omg.button );
	document.getElementByTagName('header')[0].innerHTML = '<div class="alert alert-danger">Browser not supported</div>'
		+ document.getElementByTagName('header')[0].innerHTML
}


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
