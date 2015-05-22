/*******************************************************************************

INTEL CORPORATION PROPRIETARY INFORMATION
This software is supplied under the terms of a license agreement or nondisclosure
agreement with Intel Corporation and may not be copied or disclosed except in
accordance with the terms of that agreement
Copyright(c) 2014-2015 Intel Corporation. All Rights Reserved.

*******************************************************************************/

var RealSense = { connection: null };
var RealSenseVersion = '5.0.0';
var RealSenseVersion_Major = '5';

var pxcmConst = {
    // Interface identifiers
    PXCMVideoModule:            { CUID: 1775611958 },
    PXCM3DScan:                 { CUID: 826884947 },
    PXCM3DSeg:                  { CUID: 826885971 },
    PXCMAddRef:                 { CUID: 1397965122 },
    PXCMAudio:                  { CUID: 962214344 },
    PXCMAudioSource:            { CUID: -666790621 },
    PXCMCaptureManager:         { CUID: -661576891 },
    PXCMEmotion:                { CUID: 1314147653 },
    PXCMFaceConfiguration:      { CUID: 1195787078 },
    PXCMHandConfiguration:      { CUID: 1195589960 },
    PXCMBlobConfiguration:      { CUID: 1195593026 },
    PXCMFaceModule:             { CUID: 1144209734 },
    PXCMHandModule:             { CUID: 1313751368 },
    PXCMBlobModule:             { CUID: 1145916738 },
    PXCMImage:                  { CUID: 611585910 },
    PXCMMetadata:               { CUID: 1647936547 },
    PXCMPowerState:             { CUID: 1196250960 },
    PXCMProjection:             { CUID: 1229620535 },
    PXCMSenseManager:           { CUID: -661306591 },
    PXCMSpeechRecognition:      { CUID: -2146187993 },
    PXCMSpeechSynthesis:        { CUID: 1398032726 },
    PXCMSyncPoint:              { CUID: 1347635283 },
    PXCMTouchlessController:    { CUID: 1397443654 },
    PXCMTracker:                { CUID: 1380667988 },

    PXCMHandData: {
        CUID: 1413563462,
        NUMBER_OF_FINGERS: 5, 
        NUMBER_OF_EXTREMITIES: 6,
        NUMBER_OF_JOINTS: 22,
        RESERVED_NUMBER_OF_JOINTS: 32,
        MAX_NAME_SIZE: 64,
        MAX_PATH_NAME: 256,

	    /**
            @brief
	    	Indexes of joints that can be tracked by the hand module
	    */
	    JOINT_WRIST: 0,		    /// The center of the wrist
	    JOINT_CENTER: 1,		    /// The center of the palm
	    JOINT_THUMB_BASE: 2,	    /// Thumb finger joint 1 (base)
	    JOINT_THUMB_JT1: 3,		/// Thumb finger joint 2
	    JOINT_THUMB_JT2: 4,		/// Thumb finger joint 3
	    JOINT_THUMB_TIP: 5,		/// Thumb finger joint 4 (fingertip)
	    JOINT_INDEX_BASE: 6,		/// Index finger joint 1 (base)
	    JOINT_INDEX_JT1: 7,		/// Index finger joint 2
	    JOINT_INDEX_JT2: 8,		/// Index finger joint 3
	    JOINT_INDEX_TIP: 9,		/// Index finger joint 4 (fingertip)
	    JOINT_MIDDLE_BASE: 10,		/// Middle finger joint 1 (base)
	    JOINT_MIDDLE_JT1: 11,		/// Middle finger joint 2
	    JOINT_MIDDLE_JT2: 12,		/// Middle finger joint 3
	    JOINT_MIDDLE_TIP: 13,		/// Middle finger joint 4 (fingertip)
	    JOINT_RING_BASE: 14,		/// Ring finger joint 1 (base)
	    JOINT_RING_JT1: 15,		/// Ring finger joint 2
	    JOINT_RING_JT2: 16,		/// Ring finger joint 3
	    JOINT_RING_TIP: 17,		/// Ring finger joint 4 (fingertip)
	    JOINT_PINKY_BASE: 18,		/// Pinky finger joint 1 (base)
	    JOINT_PINKY_JT1: 19,		/// Pinky finger joint 2
	    JOINT_PINKY_JT2: 20,		/// Pinky finger joint 3
	    JOINT_PINKY_TIP: 21,		/// Pinky finger joint 4 (fingertip)		

	    /**
	    	@brief Indexes of an extremity of the tracked hand
	    */
	    EXTREMITY_CLOSEST: 0,     /// The closest point to the camera in the tracked hand
	    EXTREMITY_LEFTMOST: 1,	/// The left-most point of the tracked hand
	    EXTREMITY_RIGHTMOST: 2,	/// The right-most point of the tracked hand 
	    EXTREMITY_TOPMOST: 3,		/// The top-most point of the tracked hand
	    EXTREMITY_BOTTOMMOST: 4,	/// The bottom-most point of the tracked hand
	    EXTREMITY_CENTER: 5,		/// The center point of the tracked hand			

	    /**
            @brief Indexes of the hand fingers
	    */
	    FINGER_THUMB: 0,          /// Thumb finger
	    FINGER_INDEX: 1,          /// Index finger  
	    FINGER_MIDDLE: 2,         /// Middle finger
	    FINGER_RING: 3,           /// Ring finger
	    FINGER_PINKY: 4,          /// Pinky finger

	    /** @brief Side of the body that a hand belongs to
	    */
	    BODY_SIDE_UNKNOWN: 0,     /// The hand-type was not determined
	    BODY_SIDE_LEFT: 1,        /// Left side of the body    
	    BODY_SIDE_RIGHT: 2,       /// Right side of the body

	    /** @brief Enumerates the events that can be detected and fired by the module
	    */
	    ALERT_HAND_DETECTED: 0x0001,   ///  A hand is identified and its mask is available
	    ALERT_HAND_NOT_DETECTED: 0x0002,   ///  A previously detected hand is lost, either because it left the field of view or because it is occluded
	    ALERT_HAND_TRACKED: 0x0004,   ///  Full tracking information is available for a hand
	    ALERT_HAND_NOT_TRACKED: 0x0008,   ///  No tracking information is available for a hand (none of the joints are tracked)
	    ALERT_HAND_CALIBRATED: 0x0010,   ///  Hand measurements are ready and accurate 
	    ALERT_HAND_NOT_CALIBRATED: 0x0020,   ///  Hand measurements are not yet finalized, and are not fully accurate
	    ALERT_HAND_OUT_OF_BORDERS: 0x0040,   ///  Hand is outside of the tracking boundaries
	    ALERT_HAND_INSIDE_BORDERS: 0x0080,   ///  Hand has moved back inside the tracking boundaries         
	    ALERT_HAND_OUT_OF_LEFT_BORDER: 0x0100,   ///  The tracked object is touching the left border of the field of view
	    ALERT_HAND_OUT_OF_RIGHT_BORDER: 0x0200,   ///  The tracked object is touching the right border of the field of view
	    ALERT_HAND_OUT_OF_TOP_BORDER: 0x0400,   ///  The tracked object is touching the upper border of the field of view
	    ALERT_HAND_OUT_OF_BOTTOM_BORDER: 0x0800,   ///  The tracked object is touching the lower border of the field of view
	    ALERT_HAND_TOO_FAR: 0x1000,   ///  The tracked object is too far
	    ALERT_HAND_TOO_CLOSE: 0x2000,   ///  The tracked object is too close		

	    /** 
	    	@brief Available gesture event states
	    */
	    GESTURE_STATE_START: 0,		/// Gesture started
	    GESTURE_STATE_IN_PROGRESS: 1,	/// Gesture is in progress
	    GESTURE_STATE_END: 2,			/// Gesture ended

	    /** 
            @brief The Tracking mode indicates which set of joints will be tracked.
        */
	    TRACKING_MODE_FULL_HAND: 0,	    /// Track the full skeleton
	    TRACKING_MODE_EXTREMITIES: 1,	///<Unsupported> Track the extremities of the hand

	    /** 
            @brief List of available modes for calculating the joint's speed	
        */
	    JOINT_SPEED_AVERAGE: 0,         /// Average speed across time
	    JOINT_SPEED_ABSOLUTE: 1,	    /// Average of absolute speed across time

        /** 
            @enum AccessOrderType
            List of the different orders in which the hands can be accessed
        */
	    ACCESS_ORDER_BY_ID: 0,
	    ACCESS_ORDER_BY_TIME: 1,        /// From oldest to newest hand in the scene           
		ACCESS_ORDER_NEAR_TO_FAR: 2,	/// From near to far hand in scene
		ACCESS_ORDER_LEFT_HANDS: 3,		/// All left hands
		ACCESS_ORDER_RIGHT_HANDS: 4,	/// All right hands
		ACCESS_ORDER_FIXED: 5,			/// The index of each hand is fixed as long as it is detected (and between 0 and 1)
    },

    PXCMBlobData: {
        CUID: 1413762370,
        MAX_NUMBER_OF_BLOBS: 4,
        NUMBER_OF_EXTREMITIES: 6,

        /** 
            @enum AccessOrderType
            List of the different orders in which the blobs can be accessed
        */
        ACCESS_ORDER_NEAR_TO_FAR: 0,	 /// From near to far hand in scene
        ACCESS_ORDER_LARGE_TO_SMALL: 1,  /// From largest to smallest blob in the scene   		
        ACCESS_ORDER_RIGHT_TO_LEFT: 2,   /// From rightmost to leftmost blob in the scene  

        /**
            @enum ExtremityType
            The identifier of an extremity of the tracked blob
        */  
        EXTREMITY_CLOSEST: 0,       /// The closest point to the camera in the tracked blob
        EXTREMITY_LEFTMOST: 1,	    /// The left-most point of the tracked blob
        EXTREMITY_RIGHTMOST: 2,	    /// The right-most point of the tracked blob 
        EXTREMITY_TOPMOST: 3,		/// The top-most point of the tracked blob
        EXTREMITY_BOTTOMMOST: 4,	/// The bottom-most point of the tracked blob
        EXTREMITY_CENTER: 5,		/// The center point of the tracked blob			
    },

    PXCMFaceData: {
        CUID: 1413759304,

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
        LANDMARK_CHIN: 32,

        LANDMARK_GROUP_LEFT_EYE: 0x0001,
        LANDMARK_GROUP_RIGHT_EYE: 0x0002,
        LANDMARK_GROUP_RIGHT_EYEBROW: 0x0004,
        LANDMARK_GROUP_LEFT_EYEBROW: 0x0008,
        LANDMARK_GROUP_NOSE: 0x00010,
        LANDMARK_GROUP_MOUTH: 0x0020,
        LANDMARK_GROUP_JAW: 0x0040,

        ExpressionsData: {
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
        },

        AlertData: {
            ALERT_NEW_FACE_DETECTED: 1,	        //  a new face enters the FOV and its position and bounding rectangle is available. 
            ALERT_FACE_OUT_OF_FOV: 2,			//  a new face is out of field of view (even slightly). 
            ALERT_FACE_BACK_TO_FOV: 3,			//  a tracked face is back fully to field of view. 
            ALERT_FACE_OCCLUDED: 4,			    //  face is occluded by any object or hand (even slightly).
            ALERT_FACE_NO_LONGER_OCCLUDED: 5,   //  face is not occluded by any object or hand.
            ALERT_FACE_LOST: 6,					//  a face could not be detected for too long, will be ignored.
        },

        ALERT_NAME_SIZE: 30,
    },

    PXCMSenseManager: {
        CUID: -661306591,
        TIMEOUT_INFINITE: -1,
    },

    PXCMCapture: {
        CUID: -2080953776,
        STREAM_LIMIT: 8,

        /** 
            @enum StreamType
            Bit-OR'ed values of stream types, physical or virtual streams.
        */
        STREAM_TYPE_ANY: 0,          /* Unknown/undefined type */
        STREAM_TYPE_COLOR: 0x0001,     /* the color stream type  */
        STREAM_TYPE_DEPTH: 0x0002,     /* the depth stream type  */
        STREAM_TYPE_IR: 0x0004,     /* the infrared stream type */
        STREAM_TYPE_LEFT: 0x0008,     /* the stereoscopic left intensity image */
        STREAM_TYPE_RIGHT: 0x0010,     /* the stereoscopic right intensity image */

        /** 
            @enum DeviceModel
            Describes the device model
        */
        DEVICE_MODEL_GENERIC: 0x00000000,  /* a generic device or unknown device */
        DEVICE_MODEL_F200:  0x0020000E,    /* the Intel(R) RealSense(TM) 3D Camera, model F200 */
        DEVICE_MODEL_IVCAM: 0x0020000E,    /* deprecated: the Intel(R) RealSense(TM) 3D Camera, model F200 */
        DEVICE_MODEL_R200:  0x0020000F,    /* the Intel(R) RealSense(TM) DS4 Camera, model R200 */
        DEVICE_MODEL_DS4:   0x0020000F,    /* deprecated: the Intel(R) RealSense(TM) DS4 Camera */

        /** 
            @enum DeviceOrientation
            Describes the device orientation
        */
        DEVICE_ORIENTATION_ANY: 0x0,  /* Unknown orientation */
        DEVICE_ORIENTATION_USER_FACING: 0x1,  /* A user facing camera */
        DEVICE_ORIENTATION_WORLD_FACING: 0x2,  /* A world facing camera */

        /** 
            @Device Property properties (labels) 
        */
        /* Color Stream Properties */
        PROPERTY_COLOR_EXPOSURE:                1,       /* RW  The color stream exposure, in log base 2 seconds. */
        PROPERTY_COLOR_BRIGHTNESS:              2,       /* RW  The color stream brightness from  -10,000 (pure black) to 10,000 (pure white). */
        PROPERTY_COLOR_CONTRAST:                3,       /* RW  The color stream contrast, from 0 to 10,000. */
        PROPERTY_COLOR_SATURATION:              4,       /* RW  The color stream saturation, from 0 to 10,000. */
        PROPERTY_COLOR_HUE:                     5,       /* RW  The color stream hue, from -180,000 to 180,000 (representing -180 to 180 degrees.) */
        PROPERTY_COLOR_GAMMA:                   6,       /* RW  The color stream gamma, from 1 to 500. */
        PROPERTY_COLOR_WHITE_BALANCE:           7,       /* RW  The color stream balance, as a color temperature in degrees Kelvin. */
        PROPERTY_COLOR_SHARPNESS:               8,       /* RW  The color stream sharpness, from 0 to 100. */
        PROPERTY_COLOR_BACK_LIGHT_COMPENSATION: 9,       /* RW  The color stream back light compensation. */
        PROPERTY_COLOR_GAIN:                    10,      /* RW  The color stream gain adjustment, with negative values darker, positive values brighter, and zero as normal. */
        PROPERTY_COLOR_POWER_LINE_FREQUENCY:    11,      /* RW  The power line frequency in Hz. */
        PROPERTY_COLOR_FOCAL_LENGTH_MM:         12,      /* R   The color-sensor focal length in mm. */
        PROPERTY_COLOR_FIELD_OF_VIEW:           1000,    /* R   The color-sensor horizontal and vertical field of view parameters, in degrees. */
        PROPERTY_COLOR_FOCAL_LENGTH:            1006,    /* R   The color-sensor focal length in pixels. The parameters vary with the resolution setting. */
        PROPERTY_COLOR_PRINCIPAL_POINT:         1008,    /* R   The color-sensor principal point in pixels. The parameters vary with the resolution setting. */

        /* Depth Stream Properties */
        PROPERTY_DEPTH_LOW_CONFIDENCE_VALUE: 201,        /* R   The special depth map value to indicate that the corresponding depth map pixel is of low-confidence. */
        PROPERTY_DEPTH_CONFIDENCE_THRESHOLD: 202,        /* RW  The confidence threshold that is used to floor the depth map values. The range is from  0 to 15. */
        PROPERTY_DEPTH_UNIT:                 204,        /* R   The unit of depth values in micrometer if PIXEL_FORMAT_DEPTH_RAW */
        PROPERTY_DEPTH_FOCAL_LENGTH_MM:      205,        /* R   The depth-sensor focal length in mm. */
        PROPERTY_DEPTH_FIELD_OF_VIEW:        2000,       /* R   The depth-sensor horizontal and vertical field of view parameters, in degrees. */
        PROPERTY_DEPTH_SENSOR_RANGE:         2002,       /* R   The depth-sensor, sensing distance parameters, in millimeters. */
        PROPERTY_DEPTH_FOCAL_LENGTH:         2006,       /* R   The depth-sensor focal length in pixels. The parameters vary with the resolution setting. */
        PROPERTY_DEPTH_PRINCIPAL_POINT:      2008,       /* R   The depth-sensor principal point in pixels. The parameters vary with the resolution setting. */

        /* Device Properties */
        PROPERTY_DEVICE_ALLOW_PROFILE_CHANGE: 302,       /* RW  If true, allow resolution change and throw PXC_STATUS_STREAM_CONFIG_CHANGED */
        PROPERTY_DEVICE_MIRROR:               304,       /* RW  The mirroring options. */

        /* Misc. Properties */
        PROPERTY_PROJECTION_SERIALIZABLE:     3003,      /* R   The meta data identifier of the Projection instance serialization data. */

        /* Device Specific Properties - F200/IVCam */
        PROPERTY_IVCAM_LASER_POWER:            0x10000,  /* RW  The laser power value from 0 (minimum) to 16 (maximum). */
        PROPERTY_IVCAM_ACCURACY:               0x10001,  /* RW  The IVCAM accuracy value. */
        PROPERTY_IVCAM_FILTER_OPTION:          0x10003,  /* RW  The filter option (smoothing aggressiveness) ranged from 0 (close range) to 7 (far range). */
        PROPERTY_IVCAM_MOTION_RANGE_TRADE_OFF: 0x10004,  /* RW  This option specifies the motion and range trade off. The value ranged from 0 (short exposure, range, and better motion) to 100 (long exposure, range). */

        /* Device Specific Properties - R200/DS */
        PROPERTY_DS_CROP:                   0x20000,     /* RW  Indicates whether to crop left and right images to match size of z image*/
        PROPERTY_DS_EMITTER:                0x20001,	 /*	RW  Enable or disable DS emitter*/
        PROPERTY_DS_TEMPERATURE:            0x20002,	 /* R   The temperture of the camera head in celsius */
        PROPERTY_DS_DISPARITY_OUTPUT:       0x20003,	 /* RW  Switches the range output mode between distance (Z) and disparity (inverse distance)*/
        PROPERTY_DS_DISPARITY_MULTIPLIER:   0x20004,	 /* RW  Sets the disparity scale factor used when in disparity output mode. Default value is 32.*/
        PROPERTY_DS_DISPARITY_SHIFT:        0x20005,	 /* RW  Reduces both the minimum and maximum depth that can be computed.                                                                                    Allows range to be computed for points in the near field which would otherwise be beyond the disparity search range.*/
        PROPERTY_DS_MIN_MAX_Z: 			    0x20006,	 /* RW  The minimum z and maximum z in Z units that will be output   */
        PROPERTY_DS_COLOR_RECTIFICATION:    0x20008,	 /* R   if true rectification is enabled to DS color*/
        PROPERTY_DS_DEPTH_RECTIFICATION:    0x20009,	 /* R   if true rectification is enabled to DS depth*/
        PROPERTY_DS_LEFTRIGHT_EXPOSURE:     0x2000A,	 /* RW  The depth stream exposure, in log base 2 seconds. */
        PROPERTY_DS_LEFTRIGHT_GAIN:         0x2000B,	 /* RW  The depth stream gain adjustment, with negative values darker, positive values brighter, and zero as normal. */

        /* Customized properties */
        PROPERTY_CUSTOMIZED:                0x04000000,  /* CUSTOMIZED properties */


        Device: {
            CUID: 0x938401C4,

            /** 
                @enum PowerLineFrequency
                Describes the power line compensation filter values.
            */
            POWER_LINE_FREQUENCY_DISABLED: 0,     /* Disabled power line frequency */
            POWER_LINE_FREQUENCY_50HZ: 1,         /* 50HZ power line frequency */
            POWER_LINE_FREQUENCY_60HZ: 2,         /* 60HZ power line frequency */

            /**
                @enum MirrorMode
                Describes the mirroring options.
            */
            MIRROR_MODE_DISABLED: 0,            /* Disabled. The images are displayed as in a world facing camera.  */
            MIRROR_MODE_HORIZONTAL: 1,          /* The images are horizontally mirrored as in a user facing camera. */

            /**
                @enum IVCAMAccuracy
                Describes the IVCAM accuracy.
            */
            IVCAM_ACCURACY_FINEST: 1,         /* The finest accuracy: 9 patterns */
            IVCAM_ACCURACY_MEDIAN: 2,         /* The median accuracy: 8 patterns (default) */
            IVCAM_ACCURACY_COARSE: 3,         /* The coarse accuracy: 7 patterns */

            /** 
                @enum StreamOption
                Describes the steam options.
            */
            STREAM_OPTION_ANY: 0,
            STREAM_OPTION_DEPTH_PRECALCULATE_UVMAP: 0x0001, /* A flag to ask the device to precalculate UVMap */
            STREAM_OPTION_STRONG_STREAM_SYNC: 0x0002, /* A flag to ask the device to perform strong (HW-based) synchronization on the streams with this flag. */
        },
    },

    PXCMFaceConfiguration: {
        CUID: 1195589960,

		STRATEGY_APPEARANCE_TIME: 0,
		STRATEGY_CLOSEST_TO_FARTHEST: 1,
		STRATEGY_FARTHEST_TO_CLOSEST: 2,
		STRATEGY_LEFT_TO_RIGHT: 3,
		STRATEGY_RIGHT_TO_LEFT: 4,

		SMOOTHING_DISABLED: 0,
		SMOOTHING_MEDIUM: 1,
		SMOOTHING_HIGH: 2,

		RecognitionConfiguration: {
		    REGISTRATION_MODE_CONTINUOUS: 0,	//registers users automatically
		    REGISTRATION_MODE_ON_DEMAND: 1,	//registers users on demand only
            STORAGE_NAME_SIZE: 50,
		},

		FACE_MODE_COLOR: 0,
		FACE_MODE_COLOR_PLUS_DEPTH: 1,
		FACE_MODE_COLOR_STILL: 2
    },

    PXCMSession: {
        CUID: 542328147,

        /** 
            @enum ImplGroup
            The SDK group I/O and algorithm modules into groups and subgroups.
            This is the enumerator for algorithm groups.
        */
        IMPL_GROUP_ANY: 0,             /* Undefine group */
        IMPL_GROUP_OBJECT_RECOGNITION: 0x00000001,    /* Object recognition algorithms */
        IMPL_GROUP_SPEECH_RECOGNITION: 0x00000002,    /* Speech recognition algorithms */
        IMPL_GROUP_SENSOR: 0x00000004,    /* I/O modules */
        IMPL_GROUP_PHOTOGRAPHY: 0x00000008,    /* Photography algorithms */
        IMPL_GROUP_UTILITIES: 0x00000010,    /* Utilities modules */
        IMPL_GROUP_CORE: 0x80000000,    /* Core SDK modules */
        IMPL_GROUP_USER: 0x40000000,    /* User defined algorithms */

        /**
        @enum ImplSubgroup
        The SDK group I/O and algorithm modules into groups and subgroups.
        This is the enumerator for algorithm subgroups.
        */
        IMPL_SUBGROUP_ANY                   : 0,            /* Undefined subgroup */
        IMPL_SUBGROUP_FACE_ANALYSIS         : 0x00000001,    /* face analysis subgroup */
        IMPL_SUBGROUP_GESTURE_RECOGNITION   : 0x00000010,    /* gesture recognition subgroup */
        IMPL_SUBGROUP_SEGMENTATION          : 0x00000020,    /* segmentation subgroup */
        IMPL_SUBGROUP_PULSE_ESTIMATION      : 0x00000040,    /* pulse estimation subgroup */
        IMPL_SUBGROUP_EMOTION_RECOGNITION   : 0x00000080,    /* emotion recognition subgroup */
        IMPL_SUBGROUP_OBJECT_TRACKING       : 0x00000100,    /* object detection subgroup */
        IMPL_SUBGROUP_3DSEG                 : 0x00000200,    /* user segmentation subgroup */
        IMPL_SUBGROUP_3DSCAN                : 0x00000400,    /* mesh capture subgroup */
        IMPL_SUBGROUP_SCENE_PERCEPTION      : 0x00000800,    /* scene perception subgroup */
        IMPL_SUBGROUP_ENHANCED_PHOTOGRAPHY  : 0x00001000,    /* scene perception subgroup */

        IMPL_SUBGROUP_AUDIO_CAPTURE         : 0x00000001,    /* audio capture subgroup */
        IMPL_SUBGROUP_VIDEO_CAPTURE         : 0x00000002,    /* video capture subgroup */
        IMPL_SUBGROUP_SPEECH_RECOGNITION    : 0x00000001,    /* speech recognition subgroup */
        IMPL_SUBGROUP_SPEECH_SYNTHESIS      : 0x00000002,    /* speech synthesis subgroup */
    },

    PXCMSpeechRecognition: {
        CUID: 0x8013C527,
        NBEST_SIZE: 4,
        SENTENCE_BUFFER_SIZE: 1024,
        TAG_BUFFER_SIZE: 1024,

        /**
            @enum AlertType
            Enumerates all supported alert events.
        */
        ALERT_VOLUME_HIGH           : 0x00001,        /** The volume is too high. */
        ALERT_VOLUME_LOW            : 0x00002,        /** The volume is too low. */
        ALERT_SNR_LOW               : 0x00004,        /** Too much noise. */
        ALERT_SPEECH_UNRECOGNIZABLE : 0x00008,        /** There is some speech available but not recognizable. */
        ALERT_SPEECH_BEGIN          : 0x00010,        /** The begining of a speech. */
        ALERT_SPEECH_END            : 0x00020,        /** The end of a speech. */
        ALERT_RECOGNITION_ABORTED   : 0x00040,        /** The recognition is aborted due to device lost, engine error, etc. */
        ALERT_RECOGNITION_END: 0x00080,        /** The recognition is completed. The audio source no longer provides data. */

        /** 
            @enum LanguageType
            Enumerate all supported languages.
        */
        LANGUAGE_US_ENGLISH : 0x53556e65,       /** US English */
        LANGUAGE_GB_ENGLISH : 0x42476e65,       /** British English */
        LANGUAGE_DE_GERMAN  : 0x45446564,        /** German */
        LANGUAGE_US_SPANISH : 0x53557365,       /** US Spanish */
        LANGUAGE_LA_SPANISH : 0x414c7365,       /** Latin American Spanish */
        LANGUAGE_FR_FRENCH  : 0x52467266,        /** French */
        LANGUAGE_IT_ITALIAN : 0x54497469,       /** Italian */
        LANGUAGE_JP_JAPANESE : 0x504a616a,      /** Japanese */
        LANGUAGE_CN_CHINESE : 0x4e43687a,       /** Simplified Chinese */
        LANGUAGE_BR_PORTUGUESE: 0x52427470,    /** Portuguese */

        /** 
            @enum GrammarFileType
            Enumerate all supported grammar file types.
        */
		GFT_NONE              : 0,  /**  unspecified type, use filename extension */
        GFT_LIST              : 1,  /**  text file, list of commands */
        GFT_JSGF              : 2,  /**  Java Speech Grammar Format */
        GFT_COMPILED_CONTEXT  : 5,  /**  Previously compiled format (vendor specific) */

        /** 
            @enum VocabFileType
            Enumerate all supported vocabulary file types.
        */
        VFT_NONE : 0,  /**  unspecified type, use filename extension */
        VFT_LIST : 1,  /**  text file*/
    },

    /**
       This enumeration defines various return codes that SDK interfaces
       use.  Negative values indicate errors, a zero value indicates success,
       and positive values indicate warnings.
     */
    PXCM_STATUS_NO_ERROR:0,
    PXCM_STATUS_FEATURE_UNSUPPORTED:     -1,     /* Unsupported feature */
    PXCM_STATUS_PARAM_UNSUPPORTED:       -2,     /* Unsupported parameter(s) */
    PXCM_STATUS_ITEM_UNAVAILABLE:        -3,     /* Item not found/not available */
    PXCM_STATUS_HANDLE_INVALID:          -101,   /* Invalid session, algorithm instance, or pointer */
    PXCM_STATUS_ALLOC_FAILED:            -102,   /* Memory allocation failure */
    PXCM_STATUS_DEVICE_FAILED:           -201,   /* Acceleration device failed/lost */
    PXCM_STATUS_DEVICE_LOST:             -202,   /* Acceleration device lost */
    PXCM_STATUS_DEVICE_BUSY:             -203,   /* Acceleration device busy */
    PXCM_STATUS_EXEC_ABORTED:            -301,   /* Execution aborted due to errors in upstream components */
    PXCM_STATUS_EXEC_INPROGRESS:         -302,   /* Asynchronous operation is in execution */
    PXCM_STATUS_EXEC_TIMEOUT:            -303,   /* Operation time out */
	PXCM_STATUS_FILE_WRITE_FAILED:       -401,   /** Failure in open file in WRITE mode */
    PXCM_STATUS_FILE_READ_FAILED:        -402,   /** Failure in open file in READ mode */
    PXCM_STATUS_FILE_CLOSE_FAILED:       -403,   /** Failure in close a file handle */
    PXCM_STATUS_DATA_UNAVAILABLE:         -501,   /** Data not available for MW model or processing */
	PXCM_STATUS_DATA_NOT_INITIALIZED:	 -502,	/** Data failed to initialize */
    PXCM_STATUS_INIT_FAILED:             -503,   /** Module failure during initialization */
    PXCM_STATUS_STREAM_CONFIG_CHANGED:           -601,   /** Configuration for the stream has changed */
    PXCM_STATUS_POWER_UID_ALREADY_REGISTERED:    -701,
    PXCM_STATUS_POWER_UID_NOT_REGISTERED:        -702,
    PXCM_STATUS_POWER_ILLEGAL_STATE:             -703,
    PXCM_STATUS_POWER_PROVIDER_NOT_EXISTS:       -704,
    PXCM_STATUS_CAPTURE_CONFIG_ALREADY_SET : -801, /** parameter cannot be changed since configuration for capturing has been already set */
    PXCM_STATUS_COORDINATE_SYSTEM_CONFLICT : -802,	/** Mismatched coordinate system between modules */
    PXCM_STATUS_TIME_GAP:                101,    /* time gap in time stamps */
    PXCM_STATUS_PARAM_INPLACE:           102,    /* the same parameters already defined */
    PXCM_STATUS_DATA_NOT_CHANGED:        103,	 /* Data not changed (no new data available)*/
    PXCM_STATUS_PROCESS_FAILED:          104     /* Module failure during processing */
};


