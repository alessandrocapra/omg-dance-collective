// Parte Ale

// resize viewport
function dynHeight() {
	var footerHeight = $('footer').height();
	var height = $(window).height() - footerHeight;
	console.log(height);
	$("main #intro").css('height', height);
}

$(document).ready(function() {
	dynHeight();
	$(window).bind('resize', dynHeight());
});

// Parte Daniè
var Omg = function(){
	this.startButton = document.getElementById('start');
	this.stopButton = document.getElementById('stop');
	this.cameraPreview = document.getElementById('camera-preview');
}
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
}

Omg.prototype.stop = function(){
	var rec = this;
	rec.recordVideo.stopRecording();
	rec.recordVideo.getDataURL( function( videoDataURL ) {
        rec.postFiles( videoDataURL );
    });
}
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

}

omg = new Omg();

omg.startButton.addEventListener( 'click', function(){ omg.start() } );

omg.stopButton.addEventListener( 'click', function(){ omg.stop() } );