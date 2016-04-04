var fs = require('fs'),
  exec = require('child_process').exec,
  WebSocketServer = require('websocket').server
 	http = require('http'),

  globalWsId = 1,
  openWss = [],

  httpServer = http.createServer( function( request, response ){
    response.setHeader('Access-Control-Allow-Origin', 'http://www.omgdancecollective.gq');
    switch( require('url').parse(request.url).path ){
      case '/video':
      	if(request.method == 'POST') {
      		var queryData = "";

      		request.on( 'data', function( data ) {
              queryData += data;
              if( queryData.length > 1e7 ) { //around 10MBs
                  console.log( 'request too large' );
                  queryData = "";
                  response.writeHead(413, {'Content-Type': 'text/plain'});
                  response.end();
                  request.connection.destroy();
              }
          });

      		request.on( 'end', function () {
      			var
              gifDir = process.cwd() + '/public/gif/',
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
                if( fileNames.length )
                  fileName = Math.max.apply( null, fileNames ) + 1;
                if( !fileName ){
                  fileName = 1;
                }
                gifPath = gifDir + fileName + '.gif';

                queryData = JSON.parse( queryData );
                fileBuffer = new Buffer( queryData.video.split(',').pop(), "base64" );
            		fs.writeFile( gifPath, fileBuffer, function( err ){
                  if( err ){
                    console.log( err );
                    response.writeHead( 500, {'Content-Type': 'text/plain'});
                    response.end('error');
                    return false;
                  }
                  for( var i in openWss ){
                    openWss[i].sendUTF( fileName + '.gif' );
                  }

              });

            });

      			response.writeHead( 200, {
      				'Content-Type': 'text/plain'
      			});
      			// Send data and end response.
      			response.end();
      		});
      	}
        break;

          case '/gifs':
            var gifDir = process.cwd() + '/public/gif/';
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

            case '/ws':
              response.writeHead( 200, {
                  'Content-Type': 'text/json'
                });
                response.end();
            break;

            default:
            response.writeHead( 404, {
              'Content-Type': 'text/json'
            });
            response.end('not found');
            break;    
      }   
    
}),

wsServer = new WebSocketServer({
    httpServer: httpServer
});

httpServer.listen(8080);


wsServer.on('request', function(request) {
  var wid = globalWsId++,
  connection = request.accept('gif', request.origin);
  openWss[ wid ] = connection;
  connection.on('close', function(reasonCode, description) {
        openWss.splice(wid, 1); //remove from array
  });

});
