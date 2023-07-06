import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from "socket.io-client";
window.sourceId=null;
var chromeMediaSource = 'screen';
window.getScreenConstraints=getScreenConstraints;
function getSourceId(callback) {
  if (!callback) throw '"callback" parameter is mandatory.';
  if(sourceId) return callback(sourceId);
  
  screenCallback = callback;
  window.postMessage('get-sourceId', '*');
}

var isFirefox = typeof window.InstallTrigger !== 'undefined';
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !isOpera;

function getScreenConstraints(chromeMediaSourc,callback) {
  var firefoxScreenConstraints = {
      mozMediaSource: 'window',
      mediaSource: 'window'
  };
  
  if(isFirefox) return callback(null, firefoxScreenConstraints);

  // this statement defines getUserMedia constraints
  // that will be used to capture content of screen
  var screen_constraints = {
      mandatory: {
          chromeMediaSource: chromeMediaSource,
          maxWidth: screen.width > 1920 ? screen.width : 1920,
          maxHeight: screen.height > 1080 ? screen.height : 1080
      },
      optional: []
  };

  // this statement verifies chrome extension availability
  // if installed and available then it will invoke extension API
  // otherwise it will fallback to command-line based screen capturing API
  if (chromeMediaSource == 'desktop' && !sourceId) {
      getSourceId(function() {
          screen_constraints.mandatory.chromeMediaSourceId = sourceId;
          callback(sourceId == 'PermissionDeniedError' ? sourceId : null, screen_constraints);
      });
      return;
  }

  // this statement sets gets 'sourceId" and sets "chromeMediaSourceId" 
  if (chromeMediaSource == 'desktop') {
      screen_constraints.mandatory.chromeMediaSourceId = sourceId;
  }

  // now invoking native getUserMedia API
  callback(null, screen_constraints);
}

  const socket = io('http://localhost:3000');

function App() {


  var video
  var webRtcPeer;
  var webRtcPeerRec;
  var videoRec
  const videoRef=useRef(null);

  useEffect(() => {
    function onMessage(message) {
     
      console.log(message)
      message=JSON.parse(message);

  console.info('Received message: ' + message.id);
  var parsedMessage=message
  switch (parsedMessage.id) {
  case 'presenterResponse':
    presenterResponse(parsedMessage);
    break;
  case 'viewerResponse':
    viewerResponse(parsedMessage);
    break;
  case 'stopCommunication':
    dispose();
    break;
  case 'iceCandidate':
    webRtcPeer.addIceCandidate(parsedMessage.candidate)
    break;
  default:
    console.error('Unrecognized message', parsedMessage);
  }
    }

  

    socket.on('message',(message)=>{

      onMessage(message)
}
)
   

    return () => {
      socket.off('connect', onMessage);
     
    };
  }, []);

  
  window.onload = function() {
    console.log('gello')
    video = document.getElementById('video');
    videoRec = document.getElementById('recVideo');
    videoRef.current= document.getElementById('recVideo');
  
    // document.getElementById('call').addEventListener('click', function() { presenter(); } );
    // document.getElementById('viewer').addEventListener('click', function() { viewer(); } );
    // document.getElementById('terminate').addEventListener('click', function() { stop(); } );
  }
  
  window.onbeforeunload = function() {
    dispose();
    socket.close();
  }
  
 
  
  function presenterResponse(message) {
    if (message.response != 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
      dispose();
    } else {
      webRtcPeer.processAnswer(message.sdpAnswer);
    }
  }
  
  function viewerResponse(message) {
    console.log('laulu please')
    if (message.response != 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
      dispose();
    } else {
      console.log('done laulu')
      webRtcPeer.processAnswer(message.sdpAnswer);
    }
  }
 
  function presenter() {
    if (!webRtcPeer) {

      navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(stream => {

      var constraints = {
        audio: false,
        video: true
      }
      var options = {
        localVideo: video,
        videoStream:stream,
        sendSource: 'desktop',
        onicecandidate : onIceCandidate,
        mediaConstraints: constraints,
        
      }
     
    
   
 
      
        
       webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
        if(error){
          console.error(error);
          return;
        }
 
          this.generateOffer(onOfferPresenter);
       });
      })
    }
 }
 
 function onOfferPresenter(error, offerSdp) {
  if(error){
    console.log(error);
    return;
  }
 
    var message = {
       id : 'presenter',
       sdpOffer : offerSdp,
     
    };
    sendMessage(message);
 }
 
 function viewer() {
   
    if(!webRtcPeer){

    
 
       var options = {
          remoteVideo: videoRef.current,
          onicecandidate : onIceCandidate
       }
 
       webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
        if(error){
          console.log(error);
          return;
        }
 
          this.generateOffer(onOfferViewer);
       });
      }
 }
 
 function onOfferViewer(error, offerSdp) {
  if(error){
    console.log(error);
    return;
  }
 
    var message = {
       id : 'viewer',
       sdpOffer : offerSdp,
     
    }
    console.log('message viwer')
    sendMessage(message);
 }

 function onIceCandidate(candidate) {
  // console.log('Local candidate:', candidate);

  const message = {
    id: 'onIceCandidate',
    candidate: candidate,
    
  };
  sendMessage(message);
}


function sendMessage(message) {
  console.log(message)
  message.roomName=document.getElementById('room').value;
  const jsonMessage = message;

  
  console.log('Sending message:', jsonMessage);
  // Replace 'io' with your actual socket instance
  socket.send(jsonMessage);
}

  return (
    <>
     <video autoPlay id='video'  controls></video>
     <video autoPlay id='recVideo' ref={videoRef} controls ></video>
     <input type="text"  id="room" />
     <button onClick={presenter}> send </button>
     <button onClick={viewer}> receive </button>
     <button onClick={stop}> STOP </button>
    </>
  )
}

export default App
