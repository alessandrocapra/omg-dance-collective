var fs = require('fs'),
 	http = require('http');

http.createServer(function (request, response) {
	if(request.method == 'POST') {
		var queryData = "";

		request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

		request.on("end", function () {
			var filePath = '/var/www/omg/test.mpg',
				fileBuffer;
			while( fs.existsSync(filePath) ){
		        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
		        fileID += 1;
		    }
        console.log( queryData );
    		fs.writeFileSync(filePath, new Buffer( queryData.video.contents, "base64"));


			response.writeHead(200, {
				'Content-Type': 'text/plain'
			});
			// Send data and end response.
			response.end('Hello HTTP!');
		});
	}
	else
		response.end();
// Listen on the 8080 port.
}).listen(8080);
