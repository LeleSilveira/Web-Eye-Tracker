//RECOMENDAÇÕES PARA CALIBRAÇÃO FICAR BOA:
// 1- CABEÇA CENTRALIZADA NA MARCAÇÃO DO VÍDEO
// 2- NÃO FORÇAR O OLHO PARA FICAR MAIS ABERTO OU MAIS FECHADO, MAS SIM COMO IRÁ OLHAR NORMALMENTE
// 3- AJUSTAR A INCLINAÇÃO DA CABEÇA ATÉ A MARCAÇÃO FICAR VERDE 
// 4- USAR ÓCULOS PODE ATRAPLHAR UM POUCO A PRECISÃO
// 5- APERTAR R para resetar

const math = window.math;
import GeometryUtil from "./OlhoGeometry.util.js";

const botao = document.getElementById("botao");
const botao2 = document.getElementById("botao2");
const botao3 = document.getElementById("botao3");


 var socket = io();
      

let mesh;
var pontox;
var pontoy;
var difx = 0;
var dify = 0;
var divx = 2;
var divy = 2;
var vetx = [];
var vety = [];
var cont = 0; 
var olho_direito;
var olho_esquerdo;
var re;
var le;
var contextoH;
var contextoW;
var fundoH;
var fundoW;
var flag=0; //libera começar a desenhar o mapa de calor
var inclinacao=5;
var Xfiltadro=0;
var Yfiltadro=0;
var Zfiltadro=0;


const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = "#32EEDB";
const RED = "#FF2C35";
const BLUE = "#157AB3";

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

var botoes = [];

