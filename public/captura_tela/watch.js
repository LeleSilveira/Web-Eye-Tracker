const math = window.math;

import GeometryUtil from "/tracker/OlhoGeometry.util.js";
let peerConnection;
const config = {
  iceServers: [
      { 
        "urls": "stun:stun.l.google.com:19302",
      },
      // { 
      //   "urls": "turn:TURN_IP?transport=tcp",
      //   "username": "TURN_USERNAME",
      //   "credential": "TURN_CREDENTIALS"
      // }
  ]
};
var Zfiltadro=0
var Yfiltadro=0
var Xfiltadro=0
var Hx = 0,Hy = 0;
const socket = io.connect(window.location.origin);

const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");
//const sliderange = document.querySelector("#input-range");

//enableAudioButton.addEventListener("click", enableAudio)

/*sliderange.min = 100;
sliderange.max = 800;
sliderange.step = 2;
sliderange.oninput = function() {
  //console.log("valor zoom" , this.value)
  socket.emit('zoom_message',this.value);
}*/


socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.width = 1152;
    video.height = 648; 
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher");
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
  peerConnection.close();
});

 socket.on("dados_olho_naveg", (msg) => { //recebe a origem e a matriz de rotação para desenhar
    //var teste=[msg.matriz[0],msg.matriz[1].msg.matriz[2]]
    console.log(msg.matriz)
    drawAxis(msg.origem, msg.matriz,msg.tempo);
  });

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

function enableAudio() {
  console.log("Enabling audio")
  //video.muted = false;
  socket.emit('zoom_message', 200);
}
var heatmapInstance = h337.create({
  container: document.querySelector('div#heatmapContainer'),
  maxOpacity: .8,
  radius: 60,
  blur: .9,
});

var obj = {
  table: []
};

heatmapInstance.setDataMax(5);  //MODIFICA AQUI PARA MUDAR O GRADIENTE DE CALOR, menor muda mais rápido

function drawAxis(origin, rotationMatrix, time) {
  let limitX = math
  .subtract(
    origin,
    math.multiply(math.squeeze(math.row(rotationMatrix, 0)), 100.0)
  )
  /*if(flag!=3){
  drawArrow([origin[1], origin[0]], [limitX[1], limitX[0]], "red", 1.0, ctx, 3);
  }*/
  let limitY = math.add(origin,math.multiply(math.squeeze(math.row(rotationMatrix, 1)), 100.0))

  /*if(flag!=3){
  drawArrow(
    [origin[1], origin[0]],
    [limitY[1], limitY[0]],
    "green",
    1.0,
    ctx,
    3
  );
}*/

  let limitZ = math
    .subtract(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 2)), 900.0) //alterar tamanho da seta
    )
  /*if(flag!=3){
  drawArrow(
    [origin[1], origin[0]],
    [limitZ[1], limitZ[0]], //coordenadas da ponta da seta ?
    "blue",
    1.0,
    ctx,
    3
  );
  }*/
  
  //Filtro Smooth 
  var valor_alfa ;
  valor_alfa= 0.3;// faixa de valor 0 a 1 ( quanto mais próximo de 1 menor a atuacao do filtro)
   Xfiltadro = limitZ[0] * valor_alfa + (Xfiltadro * (1.0 - valor_alfa));  
   Yfiltadro = limitZ[1]  * valor_alfa + (Yfiltadro * (1.0 - valor_alfa));  
   Zfiltadro = limitZ[2] * valor_alfa + (Zfiltadro * (1.0 - valor_alfa)); 

                                 
   console.log("antes"+ Xfiltadro,Yfiltadro);
   if(Xfiltadro>=0 && Yfiltadro>=0 && Xfiltadro<=640 && Yfiltadro<=480){
    Hx= mapear(Xfiltadro,0,640,640,0);//inverter horizontalmente
    console.log("antesD"+Hx,Yfiltadro);
    Hx= mapear(Hx,0,640,0,1152); //video.width
    Hy= mapear(Yfiltadro,0,480,0,648);  //video.height
    heatmapInstance.addData({
      x: Hx,
      y: Hy,
      value: 1
    });
    // Gravar em um arquivo JSON
    obj.table.push({"x":Hx, "y":Hy, "t":time});
    socket.emit('salvar_JSON',obj);                 //Math.floor(Date.now()/1000);
    console.log("depois"+Hx,Hy);
  }
  
}

//funcao ref. https://rosettacode.org/wiki/Map_range#JavaScript
function mapear( x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}