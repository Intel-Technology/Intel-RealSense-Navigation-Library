/*******************************************************************************

INTEL CORPORATION PROPRIETARY INFORMATION
This software is supplied under the terms of a license agreement or nondisclosure
agreement with Intel Corporation and may not be copied or disclosed except in
accordance with the terms of that agreement
@licence Copyright(c) 2014-2015 Intel Corporation. All Rights Reserved.

*******************************************************************************/
var intel = intel || {};

/**
 Utility object used to add namespaces to the define namespaces under the window context.
 @method intel._namespace
 @param {string} ns - The name of the namespace to add.
 @returns Returns the namespace object.
 */
intel._namespace = function (ns) {
    var nList = ns.split('.'), parent = window, index = 0;
    for (index in nList) {
        if (nList.hasOwnProperty(index)) {
            parent[nList[index]] = parent[nList[index]] || {};
            parent = parent[nList[index]];
        }
    }
    return window[nList[0]];
};

// SDK namespaces
intel._namespace("intel.realsense");
intel._namespace("intel.realsense.face");
intel._namespace("intel.realsense.hand");
intel._namespace("intel.realsense.blob");
intel._namespace("intel.realsense.speech");

/**
    For web service versioning control
    1. Application may run with a previous version web service
    2. JavaScript interface, this file, selects a minimal major version of web service
    3. JavaScript interface determines the active version of web service based on availability
           activeVersion.major: default = releaseVersion.major but can be a lower major version
           activeVersion.majorMin: Minimal major version of web service, which this JS interface supports
*/
intel.realsense.releaseVersion = { major: 6, minor: 0 };
intel.realsense.activeVersion = { major: 6, majorMin: 5 };

/**
 * This table maps the relationship between the speech component versions and the
 * language pack versions. Becuase language packs typicaly do not change between releases
 * this extra information is necessary for platform detection.
 *
 * Usage: intel.realsense.languagePackFor.speechVersion[6]
 */
intel.realsense.languagePackFor = {
    speechVersion: {
        6: 5
    }
};

/**
    Status codes that SDK interfaces return:
    negative values for errors; 0 for success; or positive values for warnings.
*/
intel.realsense.Status = {
    STATUS_NO_ERROR: 0,
    STATUS_FEATURE_UNSUPPORTED: -1,     /* Unsupported feature */
    STATUS_PARAM_UNSUPPORTED: -2,       /* Unsupported parameter(s) */
    STATUS_ITEM_UNAVAILABLE: -3,        /* Item not found/not available */
    STATUS_HANDLE_INVALID: -101,        /* Invalid session, algorithm instance, or pointer */
    STATUS_ALLOC_FAILED: -102,          /* Memory allocation failure */
    STATUS_DEVICE_FAILED: -201,         /* Acceleration device failed/lost */
    STATUS_DEVICE_LOST: -202,           /* Acceleration device lost */
    STATUS_DEVICE_BUSY: -203,           /* Acceleration device busy */
    STATUS_EXEC_ABORTED: -301,          /* Execution aborted due to errors in upstream components */
    STATUS_EXEC_INPROGRESS: -302,       /* Asynchronous operation is in execution */
    STATUS_EXEC_TIMEOUT: -303,          /* Operation time out */
    STATUS_FILE_WRITE_FAILED: -401,     /** Failure in open file in WRITE mode */
    STATUS_FILE_READ_FAILED: -402,      /** Failure in open file in READ mode */
    STATUS_FILE_CLOSE_FAILED: -403,     /** Failure in close a file handle */
    STATUS_DATA_UNAVAILABLE: -501,      /** Data not available for MW model or processing */
    STATUS_DATA_NOT_INITIALIZED: -502,	/** Data failed to initialize */
    STATUS_INIT_FAILED: -503,           /** Module failure during initialization */
    STATUS_STREAM_CONFIG_CHANGED: -601, /** Configuration for the stream has changed */
    STATUS_POWER_UID_ALREADY_REGISTERED: -701,
    STATUS_POWER_UID_NOT_REGISTERED: -702,
    STATUS_POWER_ILLEGAL_STATE: -703,
    STATUS_POWER_PROVIDER_NOT_EXISTS: -704,
    STATUS_CAPTURE_CONFIG_ALREADY_SET: -801,    /** parameter cannot be changed since configuration for capturing has been already set */
    STATUS_COORDINATE_SYSTEM_CONFLICT: -802,	/** Mismatched coordinate system between modules */
    STATUS_WEB_DISCONNECTED: -901,               /** lost connection to web service, JS app needs restart */
    STATUS_TIME_GAP: 101,                       /* time gap in time stamps */
    STATUS_PARAM_INPLACE: 102,                  /* the same parameters already defined */
    STATUS_DATA_NOT_CHANGED: 103,	            /* Data not changed (no new data available)*/
    STATUS_PROCESS_FAILED: 104                  /* Module failure during processing */
};

intel.realsense.Session = function (instance) {
    this.instance = instance;
    var self = this;
    var version = undefined;

    /** @brief Query the SDK version */
    intel.realsense.connection.call(instance, 'PXCMSession_QueryVersion').then(function (result) {
        self.version = result.version;
    });
};

/** 
    @brief Search a module implementation.
    @param[in]    templat         the template for the module search with optional fields
    @param[in]    1. group              of type intel.realsense.ImplGroup
    @param[in]    2: subgroup           of type intel.realsense.ImplSubgroup
    @param[in]    3: algorithm          integer
    @param[in]    4: merit              integer
    @param[in]    5: friendlyName       string
    @param[in] For instance, {'group':intel.realsense.ImplGroup.IMPL_GROUP_OBJECT_RECOGNITION, 
    @param[in]                'subgroup':intel.realsense.ImplSubgroup.IMPL_SUBGROUP_GESTURE_RECOGNITION}
    @param[out]   return an array list of module descriptors, accessable as result.impls
    @return Promise object with module descriptors
*/
intel.realsense.Session.prototype.queryImpls = function (templat) {
    return intel.realsense.connection.call(this.instance, 'PXCMSession_QueryImpls', templat);
};

/** 
    @brief Create an instance of the specified module.
    @param[in]    cuid              Interface identifier.
    @param[out]   instance          The created instance, to be returned.
    @return a Promise object
*/
intel.realsense.Session.prototype._createImpl = function (cuid) {
    var self = this;
    self.cuid = cuid;
    return intel.realsense.connection.call(this.instance, 'PXCMSession_CreateImpl', { 'cuid': cuid }, 5000).then(function (result) {
        var object = null;
        if (self.cuid == intel.realsense.speech.SpeechRecognition._CUID) object = new intel.realsense.speech.SpeechRecognition(result.instance.value);
        return object;
    });
};

/** 
    @brief Return the module descriptor
    @param[in]  module          The module instance
    @return Promise object with module descriptor
*/
intel.realsense.Session.prototype.queryModuleDesc = function (module) {
    return intel.realsense.connection.call(this.instance, 'PXCMSession_QueryModuleDesc', { 'module': module.instance });
};
 
intel.realsense.ImplGroup = {  
    IMPL_GROUP_ANY: 0,                          /* Undefine group */
    IMPL_GROUP_OBJECT_RECOGNITION: 0x00000001,  /* Object recognition algorithms */
    IMPL_GROUP_SPEECH_RECOGNITION: 0x00000002,  /* Speech recognition algorithms */
    IMPL_GROUP_SENSOR: 0x00000004,              /* I/O modules */
};

intel.realsense.ImplSubgroup = {
    IMPL_SUBGROUP_ANY: 0,                           /* Undefined subgroup */
    IMPL_SUBGROUP_FACE_ANALYSIS: 0x00000001,        /* face analysis subgroup */
    IMPL_SUBGROUP_GESTURE_RECOGNITION: 0x00000010,  /* gesture recognition subgroup */
    IMPL_SUBGROUP_AUDIO_CAPTURE: 0x00000001,        /* audio capture subgroup */
    IMPL_SUBGROUP_VIDEO_CAPTURE: 0x00000002,        /* video capture subgroup */
    IMPL_SUBGROUP_SPEECH_RECOGNITION: 0x00000001,   /* speech recognition subgroup */
};