let output = null;
let model = null;
let fundo=null;
let contexto=null;
//var heatmapInstance;
// ---------------------------------------------------------------
async function setupWebcam() {
  return new Promise((resolve, reject) => {
    console.log("Setup da Webcam");
    const webcamElement = document.getElementById("webcam");
    const navigatorAny = navigator;
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigatorAny.webkitGetUserMedia ||
      navigatorAny.mozGetUserMedia ||
      navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        { video: true },
        stream => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener("loadeddata", resolve, false);
        },
        error => reject()
      );
    } else {
      reject();
    }
  });
}
// ---------------------------------------------------------------
async function trackFace() {
  //DESENHA CÍRCULO DE LIMITAÇÃO
  if(flag!=3){
    output.save();
    output.scale(0.75, 1);
    if((inclinacao>0.6)||(inclinacao<(-0.6))){
    output.strokeStyle = RED;
    }
      else{
       output.strokeStyle= "#228B22";
      }
    output.lineWidth = 4.0;
    output.beginPath();
    output.arc(860 / 2, 480 / 2, 150, 0, Math.PI * 2, true);
    output.stroke();
    output.closePath();
    output.restore();
    }
  const video = document.getElementById("webcam");
  const faces = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false,
    predictIrises: true
  });

  output.drawImage(
    video,
    0,
    0,
    video.width,
    video.height,
    0,
    0,
    video.width,
    video.height
  );
  //botao

  faces.forEach(face => {
    // keypoints  recebe a matriz com os valores x,y,z de cada keypont mapeado
    const keypoints = face.scaledMesh;
    //----------------------------------------------------------------------------------------------
    // desenha os pontos
    output.strokeStyle = GREEN;
    output.lineWidth = 2.0;
    output.fillStyle = GREEN;
    let a = [],
      b = [],
      c = [];
    let x, y;
    mesh = face.scaledMesh;
    let can = document.getElementById("output");
    let out = can.getContext("2d");
    var r = new Rosto(mesh);
    olho_direito = r.olho.direito.pupila;
    olho_esquerdo = r.olho.esquerdo.pupila;
    re = olho_direito.centro; // right eye coordinates centro: pontos[473], cima: pontos[475],
    // direita: pontos[474], baixo: pontos[477], esquerda: pontos[476]

    le = olho_esquerdo.centro; // left eye coordinates  centro: pontos[468],
    //cima: pontos[470],
    //direita: pontos[469],
    //baixo: pontos[472],
    //esquerda: pontos[471]
    x = (le[0] + re[0]) / 2;
    y = (le[1] + re[1]) / 2;
    // PROJETAR VETORES X,Y,Z
   contexto.clearRect(0, 0, fundo.width, fundo.height);
    const centroide = math.mean(
      [
        olho_esquerdo.cima,
        olho_esquerdo.direita,
        olho_esquerdo.baixo,
        olho_esquerdo.esquerda
      ],
      0
    );
    const {
      origin,
      rotationMatrix,
      pitch,
      yaw,
      roll,
      ptx,
      pty
    } = computeHeadRotation(face, mesh[4], difx, dify, divx, divy);
    pontox = ptx;
    pontoy = pty;
    var obj={
      origem:origin,
      matriz:rotationMatrix.toArray(), //toArray() não prejudica os valores
      tempo: Math.floor(Date.now()), //caso queira mudar para segundo:Math.floor(Date.now()/1000);,
    }
    console.log(mesh[4])
    if(flag==3){
    socket.emit('dados_olho',obj);
    }
    //drawAxis tem que ir pra assistir tela, com o canvas do video
     
    
     inclinacao= re[2]+le[2];
  //  output.font = "40px Arial";
   // output.strokeText(inclinacao.toFixed(2), keypoints[10][0], keypoints[10][1]); //PODIA MANDAR UM SINAL VERDE QUANDO TIVESSE OK PARA CALIBRAR?
    
    
  });
  requestAnimationFrame(trackFace);
}
//-----------------------------------------------------------------
(async () => {
  await setupWebcam();
  /*
  heatmapInstance = h337.create({
  container: document.querySelector('div#heatmapContainer'),
  maxOpacity: .8,
  radius: 60,
  blur: .9,
});

heatmapInstance.setDataMax(5);  //MODIFICA AQUI PARA MUDAR O GRADIENTE DE CALOR, menor muda mais rápido
*/
  const video = document.getElementById("webcam");
  video.play();
  let videoWidth = video.videoWidth;
  let videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  let canvas = document.getElementById("output");
  canvas.width = video.width;
  canvas.height = video.height;
  fundoH=canvas.height;
  fundoW=canvas.width;
/*
  let canvasH= document.getElementsByClassName("heatmap-canvas");
  canvasH=canvasH[0];
  let ctxH=canvasH.getContext("2d");
  contextoH=canvasH.height;
  contextoW=canvasH.width;
*/
  output = canvas.getContext("2d");
  //comentei translate e scale  resultado: a camera mudou de posicao
  fundo = document.getElementById("fundo");
  contexto = fundo.getContext("2d");
  
  //console.log(fundoH,fundoW,contextoH,contextoW);

  fundo.width = video.width;
  fundo.height = video.height;
  contexto.translate(canvas.width, 0); //canvas.width, 0
  contexto.scale(-1, 1);
  
  output.translate(canvas.width, 0); //canvas.width, 0
  output.scale(-1, 1); //Mirror cam
  output.fillStyle = "#fdffb6";
  output.strokeStyle = "#fdffb6";
  output.lineWidth = 1; //mudei para ficar linha fina

  console.log("Inicio carregamento do modelo");
  // Load Face Landmarks Detection
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );
  console.log("modelo carregado");

  output.fillStyle = GREEN;
  output.fillRect(0,470, 20, 20); //Ponto na origem do canvas para comparação
  const peerConnections = {};
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

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement =  document.getElementById("transmissao");
//const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

//audioSelect.onchange = getStream;
//videoSelect.onchange = getStream;

getStream()
  .then(getDevices)
  .then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
    // option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      //audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
     // videoSelect.appendChild(option);
    }
  }
}

//https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  /*const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined }, 
    // https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/resolution/js/main.js 
    video: {width: {exact: 1280}, height: {exact: 720}} 
    //video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  };*/
  return navigator.mediaDevices
    .getDisplayMedia() //.getUserMedia(constraints) 
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  /*window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.width = 1280;
  videoElement.height = 720; */
  videoElement.srcObject = stream;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}
  
  trackFace();
})();

function computeHeadRotation(face, origem, x, y,dx,dy) {
  var {
    origin,
    rotationMatrix,
    ptx,
    pty
  } = GeometryUtil.computeHeadPoseEstimation(face, origem, x, y,dx,dy);
  const { pitch, yaw, roll } = GeometryUtil.rotationMatrixToEulerAngles(
    rotationMatrix
  );
  //const eyesDistance = math.norm(math.subtract(le, re));

  let mesh = face.scaledMesh;

  return { origin, rotationMatrix, pitch, yaw, roll, ptx, pty };
}