/** Create an instance of the PXCMSenseManager .
    @return Promise object with PXCMSenseManager object in success callback.
*/
PXCMSenseManager_CreateInstance = function () {
    if (RealSense.connection == null) RealSense.connection = new RealSenseConnection();
    return RealSense.connection.call(0, 'PXCMSenseManager_CreateInstance', { 'js_version': RealSenseVersion }).then(function (result) {
        var sense = new PXCMSenseManager(result.instance.value);
        sense.StartHeartBeats();
        return sense;
    })
};

/** Create an instance of the PXCMSession.
    @return Promise object with PXCMSePXCMSessionnseManager object in success callback.
*/
PXCMSession_CreateInstance = function () {
    if (RealSense.connection == null) RealSense.connection = new RealSenseConnection();
    return RealSense.connection.call(0, 'PXCMSession_CreateInstance', { 'js_version': RealSenseVersion }).then(function (result) {
        return new PXCMSession(result.instance.value);
    })
};

function PXCMBase(instance) {
    var instance = instance;
    //var prefix = name.concat('_');
    var self = this;

    /** Call module function by function name
		@param {Boolean}    functionName        Full function name like 'PXCMSession_QueryVersion'
		@param {Object}     functionParams      Function input parameters (same property names as in C++/C# interfaces)
		@return Funtion output (output parameters in C++/C# interfaces) as a promise object
    */
    this.Invoke = function (functionName, functionParams) {
        return RealSense.connection.call(instance, functionName, functionParams);
    }
}