/**
    This is the main object for the Intel® RealSense™ SDK pipeline.
    Control the pipeline execution with this interface.
*/
intel.realsense.SenseManager = function (instance, session, captureManager) {
    this.instance = instance;
    var self = this;
     
    /** public members which are available only
    *   after the return of SenseManager.createInstance() call. 
    */
    this.session = session;  
    this.captureManager = captureManager;
    
    /** private members */
    this._sessionStopped = true;   
   // this._hbIntervalID = undefined;
    this._modules = {};
    this._speechModule = null; 

    /** onDeviceConnected callback
        sender: device object 
        which callback is trigger, device information can be accessed with device.deviceInfo 
    */
    this.onDeviceConnected = function (sender, connected) { };

    /** sender: module */
    this.onStatusChanged = function (sender, status) { };
   
    /** Initialize the SenseManager pipeline for streaming with callbacks. 
        The application must enable algorithm modules before calling this function.
        @return a Promise object
    */
    this.init = function () {
        intel.realsense.connection.subscribe_callback("PXCMSenseManager_OnConnect", this, this._onDeviceConnected);
        intel.realsense.connection.subscribe_callback("PXCMSenseManager_OnStatus", this, this._onStatusChanged);
       
        var initPromise = intel.realsense.connection.call(self.instance, 'PXCMSenseManager_Init', { 'handler': true, 'onModuleProcessedFrame': true, 'onConnect': true, 'onStatus': true }, 5000).then(function () {
            return intel.realsense.connection.call(self.captureManager.instance, 'PXCMCaptureManager_QueryDevice').then(function (deviceResult) {    
                return intel.realsense.connection.call(deviceResult.instance.value, 'PXCMCapture_Device_QueryDeviceInfo').then(function (result) {
                    self.captureManager.device = new intel.realsense.Capture.Device(deviceResult.instance.value, result.dinfo);
                    return intel.realsense.connection.call(self.captureManager.instance, 'PXCMCaptureManager_QueryAggregatedImageSizes').then(function (result) {
                        self.captureManager._imageSizes = result.imageSizes;
                        return intel.realsense.connection.call(self.captureManager.instance, 'PXCMCaptureManager_QueryCapture').then(function (result) {
                            self.captureManager.capture = new intel.realsense.Capture(result.instance.value);
                        });
                    });
                });
            });
        }); 
        return initPromise;
    };

    /** Start streaming with reporting per-frame recognition results to callbacks specified in Enable* functions.
        The application must initialize the pipeline before calling this function.
        @return a Promise object
    */
    this.streamFrames = function () {
        self._sessionStopped = false;
        return intel.realsense.connection.call(instance, 'PXCMSenseManager_StreamFrames', { blocking: false });
    };

    /** Release the execution pipeline.
        @return a Promise object
    */
    this.release = function () {
        self._sessionStopped = true;
        var releasePromise = intel.realsense.connection.call(instance, 'PXCMBase_Release', {}, 10000).then(function (result) {
            if (intel.realsense.connection !== 'undefined') {
                intel.realsense.connection.close();
                intel.realsense.connection = null;
            }
        });
        return releasePromise;
    };

    this._onDeviceConnected = function (data) {
        var device = null;
        var connected = false;
        if (data.device != undefined && data.device.value != undefined) {
            device = new intel.realsense.Capture.Device(data.device.value, data.dinfo);
            connected = data.connected;
        }
        self.onDeviceConnected(device, connected);
    };

    this._onStatusChanged = function (data) {
        var module;
        if (data.mid == 0)
            module = this;
        else
            module = self._modules[data.mid];
        self.onStatusChanged(module, data.sts);
    };

    this.onClose = function () {
        if (self._sessionStopped == false) {
            self.onStatusChanged(this, intel.realsense.Status.STATUS_WEB_DISCONNECTED);

            if (self._speechModule != null && self._speechModule.onAlert != null) {
                var result = {};
                result.data = {};
                result.data.label = intel.realsense.speech.AlertType.ALERT_WEB_DISCONNECTED;
                result.data.name = "ALERT_WEB_DISCONNECTED";
                self._speechModule.onAlert(self._speechModule, result);
            }
        }
        self._sessionStopped = true;
        intel.realsense.connection = null;
    }

    this._enableModule = function (mid) {
        var res;
        return intel.realsense.connection.call(instance, 'PXCMSenseManager_EnableModule', { mid: mid}).then(function (result) {
            return intel.realsense.connection.call(instance, 'PXCMSenseManager_QueryModule', { mid: mid });
        }).then(function (result2) {
            var module = null;
            if (mid == intel.realsense.face.FaceModule._CUID)
                module = new intel.realsense.face.FaceModule(result2.instance.value, self);
            else if (mid == intel.realsense.hand.HandModule._CUID)
                module = new intel.realsense.hand.HandModule(result2.instance.value, self);
            else if (mid == intel.realsense.blob.BlobModule._CUID)
                module = new intel.realsense.blob.BlobModule(result2.instance.value, self);
            else
                module = null;

            self._modules[mid] = module;
            return module;
        });
    };

    this._pauseModule = function (mid, pause) {
        return intel.realsense.connection.call(instance, 'PXCMSenseManager_PauseModule', { 'mid': mid, 'pause': pause });
    };

    this._onModuleProcessedFrame = function (response, self) {
        var module = self._modules[response.mid];
        if (module != undefined && module.onFrameProcessed != undefined) {
            var data = null;
            switch (response.mid) {
                case intel.realsense.face.FaceModule._CUID:
                    data = new intel.realsense.face.FaceData(response);
                    break;
                case intel.realsense.hand.HandModule._CUID:
                    data = new intel.realsense.hand.HandData(response);
                    break;
                case intel.realsense.blob.BlobModule._CUID:
                    data = new intel.realsense.blob.BlobData(response);
                    break;
            }
            module.onFrameProcessed(module, data);
        }
        return;
    };

    this.close = function () {
        return RealSense.connection.call(instance, 'PXCMSenseManager_Close', {}, 5000);
    };

    intel.realsense.connection.subscribe_callback("PXCMSenseManager_OnModuleProcessedFrame", this, this._onModuleProcessedFrame);
};

intel.realsense.SenseManager.createInstance = function () {
    if (intel.realsense.connection == null) intel.realsense.connection = new RealSenseConnection(intel.realsense.activeVersion.major);
    var jsVersion = intel.realsense.releaseVersion.major + '.' + intel.realsense.releaseVersion.minor;
    return intel.realsense.connection.call(0, 'PXCMSenseManager_CreateInstance', { 'js_version': jsVersion }).then(function (result) {
        var captureMgr = new intel.realsense.CaptureManager(result.captureManager_instance.value);
        var sess = new intel.realsense.Session(result.session_instance.value);
        var sense = new intel.realsense.SenseManager(result.instance.value, sess, captureMgr);
        intel.realsense.connection.onclose = sense.onClose;
        return sense;
    });
};



intel.realsense.CaptureManager = function (instance) {
    var self = this;
    this.instance = instance;
    this.device = undefined;
       
    /**
        @brief  _imageSizes stores stream resolutions of the specified stream type.
        @brief  _imageSizes is available only after return of SenseManager.init() call.
    */
    this._imageSizes = null;

    /**
        @brief   Return the stream resolution of the specified stream type.
        @param[in] type    The stream type
        @return a Promise object with property 'size' : { 'width' : Number, 'height' : Number }
    */
    this.queryImageSize = function (type) {
        if (self._imageSizes==null) return null;
        switch (type) {
            case intel.realsense.StreamType.STREAM_TYPE_COLOR:
                return self._imageSizes[0];
            case intel.realsense.StreamType.STREAM_TYPE_DEPTH:
                return self._imageSizes[1];
            case intel.realsense.StreamType.STREAM_TYPE_IR:
                return self._imageSizes[2];
            case intel.realsense.StreamType.STREAM_TYPE_LEFT:
                return self._imageSizes[3];
            case intel.realsense.StreamType.STREAM_TYPE_RIGHT:
                return self._imageSizes[4];
        }
        return null;
    };
};

intel.realsense.Capture = function (instance) {
    this.instance = instance;
    var self = this;
};

intel.realsense.Capture.Device = function (instance, deviceInfo) {
    this.instance = instance;
    var self = this;

    /**
        @brief  deviceInfo contains such device related information as device model.
        @brief  It is available either after return of SenseManager.init() call, or
        @brief  When onDeviceConnected callback is triggered
    */
    this.deviceInfo = deviceInfo;
};

intel.realsense.Capture.Device.prototype.ResetProperties = function (streamType) {
    return intel.realsense.connection.call(this.instance, 'PXCMCapture_Device_ResetProperties', { 'streams': streamType });
};

intel.realsense.Capture.Device.prototype.restorePropertiesUponFocus = function (streamType) {
    return intel.realsense.connection.call(this.instance, 'PXCMCapture_Device_RestorePropertiesUponFocus');
};

intel.realsense.StreamType = {
    STREAM_TYPE_ANY: 0,            /* Unknown/undefined type */
    STREAM_TYPE_COLOR: 0x0001,     /* the color stream type  */
    STREAM_TYPE_DEPTH: 0x0002,     /* the depth stream type  */
    STREAM_TYPE_IR: 0x0004,        /* the infrared stream type */
    STREAM_TYPE_LEFT: 0x0008,      /* the stereoscopic left intensity image */
    STREAM_TYPE_RIGHT: 0x0010      /* the stereoscopic right intensity image */
};

intel.realsense.DeviceModel = {
    DEVICE_MODEL_GENERIC: 0x00000000, /* a generic device or unknown device */
    DEVICE_MODEL_F200: 0x0020000E,    /* the Intel(R) RealSense(TM) 3D Camera, model F200 */
    DEVICE_MODEL_R200: 0x0020000F     /* the Intel(R) RealSense(TM) DS4 Camera, model R200 */
};

intel.realsense.DeviceOrientation = {
    DEVICE_ORIENTATION_ANY: 0x0,            /* Unknown orientation */
    DEVICE_ORIENTATION_USER_FACING: 0x1,    /* A user facing camera */
    DEVICE_ORIENTATION_WORLD_FACING: 0x2    /* A world facing camera */
};  
 
intel.realsense.Rotation = {
    ROTATION_ANY: 0x0,          /* No rotation */
    ROTATION_90_DEGREE: 90,     /* 90 degree clockwise rotation */
    ROTATION_180_DEGREE: 180,   /* 180 degree clockwise rotation */
    ROTATION_270_DEGREE: 270    /* 270 degree clockwise rotation */
}; 

intel.realsense.face.FaceModule = function (instance, sense) {
    this.instance = instance;
    var self = this;
    this.sm = sense;

    /** 
        Create a new instance of the face-module's active configuration.
        @return Configuration instance as a promise object
    */
    this.createActiveConfiguration = function () {
        var config_instance;
        return intel.realsense.connection.call(instance, 'PXCMFaceModule_CreateActiveConfiguration').then(function (result) {
            config_instance = result.instance.value;
            return intel.realsense.connection.call(result.instance.value, 'PXCMFaceConfiguration_GetConfigurations');
        }).then(function (result) {
            return new intel.realsense.face.FaceConfiguration(config_instance, result.configs);
        });
    };
};
intel.realsense.face.FaceModule._CUID = 1144209734;