function drawAxis(origin, rotationMatrix) {
  let limitX = math
  .subtract(
    origin,
    math.multiply(math.squeeze(math.row(rotationMatrix, 0)), 100.0)
  )
  .toArray();
  /*if(flag!=3){
  drawArrow([origin[1], origin[0]], [limitX[1], limitX[0]], "red", 1.0, ctx, 3);
  }*/
  let limitY = math
    .add(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 1)), 100.0)
    )
  .toArray();

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
    .toArray();
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

  var Hx = 0,Hy = 0;
  var atual = Math.floor(Date.now());   //caso queira mudar para segundo:
                                        //Math.floor(Date.now()/1000);
  if(flag==3){
    Hx= mapear(Xfiltadro,0,fundoW,fundoW,0);
    Hx= mapear(Hx,0,fundoW,0,contextoW);
    Hy= mapear(Yfiltadro,0,fundoH,0,contextoH);
    heatmapInstance.addData({
      x: Hx,
      y: Hy,
      value: 1
    });
    // envia dados para o servidor.js
    
    console.log(Hx,Hy);
  }
}

function drawArrow([ay, ax], [by, bx], color, scale, ctx, lineWidth = 2) {
  var headlen = 10; // length of head in pixels
  var dx = bx - ax;
  var dy = by - ay;
  var angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(
    bx - headlen * Math.cos(angle - Math.PI / 6),
    by - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(bx, by);
  ctx.lineTo(
    bx - headlen * Math.cos(angle + Math.PI / 6),
    by - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

const click3 = function calibra3() { 
  if (cont < 5) {
    vetx[cont] = (mesh[130][0] + mesh[359][0]) / ((mesh[473][0] + mesh[468][0])/2);
    vety[cont] = (((mesh[52][1] + mesh[283][1])/2) + ((mesh[450][1] + mesh[230][1])/2))/((mesh[159][1]+mesh[386][1])/2) ;
    console.log(vetx[cont]);
    cont++;
  }
  if (cont == 5) {
    vetx.sort();
    vety.sort();
    vetx.pop();
    vety.pop();
    vetx.shift();
    vety.shift();
    divx = math.mean(vetx); 
    divy = math.mean(vety);
    cont = 0;
    botao.style.visibility= "hidden";
    console.log(divx + "," + divy);
    flag++;
  }
};

const click4 = function calibra4() { 
  if (cont < 5) {
    vety[cont] = (mesh[52][1] + mesh[230][1]) / mesh[159][1];
    cont++;
  }
  if (cont == 5) {
    vety.sort();
    vety.pop();
    vety.shift();
    divy = math.mean(vety);
    cont = 0;
    botao2.style.visibility= "hidden";
    console.log(divx + "," + divy);
    flag++;
  }
};

const click5 = function calibra5() { 
  if (cont < 5) {
    vety[cont] = (mesh[52][1] + mesh[230][1]) / mesh[159][1];
    cont++;
  }
  if (cont == 5) {
    vety.sort();
    vety.pop();
    vety.shift();
    divy = math.mean(vety);
    cont = 0;
    
    botao3.style.visibility= "hidden";
    console.log(divx + "," + divy);
    flag++;
  }
};



botao.onclick = click3;  //AQUI PARA MUDAR A FUNÇÃO DE CALIBRAÇÃO USADA
botao2.onclick = click4;
botao3.onclick = click5;

function draw(x, y, ctx, cor = "#00ff00", raio = 5) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2, true);
  ctx.fill();
}

class Rosto {
  constructor(pontos) {
    this.olho = {
      direito: {
        pupila: {
          centro: pontos[473],
          cima: pontos[475],
          direita: pontos[474],
          baixo: pontos[477],
          esquerda: pontos[476]
        }
      },

      esquerdo: {
        pupila: {
          centro: pontos[468],
          cima: pontos[470],
          direita: pontos[469],
          baixo: pontos[472],
          esquerda: pontos[471]
        }
      }
    };
  }
}

document.addEventListener('keydown', resetar);

function resetar(b){
  if (b.key == 'r'){
    difx = 0;
    dify = 0;
    divx = 2;
    divy = 2;
    vetx = [];
    vety = [];
    cont = 0;
    botao.style.visibility = "visible";
    botao2.style.visibility = "visible";
    botao3.style.visibility = "visible";
    flag=0;
  }
}

document.addEventListener('keydown', enviar);

function enviar(b){
  //ws.send("enviar");
}

//funcao ref. https://rosettacode.org/wiki/Map_range#JavaScript
function mapear( x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