/**
    This is the main object for the Intel® RealSense™ SDK pipeline.
    Control the pipeline execution with this interface.
*/
function PXCMSenseManager(instance) {
    var instance = instance;
    var self = this;
    var attachData = false;
    var sessionStopped = true; 
    this.mid_callbacks = {};
    var hbIntervalID = undefined;

    /** Enable the hand module in the SenseManager pipeline.
        @param {function} onData    Callback function to receive per-frame recognition results
        @return Promise object
    */
    this.EnableHand = function (onData) {
        attachData = true;
        return this.EnableModule(pxcmConst.PXCMHandModule.CUID, 0, onData);
    }

    /** Enable the face module in the SenseManager pipeline.
        @param {function} onData    Callback function to receive per-frame recognition results
        @return Promise object
    */
    this.EnableFace = function (onData) {
        attachData = true; 
        return this.EnableModule(pxcmConst.PXCMFaceModule.CUID, 0, onData);
    }

    /** Enable the blob module in the SenseManager pipeline.
        @param {function} onData    Callback function to receive per-frame recognition results
        @return Promise object
    */
    this.EnableBlob = function (onData) {
        return this.EnableModule(pxcmConst.PXCMBlobModule.CUID, 0, onData);
    }

    /** Query the PXCMCaptureManager object for changing capture configuration
        @return Promise object with PXCMCaptureManager object in success callback
    */
    this.QueryCaptureManager = function () {
        return RealSense.connection.call(instance, 'PXCMSenseManager_QueryCaptureManager').then(function (result) {
            return new PXCMCaptureManager(result.instance.value);
        });
    }

    /** Initialize the SenseManager pipeline for streaming with callbacks. The application must 
        enable raw streams or algorithm modules before this function.
        @param {function} onConnect     Optional callback when there is a device connection or disconnection
        @return Promise object
    */
    this.Init = function (onConnect, onStatus, onData) {
        if (onConnect !== 'undefined' && onConnect != null) {
            RealSense.connection.subscribe_callback("PXCMSenseManager_OnConnect", this, onConnect);
        }
        if (onStatus !== 'undefined' && onStatus != null) {
            RealSense.connection.subscribe_callback("PXCMSenseManager_OnStatus", this, onStatus);
        }

        if (onData != undefined) {
            self.smgr_callback = onData;
        }

        return RealSense.connection.call(instance, 'PXCMSenseManager_Init', { 'handler': true, 'onModuleProcessedFrame': true, 'onConnect': onConnect !== 'undefined' && onConnect != null, 'onStatus': onStatus !== 'undefined' && onStatus != null, 'attachDataToCallbacks': attachData, 'enableFrameBlockingToCallbacks':false},5000);
    }

    /** Start streaming with reporting per-frame recognition results to callbacks specified in Enable* functions.
        The application must initialize the pipeline before calling this function.
        @return Promise object
    */
    this.StreamFrames = function () {
        sessionStopped = false; 
        return RealSense.connection.call(instance, 'PXCMSenseManager_StreamFrames', { blocking: false });
    };

    /** Pause/Resume the execution of the hand module.
        @param {Boolean} pause        If true, pause the module. Otherwise, resume the module.
        @return Promise object
    */
    this.PauseHand = function (pause) {
        return this.PauseModule(pxcmConst.PXCMHandModule.CUID, pause);
    }

    /** Pause/Resume the execution of the face module.
        @param {Boolean} pause        If true, pause the module. Otherwise, resume the module.
        @return Promise object
    */
    this.PauseFace = function (pause) {
        return this.PauseModule(pxcmConst.PXCMFaceModule.CUID, pause);
    }

    /** Pause/Resume the execution of the blob module.
        @param {Boolean} pause        If true, pause the module. Otherwise, resume the module.
        @return Promise object
    */
    this.PauseBlob = function (pause) {
        return this.PauseModule(pxcmConst.PXCMBlobModule.CUID, pause);
    }

    /** Close the execution pipeline.
        @return Promise object
    */
    this.Close = function () {
        sessionStopped = true;
        this.StopHeartBeats(); 
        return RealSense.connection.call(instance, 'PXCMSenseManager_Close', {}, 5000);
    }

    /** Start to send HeartBeat messages to web service.
    */

    this.SendHeartBeatMessage = function () {
        return RealSense.connection.call(instance, 'PXCMSenseManager_HeartBeat', {});
    }


    this.StartHeartBeats = function() {
        hbIntervalID = setInterval(this.SendHeartBeatMessage, 1000);
    }
    
    this.StopHeartBeats = function () {

        if (hbIntervalID != undefined) {
            clearInterval(hbIntervalID);
            hbIntervalID = undefined;
        }
    }

    ///////////////////////////////////////////////////////////////
    // Internal functions

    this.EnableModule = function (mid, mdesc, onData) {  
        var res;
        return RealSense.connection.call(instance, 'PXCMSenseManager_EnableModule', { mid: mid, mdesc: mdesc }).then(function (result) {
            res = result;
            return RealSense.connection.call(instance, 'PXCMSenseManager_QueryModule', { mid: mid });
        }).then(function (result2) {
            var module = null;
            if (mid == pxcmConst.PXCMFaceModule.CUID) module = new PXCMFaceModule(result2.instance.value); else
            if (mid == pxcmConst.PXCMHandModule.CUID) module = new PXCMHandModule(result2.instance.value); else
            if (mid == pxcmConst.PXCMBlobModule.CUID) module = new PXCMBlobModule(result2.instance.value); else
                module = new PXCMBase(result2.instance.value);
            if (onData != undefined) {
                self.mid_callbacks[mid] = { callback: onData };
                res.instance = result2.instance.value;
                self.mid_callbacks[mid].instance = result2.instance.value;
                
                self.mid_callbacks[mid].module_instance = result2.instance.value;
                self.mid_callbacks[mid].module = module;   
            }
            return module;
        });
    }

    this.PauseModule = function (mid, pause) {
        return RealSense.connection.call(instance, 'PXCMSenseManager_PauseModule', { 'mid': mid, 'pause': pause });
    }

    this.EnableStreams = function (sdesc, onData) {
        this.mid_callbacks[mid] = { callback: onData };
        return RealSense.connection.call(instance, 'PXCMSenseManager_EnableStreams', { 'sdesc': sdesc });
    }

    // Callback with mutex object from server
    this.OnModuleProcessedFrame = function (response, self) {
        if (self.mid_callbacks[response.mid]) {
            if (!sessionStopped) {
                var callback = self.mid_callbacks[response.mid].callback;
                var module = self.mid_callbacks[response.mid].module;
                callback(response.mid, module, response);
            }
        } else if (self.smgr_callback != undefined) {
            self.smgr_callback(response.mid, null, response);
        }

        if (response.blocking)
            RealSense.connection.call(instance, 'PXC_SignalEvent', { 'eventID': response.eventID });
        return; 
    };

    RealSense.connection.subscribe_callback("PXCMSenseManager_OnModuleProcessedFrame", this, this.OnModuleProcessedFrame);
}