intel.realsense.face.FaceModule.prototype.pause = function (pause) {
    return this.sm._pauseModule(intel.realsense.face.FaceModule._CUID, pause);
};

/** default face data callback which can be overwritten by JS application */
intel.realsense.face.FaceModule.prototype.onFrameProcessed = function (module, data) {
};

intel.realsense.face.FaceModule.activate = function (sense) {
    return sense._enableModule(intel.realsense.face.FaceModule._CUID);
};

intel.realsense.face.FaceConfiguration = function (instance, configs) {
    this.instance = instance;
    var self = this;

    /* private member */
    this._configs = configs;

    /* public members */
    this.detection = configs.detection;     /* Detection configuration */
    this.landmarks = configs.landmarks;     /* Landmark configuration  */
    this.pose = configs.pose;               /* Pose configuration */
    this.expressions = configs.expressions;
    this.trackingMode = intel.realsense.face.TrackingModeType.FACE_MODE_COLOR_PLUS_DEPTH;
    /**
        Expressions configuration within expressions.properties
        Two fields: 
                    isEnabled       (boolean)   
                    maxTrackedFaces (integer) 
    */

    /* Not necessary: based on 'isEnable' value - do at backend
    // @brief Enables all available face expressions. 
    this.expressions.enableAllExpressions = function () {
        if (self._configs.expressionInstance != null)
        return intel.realsense.connection.call(self._configs.expressionInstance, 'PXCMFaceConfiguration_ExpressionsConfiguration_EnableAllExpressions');
    }

    // @brief Disables all available face expressions. 
    this.expressions.disableAllExpressions = function () {
        if (self._configs.expressionInstance != null)
            return intel.realsense.connection.call(self._configs.expressionInstance, 'PXCMFaceConfiguration_ExpressionsConfiguration_DisableAllExpressions');
    }
    */

    /** Commit the configuration changes to the module
        This method must be called in order for any configuration changes to actually apply
        @return Promise object
    */
    this.applyChanges = function () {
        self._configs.detection = self.detection;
        self._configs.landmarks = self.landmarks;
        self._configs.pose = self.pose;
        self._configs.expressions = self.expressions;
        return intel.realsense.connection.call(self.instance, 'PXCMFaceConfiguration_ApplyChanges', { 'configs': self._configs, 'trackingMode': self.trackingMode});
    };

    this.release = function () {
        return intel.realsense.connection.call(self.instance, 'PXCMFaceConfiguration_Release');
    };
};

intel.realsense.face.TrackingStrategyType = {
    STRATEGY_APPEARANCE_TIME: 0,
    STRATEGY_CLOSEST_TO_FARTHEST: 1,
    STRATEGY_FARTHEST_TO_CLOSEST: 2,
    STRATEGY_LEFT_TO_RIGHT: 3,
    STRATEGY_RIGHT_TO_LEFT: 4
};

intel.realsense.face.SmoothingLevelType = {
    SMOOTHING_DISABLED: 0,
    SMOOTHING_MEDIUM: 1,
    SMOOTHING_HIGH: 2
};

intel.realsense.face.TrackingModeType = {
    FACE_MODE_COLOR: 0,
    FACE_MODE_COLOR_PLUS_DEPTH: 1,
    FACE_MODE_COLOR_STILL: 2
};

intel.realsense.face.FaceData = function (data) {
    var self = this;
    this.faces = data.faces;
    this.firedAlertData = data.alerts;
};

intel.realsense.face.LandmarkType = {
    LANDMARK_NOT_NAMED: 0,
    LANDMARK_EYE_RIGHT_CENTER: 1,
    LANDMARK_EYE_LEFT_CENTER: 2,
    LANDMARK_EYELID_RIGHT_TOP: 3,
    LANDMARK_EYELID_RIGHT_BOTTOM: 4,
    LANDMARK_EYELID_RIGHT_RIGHT: 5,
    LANDMARK_EYELID_RIGHT_LEFT: 6,
    LANDMARK_EYELID_LEFT_TOP: 7,
    LANDMARK_EYELID_LEFT_BOTTOM: 8,
    LANDMARK_EYELID_LEFT_RIGHT: 9,
    LANDMARK_EYELID_LEFT_LEFT: 10,
    LANDMARK_EYEBROW_RIGHT_CENTER: 11,
    LANDMARK_EYEBROW_RIGHT_RIGHT: 12,
    LANDMARK_EYEBROW_RIGHT_LEFT: 13,
    LANDMARK_EYEBROW_LEFT_CENTER: 14,
    LANDMARK_EYEBROW_LEFT_RIGHT: 15,
    LANDMARK_EYEBROW_LEFT_LEFT: 16,
    LANDMARK_NOSE_TIP: 17,
    LANDMARK_NOSE_TOP: 18,
    LANDMARK_NOSE_BOTTOM: 19,
    LANDMARK_NOSE_RIGHT: 20,
    LANDMARK_NOSE_LEFT: 21,
    LANDMARK_LIP_RIGHT: 22,
    LANDMARK_LIP_LEFT: 23,
    LANDMARK_UPPER_LIP_CENTER: 24,
    LANDMARK_UPPER_LIP_RIGHT: 25,
    LANDMARK_UPPER_LIP_LEFT: 26,
    LANDMARK_LOWER_LIP_CENTER: 27,
    LANDMARK_LOWER_LIP_RIGHT: 28,
    LANDMARK_LOWER_LIP_LEFT: 29,
    LANDMARK_FACE_BORDER_TOP_RIGHT: 30,
    LANDMARK_FACE_BORDER_TOP_LEFT: 31,
    LANDMARK_CHIN: 32
};

intel.realsense.face.LandmarksGroupType = {
    LANDMARK_GROUP_LEFT_EYE: 0x0001,
    LANDMARK_GROUP_RIGHT_EYE: 0x0002,
    LANDMARK_GROUP_RIGHT_EYEBROW: 0x0004,
    LANDMARK_GROUP_LEFT_EYEBROW: 0x0008,
    LANDMARK_GROUP_NOSE: 0x00010,
    LANDMARK_GROUP_MOUTH: 0x0020,
    LANDMARK_GROUP_JAW: 0x0040
};

intel.realsense.face.ExpressionsData = {};
intel.realsense.face.ExpressionsData.FaceExpression = {
    EXPRESSION_BROW_RAISER_LEFT: 0,
    EXPRESSION_BROW_RAISER_RIGHT: 1,
    EXPRESSION_BROW_LOWERER_LEFT: 2,
    EXPRESSION_BROW_LOWERER_RIGHT: 3,
    EXPRESSION_SMILE: 4,
    EXPRESSION_KISS: 5,
    EXPRESSION_MOUTH_OPEN: 6,
    EXPRESSION_EYES_CLOSED_LEFT: 7,
    EXPRESSION_EYES_CLOSED_RIGHT: 8,
    EXPRESSION_HEAD_TURN_LEFT: 9,
    EXPRESSION_HEAD_TURN_RIGHT: 10,
    EXPRESSION_HEAD_UP: 11,
    EXPRESSION_HEAD_DOWN: 12,
    EXPRESSION_HEAD_TILT_LEFT: 13,
    EXPRESSION_HEAD_TILT_RIGHT: 14,
    EXPRESSION_EYES_TURN_LEFT: 15,
    EXPRESSION_EYES_TURN_RIGHT: 16,
    EXPRESSION_EYES_UP: 17,
    EXPRESSION_EYES_DOWN: 18,
    EXPRESSION_TONGUE_OUT: 19,
	EXPRESSION_PUFF_RIGHT: 20,
    EXPRESSION_PUFF_LEFT: 21
};

intel.realsense.face.AlertType = {
    ALERT_NEW_FACE_DETECTED: 1,	        //  a new face enters the FOV and its position and bounding rectangle is available. 
    ALERT_FACE_OUT_OF_FOV: 2,			//  a new face is out of field of view (even slightly). 
    ALERT_FACE_BACK_TO_FOV: 3,			//  a tracked face is back fully to field of view. 
    ALERT_FACE_OCCLUDED: 4,			    //  face is occluded by any object or hand (even slightly).
    ALERT_FACE_NO_LONGER_OCCLUDED: 5,   //  face is not occluded by any object or hand.
    ALERT_FACE_LOST: 6					//  a face could not be detected for too long, will be ignored.
};

 
intel.realsense.hand.HandModule = function (instance, sense) {
    var instance = instance;
    var self = this;
    this.sm = sense;

    /** 
        Create a new instance of the hand-module's active configuration.
        @return Configuration instance as a promise object
    */
    this.createActiveConfiguration = function () {
        return intel.realsense.connection.call(instance, 'PXCMHandModule_CreateActiveConfiguration').then(function (result) {
            return new intel.realsense.hand.HandConfiguration(result.instance.value);
        });
    };
};
intel.realsense.hand.HandModule._CUID = 1313751368;


intel.realsense.hand.HandModule.prototype.pause = function (pause) {
    return this.sm._pauseModule(intel.realsense.hand.HandModule._CUID, pause);
};

/** default hand data callback which can be overwritten by JS application */
intel.realsense.hand.HandModule.prototype.onFrameProcessed = function (module, data) {
};

intel.realsense.hand.HandModule.activate = function (sense) {
    return sense._enableModule(intel.realsense.hand.HandModule._CUID);
};

