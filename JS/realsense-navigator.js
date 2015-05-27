/**
old Copyright 2015 Intel Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


Authors:
  Joe Olivas <joseph.k.olivas@intel.com>
  Bryan Mackenzie <bryan.a.mackenzie@intel.com>
  Praful Mangalath <praful.mangalath@intel.com>

**/

"use strict";

var IntelRealSense = {};

// Functionality for detecting hand movement and firing callbacks
// as needed.
IntelRealSense.Gestures = function (options) {
  var self = this;

  var supported = false;

  var ready = true;
  var lastHandTime = 0;
  var lastHandPositionImage = {};
  var lastHandPositionWorld = {};
  var lastHandPosition = {};

  var isPinching = false;
  var pinchStart = {};
  var unPinchCount = 0;
  var pinchCount = 0;

  // moving average stuff
  var alpha = 0.25;
  var lastValues;

  var handId = -1;

  // left or right hand
  var bodySide = pxcmConst.PXCMHandData.BODY_SIDE_UNKNOWN;

  // Defaults for the hover feature
  var resolutionWidth = 640;
  var resolutionHeight = 480;

  // Storing the last few hand positions
  var handPositionsImage = [];
  var handPositions = [];
  var handPositionLimit = 10;

  // Should accept input
  var isEngaged = true;

  // Tap scrolling flag
  var isPinching = false;

  // Distance in meters for movement
  var threshold = 0.10;

  // Callbacks used on gesture detection
  this.onSwipeLeft = null;
  this.onSwipeRight = null;
  this.onSwipeUp = null;
  this.onSwipeDown = null;
  this.onTap = null;
  this.onUntap = null;
  this.onWave = null;
  this.onAlert = null;
  this.onPinch = null;
  this.onUnpinch = null;
  this.onNewHand = null;

  // Set the camera resolution
  this.setResolution = function (imageSize) {
    resolutionWidth = imageSize.width;
    resolutionHeight = imageSize.height;
  };

  // Reduce the movement to 1/2 of the real camera image size
  this.getSmoothedReducedCoordinates = function () {
    var smoothPosition = self.smoothedAveragePosition();

    // Reduce the screen space to 1/2 the actual size
    var x = smoothPosition.x - ((resolutionWidth >> 1) - smoothPosition.x);
    var y = smoothPosition.y - ((resolutionHeight >> 1) - smoothPosition.y);

    // Hand data has reversed x
    return { x: (resolutionWidth - x), y: y};
  };

  // Simple smoothed averaging
  this.smoothedAveragePosition = function () {
    var newValues = {};
    if(lastValues && !isNaN(lastValues.x))
    {
      newValues.x = lastValues.x + alpha * (lastHandPositionImage.x - lastValues.x);
      newValues.y = lastValues.y + alpha * (lastHandPositionImage.y - lastValues.y);
      newValues.z = lastValues.z + alpha * (lastHandPositionImage.z - lastValues.z);
    }
    else
    {
      newValues = lastHandPositionImage;
    }
    lastValues = newValues;
    return lastValues;
  };

  // Return the body side of the hand
  // dependent on realsense.js
  this.getHandedness = function () {
    return bodySide;
  };

  // Used by the user to tell us to start detecting gestures again
  this.actionCompleted = function () {
    ready = true;
  };

  // Check to determine whether or not the hand is actively being tracked
  // Right now, if we don't have hand data for more than 500ms, we say false
  this.isHandActive = function () {
    return ((Date.now() - lastHandTime) < 500);
  }

  // Update the last hand position. We are traking the center of the hand
  this.getlastHandPositionImage = function () {
    return lastHandPositionImage;
  }

  // Basic checking before trying to callback
  this.tryCallback = function (callback, args) {
    if (callback && typeof(callback) === "function")
    {
      //console.log("Executing " + callback.name + " with args " + args);
      callback(args);
    }
  };

  // Determine the distance between two (x,y,z) points
  var distanceBetween = function (first, second) {
    var x = Math.pow((first.x - second.x), 2);
    var y = Math.pow((first.y - second.y), 2);
    var z = Math.pow((first.z - second.z), 2);

    return Math.sqrt(x + y + z);
  };

  // Set the pinch flag, and grab the starting point
  var setPinch = function (index) {
    unPinchCount = 0;
    pinchCount += 1;
    // Pinches must have 10 consecutive frames
    // And begin within a subset of the camera boundaries
    if(isPinching == false && pinchCount == 5)
    {
      isPinching = true;
      pinchStart = index;
      self.tryCallback(self.onPinch, 0);
    }
  };

  // Unset the pinch and unset the starting point
  var unsetPinch = function () {
    unPinchCount += 1;
    pinchCount = 0;
    if(isPinching == true && unPinchCount == 5)
    {
      isPinching = false;
      pinchStart = {};
      self.tryCallback(self.onUnpinch, 0);
    }
  };

  // Check the distance between the thumb and index finger
  // if a threshold is met, call it a pinch, otherwise,
  // it is an unpinch
  var checkPinch = function (threshold) {
    if(handPositions[0] && handPositions.length == handPositionLimit)
    {
      var lastPosition = handPositions[handPositions.length -1];
      var pinky = lastPosition[pxcmConst.PXCMHandData.JOINT_PINKY_TIP].positionWorld;
      var ring = lastPosition[pxcmConst.PXCMHandData.JOINT_RING_TIP].positionWorld;
      var middle = lastPosition[pxcmConst.PXCMHandData.JOINT_MIDDLE_TIP].positionWorld;
      var index = lastPosition[pxcmConst.PXCMHandData.JOINT_INDEX_TIP].positionWorld;
      var thumb = lastPosition[pxcmConst.PXCMHandData.JOINT_THUMB_TIP].positionWorld;

      var fingers = [ index, middle, ring, pinky];

      if (distanceBetween(thumb, index) < threshold) {
        setPinch();
      } else {
        unsetPinch();
      }
    }
  };

  // Entry point to detect the basic navigation gestures
  this.detectGestures = function (data) {
    // First hand only
    var joints = data.hands[0].trackedJoint;
    // Bail out if there are no fingers
    if(!joints[0]) return;

    setLastHandPosition(joints);

	if(data.hands[0].openness <= 0.75){
		self.isEngaged = false;
	}else{
		self.isEngaged = true;
	}
	//console.log('isEngaged = ' + self.isEngaged);
	//console.log('openness = ' + data.hands[0].openness.toString()); // is the hand more closed than open...should we stop engagement?
	//console.log('distance = ' + data.hands[0].trackedJoint[pxcmConst.PXCMHandData.JOINT_CENTER].positionWorld.z.toString()); // distance from camera to stop engagement?

    checkHandActivity(Date.now());
    checkFingerTap(0.10);
    checkPinch(0.05);
  };

  // Mark us as not ready for gestures, and clear the tracking
  this.disableGestures = function () {
    ready = false;
  };

  // Callback used to get hand data from the SDK
  // Also fires callbacks on gestures if necessary
  this.onHandData = function (mid, module, data)
  {
    // This means we have a new hand, so reset state
    if(!self.isHandActive)
    {
      isPinching = false;
      pinchStart = {};
      lastValues = {};
      unPinchCount = 0;
      pinchCount = 0;
    }

    // Check to see if we have hands data before anything
    if (!data.hands) return;

    self.detectGestures(data);
	//console.log('speed = ' + data.hands[0].trackedJoint[pxcmConst.PXCMHandData.JOINT_CENTER].speed.z.toString()); // distance from camera to stop engagement?

  };

  // Store the position of the hands in both world and image space
  var setLastHandPosition = function (joints)
  {
    lastHandPosition = joints;
    setLastHandPositionImage(joints[pxcmConst.PXCMHandData.JOINT_CENTER].positionImage);
    handPositions.push(joints);
    if (handPositions.length > handPositionLimit){
      handPositions.shift();
    }
  };

  // Store the image position of the hands
  var setLastHandPositionImage = function (position)
  {
    lastHandPositionImage = position;
    handPositionsImage.push(position);
    if (handPositionsImage.length > handPositionLimit){
      handPositionsImage.shift();
    }
  };


  // Check if there has been significant movement by the fingertips
  // in the z direction. Fire tap and untap events as detected and reset
  // state if so.
  var checkFingerTap = function (threshold)
  {
    if(handPositions[0] && handPositions.length == handPositionLimit)
    {
      var pinky = pxcmConst.PXCMHandData.JOINT_PINKY_TIP;
      var ring = pxcmConst.PXCMHandData.JOINT_RING_TIP;
      var middle = pxcmConst.PXCMHandData.JOINT_MIDDLE_TIP;
      var index = pxcmConst.PXCMHandData.JOINT_INDEX_TIP;

      var fingertips = [index, middle, ring, pinky];

      // Check each finger for z movement
      for(var i = 0; i < fingertips.length; ++i) {
        var finger = fingertips[i];
        var first = handPositions[0][finger].positionWorld.z;
        var last = handPositions[handPositions.length - 1][finger].positionWorld.z;
        if (last - first < -threshold)
        {
          self.tryCallback(self.onTap);
          handPositionsImage = [];
          handPositions = [];
          break;
        }
        else if (last - first > threshold)
        {
          self.tryCallback(self.onUntap);
          handPositionsImage = [];
          handPositions = [];
          break;
        }
      }
    }
  }

  // If it has been a while since we had a hand, reset state
  // but record the current hand time
  var checkHandActivity = function (time)
  {
    if (time - lastHandTime > 500)
    {
      handPositionsImage = [];
      handPositions = [];
    }
    lastHandTime = time;
  }
};