function PXCMCaptureManager(instance) {
    var instance = instance;
    var self = this;

    /**
       @brief  Return the capture instance.
       @return the capture instance.
   */
    this.QueryCapture = function () {
        return RealSense.connection.call(instance, 'PXCMCaptureManager_QueryCapture').then(function (result) {
            return new PXCMCapture(result.instance.value);
        });
    }

    /**
        @brief  Return the device instance.
        @return the device instance.
    */
    this.QueryDevice = function () {
        return RealSense.connection.call(instance, 'PXCMCaptureManager_QueryDevice').then(function (result) {
            return new PXCMDevice(result.instance.value);
        });
    }

    /**
        @brief    Return the stream resolution of the specified stream type.
        @param {Number} type    The stream type, COLOR=1, DEPTH=2
        @return Promise object with property 'size' : { 'width' : Number, 'height' : Number }
    */
    this.QueryImageSize = function (type) {
        return RealSense.connection.call(instance, 'PXCMCaptureManager_QueryImageSize', { 'type': type });
    };
}

function PXCMCapture(instance) {
    var instance = instance;
    var self = this;

    /** 
        @brief Return the device information             
        @param[in] pointer to the DeviceInfo structure, to be returned.
    */
    this.QueryDeviceInfo = function (index) {
        return RealSense.connection.call(instance, 'PXCMCapture_QueryDeviceInfoAggregated').then(function (result) {
            var key = 'device' + index.toString();
            return result[key];
        });
    };

    this.QueryDeviceInfo = function () {
        return RealSense.connection.call(instance, 'PXCMCapture_QueryDeviceInfoAggregated').then(function (result) {
            return result['device0'];
        });
    };
}

