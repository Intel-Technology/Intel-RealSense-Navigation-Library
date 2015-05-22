/*******************************************************************************

INTEL CORPORATION PROPRIETARY INFORMATION
This software is supplied under the terms of l license agreement or nondisclosure
agreement with Intel Corporation and may not be copied or disclosed except in
accordance with the terms of that agreement
Copyright(c) 2014-2015 Intel Corporation. All Rights Reserved.

*******************************************************************************/

/**
 * @function RealSenseInfo
 * Returns information about platform compatibility with Intel� RealSense�
 * 
 * @param [String] components   Array of strings with name of required components, for example ['face', 'hand']
 * @param {Function} callback   Callback receives object with the following properties.
 *  isCheckNeeded       {Boolean} if true, this function failed to reliably detect the platform. Suggest to run additional check.
 *  isCameraF200        {Boolean} if false, platform doesn't have Intel� RealSense� 3D F200 Camera.
 *  isDCMF200Ready      {Boolean} if false and IsCameraF200=true, DCM (Depth Camera Manager) and firmware needs to be updated
 *                                for Intel� RealSense� 3D F200 Camera.
 *  isCameraR200        {Boolean} if false, platform doesn't have Intel� RealSense� 3D R200 Camera.
 *  isDCMR200Ready      {Boolean} if false and IsCameraFR00=true, DCM (Depth Camera Manager) and firmware needs to be updated
 *                                for Intel� RealSense� 3D R200 Camera.
 *  isRuntimeInstalled  {Boolean} if false, Intel� RealSense� SDK runtime needs to be installed.  
 
 Example:
   RealSenseInfo(['face3d', 'hand'], function (info) {
      // check if (info.IsCheckNeeded == true)
   })
*/

var RUNTIME_VERSION = "5.0";
var REALSENSE_VERSION = 'v5';

// Get RealSenseInfo from RealSense Capacity service (ITA)
PXCM_GetRealSenseInfo = function (callback) {
    if (RealSense.connection == null) RealSense.connection = new RealSenseConnection();
    RealSense.connection.onerror = function(err){
        // console.log('error bubbled up to caller: ' + err);
        var info = new Object();
    	info.isCameraF200 = false;
    	info.isDCMF200Ready = false;
    	info.isCameraR200 = false;
    	info.isDCMR200Ready = false
    	info.isRuntimeInstalled = false;
    	info.isCheckNeeded = true;
        callback(info);
        return;
    };
    return RealSense.connection.call(0, 'PXCM_GetRealSenseInfo', { 'js_version': REALSENSE_VERSION});
};

versionCompare = function (left, right) {
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
}

// Major version comparison
//    version: [input] argument of the candidate version - a string of such format "1.3.1234"
//    major:   [input] the major version to match - it is a string of major version
// Return:
//    0: if major versions do not match
//    1: if major versions match
compareMajorVersion = function (version, major) {
    if (typeof ver != 'string') return 0;
    if (typeof major != 'string') return 0;

    var l = version.split('.');
    if (l[0] == major)
        return 1;
    else
        return 0;
}

// Major version comparison
//    version: [input] argument of the candidate version - a string of such format "1.3.1234"
//    minor:   [input] the minor version to compare - it is a string of minor version
// Return:
//    0: if minor version of "version" is less than "minor"  
//    1: otherwise
compareMinorVersion = function (version, minor) {
    if (typeof ver != 'string') return 0;
    if (typeof minor != 'string') return 0;
    var l = version.split('.');
    if (l.length < 2) return 0;

    if (parseInt(l[1]) >= parseInt(minor))   
        return 1;
    else
        return 0;
}

function RealSenseInfo(components, callback) {
    var info = new Object();
    info.isCameraF200 = false;
    info.isDCMF200Ready = false;
    info.isCameraR200 = false;
    info.isDCMR200Ready = false
    info.isRuntimeInstalled = false;
    info.isCheckNeeded = false;

    // Check if it is Windows platform
    if ((navigator.appVersion.indexOf("Win") == -1) || (navigator.appVersion.indexOf("32") >= 0) || !("WebSocket" in window)) {
        callback(info);
        return;
    }

    var onerror = function () {
        info.isCheckNeeded = true;
        callback(info);
        return;
    }

    var xhr; 
    var onReady = function () {
        try {
            if (xhr.readyState == 4) {
                // Contact ITA RealSense capacity engine to retrieve component list
                PXCM_GetRealSenseInfo(callback).then(function (result) {
                    var info = result;
                    info.isCameraF200 = false;
                    info.isDCMF200Ready = false;
                    info.isCameraR200 = false;
                    info.isDCMR200Ready = false
                    info.isRuntimeInstalled = false;
                    info.isCheckNeeded = false;

                    if ('DCM' in info) {
                        info.isCameraF200 = true;
                        if (versionCompare(info.DCM, '1.2') >= 0) {
                            info.isDCMF200Ready = true;
                            info.versionF200 = info.DCM;
                        }
                    }

                    if ('dcmservice_r200' in info) {
                        info.isCameraR200 = true;
                        if (versionCompare(info.dcmservice_r200, '2.0') >= 0) {
                            info.isDCMR200Ready = true;
                            info.versionR200 = info.dcmservice_r200;
                        }
                    }

                    info.isRuntimeInstalled = true;
                    if (!("web_server" in info) || versionCompare(RUNTIME_VERSION, info.web_server) > 0)
                        info.isRuntimeInstalled = false;
                    else if (components != null) {
                        for (i = 0; i < components.length; i++) {
                            if (!(components[i] in info))
                                info.isRuntimeInstalled = false;
                        }
                    }

                    callback(info);
                    return;

                }).catch(onerror);
            }
        } catch (err) {
            onerror();
        };
    }
 
    try {
            xhr = new XMLHttpRequest();
            var url;
            
            xhr.open("GET", "https://192.55.233.1/health", true);
            //xhr.onreadystatechange = onReady;
            xhr.onload = onReady;
            xhr.timeout = 5000;
            xhr.ontimeout = onerror;
            xhr.onerror = onerror;
            xhr.send();
    } catch (err) {
        onerror();
    }   
        
}

