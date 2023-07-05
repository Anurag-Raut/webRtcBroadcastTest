const kurentoUtils=require('kurento-utils')
var ws = new WebSocket('ws://' + 'localhost:3000' + '/one2many');
var webRtcPeer;

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;



ws.onmessage = function(message) {
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
       showSpinner(video);
 
       var options = {
          localVideo: video,
          onicecandidate : onIceCandidate
        }
 
       webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
          if(error) return onError(error);
 
          this.generateOffer(onOfferPresenter);
       });
    }
 }
 
 function onOfferPresenter(error, offerSdp) {
    if (error) return onError(error);
 
    var message = {
       id : 'presenter',
       sdpOffer : offerSdp
    };
    sendMessage(message);
 }
 
 function viewer() {
    if (!webRtcPeer) {
       showSpinner(video);
 
       var options = {
          remoteVideo: video,
          onicecandidate : onIceCandidate
       }
 
       webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
          if(error) return onError(error);
 
          this.generateOffer(onOfferViewer);
       });
    }
 }
 
 function onOfferViewer(error, offerSdp) {
    if (error) return onError(error)
 
    var message = {
       id : 'viewer',
       sdpOffer : offerSdp
    }
    sendMessage(message);
 }