function PXCMDevice(instance) {
    var instance = instance;
    var self = this;

    this.QueryDeviceInfo = function (label) {
        return RealSense.connection.call(instance, 'PXCMCapture_Device_QueryDeviceInfo').then(function (result) {
            return result.dinfo;
        });
    };

    /** 
        @brief Query device property             
    */
    this.QueryProperty = function (label) {
        return RealSense.connection.call(instance, 'PXCMCapture_Device_QueryProperty', { 'label': label }).then(function (result) {
            return result.value;
        });
    };
}

function PXCMHandModule(instance) {
    var instance = instance;
    var self = this;

    /** 
	    Create a new instance of the hand-module's active configuration.
	    @return Configuration instance as a promise object
	*/
    this.CreateActiveConfiguration = function () {
        return RealSense.connection.call(instance, 'PXCMHandModule_CreateActiveConfiguration').then(function (result) {
            return new PXCMHandConfiguration(result.instance.value);
        });
    };

    /** 
        Create a new instance of the hand-module's output data 
        @return a pointer to the output-data instance
        @see PXCMHandData
    */
    this.CreateOutput = function () {
        return RealSense.connection.call(instance, 'PXCMHandModule_CreateOutput').then(function (result) {
            return new PXCMHandData(result.instance.value);
        });
    };
}

