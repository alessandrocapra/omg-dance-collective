var Omg = function(){
	this.startButton = document.getElementById('start');
	this.stopButton = document.getElementById('stop');
	this.cameraPreview = document.getElementById('intro');
};

Omg.prototype.start = function(){
	var rec = this;
	navigator.getUserMedia({
        audio: false,
        video: true
    }, function(stream) {
        rec.cameraPreview.src = window.URL.createObjectURL(stream);
        rec.cameraPreview.play();
        rec.recordVideo = RecordRTC(stream, {
            type: 'video'
        });
				rec.recordVideo.startRecording();
    }, function(error) {
        alert(JSON.stringify(error));
    });
};

Omg.prototype.stop = function(){
	var rec = this;
	rec.recordVideo.stopRecording();
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
		gifStr = []];

		request.onreadystatechange = function() {
			var gifs, gifStr = [];
        if (request.readyState == 4 && request.status == 200) {
          gifs = request.responseText;
					for( var i in gifs ){
						gifStr.push( '<div class="col-sm-2"><img src="' + gifs[i] '" alt=""></div>' );
					}
					document.getElementById('gif-container').innerHTML( gifStr.join() );
        }
    };
    request.open( 'GET', 'http://localhost:8080/gifs' );
    request.send( JSON.stringify( files ) );

}
omg = new Omg();

omg.startButton.addEventListener( 'click', function(){ omg.start() } );
omg.stopButton.addEventListener( 'click', function(){ omg.stop() } );
window.addEventListener( 'resize', function(){ omg.dynHeight() } );
omg.dynHeight();

omg.showGif();
