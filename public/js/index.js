var Omg = function(){
	this.button = document.getElementById('movebutton');
	this.cameraPreview = document.getElementById('camera');
	this.gifContainer = document.getElementById('grid');
	this.background = document.getElementById('background');
	this.serverUrl = window.location.origin;
	this.wsUrl = window.location.protocol.replace( 'http', 'ws')+ '//' + window.location.host + '/ws';
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
	    noFallback: true,
	    //swffile: "js/fallback/jscam.swf",
	    quality: 20,
		el: rec.cameraPreview.id

	  }, function(stream) {
			rec.stream = stream;


			var vendorURL = window.URL || window.webkitURL;
			rec.background.src = 'video/unfearing-short.mp4';
			rec.cameraPreview.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
			rec.cameraPreview.play();

			rec.cameraPreview.onerror = function() {
					alert('error in trasmitting data');
			};
			rec.button.onclick = function(){ rec.ready(); };
			rec.button.innerHTML = 'Start Recording';
			rec.recordVideo = RecordRTC(stream,  {
			   	type: 'webm',
			   	video: rec.dimensions,
	    		canvas: rec.dimensions,
					disableLogs : true
			});
	}, function(error) {
		var el, container, a;
		if( typeof error !== 'undefined' && error.message )
			alert( error.message );
		else{
			el = document.createElement( 'div' );
			el.id = 'no-rec';
			container = document.getElementById( 'intro' );
			a = document.createElement( 'a' );
			a.href = 'javascript:void(0)';
			a.onclick = function(){ container.removeChild( el ) };
			a.innerHTML = 'Watch video';
			a.className = 'pulsante';
			el.innerHTML = '<p>Your browser does not support webcam record<br>To record your dance please use Google Chrome or Firefox</p>';
			el.appendChild( a );
			container.insertBefore( el, container.children[0] );
		}
	});

}

Omg.prototype.ready = function(){
	var rec = this,
		counter = 9,
		func = function(){
			rec.button.innerHTML = 'Ready?! ' + (counter > 1 ? counter : '');

			if( !counter ){
				rec.start();
				clearTimeout( rec.timeouts['ready'] );
			}
			else {
				rec.timeouts['ready'] = setTimeout( func , 1000 );
			}
			counter--;
		};

	rec.timeouts['ready'] = setTimeout( func , 1000 );
	rec.button.onclick = function(){};
}

Omg.prototype.start = function(){
	var rec = this,
		counter = 39,
		func = function(){
			rec.button.innerHTML = 'Dance!! ';

			if( !counter ){
				rec.stop();
				clearTimeout( rec.timeouts['start'] );
			}
			else {
				rec.timeouts['start'] = setTimeout( func , 1000 );
			}
			counter--;
		};


	rec.background.currentTime = 0;
	rec.recordVideo.startRecording();
	rec.timeouts['start'] = setTimeout( func , 1000 );

};

Omg.prototype.stop = function(){
	var rec = this,
		tracks = rec.stream.getTracks(),
		parent = document.getElementById( 'final-buttons' );

	rec.button.style.display = 'none';
	rec.cameraPreview.style.display = 'none';

	rec.background.pause();

	rec.recordVideo.stopRecording();
	rec.recordVideo.getDataURL( function( videoDataURL ) {
		var videoEl = document.createElement('video');
		rec.videoDataURL = videoDataURL;
		videoEl.id = 'preview';
		videoEl.loop = 'loop';
		videoEl.src = videoDataURL;
		videoEl.play();

		rec.background.parentNode.insertBefore( videoEl, rec.background );

	});

	parent.style.display = 'block';
	parent.addEventListener( 'click', function( event ){
		switch( event.target.id ){
			case 'upload':
				rec.postFiles();
				parent.removeChild( event.target );
			break;

			case 'again':
				location.reload();
				break;

			case 'share':
				window.open( 'http://www.facebook.com/sharer/sharer.php?u=' + rec.serverUrl, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
				/*
				FB.ui({
					  method: 'share',
					  href: location.href,
					}, function(response){});*/
				break;
		}
	});


	/*if( typeof rec.stream.stop === 'function' )
		rec.stream.stop();
	else{
		for( var i in tracks ){
			if( tracks.hasOwnProperty( i ) )
				tracks[i].stop();
		}
	}*/

};

Omg.prototype.postFiles = function(){
	var rec = this,
		progressEl = document.createElement('div'),
		percEl = document.createElement('span'),
    	request = new XMLHttpRequest();

	if( typeof rec.videoDataURL === 'undefined' )
		return false;

	progressEl.id = 'progress';
	progressEl.innerHTML = 'please wait for upload to finish..';
	if( typeof request.onprogress !== 'undefined' ){
		percEl.id = 'perc';
		percEl.innerHTML = '0%';
		progressEl.appendChild( percEl );
		request.onprogress = function( evt ){
			if (evt.lengthComputable)
	     		percEl.innerHTML = (evt.loaded / evt.total) * 100 + '%';
		};
	}

	rec.background.parentNode.insertBefore( progressEl, rec.background );


    request.onreadystatechange = function() {
        if( request.readyState == 4 )
			if( request.status == 200)
				progressEl.innerHTML = 'upload complete, enjoy your recording while it\'s converted!';
			else
				progressEl.innerHTML = 'error in sending video to the server';
    };
    request.open( 'POST', this.serverUrl + '/stream' );
    request.send( JSON.stringify( { video : rec.videoDataURL } ) );
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
	return '<div class="col-sm-3"><img src="gif/' + fileName + '" alt=""></div>';
};

Omg.prototype.startWSClient = function(){
	var rec = this, connection;
	if( !'WebSocket' in window )
		return false;
	connection = new WebSocket( this.wsUrl, 'gif' );
	connection.onmessage = function(e){
		var lastRow = rec.gifContainer.lastChild, container;
		if( lastRow.children.length >= 4 ){
			container = document.createElement('div');
			container.className = 'row';
			rec.gifContainer.appendChild( container );
		}
		else
			container = lastRow;
    container.innerHTML = container.innerHTML + rec.getGifStr( e.data );
	}

	window.onbeforeunload = function() {
    connection.onclose = function () {}; // disable onclose handler first
    connection.close()
	};
}
omg = new Omg();

omg.button.onclick = function(){
	omg.background.play();
	omg.init()
};


omg.showGifs();
var scrollForNewGifs = function(){ omg.scrollForNewGifs(); };
window.addEventListener( 'scroll', scrollForNewGifs );

(function(){
	var grid = document.getElementById('grid'),
		about = document.getElementById('about'),
		footer = document.querySelector('footer');
	window.addEventListener( 'scroll', function(){

		if ( window.innerHeight + window.scrollY > about.offsetTop )
			footer.className = 'container-fluid down about';
		else if ( window.innerHeight + window.scrollY > grid.offsetTop )
			footer.className = 'container-fluid down';
		else
			footer.className = 'container-fluid';

	} );
})();
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