function PXCMHandConfiguration(instance) {
    var instance = instance;
    var self = this;

    /** Enable all gestures
		@param {Boolean} continuousGesture  Set to "true" to get an event at every frame, or "false" to get only start and end states of the gesture
		@return Promise object
    */
    this.EnableAllGestures = function (continuousGesture) {
        return RealSense.connection.call(instance, 'PXCMHandConfiguration_EnableAllGestures', { 'continuousGesture': continuousGesture });
    };

    /** Enable all alert messages.
		@return Promise object
	*/
    this.EnableAllAlerts = function () {
        return RealSense.connection.call(instance, 'PXCMHandConfiguration_EnableAllAlerts');
    };

    /** Disable all gestures
		@param {Boolean} continuousGesture  Set to "true" to get an event at every frame, or "false" to get only start and end states of the gesture
		@return Promise object
    */
    this.DisableAllGestures = function () {
        return RealSense.connection.call(instance, 'PXCMHandConfiguration_DisableAllGestures');
    }

    /** Disable all alert messages.
		@return Promise object
	*/
    this.DisableAllAlerts = function () {
        return RealSense.connection.call(instance, 'PXCMHandConfiguration_DisableAllAlerts');
    }

    /** Commit the configuration changes to the module
		This method must be called in order for any configuration changes to actually apply
		@return Promise object
	*/
    this.ApplyChanges = function () {
        return RealSense.connection.call(instance, 'PXCMHandConfiguration_ApplyChanges');
    }
}

function PXCMHandData(instance) {
    var instance = instance;
    var self = this;

    this.Update = function () {
        return RealSense.connection.call(instance, 'PXCMHandData_Update');
    }

    this.QueryNumberOfHands = function () {
        return RealSense.connection.call(instance, 'PXCMHandData_QueryNumberOfHands').then (function(result) {
            return result.number;
        });
    }

    this.QueryHandData = function (index) {
        return RealSense.connection.call(instance, 'PXCMHandData_QueryHandData', {'index': index}).then(function (result) {
            if (result.instance.value != 0)
	        return new PXCMHandData_IHand(result.instance.value);
            else return null;
        }); 
    }
}

function PXCMHandData_IHand(instance) {
    var instance = instance;
    var self = this;
 
    this.QueryTrackedJoint = function (jointLabel) {
        return RealSense.connection.call(instance, 'PXCMHandData_IHand_QueryTrackedJoint', { 'jointLabel': jointLabel }).then(function (result) {
            return result.jointData;
        });
    }  
}

function PXCMBlobModule(instance) {
    var instance = instance;
    var self = this;

    /** 
	    Create a new instance of the blob module's active configuration.
	    @return Configuration instance as a promise object
	*/
    this.CreateActiveConfiguration = function () {
        return RealSense.connection.call(instance, 'PXCMBlobModule_CreateActiveConfiguration').then(function (result) {
            return new PXCMBlobConfiguration(result.instance.value);
        });
    };

    /** 
        Create a new instance of the blob-module's output data 
        @return a pointer to the output-data instance
        @see PXCMBlobData
    */
    this.CreateOutput = function () {
        return RealSense.connection.call(instance, 'PXCMBlobModule_CreateOutput').then(function (result) {
            return new PXCMBlobData(result.instance.value);
        });
    };
}

