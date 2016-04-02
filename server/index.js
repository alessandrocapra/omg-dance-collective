var fs = require('fs'),
  exec = require('child_process').exec,
 	http = require('http');

http.createServer( function( request, response ){
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost');

	if(request.method == 'POST') {
		var queryData = "";

		request.on( 'data', function( data ) {
        queryData += data;
        if(queryData.length > 1e6) {
            console.log( 'request too large' );
            queryData = "";
            response.writeHead(413, {'Content-Type': 'text/plain'});
            response.end();
            request.connection.destroy();
        }
    });

		request.on( 'end', function () {
			var
        videoDir = process.cwd() + '/../video/',
        gifDir = process.cwd() + '/../public/gif/',
        fileNames = [],
        fileName,
        filePath,
        gifPath,
				fileBuffer;
        fs.readdir( gifDir, function( err, files ){
          if( err ){
            console.log( err );
            response.writeHead( 500, {'Content-Type': 'text/plain'});
            response.end('error');
            return false;
          }
          for( var i in files ){
            fileNames.push( parseInt( files[i].split( '.' )[0] ) );
          }
          fileName = Math.max.apply( null, fileNames ) + 1;
          if( !fileName ){
            fileName = 1;
          }
          filePath = videoDir + fileName + '.webm';
          gifPath = gifDir + fileName + '.gif';

          queryData = JSON.parse( queryData );
          fileBuffer = new Buffer( queryData.video.split(',').pop(), "base64" );
      		fs.writeFile( filePath, fileBuffer, function( err ){
            if( err ){
              console.log( err );
              response.writeHead( 500, {'Content-Type': 'text/plain'});
              response.end('error');
              return false;
            }
            exec( './gif.sh ' + filePath + ' ' + gifPath, function( err, stdout, stderr ){
              if( err ){
                console.log( err );
                response.writeHead( 500, {'Content-Type': 'text/plain'});
                response.end('error');
                return false
              }
              fs.unlink( filePath );
            });

        });

      });

			response.writeHead( 200, {
				'Content-Type': 'text/plain'
			});
			// Send data and end response.
			response.end();
		});
	}
	else{
    switch( require('url').parse(request.url).path ){
        case '/gifs':
          var gifDir = process.cwd() + '/../public/gif/';
          fs.readdir( gifDir, function( err, files ){
            if( err ){
              console.log( err );
              response.writeHead( 500, {'Content-Type': 'text/plain'});
              response.end('error');
              return false;
            }

            response.writeHead( 200, {
              'Content-Type': 'text/json'
            });
            response.end( JSON.stringify( files ) );
          });
            break;


        default:
          response.writeHead( 200, {
            'Content-Type': 'text/json'
          });
          response.end();
          break;
      }
  }

// Listen on the 8080 port.
}).listen(8080);