intel.realsense.hand.HandConfiguration = function (instance) {
    this.instance = instance;
    var self = this;

    /* public members */
    this.allGestures = false; 
    this.allAlerts = false;
      
    /** Commit the configuration changes to the module
        This method must be called in order for any configuration changes to actually apply
        @return Promise object
    */
    this.applyChanges = function () {
        return intel.realsense.connection.call(self.instance, 'PXCMHandConfiguration_ApplyChanges', { 'configs': { 'allGestures': self.allGestures, 'allAlerts': self.allAlerts }});
    };

    this.release = function () {
        return intel.realsense.connection.call(self.instance, 'PXCMHandConfiguration_Release');
    };
};


intel.realsense.hand.HandData = function (data) {
    var self = this;
    this._handsData = data;

    this.numberOfHands = 0;
    if (this._handsData.hands !== undefined)
        this.numberOfHands = this._handsData.hands.length;

    this.firedGestureData = data.gestures;
    this.firedAlertData = data.alerts;
};

intel.realsense.hand.HandData.prototype.queryHandIds = function (accessOrder) {
    if (this.numberOfHands <= 0) return null;

    var ids = [];
    var k;
    for (k = 0; k < this.numberOfHands; k++)
        ids[k] = this._handsData.hands[k].uniqueId;

    return ids;
};

intel.realsense.hand.HandData.prototype.queryHandData = function (accessOrder) {
    if (this.numberOfHands <= 0) return null;

    var arrHandData = [];
    var k;
    for (k = 0; k < this.numberOfHands; k++)
        arrHandData[k] = new intel.realsense.hand.HandData.IHand(this._handsData.hands[k]);

    return arrHandData;
};

intel.realsense.hand.HandData.prototype.queryHandDataById = function (handID) {
    var index = -1;
    for (i=0; i<this.numberOfHands; i++) {
        if (this._handsData.hands[index].uniqueId == handID){
            index = i; 
            break;
        }
    }
    if (index >= 0)
        return new intel.realsense.hand.HandData.IHand(this._handsData.hands[index]);
    else 
        return null;
};

intel.realsense.hand.NUMBER_OF_FINGERS = 5;
intel.realsense.hand.NUMBER_OF_EXTREMITIES = 6;
intel.realsense.hand.NUMBER_OF_JOINTS = 22;

intel.realsense.hand.JointType = {
    JOINT_WRIST: 0,		    /// The center of the wrist
    JOINT_CENTER: 1,		/// The center of the palm
    JOINT_THUMB_BASE: 2,	/// Thumb finger joint 1 (base)
    JOINT_THUMB_JT1: 3,		/// Thumb finger joint 2
    JOINT_THUMB_JT2: 4,		/// Thumb finger joint 3
    JOINT_THUMB_TIP: 5,		/// Thumb finger joint 4 (fingertip)
    JOINT_INDEX_BASE: 6,	/// Index finger joint 1 (base)
    JOINT_INDEX_JT1: 7,		/// Index finger joint 2
    JOINT_INDEX_JT2: 8,		/// Index finger joint 3
    JOINT_INDEX_TIP: 9,		/// Index finger joint 4 (fingertip)
    JOINT_MIDDLE_BASE: 10,	/// Middle finger joint 1 (base)
    JOINT_MIDDLE_JT1: 11,	/// Middle finger joint 2
    JOINT_MIDDLE_JT2: 12,	/// Middle finger joint 3
    JOINT_MIDDLE_TIP: 13,	/// Middle finger joint 4 (fingertip)
    JOINT_RING_BASE: 14,	/// Ring finger joint 1 (base)
    JOINT_RING_JT1: 15,		/// Ring finger joint 2
    JOINT_RING_JT2: 16,		/// Ring finger joint 3
    JOINT_RING_TIP: 17,		/// Ring finger joint 4 (fingertip)
    JOINT_PINKY_BASE: 18,	/// Pinky finger joint 1 (base)
    JOINT_PINKY_JT1: 19,	/// Pinky finger joint 2
    JOINT_PINKY_JT2: 20,	/// Pinky finger joint 3
    JOINT_PINKY_TIP: 21  	/// Pinky finger joint 4 (fingertip)	
};

intel.realsense.hand.ExtremityType = { 
    EXTREMITY_CLOSEST: 0,       /// The closest point to the camera in the tracked hand
    EXTREMITY_LEFTMOST: 1,	    /// The left-most point of the tracked hand
    EXTREMITY_RIGHTMOST: 2,	    /// The right-most point of the tracked hand 
    EXTREMITY_TOPMOST: 3,		/// The top-most point of the tracked hand
    EXTREMITY_BOTTOMMOST: 4,	/// The bottom-most point of the tracked hand
    EXTREMITY_CENTER: 5 		/// The center point of the tracked hand	
};

intel.realsense.hand.FingerType = {
    FINGER_THUMB: 0,          /// Thumb finger
    FINGER_INDEX: 1,          /// Index finger  
    FINGER_MIDDLE: 2,         /// Middle finger
    FINGER_RING: 3,           /// Ring finger
    FINGER_PINKY: 4           /// Pinky finger
};

intel.realsense.hand.BodySideType = {
    BODY_SIDE_UNKNOWN: 0,     /// The hand-type was not determined
    BODY_SIDE_LEFT: 1,        /// Left side of the body    
    BODY_SIDE_RIGHT: 2        /// Right side of the body
};

intel.realsense.hand.AlertType = { 
    ALERT_HAND_DETECTED: 0x0001,        ///  A hand is identified and its mask is available
    ALERT_HAND_NOT_DETECTED: 0x0002,    ///  A previously detected hand is lost, either because it left the field of view or because it is occluded
    ALERT_HAND_TRACKED: 0x0004,         ///  Full tracking information is available for a hand
    ALERT_HAND_NOT_TRACKED: 0x0008,     ///  No tracking information is available for a hand (none of the joints are tracked)
    ALERT_HAND_CALIBRATED: 0x0010,      ///  Hand measurements are ready and accurate 
    ALERT_HAND_NOT_CALIBRATED: 0x0020,  ///  Hand measurements are not yet finalized, and are not fully accurate
    ALERT_HAND_OUT_OF_BORDERS: 0x0040,  ///  Hand is outside of the tracking boundaries
    ALERT_HAND_INSIDE_BORDERS: 0x0080,  ///  Hand has moved back inside the tracking boundaries         
    ALERT_HAND_OUT_OF_LEFT_BORDER: 0x0100,   ///  The tracked object is touching the left border of the field of view
    ALERT_HAND_OUT_OF_RIGHT_BORDER: 0x0200,  ///  The tracked object is touching the right border of the field of view
    ALERT_HAND_OUT_OF_TOP_BORDER: 0x0400,    ///  The tracked object is touching the upper border of the field of view
    ALERT_HAND_OUT_OF_BOTTOM_BORDER: 0x0800, ///  The tracked object is touching the lower border of the field of view
    ALERT_HAND_TOO_FAR: 0x1000,         ///  The tracked object is too far
    ALERT_HAND_TOO_CLOSE: 0x2000        ///  The tracked object is too close
};

intel.realsense.hand.GestureStateType = {     
    GESTURE_STATE_START: 0,		    /// Gesture started
    GESTURE_STATE_IN_PROGRESS: 1,	/// Gesture is in progress
    GESTURE_STATE_END: 2			/// Gesture ended
};

intel.realsense.hand.TrackingModeType = {
    TRACKING_MODE_FULL_HAND: 0,	    /// Track the full skeleton
    TRACKING_MODE_EXTREMITIES: 1	///<Unsupported> Track the extremities of the hand
};

intel.realsense.hand.JointSpeedType = {
    JOINT_SPEED_AVERAGE: 0,         /// Average speed across time
    JOINT_SPEED_ABSOLUTE: 1 	    /// Average of absolute speed across time
};

intel.realsense.hand.AccessOrderType = {
    ACCESS_ORDER_BY_ID: 0,
    ACCESS_ORDER_BY_TIME: 1,        /// From oldest to newest hand in the scene           
    ACCESS_ORDER_NEAR_TO_FAR: 2,	/// From near to far hand in scene
    ACCESS_ORDER_LEFT_HANDS: 3,		/// All left hands
    ACCESS_ORDER_RIGHT_HANDS: 4,	/// All right hands
    ACCESS_ORDER_FIXED: 5			/// The index of each hand is fixed as long as it is detected (and between 0 and 1)
};


intel.realsense.hand.HandData.IHand = function (data) {
    var self = this;

    if (data !== undefined) {
        for (var key in data) {
            this[key] = data[key];
        }
    }
};

intel.realsense.blob.BlobModule = function (instance, sense) {
    this.instance = instance;
    var self = this;
    this.sm = sense;

    /**
        Create a new instance of the blob module's active configuration.
        @return Configuration instance as a promise object
    */
    this.createActiveConfiguration = function () {
        return intel.realsense.connection.call(instance, 'PXCMBlobModule_CreateActiveConfiguration', {}, 2000).then(function (result) {
            return new intel.realsense.blob.BlobConfiguration(result.instance.value, result.configs);
        });
    };
};
intel.realsense.blob.BlobModule._CUID = 1145916738;

intel.realsense.blob.BlobModule.prototype.pause = function (pause) {
    return this.sm._pauseModule(intel.realsense.blob.BlobModule._CUID, pause);
};

/** default blob data callback which can be overwritten by JS application */
intel.realsense.blob.BlobModule.prototype.onFrameProcessed = function (module, data) {
};

intel.realsense.blob.BlobModule.activate = function (sense) {
    return sense._enableModule(intel.realsense.blob.BlobModule._CUID);
};

