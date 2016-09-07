var http = require('http');
var urlparse = require('url').parse;

// simple page that acts as the OAuth endpoint
http.createServer(function(request, response) {
    var url = urlparse(request.url, true);
    if (url.path === '/jira') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<html><head><title>Jira | cabdriver</title></head>');
        response.write('<p>Welcome Jira</p>');
        response.end('</body></html>');
        return;
    }
    if (url.query.code) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<html><head><title>Authentication successful | cabdriver</title></head>');
        response.write('<body><h1>Successfully authenticated</h1>');
        response.write('<p>Copy the following code back to the terminal for cabdriver: ');
        response.write('<strong>' + url.query.code + '</strong></p>');
        response.end('</body></html>');
    } else {
        response.writeHead(401, {'Content-Type': 'text/html'});
        response.write('<html><head><title>Authentication failed | cabdriver</title></head>');
        response.end('<h1>401 Not Authorized</h1></body></html>');
    }
}).listen(process.env.PORT || 5000);
