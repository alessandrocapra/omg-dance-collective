var Omg = function(){
	this.button = document.getElementById('movebutton');
	this.cameraPreview = document.getElementById('camera');
};

Omg.prototype.init = function(){
	var rec = this;
	rec.button.onclick = function(){ rec.start(); };
	rec.button.innerHTML = 'Start Recording';
	navigator.getUserMedia({
        audio: false,
        video: true
    }, function(stream) {
		rec.cameraPreview.src = window.URL.createObjectURL(stream);
		rec.cameraPreview.play();
		rec.recordVideo = RecordRTC(stream, {
				type: 'video'
		});
	}, function(error) {
			alert(JSON.stringify(error));
	});

}

Omg.prototype.start = function(){
	var rec = this;
	rec.recordVideo.startRecording();
	setTimeout( function(){
		rec.stop();
	}, 4000 );

};

Omg.prototype.stop = function(){
	var rec = this;
	rec.recordVideo.stopRecording();
	rec.recordVideo.getDataURL( function( videoDataURL ) {
        rec.postFiles( videoDataURL );
				rec.button.onclick = function(){ rec.init(); };
				rec.button.innerHTML = 'Let\'s move together!';
    });
};

Omg.prototype.postFiles = function( videoDataURL ){
	var rec = this,
		files = {
			video : videoDataURL
    },
    request = new XMLHttpRequest();
    rec.cameraPreview.src = ''; //add loading?

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var href = location.href.substr(0, location.href.lastIndexOf('/') + 1),
            	h2;
	        rec.cameraPreview.src = href + 'uploads/' + request.responseText;
	        rec.cameraPreview.play();

	        h2 = document.createElement('h2');
	        h2.innerHTML = '<a href="' + rec.cameraPreview.src + '">' + rec.cameraPreview.src + '</a>';
	        document.body.appendChild(h2);
        }
    };
    request.open( 'POST', 'http://localhost:8080' );
    request.send( JSON.stringify( files ) );
};

Omg.prototype.dynHeight = function() {
	this.cameraPreview.style.height = window.innerHeight;
};

Omg.prototype.showGifs = function(){
	var rec = this,
		request = new XMLHttpRequest();
		gifStr = [];

		request.onreadystatechange = function() {
			var gifs, gifStr = [];
        if (request.readyState == 4 && request.status == 200) {
          gifs = JSON.parse(request.responseText);
					console.log( gifs );
					for( var i in gifs ){
						if( gifs.hasOwnProperty( i ) )
							gifStr.push( '<div class="col-sm-2"><img src="gif/' + gifs[i] + '" alt=""></div>' );
					}
					document.getElementById('gif-container').innerHTML = gifStr.join('');
        }
    };
    request.open( 'GET', 'http://localhost:8080/gifs' );
    request.send( );

}
omg = new Omg();

omg.button.onclick = function(){ omg.init() };
window.addEventListener( 'resize', function(){ omg.dynHeight() } );
omg.dynHeight();

omg.showGifs();