intel.realsense.blob.BlobConfiguration = function (instance, configs) {
    this.instance = instance;
    var self = this;

    /* private members */
    this._configs = configs;

    /* public members */
    this.maxBlobs = configs.maxBlobs;               // maximal number of blobs that can be detected.
    this.maxDistance = configs.maxDistance;         // maximal distance in meters of a detected blob from the sensor.
    this.maxObjectDepth = configs.maxObjectDepth;   // maximal depth in millimeters of a blob.
    this.minPixelCount = configs.minPixelCount;     // minimal blob size in pixels.
    this.enableFlag = configs.enableFlag;           // flag to enable/disable extraction of the segmentation image.
    this.minContourSize = configs.minContourSize;   // minimal contour size in points.
    this.maxPixelCount = configs.maxPixelCount;     // maximal blob size in pixels.
    this.maxBlobArea = configs.maxBlobArea;         // maximal blob area in meter.
    this.minBlobArea= configs.minBlobArea;          // minimal blob area in meter.
    this.blobSmoothing = configs.blobSmoothing;     // segmentation smoothing

    /** Commit the configuration changes to the module
        This method must be called in order for any configuration changes to actually apply
        @return Promise object
    */
    this.applyChanges = function () {
        self._configs.maxBlobs = self.maxBlobs;
        self._configs.maxDistance = self.maxDistance;
        self._configs.maxObjectDepth = self.maxObjectDepth;
        self._configs.minPixelCount = self.minPixelCount;
        self._configs.enableFlag = self.enableFlag;
        self._configs.minContourSize = self.minContourSize;
        self._configs.maxPixelCount = self.maxPixelCount;
        self._configs.maxBlobArea = self.maxBlobArea;
        self._configs.minBlobArea = self.minBlobArea;
        self._configs.blobSmoothing = self.blobSmoothing;
        return intel.realsense.connection.call(self.instance, 'PXCMBlobConfiguration_ApplyChanges', { 'configs': self._configs });
    };

    this.release = function () {
        return intel.realsense.connection.call(self.instance, 'PXCMBlobConfiguration_Release');
    };
};
intel.realsense.blob.MAX_NUMBER_OF_BLOBS = 4;

intel.realsense.blob.BlobData = function (data) {
    var self = this;
    this._blobsData = data;
};

intel.realsense.blob.BlobData.prototype.queryBlobs = function (segmentationImageType, accessOrderType) {
    if (segmentationImageType == intel.realsense.blob.SegmentationImageType.SEGMENTATION_IMAGE_COLOR)
        return null;  // no support of color segmentation type in JS yet

    if (this._blobsData.blobs_depth == null || this._blobsData.blobs_depth.length == 0)
        return null; 
        
    var blobs = [];
    var index;
    for (index = 0; index < this._blobsData.blobs_depth.length; index++) {
        var mappedIndex = this._blobsData.mappings_depth[accessOrderType].mapping[index];
        blobs[index] = new intel.realsense.blob.BlobData.IBlob(this._blobsData.blobs_depth[mappedIndex]);
    }
    return blobs;
};
    

intel.realsense.blob.AccessOrderType = {
    ACCESS_ORDER_NEAR_TO_FAR: 0,	 /// From near to far hand in scene
    ACCESS_ORDER_LARGE_TO_SMALL: 1,  /// From largest to smallest blob in the scene   		
    ACCESS_ORDER_RIGHT_TO_LEFT: 2    /// From rightmost to leftmost blob in the scene  
};

intel.realsense.blob.ExtremityType = {
    EXTREMITY_CLOSEST: 0,       /// The closest point to the camera in the tracked blob
    EXTREMITY_LEFTMOST: 1,	    /// The left-most point of the tracked blob
    EXTREMITY_RIGHTMOST: 2,	    /// The right-most point of the tracked blob 
    EXTREMITY_TOPMOST: 3,		/// The top-most point of the tracked blob
    EXTREMITY_BOTTOMMOST: 4,	/// The bottom-most point of the tracked blob
    EXTREMITY_CENTER: 5		    /// The center point of the tracked blob			
};

intel.realsense.blob.SegmentationImageType =
{
    SEGMENTATION_IMAGE_DEPTH: 0,
    SEGMENTATION_IMAGE_COLOR: 1
};

intel.realsense.blob.BlobData.IContour = function (contourData) {
    var self = this;

    if (contourData !== undefined) {
        for (var key in contourData) {
            this[key] = contourData[key];
        }
    }
};

intel.realsense.blob.BlobData.IContour.prototype.queryPoints = function() {
    return this.contourPoints;
}

intel.realsense.blob.BlobData.IBlob = function (data) {
    var self = this;

    if (data !== undefined) {
        for (var key in data) {
            this[key] = data[key];
        }
    }
};

intel.realsense.blob.BlobData.IBlob.prototype.queryContours = function () {
    if (this.contours == null)
        return null;
    else {
        var contours = [];
        var index;
        for (index = 0; index < this.contours.length; index++) {
            contours[index] = new intel.realsense.blob.BlobData.IContour(this.contours[index]);
        }
        return contours;
    }
};


intel.realsense.speech.SpeechRecognition = function (instance) {
    this.instance = instance;
    var self = this;
    var _profiles = null;
    var _profiles_promise = null;
    this.onSpeechRecognized = null;
    this.onAlertFired = null;

    this._onSpeechRecognized = function (data) {
        if (self.onSpeechRecognized != null)
            self.onSpeechRecognized(this, data);
    };

    this._onAlertFired = function (data) {
        if (self.onAlertFired != null)
            self.onAlertFired(this, data);
    };
};

/**
    @brief  The function returns the working algorithm configuration.
    @return configuration with a Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.queryProfile = function () {
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_QueryProfile', { 'idx': -1 }).then(function (result) {
        return result.pinfo;
    });
};

/**
    @brief  The function returns all available algorithm configurations.
    @return configuration with a Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.queryProfiles = function () {
    var self = this;
    if (self._profiles == null) {
        self._profiles_promise = intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_QuerySupportedProfiles').then(function (result) {
            self._profiles = result.profiles;
            return self._profiles;
        });
        return self._profiles_promise;
    } else {
        var myresolve;
        var promise = new Promise(function (resolve, reject) {
            myresolve = resolve;
        });
        myresolve(self._profiles);
        return promise;
    }
};

/**
    @brief The function sets the working algorithm configurations. 
    @param[in] pinfo       The algorithm configuration.
    @return Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.setProfile = function (pinfo) {
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_SetProfile', { 'pinfo': pinfo });
};

/** 
    @brief The function builds the recognition grammar from the list of strings. 
    @param[in] gid          The grammar identifier. Can be any non-zero number.
    @param[in] cmds         The string list.
    @param[in] labels       Optional list of labels. If not provided, the labels are 1...ncmds.
    @return Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.buildGrammarFromStringList = function (gid, cmds, labels) {
    if (gid == 0) {
        return new Promise(function (resolve, reject) {
            reject({ 'sts': STATUS_FEATURE_NOT_SUPPORT });
        });
    }
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_BuildGrammarFromStringList', { 'gid': gid, 'cmds': cmds, 'labels': labels });
};

/** 
    @brief The function deletes the specified grammar and releases any resources allocated.
    @param[in] gid          The grammar identifier.
    @return Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.releaseGrammar = function (gid) {
    if (gid == 0) {
        return new Promise(function (resolve, reject) {
            reject({ 'sts': STATUS_FEATURE_NOT_SUPPORT });
        });
    }
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_ReleaseGrammar', { 'gid': gid });
};

/** 
    @brief The function sets the active grammar for recognition.
    @param[in] gid          The grammar identifier.
    @return Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.setGrammar = function (gid) {
    if (gid == 0) {
        return new Promise(function (resolve, reject) {
            reject({ 'sts': STATUS_FEATURE_NOT_SUPPORT });
        });
    }
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_SetGrammar', { 'gid': gid }, 30000);
    // Loading language model may take long time
};

/** 
    @brief The function starts voice recognition.
    @return Promise object

*/
intel.realsense.speech.SpeechRecognition.prototype.startRec = function () {
    if (this.onSpeechRecognized !== 'undefined' && this.onSpeechRecognized != null) {
        intel.realsense.connection.subscribe_callback("PXCMSpeechRecognition_OnRecognition", this, this._onSpeechRecognized);
    }

    if (this.onAlertFired !== 'undefined' && this.onAlertFired != null) {
        intel.realsense.connection.subscribe_callback("PXCMSpeechRecognition_OnAlert", this, this._onAlertFired);
    }

    // Loading language model may take several seconds: thus set 20 seconds as timeout
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_StartRec', { 'handler': true, 'onRecognition': true, 'onAlert': true }, 20000);    
};

/** 
    @brief The function stops voice recognition immediately.
    @return Promise object
*/
intel.realsense.speech.SpeechRecognition.prototype.stopRec = function () {
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_StopRec', {});
};

intel.realsense.speech.SpeechRecognition.prototype.release = function () {
    return intel.realsense.connection.call(this.instance, 'PXCMSpeechRecognition_Release');
};

intel.realsense.speech.SpeechRecognition._CUID = -2146187993;

intel.realsense.speech.SpeechRecognition.createInstance = function (sense) {
    var sr = sense.session._createImpl(intel.realsense.speech.SpeechRecognition._CUID);
    sense._speechModule = sr;
    return sr;
};

