/*
modulos instalados:
  npm install express
  //npm install ws
  npm install local-ipv4-address
  npm install socket.io
*/


//secao servidor https
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();

//carregar certificados
var path = require('path');
var certsPath = path.join(__dirname, 'certs', 'server');
var caCertsPath = path.join(__dirname, 'certs', 'ca');

//obter o endereco ip do computador executando esse servidor
var localIpV4Address = require("local-ipv4-address");
localIpV4Address().then(function(ipAddress){      
    console.log(`Endereco base servidor https => https://${ipAddress}:8083`);  
    console.log(`Pagina eyetracker e transmissao da tela => https://${ipAddress}:8083/tracker/index.html`); 
   // console.log(`Pagina captura e transmissao da tela => https://${ipAddress}:8083/captura_tela/transmitir_tela.html`); 
    console.log(`Pagina exibir tela capturada => https://${ipAddress}:8083/captura_tela/assistir_tela.html`);     
   
});

// paginas estaticas na pasta public
app.use(express.static(__dirname+'/public'));

//========================================================
// SSL Certificates
var options = {
  key: fs.readFileSync(path.join(certsPath, 'my-server.key.pem'))
, ca: [ fs.readFileSync(path.join(caCertsPath, 'my-root-ca.crt.pem')) ]
, cert: fs.readFileSync(path.join(certsPath, 'my-server.crt.pem'))
};

/*var app = function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
}*/

// =====================  eco para teste do servidor ==================
/*app.get('/eco/:palavra', function(req, res) {
  var palavra_recebida = req.params.palavra;
   //res.send("<html><body>" +  palavra_recebida + "</body></html>");
   res.send(palavra_recebida);
   console.log("recebido: " + palavra_recebida);
 });*/
 //====================================================================

http.createServer(app).listen(8000);
servidor = https.createServer(options, app).listen(8083);
// ---- scocket.io , secao WebRTC -----------------------------
const io = require("socket.io")(servidor);
io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
  socket.on("broadcaster", () => {
    broadcaster = socket.id;
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", () => {
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });

socket.on("zoom_message", (message) => {
    console.log("msg: ", message)
    socket.to(broadcaster).emit("zoom_message", message);
 });
 socket.on("salvar_JSON", (obj) => {
  var json = JSON.stringify(obj);
    var fs = require('fs');
    fs.writeFile('MapaDeCalor.json', json, 'utf8', callback);
});
  
});
// ----------------------------------------------------------------- 

 
// dados recebidos de: tracker\index.html  (emitido na funcao drawAxis) 
// enviados para: captura_tela\visualizar.html 
io.on('connection', (socket) => {
  socket.on('dados_olho', (msg) => {
    console.log('message: ' + msg);
    io.emit('dados_olho_naveg', msg);
  });
});
 

// endereco do servidor vai ser https://localhost:8083  (localhost pode ser substituido pelo ip)
// ao carregar vai dar um aviso de seguranca, isso pq estou usando certificados particulares, mas nao tem problema
//criar uma pasta com o nome public , nessa pasta sao colocados os arquivos html, js, imagens, etc
  
function callback(){
  
}