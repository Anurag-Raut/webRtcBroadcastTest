import { useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from "socket.io-client";


function App() {
  const socket = io();
  const videoRef = useRef(null);
  const videoRecRef = useRef(null);
  var webRtcPeer;
  var webRtcPeerRec;
  
  window.onload = function() {
    console.log('gello')
    videoRef.current = document.getElementById('video');
    videoRecRef.current = document.getElementById('recVideo');
  
    // document.getElementById('call').addEventListener('click', function() { presenter(); } );
    // document.getElementById('viewer').addEventListener('click', function() { viewer(); } );
    // document.getElementById('terminate').addEventListener('click', function() { stop(); } );
  }
  
  window.onbeforeunload = function() {
    dispose();
    socket.close();
  }
  
  socket.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);
  
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
    if (message.response != 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
      dispose();
    } else {
      webRtcPeer.processAnswer(message.sdpAnswer);
    }
  }
  function presenter() {
    if (!webRtcPeer) {
       
 
       var options = {
          localVideo: videoRef.current,
          onicecandidate : onIceCandidate
        }
 
       webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
        if(error){
          console.log(error);
          return;
        }
 
          this.generateOffer(onOfferPresenter);
       });
    }
 }
 
 function onOfferPresenter(error, offerSdp) {
  if(error){
    console.log(error);
    return;
  }
 
    var message = {
       id : 'presenter',
       sdpOffer : offerSdp
    };
    sendMessage(message);
 }
 
 function viewer() {
   
    if(!webRtcPeerRec){

    
 
       var options = {
          remoteVideo: videoRecRef.current,
          onicecandidate : onIceCandidate
       }
 
       webRtcPeerRec = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
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
       sdpOffer : offerSdp
    }
    sendMessage(message);
 }

 function onIceCandidate(candidate) {
  console.log('Local candidate:', candidate);

  const message = {
    id: 'onIceCandidate',
    candidate: candidate,
  };
  sendMessage(message);
}


function sendMessage(message) {
  const jsonMessage = JSON.stringify(message);
  console.log('Sending message:', jsonMessage);
  // Replace 'io' with your actual socket instance
  socket.send(jsonMessage);
}

  return (
    <>
     <video autoPlay id='video' ref={videoRef} controls></video>
     <video  id='recVideo' ref={videoRecRef} controls ></video>
     <button onClick={presenter}> send </button>
     <button onClick={viewer}> receive </button>
     <button onClick={stop}> STOP </button>
    </>
  )
}

export default App