intel.realsense.speech.AlertType = {
    ALERT_VOLUME_HIGH: 0x00001,             /** The volume is too high. */
    ALERT_VOLUME_LOW: 0x00002,              /** The volume is too low. */
    ALERT_SNR_LOW: 0x00004,                 /** Too much noise. */
    ALERT_SPEECH_UNRECOGNIZABLE: 0x00008,   /** There is some speech available but not recognizable. */
    ALERT_SPEECH_BEGIN: 0x00010,            /** The begining of a speech. */
    ALERT_SPEECH_END: 0x00020,              /** The end of a speech. */
    ALERT_RECOGNITION_ABORTED: 0x00040,     /** The recognition is aborted due to device lost, engine error, etc. */
    ALERT_RECOGNITION_END: 0x00080,         /** The recognition is completed. The audio source no longer provides data. */
    ALERT_WEB_DISCONNECTED: 0x10000         /** Lose connection to web service */
};

intel.realsense.speech.LanguageType = {
    LANGUAGE_US_ENGLISH: 0x53556e65,       /** US English */
    LANGUAGE_GB_ENGLISH: 0x42476e65,       /** British English */
    LANGUAGE_DE_GERMAN: 0x45446564,        /** German */
    LANGUAGE_US_SPANISH: 0x53557365,       /** US Spanish */
    LANGUAGE_LA_SPANISH: 0x414c7365,       /** Latin American Spanish */
    LANGUAGE_FR_FRENCH: 0x52467266,        /** French */
    LANGUAGE_IT_ITALIAN: 0x54497469,       /** Italian */
    LANGUAGE_JP_JAPANESE: 0x504a616a,      /** Japanese */
    LANGUAGE_CN_CHINESE: 0x4e43687a,       /** Simplified Chinese */
    LANGUAGE_BR_PORTUGUESE: 0x52427470     /** Portuguese */
};



intel.realsense.SenseManager.detectPlatform = function (components, cameras) {
    var myresolve;
    var info = new Object();
    info.isCameraReady = false;
    info.isDCMUpdateNeeded = false;
    info.isRuntimeInstalled = false;
    info.isCheckNeeded = false;
    /* nextStep: 'driver', 'runtime', 'unsupported', 'ready' */
    info.nextStep = 'ready';

    var promise = new Promise(function (resolve, reject) {
        myresolve = resolve;
    });

    // Try to detect a 64 bit Intel Processor
    function is64Bit() {
        var archNames = ['x86_64', 'x86-64', 'Win64', 'x64;', 'amd64', 'AMD64', 'WOW64'];
        var userAgent = navigator.userAgent;
        for (var i = 0; i < archNames.length; i++) {
            if (userAgent.indexOf(archNames[i]) != -1) {
                return true;
            }
        }
        return false;
    }

    // Check if it is Windows platform
    if ((navigator.appVersion.indexOf("Win") == -1) || !is64Bit() || !("WebSocket" in window)) {
        info.nextStep = 'unsupported';
        myresolve(info);
    }

    // Get RealSenseInfo from Capability.Servicer.RealSense
    getRealSenseInfo = function (callback) {
        if (intel.realsense.connection == null) intel.realsense.connection = new RealSenseConnection(intel.realsense.activeVersion.major);
        intel.realsense.connection.onerror = function (err) {
            var info = new Object();
            info.isCameraReady = false;
            info.isDCMUpdateNeeded = false;
            info.isRuntimeInstalled = false;
            info.isCheckNeeded = true;
            info.nextStep = 'runtime';
            callback(info);
            return;
        };
        var activeVersion = intel.realsense.activeVersion.major;
        return intel.realsense.connection.call(0, 'PXCM_GetRealSenseInfo', { 'js_version': 'v' + activeVersion, 
                'language_pack_version': 'v' + intel.realsense.languagePackFor.speechVersion[activeVersion]});
    };

    compareVersion = function (left, right) {
        if (typeof left != 'string') return 0;
        if (typeof right != 'string') return 0;
        var l = left.split('.');
        var r = right.split('.');
        var length = Math.min(l.length, r.length);

        for (i = 0; i < length; i++) {
            if ((l[i] && !r[i] && parseInt(l[i]) > 0) || (parseInt(l[i]) > parseInt(r[i]))) {
                return 1;
            } else if ((r[i] && !l[i] && parseInt(r[i]) > 0) || (parseInt(l[i]) < parseInt(r[i]))) {
                return -1;
            }
        }
        return 0;
    };

    var onerror = function () {
        info.isCheckNeeded = true;
        info.nextStep = 'runtime';
        myresolve(info);
        return;
    };

    var xhr;
    var onReady = function () {
        try {
            if (xhr.readyState == 4) {
                if (xhr.response != undefined) {
                    // Decide active web service version
                    for (ver = intel.realsense.releaseVersion.major; ver >= intel.realsense.activeVersion.majorMin; ver--) {
                        var version = 'v' + ver;
                        if (xhr.response.indexOf('realsense/rssdk_v' + ver) >= 0) {
                            intel.realsense.activeVersion.major = ver;
                            break;
                        }
                    }
                }

                // Retrieve component list
                getRealSenseInfo(myresolve).then(function (result) {
                    if (intel.realsense.connection !== 'undefined') {
                        intel.realsense.connection.close();
                        intel.realsense.connection = null;
                    }
                    
                    var info = result;
                    info.isCameraReady = false;
                    info.isDCMUpdateNeeded = false;
                    info.isRuntimeInstalled = false;
                    info.isCheckNeeded = false;
                    info.nextStep = 'ready';
                 
                    var cameraInfo = [];  
                    if ('dcmservice_sr300' in info) {
                        cameraInfo['front'] = (compareVersion(info.ivcam, '1.2') < 0);
                        cameraInfo['f250'] = cameraInfo['front'];
                    } else if ('ivcam' in info) {
                        cameraInfo['front'] = (compareVersion(info.ivcam, '1.2') < 0);
                        cameraInfo['f200'] = cameraInfo['front'];
                    }

                    // Future enhancement: || ('dcmservice_r400' in info)
                    if ('dcmservice_r200' in info) {
                        cameraInfo['rear'] = (compareVersion(info.dcmservice_r200, '2.0') < 0);
                        cameraInfo['r200'] = cameraInfo['rear'];
                    }

                    if (cameras.length == 0) {
                        info.nextStep = 'unsupported';

                        if ('front' in cameraInfo && info.nextStep != 'ready') {
                            info.isCameraReady = true;
                            info.isDCMUpdateNeeded = cameraInfo['front'];
                            if (info.isDCMUpdateNeeded)
                                info.nextStep = 'driver';
                            else
                                info.nextStep = 'ready';
                        }

                        if ('rear' in cameraInfo && info.nextStep != 'ready') {
                            info.isCameraReady = true;
                            info.isDCMUpdateNeeded = cameraInfo['rear'];
                            if (info.isDCMUpdateNeeded)
                                info.nextStep = 'driver';
                            else
                                info.nextStep = 'ready';
                        }                           
                    } else {
                        info.nextStep = 'unsupported';
                        for (i = 0; i < cameras.length; i++) {
                            if (cameras[i] in cameraInfo) {
                                info.isCameraReady = true;
                                info.isDCMUpdateNeeded = cameraInfo[cameras[i]];
                                if (!info.isDCMUpdateNeeded) {
                                    info.nextStep = 'ready';
                                    break;
                                }
                            }
                        }
                    }

                    if (info.nextStep == 'ready') {
                        info.isRuntimeInstalled = true;
                        var activeVersion = intel.realsense.activeVersion.major + '.0';
                        if (!("web_server" in info) || compareVersion(activeVersion, info.web_server) > 0) {
                            info.isRuntimeInstalled = false;
                            info.nextStep = 'runtime';
                        }  else if (components != null) {
                            for (i = 0; i < components.length; i++) {
                                if (!(components[i] in info)) {
                                    info.isRuntimeInstalled = false;
                                    info.nextStep = 'runtime';
                                }
                            }
                        }
                    }

                    myresolve(info);
                }).catch(function(err){
                    onerror();
                });
            }
        } catch (err) {
            onerror();
        }
        };

    try {
        /* TODO: Check with Pranav if we need to use CORS on IE/Firefox. */
        xhr = new XMLHttpRequest();
        xhr.open("GET", "https://192.55.233.1/capabilityproxy/capabilities", true);
        xhr.onload = onReady;
        xhr.timeout = 5000;
        xhr.ontimeout = onerror;
        xhr.onerror = onerror;
        xhr.send();
    } catch (err) {
        myresolve(info);
    }
    return promise;
};



//////////////////////////////////////////////////////////////////////////////////
//
// Internal object for websocket communication
//
//////////////////////////////////////////////////////////////////////////////////


/**
 * Intel Technology Access WebSocket Interface
 * @param endpoint
 * @param options
 * @param listeners
 * @constructor
 */
ITAWS = function (endpoint, options, listeners) {
    var self = this;
    if (!endpoint || typeof endpoint !== "string") {
        throw "Endpoint required";
    }
    options = options || {};
    listeners = listeners || {};
    if (typeof listeners === "function") {
        listeners = { onopen: listeners };
    }

    if (!options.wsConstructor) {
        // TODO remove hardcoded wamp implementation selection
        if (typeof autobahn === "object") {
            options.wsConstructor = autobahn.Connection;
        }
        else {
            throw "WAMP2 implementation not found";
        }
    }

    //create properties
    self.options = options;
    self.connection = new ITAWSConnection(endpoint, options, listeners);
    //console.log("Connection object" + self.connection);
    // connect by default

};

/**
 * Handles connection, methods and listeners
 * @param endpoint
 * @param options
 * @param listeners
 * @constructor
 */