// Basic voice functionality. The only built-in commands are to
// scroll the page up and down. Everything else is user-defined.
IntelRealSense.Voice = function (args) {

  var self = this;

  //Callback functions
  this.onOpenRecipe = null;
  this.onVideoPage = null;
  this.onOpenHelp = null;
  this.onScrollDown = null;
  this.onScrollUp = null;
  this.onPlayVideo = null;
  this.onFullScreen = null;
  this.onStopVideo = null;
  this.onGoBack = null;
  this.onStartTimer = null;
  this.onStopTimer = null;
  this.onOpenTimer = null;
  this.onCloseTimer = null;
  this.onResetTimer = null;
  this.onOpenTutorial = null;
  this.onCloseTutorial = null;
  this.onCloseHelp = null;
  this.onReload = null;

  //Alert callbacks
  this.onVolumeHigh = null;
  this.onVolumeLow = null;
  this.onNoise = null;
  this.onUnrecognizedSpeech = null;
  this.onSpeechBegin = null;
  this.onSpeechEnd = null;
  this.onRecognitionAborted = null;
  this.onRecognitionEnd = null;

  // Basic built in commands
  var voiceCommands = [
    { commands: null, callback: null},
    // Scroll Down
    {
      commands : ['scroll down', 'page down', 'go down'],
      callback : function (arg) { self.onScrollDown(arg); }
    },
    // Scroll Up
    {
      commands : ['scroll up', 'page up', 'go up'],
      callback : function (arg) { self.onScrollUp(arg); }
    }
  ];

  // Add the passed in commands to the list
  this.addCommand = function (phrases, callback) {
    voiceCommands.push({commands: phrases, callback: callback});
  };

  // Call back type check
  this.tryCallback = function (callback, args) {
    if (callback && typeof(callback) === "function")
    {
      callback(args);
    }
  }

  // Returns the selected voice commands in a format
  // required by the RealSense SDK.
  this.getVoiceCommands = function () {
    var allCommands = [];
    var allIndicies = [];
    for (var i = 1; i < voiceCommands.length; ++i) {
      allCommands = allCommands.concat(voiceCommands[i].commands);
      for (var j = 0; j < voiceCommands[i].commands.length; ++j) {
        allIndicies.push(i);
      }
    }
    return {commands : allCommands, command_idx : allIndicies};
  }

  // Callback for alerts
  this.OnAlert = function (data) {
    switch(data.data.label)
    {
      case pxcmConst.PXCMSpeechRecognition.ALERT_VOLUME_HIGH:
        self.tryCallback(self.onVolumeHigh, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_VOLUME_LOW:
        self.tryCallback(self.onVolumeLow, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_SNR_LOW:
        self.tryCallback(self.onNoise, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_SPEECH_UNRECOGNIZABLE:
        self.tryCallback(self.onUnrecognizedSpeech, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_SPEECH_BEGIN:
        self.tryCallback(self.onSpeechBegin, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_SPEECH_END:
        self.tryCallback(self.onSpeechEnd, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_RECOGNITION_ABORTED:
        self.tryCallback(self.onRecognitionAborted, 0);
        break;
      case pxcmConst.PXCMSpeechRecognition.ALERT_RECOGNITION_END:
        self.tryCallback(self.onRecognitionEnd, 0);
        break;
    }
  }

  // Return the recognized phrase on callback
  this.OnRecognition = function (data) {
    var res = data.data.scores[0];
    if (res.confidence < 47) return;
    if (res.label <= 18)
    {
      self.tryCallback(voiceCommands[res.label].callback, res.sentence);
    }
  }

};

// Wrapper for the voice and gestures along with some basic
// navigation features.
IntelRealSense.Navigator = function (settings) {
  var self = this;

  // Elements required for navigation
  var canvas = null;
  var context = null;
  var topTrigger = null;
  var bottomTrigger = null;

  // RealSense setup stuff
  var session;
  var speech_rec;
  var sense;
  var mode;
  var voice = new IntelRealSense.Voice();
  var gesture = new IntelRealSense.Gestures();
  var handModule;
  var handConfiguration;
  var capture;
  var imageSize;

  var imageWidthRatio = 1;
  var imageHeightRatio = 1;
  var scrollStart = { top: 0, bot: 0 };
  var screenCoordinates;

  var viewportHeight = 0;
  var documentHeight = 0;
  var currentScrollPosition = window.pageYOffset;;

  // Drawing helpers
  var gradient = null;
  var twoPi = 2 * Math.PI;
  var pinchStart = { x: 0, y: 0 };
  var isPinching = false;
  var firstPinchFrame = true;

  // User-defined objects and callbacks
   var navigatorEvents = [
    'realsense-hover',
    'realsense-unhover',
    'realsense-tap',
    'realsense-untap',
    'realsense-scroll-up',
    'realsense-scroll-down',
    'realsense-pinch',
    'realsense-unpinch',
    'realsense-speech-volume-high',
    'realsense-speech-volume-low',
    'realsense-speech-too-noisy',
    'realsense-speech-unrecognized',
    'realsense-speech-begin',
    'realsense-speech-end',
    'realsense-speech-recognition-aborted',
    'realsense-speech-recognition-end'
  ];

  // Base this from the events and create empty entries for each
   var userInteractions = (function () {
    var results = {};
    for(var i = 0; i < navigatorEvents.length; ++i) {
      results[navigatorEvents[i]] = [];
    }
    return results;
  })();

  // Polyfill for IE CustomEvent
  (function () {
    function CustomEvent ( event, params ) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
     }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
  })();

  // Add the navigation elements to the body
  var createNavigationElements = function () {
    // canvas
    var elem = document.createElement('canvas');
    elem.id = 'intel-realsense-canvas';
    document.body.appendChild(elem);
    canvas = document.getElementById('intel-realsense-canvas');
    context = canvas.getContext('2d');

    // hover triggers
    elem = document.createElement('div');
    elem.id = 'intel-realsense-top-trigger';
    elem.classList.add('intel-realsense');
    document.body.appendChild(elem);
    topTrigger = document.getElementById('intel-realsense-top-trigger');

    elem = document.createElement('div');
    elem.id = 'intel-realsense-bot-trigger';
    elem.classList.add('intel-realsense');
    document.body.appendChild(elem);
    bottomTrigger = document.getElementById('intel-realsense-bot-trigger');

    gradient = context.createRadialGradient(0, 0, 25, 0, 0, 50);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
  };

  // Update the viewport so we can scroll and appropriate distance
  var updateViewportHeight = function (param) {
    viewportHeight = window.innerHeight;
  };

  // Update the document height for scrolling
  var updateDocumentHeight = function (param) {
    var body = document.body;
    var html = document.documentElement;

    documentHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
  };

  // Setup event handlers
  var setupEventHandlers = function () {
    // Make all realsense enabled videos respond to tap
    var elements = document.getElementsByClassName('intel-realsense');
    for (var i = 0; i < elements.length; i++) {
      // Add tap to start any video
      if(elements[i].tagName.toLowerCase() === 'video') {
        elements[i].addEventListener('realsense-tap', function (){
          if (this.paused){
            this.play();
          }else{
            this.pause();
          }
        });
      }
    }

    // Add the triggers for scrolling up...
    topTrigger.addEventListener("realsense-hover", function () {
      if (scrollStart.top == 0) {
        scrollStart.top = screenCoordinates.y;
      }
      var modifier = (scrollStart.top - screenCoordinates.y)/10;
      if (modifier > 0) {
        context.save();

        var grd = context.createLinearGradient(0, 0, 0, modifier*4);
        grd.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        grd.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
        context.fillStyle = grd;
        context.fillRect(0, 0, canvas.width, modifier*7);
        context.restore();

        window.scrollBy(0, -modifier*1.5);
      }
    });

    // ..and down.
    bottomTrigger.addEventListener("realsense-hover", function () {
      if (scrollStart.bot == 0) {
        scrollStart.bot = screenCoordinates.y;
      }
      var modifier = (screenCoordinates.y - scrollStart.bot) / 10;
      if (modifier > 0) {
        context.save();

        var grd = context.createLinearGradient(0, canvas.height, 0, canvas.height  + -modifier*4);
        grd.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        grd.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
        context.fillStyle = grd;
        context.fillRect(0, canvas.height, canvas.width, -modifier*7);
        context.restore();
        window.scrollBy(0, modifier*1.5);
      }
    });

    // Triggers on unhover
    bottomTrigger.addEventListener("realsense-unhover", function () {
        scrollStart.bot = 0;
    });

    topTrigger.addEventListener("realsense-unhover", function () {
        scrollStart.top = 0;
    });

    // Update the green dot to notify of a pinch
    canvas.addEventListener('realsense-pinch', function () {
      updateHandVisual(50, 'rgba(255, 255, 0, 0.4)', 'rgba(255, 255, 0, 0.0)');
      console.log('pinching');
	  // Start scrolling, need to latch hand position to screen
      isPinching = true;
      firstPinchFrame = true;
    });

    // Return the green color when unpinching
    canvas.addEventListener('realsense-unpinch', function () {
      updateHandVisual(50, 'rgba(255, 0, 0, 0.4)', 'rgba(255, 0, 0, 0.0)');
      isPinching = false;
      console.log('un-pinching');
	  // Release scrolling and dampen
    });

    var updateHandVisual = function (scale, colorStopOne, colorStopTwo) {
      gradient = context.createRadialGradient(0, 0, 25, 0, 0, 50);
      gradient.addColorStop(0, colorStopOne);
      gradient.addColorStop(1, colorStopTwo);
    }

    // Handle resizing
    window.addEventListener("resize", function (event) {
      updateViewportHeight();
      updateDocumentHeight();
      resizeCanvas();
      resetCanvasRatio();
      scrollStart.bot = 0;
      scrollStart.top = 0;
    }, false);

    // Update when scrolling
    window.addEventListener("scroll", function (event) {
      currentScrollPosition = window.pageYOffset;
    }, false);

    // Activate the scrolling on voice
    window.addEventListener('realsense-scroll-up', function (event){
      this.scrollBy(0, -(viewportHeight));
    });

    // Activate the scrolling on voice
    window.addEventListener('realsense-scroll-down', function (event){
      this.scrollBy(0, viewportHeight);
    });

    // Go through user-defined handlers and set those up
    for(var i = 0; i < navigatorEvents.length; ++i) {
      var event = navigatorEvents[i];
      var ui = userInteractions[event];
      for(var j = 0; j < ui.length; ++j) {
        var elem = ui[j].element;
        var callback = ui[j].callback;
        elem.addEventListener(event, callback);
      }

    }
  };

  //Catch page close, refresh case in order to end the session appropriately
  $(window).bind("onbeforeunload", function (e) {
  if (sense != undefined) {
	sense.Close();
	setTimeout(function () { }, 2000);
	sense = undefined;
  }
  if (speech_rec != undefined) {
	speech_rec.StopRec().then(function (result) {
		speech_rec.Release();
		speech_rec = undefined;
	});
  }
// return "Are you sure to leave this page?"; // no return --> no Navigation Confirmation dialog
})


  var resizeCanvas = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  var resetCanvasRatio = function () {
    imageWidthRatio = canvas.width / imageSize.width;
    imageHeightRatio = canvas.height / imageSize.height;
  };

  var clearCanvas = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }


  // Takes the hand coordinates and scales them to screen space
  var getScreenCoordinates = function (position) {
    return { x: (position.x * imageWidthRatio), y: (position.y * imageHeightRatio) };
  }

  var drawPosition = function (position) {
    screenCoordinates = getScreenCoordinates(position);
    if (isPinching) {
      if(firstPinchFrame) {
        pinchStart.y = currentScrollPosition + screenCoordinates.y;
        firstPinchFrame = false;
      }
      var movement = (screenCoordinates.y - pinchStart.y);
      window.scrollTo(0, -movement);
    }
    clearCanvas();
    context.save();
    context.translate(screenCoordinates.x, screenCoordinates.y);
    context.beginPath();
    context.arc(0, 0, 50, 0, twoPi, false);
    context.closePath;
    context.fillStyle = gradient;
    context.fill();
    context.restore();
  }

  // Draw the position of the hand and kick off any
  // checking for collisions
  var draw = function () {
    if(gesture.isHandActive()) {
      // Draw at 25 FPS
      setTimeout(function () {requestAnimationFrame(draw);}, 40);
      drawPosition(gesture.getSmoothedReducedCoordinates());
      checkHover();
    } else {
      // if we have no hand, check again every 250ms
      setTimeout(draw, 250);
      clearCanvas();
    }
  }
  /*
  // Try to fire the hover event if there a collision detected
  var tryFireHover = function (element) {
    //check if hand position is contain inside the dom object rect
    var rect = element.getBoundingClientRect();

    if (pointRectangleIntersection(screenCoordinates, rect)) {
      element.classList.add('intel-realsense-active');
      var event = createEvent('realsense-hover');
      element.dispatchEvent(event);
    } else {
      // Fire the unhover event if needed
      if (element.classList.contains('intel-realsense-active')) {
        var event = createEvent('realsense-unhover');
        element.dispatchEvent(event);
        element.classList.remove('intel-realsense-active');
      }
    }
  };
  */

  // Try to fire the hover event if there a collision detected
  var tryFireHover = function (element) {
    //check if hand position is contain inside the dom object rect
    var rect = element.getBoundingClientRect();

    if (pointRectangleIntersection(screenCoordinates, rect)) {
      element.classList.add('intel-realsense-hovering');
      // Only add the growing effects if the element
      // is declared to do so.
      if(element.classList.contains('intel-realsense')) {
        element.classList.add('intel-realsense-active');
      }
      var event = createEvent('realsense-hover', screenCoordinates);
      element.dispatchEvent(event);
    } else {
      // Fire the unhover event if needed
      if (element.classList.contains('intel-realsense-hovering')) {
        var event = createEvent('realsense-unhover');
        element.dispatchEvent(event);
        element.classList.remove('intel-realsense-active');
        element.classList.remove('intel-realsense-hovering');
      }
    }
  };

  // Check for collision between DOM objects
  // unless we are pinching, in which case,
  // ignore hover events.
  var checkHover = function () {
    if(!isPinching) {
      var elements = getElementsArray('intel-realsense');
      elements = elements.concat(userInteractions['realsense-hover'].map(function (obj) { return obj.element }));
      elements = elements.concat(userInteractions['realsense-unhover'].map(function (obj) { return obj.element }));
      for (var i = 0; i < elements.length; i++) {
        tryFireHover(elements[i]);
      }
    }
  };

  // Lets' create events the old way
  var createEvent = function(name, args) {
    var evt = null;
    if('CustomEvent' in window) {
      evt = new CustomEvent(name, { 'detail' : args});
    } else {
      // Create the event.
      evt = document.createEvent('Event');
      // Initialize event
      evt.initCustomEvent(name, true, true, args);
    }
    return evt;
  };

  // Given a class name, returns a real array with the elements
  var getElementsArray = function (name){
    return Array.prototype.slice.call(document.getElementsByClassName(name));
  }

  // Check for overlapping rectangles for collision detection
  var pointRectangleIntersection = function (p, r) {
    return p.x > r.left && p.x < (r.left + r.width) && p.y > r.top && p.y < (r.top + r.height);
  }

  // Return a function
  var fireEvent = function (eventName) {
    return function () {
      var elements = getElementsArray('intel-realsense-active');
      for (var i = 0; i < elements.length; i++) {
        var event = createEvent(eventName);
        elements[i].dispatchEvent(event);
      }

      // Some may want tap without hover, so perhaps check collision
      // TODO: lots of repeated code. Refactor.
      var elements = userInteractions[eventName].map(function (obj) { return obj.element });
      for (var i = 0; i < elements.length; i++) {
        var rect = elements[i].getBoundingClientRect();
        if (pointRectangleIntersection(screenCoordinates, rect)) {
          var event = createEvent(eventName);
          elements[i].dispatchEvent(event);
        }
      }

      // Always send to the canvas, too
      var event = createEvent(eventName);
      canvas.dispatchEvent(event);

    }
  }

  // Fire an event to the window
  var fireWindowEvent = function (eventName) {
    return function () {
      var event = createEvent(eventName);
      window.dispatchEvent(event);
    };
  };

  //
  var fireSpeechEvent = function (eventName) {
    // Some may want tap without hover, so perhaps check collision
    // TODO: lots of repeated code. Refactor.
    var elements = userInteractions[eventName].map(function (obj) { return obj.element });
    for (var i = 0; i < elements.length; i++) {
        var event = createEvent(eventName);
        elements[i].dispatchEvent(event);
    }
  };

  // Callback events to fire on gestures
  gesture.onTap = fireEvent('realsense-tap');
  gesture.onUntap = fireEvent('realsense-untap');
  gesture.onPinch = fireEvent('realsense-pinch');
  gesture.onUnpinch = fireEvent('realsense-unpinch');
	
  voice.onScrollUp = fireWindowEvent('realsense-scroll-up');
  voice.onScrollDown = fireWindowEvent('realsense-scroll-down');
  voice.onVolumeHigh = fireSpeechEvent.bind(null, 'realsense-speech-volume-high');
  voice.onVolumeLow = fireSpeechEvent.bind(null, 'realsense-speech-volume-low');
  voice.onNoise = fireSpeechEvent.bind(null, 'realsense-speech-too-noisy');
  voice.onUnrecognizedSpeech = fireSpeechEvent.bind(null, 'realsense-speech-unrecognized');
  voice.onSpeechBegin = fireSpeechEvent.bind(null, 'realsense-speech-begin');
  voice.onSpeechEnd = fireSpeechEvent.bind(null, 'realsense-speech-end');
  voice.onRecognitionAborted = fireSpeechEvent.bind(null, 'realsense-speech-recognition-aborted');
  voice.onRecognitionEnd = fireSpeechEvent.bind(null, 'realsense-speech-recognition-end');




  // Entry point for setup
  self.init = function () {
    createNavigationElements();
    setupEventHandlers();
    resizeCanvas();
    updateDocumentHeight();
    updateViewportHeight();

    PXCMSession_CreateInstance().then(function (result) {
      session = result;
      console.log('Initializing');
      return session.CreateImpl(undefined, undefined, pxcmConst.PXCMSpeechRecognition.CUID);
    }).then(function (result) {
      console.log('Generating commands');
      speech_rec = result;
      mode = Number(1);
      var voice_commands = voice.getVoiceCommands();
      return speech_rec.BuildGrammarFromStringList(mode, voice_commands.commands, voice_commands.command_idx, null);
    }).then(function (result) {
      return speech_rec.SetGrammar(mode);
    }).then(function (result) {
      console.log('Grammar created');
      return speech_rec.StartRec(voice.OnRecognition, voice.OnAlert);
    }).then(function (result) {
      console.log('Started Speech');
    }).then(function (result) {
      return session.CreateImpl(undefined, undefined, pxcmConst.PXCMSenseManager.CUID);
    }).then(function (result) {
      console.log('Enabling Hands');
      sense = result;
      return sense.EnableHand(gesture.onHandData);
    }).then(function (result) {
      console.log('Init started');
      handModule = result;
      return sense.Init(function () {}, function () {});
    }).then(function (result) {
      console.log('hand config');
      return handModule.CreateActiveConfiguration();
    }).then(function (result) {
      handConfiguration = result;
      console.log('disabling alerts');
      return handConfiguration.DisableAllAlerts();
    }).then(function (result) {
      console.log('disabling gestures');
      return handConfiguration.DisableAllGestures();
    }).then(function (result) {
      console.log('applying changes');
      return handConfiguration.ApplyChanges();
    }).then(function (result) {
      console.log('query capture manager');
      return sense.QueryCaptureManager();
    }).then(function (result) {
      console.log('query image size');
      capture = result;
      return capture.QueryImageSize(pxcmConst.PXCMCapture.STREAM_TYPE_DEPTH);
    }).then(function (result) {
      console.log('stream frames');
      imageSize = result.size;
      var ret = sense.StreamFrames();
      return ret;
    }).then(function (result) {
      console.log('Streaming ' + imageSize.width + 'x' + imageSize.height);
      gesture.setResolution(imageSize);
      resetCanvasRatio();
    }).catch(function (error) {
      console.log('RealSense setup failed: ' + JSON.stringify(error));
    });
  };

  self.startNavigation = function () {
    draw();
  }

  // Add a user defined element and its callback to the list
  // for the given event
  self.addNavigationElement = function (event, element, callback){
    userInteractions[event].push({element: element, callback: callback});
  };

  // Add a user-defined list of commands to be accepted
  // along with its callback
  self.addSpeechElement = function (phrases, callback){
    voice.addCommand(phrases, callback);
  };

};