function PXCMBlobConfiguration(instance) {
    var instance = instance;
    var self = this;

    /**
        @brief Sets the strength of the smoothing of the segmentation image
        @param[in] smoothingValue: ranging from 0 (not smoothed) to 1 (very smooth)
        @ Returns PXCM_STATUS_NO_ERROR, if the smoothing value is set successfully
                PXCM_STATUS_PARAM_UNSUPPORTED if smoothing value is out of range
    */
    this.SetSegmentationSmoothingValue = function (smoothingValue) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetSegmentationSmoothingValue', { 'smoothingValue': smoothingValue });
    }

    /**
        @brief Sets the strength of the smoothing of the contours
        @param[in] smoothingValue: ranging from 0 (not smoothed) to 1 (very smooth)
        @ Returns PXCM_STATUS_NO_ERROR, if the smoothing value is set successfully
                PXCM_STATUS_PARAM_UNSUPPORTED if smoothing value is out of range
    */
    this.SetContourSmoothingValue = function (smoothingValue) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetContourSmoothingValue', { 'smoothingValue': smoothingValue });
    }

    /** 
        @brief Set the maximal number of blobs that can be detected 
        The default number of blobs that will be detected is 1
        @param[in] maxBlobs the maximal number of blobs that can be detected (limited to 4)
        @return PXCM_STATUS_NO_ERROR if maxBlobs is valid;  
                PXCM_STATUS_PARAM_UNSUPPORTED, maxBlobs will remain the last valid value
    */
    this.SetMaxBlobs = function (maxBlobs) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetMaxBlobs', { 'maxBlobs': maxBlobs });
    }

    /** 
        @brief Set the maximal distance limit from the camera. 
        Blobs will be objects that appear between the camera and the maxDistance limit.
        @param[in] maxDistance the maximal distance from the camera (has to be a positive value) 
        @return PXCM_STATUS_NO_ERROR if maxDistance is valid; otherwise, return the following error:
                PXCM_STATUS_PARAM_UNSUPPORTED, maxDistance will remain the last valid value
    */
    this.SetMaxDistance = function (maxDistance) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetMaxDistance', { 'maxDistance': maxDistance });
    }

    /**
        @brief Set the maximal depth of a blob (maximal distance between closest and furthest points on blob)
        @param[in] maxDepth the maximal depth of the blob (has to be a positive value) 
        @return PXCM_STATUS_NO_ERROR if maxDepth is valid; otherwise, return the following error:
                PXCM_STATUS_PARAM_UNSUPPORTED, maxDepth will remain the last valid value
    */
    this.SetMaxObjectDepth = function (maxDepth) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetMaxObjectDepth', { 'maxDepth': maxDepth });
    }

    /** 
        @brief Set the minimal blob size in pixels
        Any blob that is smaller than threshold will be cleared during "ProcessImage".
        @param[in] minBlobSize the minimal blob size in pixels (cannot be more than a quarter of image-size)
        @return PXCM_STATUS_NO_ERROR if minBlobSize is valid; otherwise, return the following error:
                PXCM_STATUS_PARAM_UNSUPPORTED, minimal blob size will remain the last valid size
    */
    this.SetMinBlobSize = function (minBlobSize) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetMinBlobSize', { 'minBlobSize': minBlobSize });
    }

    /**
        @brief Enable extraction of the segmentation image
        @param[in] enableFlag flag indicating if the segmentation image should be extracted 
        @Return PXCM_STATUS_NO_ERROR, if the enable flag is set successfully
    */
    this.EnableSegmentationImage = function (enableFlag) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_EnableSegmentationImage', { 'enableFlag': enableFlag });
    }

    /**
        @brief Enable extraction of the contour data
        @param[in] enableFlag flag indicating if the contour-extraction should be enabled 
        @Return PXCM_STATUS_NO_ERROR, if the enable flag is set successfully
    */
    this.EnableContourExtraction = function (enableFlag) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_EnableContourExtraction', { 'enableFlag': enableFlag });
    }

    /** 
        @brief Set the minimal contour size in points
        Any contour that is smaller than threshold will be cleared during "ProcessImage".
        @param[in] minContourSize the minimal contour size in points
        @return PXCM_STATUS_NO_ERROR if minContourSize is valid; otherwise, return the following error:
                PXCM_STATUS_PARAM_UNSUPPORTED, minimal contour size will remain the last valid size
    */
    this.SetMinContourSize = function (minContourSize) {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_SetMinContourSize', { 'minContourSize': minContourSize });
    }

    /** Commit the configuration changes to the module
		This method must be called in order for any configuration changes to actually apply
		@return Promise object
	*/
    this.ApplyChanges = function () {
        return RealSense.connection.call(instance, 'PXCMBlobConfiguration_ApplyChanges');
    }
}

function PXCMBlobData(instance) {
    var instance = instance;
    var self = this;

    this.Update = function () {
        return RealSense.connection.call(instance, 'PXCMBlobData_Update');
    }

    this.QueryNumberOfBlobs = function () {
        return RealSense.connection.call(instance, 'PXCMBlobData_QueryNumberOfBlobs').then(function (result) {
            return result.number;
        });
    }

    this.QueryBlobByAccessOrder = function (index, accessOrderType) {
        return RealSense.connection.call(instance, 'PXCMBlobData_QueryBlobByAccessOrder', { 'index': index, 'accessOrderType': accessOrderType }).then(function (result) {
	    if (result.blobData.value != 0)
            	return new PXCMBlobData_IBlob(result.blobData.value);
	    else
		return null;
        });
    }
}

function PXCMBlobData_IBlob(instance) {
    var instance = instance;
    var self = this;

    // QuerySegmentationImage is not implemented 

    this.QueryExtremityPoint = function (extremityLabel) {
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryExtremityPoint', {'extremityLabel': extremityLabel }).then(function (result) {
            return result.extremityPoint;
        });
    }

    this.QueryPixelCount = function () {
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryPixelCount', {}).then(function (result) {
            return result.pixels;
        });
    }

    this.QueryNumberOfContours = function () {
        //return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryNumberOfContours', {});
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryNumberOfContours', {}).then(function (result) {
            return result.contours;
        }); 
    }

    this.QueryContourPoints = function (index, max) {
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryContourPoints', { 'index': index, 'max': max }).then(function (result) {
            var points = [];
            for (idx=0; idx<max; idx++) {
                var key = 'contour' + idx.toString();
                points.push(result[key]);
            }
            return points;
        });   
    }

    this.QueryContourSize = function (index) {
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_QueryContourSize', { 'index': index }).then(function(result) {
            return result.contourSize;
        });
    }

    this.IsContourOuter = function (index) {
        return RealSense.connection.call(instance, 'PXCMBlobData_IBlob_IsContourOuter', { 'index': index }).then(function (result) {
            return result.isCounterOuter;
        });
    }
}

function PXCMFaceModule(instance) {
    var instance = instance;
    var self = this;

    /** 
	Create a new instance of the face-module's active configuration.
	@return Configuration instance as a promise object
	*/
    this.CreateActiveConfiguration = function () {
        var config;
        return RealSense.connection.call(instance, 'PXCMFaceModule_CreateActiveConfiguration').then(function (result) {
            config = new PXCMFaceConfiguration(result.instance.value);
            return RealSense.connection.call(result.instance.value, 'PXCMFaceConfiguration_GetConfigurations');
        }).then(function (result) {
            config.configs = result.configs;
            return config;
        });
    }
}

function PXCMFaceConfiguration(instance) {
    var instance = instance;
    var self = this;
    var configs; // current configuration

    /** Set tracking mode. 
		@param {Number} FACE_MODE_COLOR (0) or FACE_MODE_COLOR_PLUS_DEPTH (1) or FACE_MODE_COLOR_STILL (2)
		@return Promise object
	*/
    this.SetTrackingMode = function (trackingMode) {
        return RealSense.connection.call(instance, 'PXCMFaceConfiguration_SetTrackingMode', { 'trackingMode': trackingMode });
    }

    /** Commit the configuration changes to the module
		This method must be called in order for any configuration changes to actually apply
		@return Promise object
	*/
    this.ApplyChanges = function () {
        return RealSense.connection.call(instance, 'PXCMFaceConfiguration_ApplyChanges', { 'configs': this.configs });
    }
}

function PXCMSession(instance) {
    var instance = instance;
    var self = this;

    /** 
        @brief Return the SDK version.
        @return Promise object with the SDK version.
    */
    this.QueryVersion = function () {
        return RealSense.connection.call(instance, 'PXCMSession_QueryVersion');
    }

    /** 
        @brief Search a module implementation.
        @param[in]    templat           The template for the module search.
        @param[in]    idx               The zero-based index to retrieve multiple matches.
        @return Promise object with module descritpor
    */
    this.QueryImpl = function (templat, idx) {
        return RealSense.connection.call(instance, 'PXCMSession_QueryImpl', { templat: templat, idx: idx });
    }

    /** 
        @brief Create an instance of the specified module.
        @param[in]    desc              Optional module descriptor.
        @param[in]    iuid              Optional module implementation identifier.
        @param[in]    cuid              Interface identifier.
        @param[out]   instance          The created instance, to be returned.
        @return Requested object or PXCMBase object (if unknown interface) as a promise object
    */
    this.CreateImpl = function (desc, iuid, cuid) {
        self.cuid = cuid;
        return RealSense.connection.call(instance, 'PXCMSession_CreateImpl', { 'desc': desc, 'iuid': iuid, 'cuid': cuid }, 5000).then(function (result) {
            var object = null;
            if (self.cuid == pxcmConst.PXCMSenseManager.CUID) {
                object = new PXCMSenseManager(result.instance.value);
                object.StartHeartBeats();
            }
            if (self.cuid == pxcmConst.PXCMCaptureManager.CUID) object = new PXCMCaptureManager(result.instance.value);
            if (self.cuid == pxcmConst.PXCMSpeechRecognition.CUID) object = new PXCMSpeechRecognition(result.instance.value);
            if (self.cuid == pxcmConst.PXCMHandModule.CUID) object = new PXCMHandModule(result.instance.value);
            if (self.cuid == pxcmConst.PXCMHandConfiguration.CUID) object = new PXCMHandConfiguration(result.instance.value);
            if (self.cuid == pxcmConst.PXCMBlobModule.CUID) object = new PXCMBlobModule(result.instance.value);
            if (self.cuid == pxcmConst.PXCMBlobConfiguration.CUID) object = new PXCMBlobConfiguration(result.instance.value);
	    if (self.cuid == pxcmConst.PXCMBlobData.CUID) object = new PXCMBlobData(result.instance.value);
            if (self.cuid == pxcmConst.PXCMFaceModule.CUID) object = new PXCMFaceModule(result.instance.value);
            if (self.cuid == pxcmConst.PXCMFaceConfiguration.CUID) object = new PXCMFaceConfiguration(result.instance.value);
            if (object == null) object = new PXCMBase(result.instance.value);
            return object;
        })
    }

    /** 
        @brief Return the module descriptor
        @param[in]  module          The module instance
		@return Promise object with module descriptor
	*/
    this.QueryModuleDesc = function (module) {
        return RealSense.connection.call(instance, 'PXCMSession_QueryModuleDesc', { 'module': module.instance });
    }
}