ITAWSConnection = function (endpoint, options, listeners) {
    var self = this;
    this._hbIntervalID = undefined;
    this.rsPlugin = "realsense/rssdk_v" + intel.realsense.activeVersion.major;
    var at = { "iat": new Date().getTime(), "expcr": 0, "explp": 0, "api-key": "", "cap": [this.rsPlugin] };
    options.at = at;
    var PairCallback = function (err, rat) {
        if (err) {
            //console.log("Error occurred while pairing: ", err);
            if (listeners.onerror)
                listeners.onerror(err);
            return;
        }
        if (rat) {
            //console.log("Got Rat. Start connection");
            self.default = {};
            self.default.endpoint = "ws://localhost:9000";
            self.default.realm = 'com.intel.api';
            self.rat = rat;
            self.mode = "debug";
            self.log = function () {
                if (self.mode === "debug") {
                    console.log.apply(console, arguments);
                }
            }
            self.endpoint = endpoint || self.default.endpoint;
            self.realm = options && options.realm ? options.realm : self.default.realm;

            // set our wamp constructor fn
            self.setWSConstructor(options.wsConstructor);
            //set options and instantiate our websocket connection using constructor
            var cnOptions = {
                url: self.endpoint,
                realm: self.realm,
                authmethods: ["ticket"],
                authid: "realsense",
                onchallenge: function (session, method, extra) {
                    if (method === "ticket") {
                        console.log("onchallenge method is ticket");
                        return self.rat;
                    }
                    else {
                        throw "Unknown authentication method '" + method + "'";
                    }
                }
            };

            //var ws = new self.wsConstructor(cnOptions);
            var ws = new autobahn.Connection(cnOptions);

            self.ws = ws;

            if (typeof listeners === "object") {
                self.setListeners(listeners);
            }
            // set wrappers for ws events that call user listeners
            self.wrapEvents();

            if (options.autoConnect !== false) {
                self.ws.open();
            }
        }
    }
    // check for rat or error
    if (options && options.rat) {
        self.rat = options.rat;
        PairCallback(null, self.rat);
    }
    else {
        if (options.at) {
            getRAT(at, PairCallback);
        }
        else {
            throw 'Access Token is required';
        }
    }

};

// TODO this should be passing in a wamp lib adapter, not hardcoded
/**
 * Runs after session
 */
ITAWSConnection.prototype.attachMethods = function () {
    var self = this;
    // wire methods native to any wamp lib (call, subscribe etc)
    self.call = (self.session) ? self.session.call : function () { };
    self.subscribe = (self.session) ? self.session.subscribe : function () { };
    self.session.SendRPC = function (procedureName, args, responseHandler) {
        //console.log("Sending RPC...");
        if (typeof args === "string") {
            //console.log("sending string");
            //console.log(procedureName);

            // send string as single element array
            self.session.call(procedureName, [args]).then(function (res) {
                //console.log(res);

                return responseHandler(res);
            }, console.log);
        }
        else {
            if (Object.prototype.toString.call(args) === '[object Array]') {
                console.log("sending array");
                // binary, send array data
                self.session.call(procedureName, args).then(function (res) {
                    responseHandler(res);
                });
            }
            else if (typeof args === "object") {
                console.log("sending object");
                //send object
                self.call(procedureName, [], args).then(function (res) {
                    responseHandler(res);
                });
            }

        }
    };

    self.session.Subscribe = function (topic, args, eventHandler) {
        self.session.subscribe(topic, eventHandler);
    };
}
/**
 * Set the websocket handlers to call user specified listeners
 */
ITAWSConnection.prototype.wrapEvents = function () {
    var self = this;
    // set wrappers for events
    self.ws.onopen = function (session, details) {
        self.log("ITAWS session started");
        self.session = session;
        self.attachMethods();
        self.ws._onopen(self.session);
    };
    // TODO needs wrapper to work, wamp is rpc,pubsub not socket msg based
    self.ws.onmessage = function (e) {
        self.log("ITAWS ws message: " + e.data);
        self.ws._onmessage(session);
    };
    self.ws.onclose = function (e) {
        //stop the heartbeats here
        //self._stopHeartBeats();
        self.log("ITAWS ws session closed");
        self.ws._onclose(e);
    };
    self.ws.onerror = function (e) {
        self.log("ITAWS ws error");
        self.ws._onerror(e);
    };

    //self.ws = ws;
}
/**
 * Set the function to be used for constructing websockets
 * @param fn
 */
ITAWSConnection.prototype.setWSConstructor = function (fn) {
    var self = this;
    if (typeof fn === "function") {
        self.wsConstructor = fn;
    }
    else {
        self.wsConstructor = (typeof WebSocket === "function") ? WebSocket : null;
    }
}

/**
 * Set user supplied listeners to be called when communication events occur
 * @param listeners
 * @returns {boolean}
 */
ITAWSConnection.prototype.setListeners = function (listeners) {
    var self = this;
    var noop = function (e) { };
    if (!self.ws || typeof listeners !== "object") {
        throw "websocket property does not exist";
    }
    //self.ws._onopen = listeners.onopen || self.ws._onopen || function(session) {
    self.ws._onopen = listeners.onopen || function (session) {

    };
    /*TBD convenience fn - onmessage is not RPC,EVENT protocol (WAMP2 etc) */
    self.ws._onmessage = listeners.onmessage || self.ws._onmessage || noop;
    self.ws._onclose = listeners.onclose || self.ws._onclose || noop;
    self.ws._onerror = listeners.onerror || self.ws._onerror || noop;

};
/**
 * Connect using websocket
 */
ITAWSConnection.prototype.connect = function () {
    var self = this;
    if (!self.ws) {
        if (self.wsConstructor) {
            // TODO implement reconnect
        }
    }
    self.ws.open();

};

/**
 * Set all listeners to no ops
 */
ITAWSConnection.prototype.removeListeners = function () {
    var self = this;
    var noop = function (e) { };
    var o = {
        onclose: noop,
        onopen: noop,
        onerror: noop,
        onmessage: noop
    };
    self.setListeners(o);
};

function getRAT(accessToken, cb) {
    var rat = "";
    var at = accessToken;
    var getRATOptions = {
        "headers": {
            "api-key": "12345",
            "Content-Type": 'application/json'
        },
        "body": JSON.stringify(at)
    };

    var successCallback = function (result) {
        var rat;
        if (result.responseText) {
            var res = JSON.parse(result.responseText);
            rat = res.ResourceAccessToken;
        }
        console.log('Successfuly obtained RAT: ' + rat);
        if (result && rat) {
            cb(null, rat);
        }
        return;
    }
    var errorCallback = function (result) {
        console.log('Error', result)
        var ex = "Pairing Failed";
        cb(ex, null);
        return;
    }
    GetResourceAccessToken(getRATOptions, successCallback, errorCallback);
};

intel.rest = function (method, url, options) {
    var self = {};

    /**
     Dynamically builds the URL string, replacing url tokens with provided values and appending any provided query parameters.
     @method intel.rest._buildUrl
     @param {string} url - Base URL to attempt token replacement and append query params to.
     @param {object} options - Dynamic options for this request. Structure is identical to top level options passed to intel.rest, 
                                however, only url and query properties are used in this function.
     */
    function _buildUrl(url, options) {
        // Dynamic URL key replacements.
        if (options.url) {
            for (var okey in options.url) {
                if (options.url.hasOwnProperty(okey)) {
                    url = url.replace("{" + okey + "}", options.url[okey]);
                }
            }
        }

        // Attach query string.
        if (options.query) {
            var queryArray = [];
            for (var qkey in options.query) {
                if (options.query.hasOwnProperty(qkey)) {
                    queryArray.push(encodeURI(qkey) + "=" + encodeURI(options.query[qkey]));
                }
            }

            url += "?" + queryArray.join("&");
        }

        return url;
    }

    // Set defaults.
    self.options = options || {};
    self.method = method || "GET";
    self.url = _buildUrl(url || "", options || {});
    self.body = options.body || "";
    self.headers = options.headers || {};
    self.request = null;
    self.timeout = options.timeout || -1;

    //Set JSON as default dataType
    if (!("Accept" in self.headers)) {
        self.headers["Accept"] = "application/json";
    }

    //Set Default Content-Type
    if (!("Content-Type" in self.headers) && self.method !== 'GET') {
        self.headers["Content-type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    }

    /**
     Executes the prepared REST command.
     @method intel.rest._execute
     @param {function} successCB - Callback called on success. Callback should accept a result parameter.
     @param {function} errorCB - Callback called in the event of an error. Callback should accept a result parameter.
     */
    self._execute = function (successCB, errorCB) {
        var xhr;

        try {
            xhr = new XMLHttpRequest();
            //xhr.withCredentials = true;

            // Event callbacks.
            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 204 || xhr.status === 303) {
                        successCB(xhr);
                    } else {
                        errorCB(xhr);
                    }
                }
            };

            xhr.onabort = function () {
                errorCB({ 'status': 'ABORTED', 'message': 'request aborted' });
            };

            xhr.onerror = function () {
                errorCB({ 'status': 'ERROR', 'message': 'An error occurred during request execution' });
            };

            // Init the request so we can prep for sending.
            xhr.open(self.method, self.url, true);

            // Set the request headers.
            if (self.headers) {
                for (var index in self.headers) {
                    if (self.headers.hasOwnProperty(index)) {
                        xhr.setRequestHeader(index, self.headers[index]);
                    }
                }
            }

            // Set request timeout.
            if (self.timeout > 0) {
                xhr.timeout = self.timeout;
                xhr.ontimeout = function () {
                    errorCB('Request execution timed out');
                };
            }

            // Send the request.
            if (this.method === "GET") {
                xhr.send(null);
            } else {
                xhr.send(self.body);
            }
        } catch (e) {
            errorCB(e);
        }
    };

    return self;
};

