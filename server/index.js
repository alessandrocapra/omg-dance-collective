var fs = require('fs'),
  exec = require('child_process').exec,
  url = require('url'),
  WebSocketServer = require('websocket').server
 	http = require('http'),

  globalWsId = 1,
  openWss = [],

  httpServer = http.createServer( function( request, response ){
    //response.setHeader('Access-Control-Allow-Origin', 'https://www.omgdancecollective.gq');
    response.setHeader('Access-Control-Allow-Origin', 'https://un-fearing.com');
    //response.setHeader('Access-Control-Allow-Origin', 'http://localhost');
    switch( url.parse(request.url).pathname ){
      case '/stream':
      	if(request.method == 'POST') {
      		var queryData = "";

      		request.on( 'data', function( data ) {
              queryData += data;
              /*if( queryData.length > 1e7 ) { //around 10MBs - it's handled by nginx
                  queryData = "";
                  response.writeHead(413, {'Content-Type': 'text/plain'});
                  response.end();
                  request.connection.destroy();
              }*/
          });

      		request.on( 'end', function () {
            console.log( 'stream acquisito');
            var
              videoDir = __dirname + '/../video/',
              gifDir = __dirname + '/../public/gif/',
              fileNames = [],
              fileName,
              filePath,
              gifPath,
      				fileBuffer;
              fs.readdir( gifDir, function( err, files ){
                if( err ){
                  console.error( err );
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
                filePath = videoDir + fileName + '.webm';
                gifPath = gifDir + fileName + '.gif';

                queryData = JSON.parse( queryData );
                fileBuffer = new Buffer( queryData.video.split(',').pop(), "base64" );
            		fs.writeFile( filePath, fileBuffer, function( err ){
                  if( err ){
                    console.error( err );
                    return false;
                  }
                  console.log('salvato file ' + filePath );
                  exec( './' + __dirname +  '/gif.sh ' + filePath + ' ' + gifPath, {maxBuffer: 1024 * 500}, function( err, stdout, stderr ){
                    if( err ){
                      console.error( err );
                      return false
                    }
                    console.log('salvato file ' + gifPath );
                    for( var i in openWss ){
                      openWss[i].sendUTF( fileName + '.gif' );
                    }
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
        break;

          case '/gifs':
            var gifDir = __dirname + '/../public/gif/',
              start = parseInt( url.parse(request.url,true).query.start );
            fs.readdir( gifDir, function( err, files ){
              if( err ){
                console.log( err );
                response.writeHead( 500, {'Content-Type': 'text/plain'});
                response.end('error');
                return false;
              }

              files.sort(function(a, b) {
                 return fs.statSync(gifDir + b).mtime.getTime() -
                        fs.statSync(gifDir + a).mtime.getTime();
             });

              response.writeHead( 200, {
                'Content-Type': 'text/json'
              });
              response.end( JSON.stringify( files.slice(  start, start + 12 ) ) );
            });
            break;

            case '/ws':
              response.writeHead( 404, {
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