function PXCMSpeechRecognition(instance) {
    var instance = instance;
    var self = this;

    /**
        @brief The function returns the available algorithm configurations.
        @return Array of available configurations as Promise object
	*/
    this.QuerySupportedProfiles = function (idx) {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_QuerySupportedProfiles');
    }

    /**
        @brief The function returns the working algorithm configurations.
        @return The algorithm configuration, as Promise object
	*/
    this.QueryProfile = function () {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_QueryProfile', { 'idx': -1 });
    }

    /**
        @brief The function sets the working algorithm configurations. 
        @param[in] pinfo       The algorithm configuration.
		@return Promise object
	*/
    this.SetProfile = function (pinfo) {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_SetProfile', { 'pinfo': pinfo });
    }

    /** 
        @brief The function builds the recognition grammar from the list of strings. 
        @param[in] gid          The grammar identifier. Can be any non-zero number.
        @param[in] cmds         The string list.
        @param[in] labels       Optional list of labels. If not provided, the labels are 1...ncmds.
		@return Promise object
	*/
    this.BuildGrammarFromStringList = function (gid, cmds, labels) {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_BuildGrammarFromStringList', { 'gid': gid, 'cmds': cmds, 'labels': labels });
    }

    /** 
        @brief The function deletes the specified grammar and releases any resources allocated.
        @param[in] gid          The grammar identifier.
		@return Promise object
	*/
    this.ReleaseGrammar = function (gid) {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_ReleaseGrammar', { 'gid': gid });
    }

    /** 
        @brief The function sets the active grammar for recognition.
        @param[in] gid          The grammar identifier.
		@return Promise object
	*/
    this.SetGrammar = function (gid) {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_SetGrammar', { 'gid': gid }, 30000); // Loading language model may take long time
    }

    /** 
        @brief The function sets the dictation recognition mode. 
        The function may take some time to initialize.
		@return Promise object
	*/
    this.SetDictation = function () {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_SetGrammar', { 'gid': 0 }, 30000); // Loading language model may take long time
    }

    /** 
        @brief The function starts voice recognition.
        @param[in] OnRecognition    The callback function is invoked when there is some speech recognized.
        @param[in] handler          The callback function is triggered by any alert event.
		@return Promise object
	*/
    this.StartRec = function (OnRecognition, OnAlert) {
        RealSense.connection.subscribe_callback("PXCMSpeechRecognition_OnRecognition", this, OnRecognition);
        RealSense.connection.subscribe_callback("PXCMSpeechRecognition_OnAlert", this, OnAlert);
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_StartRec', { 'handler': true, 'onRecognition': true, 'onAlert': true }, 20000); // Loading language model may take several seconds
    }

    /** 
        @brief The function stops voice recognition immediately.
		@return Promise object
	*/
    this.StopRec = function () {
        return RealSense.connection.call(instance, 'PXCMSpeechRecognition_StopRec', {});
    }

    this.Release = function () {
        return RealSense.connection.call(instance, 'PXCMBase_Release', {}, 5000);
    }
}


// layout of object received in face callback (callback specified in EnableFaceModule)
var FaceDataLayout = {
    timestamp: Number,
    faces: [{
        userID: Number,
        detection: {
            faceAverageDepth: Number,
            faceBoundingRect: {
                x: Number,
                y: Number,
                w: Number,
                h: Number,
            }
        },
        landmarks: {
            landmarksPoints: [{
                label: Number,
                confidenceImage: Number,
                confidenceWorld: Number,
                world: {
                    x: Number,
                    y: Number,
                    z: Number,
                },
                image: {
                    x: Number,
                    y: Number,
                }
            }]
        },
        pose: {
            headPosition: {
                x: Number,
                y: Number,
                z: Number,
            },
            poseEulerAngles: {
                yaw: Number,
                pitch: Number,
                roll: Number,
            },
            poseQuaternion: {
                x: Number,
                y: Number,
                z: Number,
                w: Number,
            }
        },
        expressions: {
            browRaiserLeft: Number,
            browRaiserRight: Number,
            browLowererLeft: Number,
            browLowererRight: Number,
            smile: Number,
            mouthOpen: Number,
            eyesClosedLeft: Number,
            eyesClosedRight: Number,
            headTurnLeft: Number,
            headTurnRight: Number,
            headUp: Number,
            headDown: Number,
            headTiltLeft: Number,
            headTiltRight: Number,
            eyesTurnLeft: Number,
            eyesTurnRight: Number,
            eyesUp: Number,
            eyesDown: Number,
        }
    }],
    alerts: [{
        name: String,
        timeStamp: Number,
        faceId: Number,
    }]
}

var PXCMPointF32Layout = {
    x: Number,
    y: Number,
}

var PXCMPoint3DF32Layout = {
    x: Number,
    y: Number,
    z: Number,
}

// layout of object received in hand callback (callback specified in EnableHandModule)
var HandDataLayout = {
    hands: [{
        uniqueId: Number,
        userId: Number,
        timeStamp: Number,
        isCalibrated: Boolean,
        bodySide: Number,
        openness : Number,
        boundingBoxImage: {
            x: Number,
            y: Number,
            w: Number,
            h: Number,
        },
        massCenterImage: {
            x: Number,
            y: Number,
        },
        massCenterWorld: {
            x: Number,
            y: Number,
            z: Number,
        },
        palmOrientation: {
            x: Number,
            y: Number,
            z: Number,
            w: Number,
        },
        extremityPoints: [{
            pointWorld: {
                x: Number,
                y: Number,
                z: Number,
            },
            pointImage: {
                x: Number,
                y: Number,
                z: Number,
            }
        }],
        fingerData: [{
            foldedness: Number,
            radius: Number,
        }],
        trackedJoint: [{
            confidence: Number,
            positionWorld: {
                x: Number,
                y: Number,
                z: Number,
            },
            positionImage: {
                x: Number,
                y: Number,
                z: Number,
            },
            localRotation: {
                x: Number,
                y: Number,
                z: Number,
                w: Number,
            },
            globalOrientation: {
                x: Number,
                y: Number,
                z: Number,
                w: Number,
            },
            speed: {
                x: Number,
                y: Number,
                z: Number,
            }
        }],
        normalizedJoint: [{
            confidence: Number,
            positionWorld: {
                x: Number,
                y: Number,
                z: Number,
            },
            positionImage: {
                x: Number,
                y: Number,
                z: Number,
            },
            localRotation: {
                x: Number,
                y: Number,
                z: Number,
                w: Number,
            },
            globalOrientation: {
                x: Number,
                y: Number,
                z: Number,
                w: Number,
            },
            speed: {
                x: Number,
                y: Number,
                z: Number,
            },
        }],
    }],
    alerts: [{
        label: Number,
        handId: Number,
        timeStamp: Number,
        frameNumber: Number,
    }],
    gestures: [{
        timeStamp: Number,
        handId: Number,
        state: Number,
        frameNumber: Number,
        name: String,
    }]
}

var BlobDataLayout = {
}