GetResourceAccessToken = function (options, successCB, errorCB) {
    var url = "https://192.55.233.1/resourceaccesstoken";
    var restRequest = intel.rest("POST", url, options);
    restRequest._execute(successCB, errorCB);
};


function RealSenseConnection(major) {
    console.log('Realsense.Connection()');
    var self = this;
    var version_major = 'v' + major;
    var request_url = "realsense/rssdk_" + version_major + "/api";

    var noop = function () { };
    this.onmessage = noop;
    this.onopen = noop;
    this.onclose = noop;
    this.onerror = noop;

    this.queue = [];        // queue before websocket is open
    this.websocket = null;  // WebSocket object
    this.wssession = null;
    this.request_array = {};// Requests by request id
    this.request_id = 0;    // Increment on every message
    this.callbacks = {};    // Callbacks from server
    this.binary_data = null;// Data received in last binary message
    this._connected = false; 

    this.close = function () {
        if (this.websocket !== 'undefined' && this.websocket.connection != 'undefined' && this.websocket.connection.ws != 'undefined') {
            this.websocket.connection.ws.close(request_url);
        }
        this._connected = false;
        this.onclose();
    }

    this.call = function (instance, method, params, timeout) {
        params = params || {};      // Empty params by default
        timeout = timeout || 2000;  // Default timeout in ms for response from server

        if (!("WebSocket" in window)) throw "WebSocket not available";

        if (this.websocket === null || this.wssession === null) { // Create WebSocket if not created or closed
            //this.websocket = new WebSocket(this.socketUrl);
            console.log('No websocket. Create one.');
            this.websocket = new ITAWS("wss://192.55.233.1/", {
                //send rat to bypass pairing
                //rat: ".eyJhcGkta2V5IjoiamEyc2hhNzg4a3l4dHI4Nnk3OGhqZTlrdDUyNHpkYnVqZDY4IiwiY2FwIjpbInJlYWxzZW5zZS92MSJdLCJleHBjciI6MTQyMTI3NjM0OTk2NCwiZXhwbHAiOjE0NTI4MDY5NDk5NjQsImhlYWQiOiJJbnRlbCBDb3JwLCB2MiIsImlhdCI6MTQyMTI3MDk0OTk2NCwianRpIjoibmhEYnhZZUQiLCJub25jZSI6IkMyR0M3b05Vdi9JN1c0R1VMdmdneU11bFdYQlFPK1kzc1Z6VGM0STAraTA9IiwidGFyY3AiOlsiVFplZFRhQmJsVzhnalEva2t1aFcvcm1QK1BrREgwT3UrUGZBZ2tnck9mR2NIRnM1OWluM3RBTElEMzhkU3BOYjdrNWxnLzloM0EzZVZvYyt1amtyTEVXUEczdWgzZkZEZGwvZGVkZmoyaEFUc0RNY2NtWHp5VVZDOXFkWWZoY1pNeGlBYVYvRG53WkRoYzZvWDVINnJKY2ZRRzUwSXdnOElOTVJBdHNZWWxZV3greWxXbzYxUEJRVWpSazZFZ3BYS2QrYlFMQ2dMTXhtV2l4SkxSV1BqSHhnZ1Q3TGdtZTdpNEU5RlB0M0hmR3ZpN2RlWHFhaUJkeG5mbitUZ2pUWXorNFdDc3FDVGlIa1Myd2lHejRUdlA3TjNITU1JRWJuRW03R1ZpcFBJVm00MHgzOS9EajRlbmhORWVwTTVKeDN2SzFZZUQrQWg0NGNZYmlMdFRkK2N3PT0iXSwidGFyY3IiOlsiN2ExYjc0OWZkMjFjZWM2OWQwNmE1YTFkNGE4ZmJmOTAzNGMzNzg1YzQ0ZGMwZDkyMTk0ZjEwM2JjNzAzNmY1NmFkYjdjNDU2YmI2MDM2YWQ0NjY2MzYyMzE5MmVlN2JjNzc3NzViNThlNjhkNDFkMDUxMjhkZjkwZmY2N2Q0MjJlZWMzMmUyNWQxNDU4ZTZmMGY4NzkwNzllYTM1ODE2NWVlNTUwZjMwODI3ZWFkNDAzMmRkMDAyZjJkMTMwM2Y4OGI2ZjIwNjU2M2IyNTA5NjgxMDVlNDczMmUyYTMwNTNiNDFhZDA0MmQxOWQ1NDcwMWUyODUyYzdjODEwM2NkZmVlZGRkYTMxZTE3Yjg3MDY5NmE0YzVlNDcwZTk3YTM3ZDgzOTNkNGQyZDE1YTYwNjY4M2U1NmE2MzZmZjJhNjdlODY3NGNkZTViMmI4YzAxODYxNWZmZDUwOGM2YTEzNjkzNDhmOTFjZDBmNDllY2U5NjE0NTk0MTZhNzdlY2Y3MTcxMmI1OTgyN2FhODBhOWI1NGNlMGI3NzFiN2ExMDkzYWZiMDU2ZmNjMTVmNTIxOTEwNWFkNzk2NGUxYmRhMjEyZGU5NDEwMzFlMzk1ZDFiYTE3ZGE0ZTk0YmI5OTlhMDBmNWI0NTI5MGQwZmE2YWQ3OTIxNDVkZmZkNzIyMjAiXX0=."
            },
                {
                    "onopen": function (session, details) { console.log('Opened!'); self._onopen(session); },
                    "onmessage": function (response) { console.log('Message!'); self._onmessage(response); },
                    "onerror": this.onerror,
                    "onclose": this.onclose
                });
            this._connected = true;
            this.websocket.binaryType = "arraybuffer"; // Receive binary messages as ArrayBuffer
        }

        // send a rejected promise if the connection is already closed
        if (this._connected == false) {
            var rejectPromise = new Promise(function (resolve, reject) {
                reject({ 'sts': intel.realsense.Status.STATUS_WEB_DISCONNECTED});
            });
            return rejectPromise;
        }

        //send a heartbeat message here
        var hbObj = params;
        hbObj.id = ++this.request_id;
        hbObj.instance = { value: instance };
        hbObj.method = "PXCM_HeartBeat";
        hbObj.version_major = version_major;

        var hbObj_text = JSON.stringify(hbObj);

        if (typeof this.wssession == undefined || this.wssession == null) {
            this.queue.push(hbObj_text);
        } else if (this.wssession) {
            this.wssession.SendRPC(request_url, hbObj_text, function (response) { });
        }

        // Construct request as id+instance+method+params
        var request = params;
        request.id = ++this.request_id;
        request.instance = { value: instance };
        request.method = method;
        request.version_major = version_major;

        // Convert request to JSON string
        var request_text = JSON.stringify(request);

        // Send request or put request into queue (if socket still in CONNECTING state)
        if (typeof this.wssession == undefined || this.wssession == null) {
            this.queue.push(request_text);
        } else if (this.wssession) {
            var t4 = performance.now();
            this.wssession.SendRPC(request_url, request_text, function (response) { var t5 = performance.now(); console.log("Response time: " + (t5 - t4)); self._onmessage(response) });
        }

        // Create promise object
        var promise = new Promise(function (resolve, reject) {
            request.resolve = resolve;
            request.reject = reject;
        });

        // Store request by id
        this.request_array[request.id] = request;
        return promise;
    };

    // Send queued messages when socket is open
    this._onopen = function (session) {
        //self.onopen(session);
        this.wssession = session;

        //subscribe to the realsense events
        this.wssession.Subscribe(request_url, self.queue[i], function (response) { var t3 = performance.now(); /*console.log("Response time: " + (t3 - t2))*/; self._onmessage(response) });

        for (var i = 0; i < self.queue.length; i++) {
            var t2 = performance.now();
            this.wssession.SendRPC(request_url, self.queue[i], function (response) { var t3 = performance.now(); /*console.log("Response time: " + (t3 - t2))*/; self._onmessage(response) });
        }
        self.queue = [];
    }

    // Message handler
    this._onmessage = function (event) {
        if (event.data instanceof ArrayBuffer) {
            this.binary_data = new Uint8Array(event.data);
            //this.onmessage(event.data);
            return;
        }

        // Parse JSON
        var response;
        //console.log("received a response");
        //console.log(response);
        //console.log("<<");
        try {
            var t0 = performance.now();
            response = JSON.parse(event);
            var t1 = performance.now();
            response.parse_time = t1 - t0;
        } catch (err) {
            this.onmessage(event, null);
            return;
        }

        if (typeof response !== 'object') { /*console.log("Could not parse JSON")*/; return; }// error parsing JSON

        if (response.method !== 'undefined' && this.callbacks[response.method]) { // callback from server
            var callback = this.callbacks[response.method].callback;
            var obj = this.callbacks[response.method].obj;
            callback(response, obj);
            return;
        } else if (response.id !== 'undefined' && this.request_array[response.id]) { // result from server
            //console.log("Found request id");
            //console.log(response);
            // Attach request to response object and remove from array
            response.request = this.request_array[response.id];
            delete this.request_array[response.id];

            clearTimeout(response.request.timeout_id);

            if (this.binary_data != null) {
                response.binary_data = this.binary_data;
            }

            // if error or status<0
            if ('error' in response || ('status' in response && response.status < 0)) {
                response.request.reject(response);
            } else {
                response.request.resolve(response);
            }
            return;
        }

        // Unknown message from server, pass it to onmessage handler
        this.onmessage(event, response);
    };

    // Subscribe to callback from server
    this.subscribe_callback = function (method, obj_ptr, callback) {
        this.callbacks[method] = { obj: obj_ptr, callback: callback };
    }
}
