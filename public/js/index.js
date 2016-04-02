var Omg = function(){
	this.startButton = document.getElementById('start');
	this.stopButton = document.getElementById('stop');
	this.cameraPreview = document.getElementById('intro');
};

Omg.prototype.start = function(){
	var rec = this;
	navigator.getUserMedia({
        audio: true,
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
			video : {
	    	    name: 'test.webm',
		        type: 'video/webm',
	            contents: videoDataURL
	        }
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
    request.open( 'POST', '/upload' );
    request.send( JSON.stringify( files ) );
};

// Parte Ale

// resize viewport
Omg.prototype.dynHeight = function() {
	console.log( document.innerHeight );
	this.cameraPreview.style.height = window.innerHeight;
	console.log( this.cameraPreview.style.height );
};

omg = new Omg();

omg.startButton.addEventListener( 'click', function(){ omg.start() } );
omg.stopButton.addEventListener( 'click', function(){ omg.stop() } );
window.addEventListener( 'resize', function(){ omg.dynHeight() } );
omg.dynHeight();
