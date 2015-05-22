/*******************************************************************************

INTEL CORPORATION PROPRIETARY INFORMATION
This software is supplied under the terms of a license agreement or nondisclosure
agreement with Intel Corporation and may not be copied or disclosed except in
accordance with the terms of that agreement
Copyright(c) 2015 Intel Corporation. All Rights Reserved.

*******************************************************************************/

//////////////////////////////////////////////////////////////////////////////////
// Internal object for websocket communication

var intel = intel || {};

/**
 Utility object used to add namespaces to the define namespaces under the window context.
 @method intel._namespace
 @param {string} ns - The name of the namespace to add.
 @returns Returns the namespace object.
 */
intel._namespace = function(ns) {
    var nList = ns.split('.'), parent = window, index = 0;
    for (index in nList) {
        if (nList.hasOwnProperty(index)) {
            parent[nList[index]] = parent[nList[index]] || {};
            parent = parent[nList[index]];
        }
    }
    return window[nList[0]];
};

/**
 * Intel Technology Access WebSocket Interface
 * @param endpoint
 * @param options
 * @param listeners
 * @constructor
 */
ITAWS = function(endpoint, options, listeners){
    var self = this;
    if (!endpoint || typeof endpoint !== "string"){
        throw "Endpoint required";
    }
    options = options || {};
    listeners = listeners || {};
    if (typeof listeners === "function"){
        listeners = {onopen: listeners};
    }

    if (!options.wsConstructor){
        // TODO remove hardcoded wamp implementation selection
        if (typeof autobahn === "object"){
            options.wsConstructor = autobahn.Connection;
        }
        else{
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
ITAWSConnection = function(endpoint, options, listeners){
    var self = this;
    var at = {"iat":new Date().getTime(), "expcr":0,"explp":0,"api-key":"","cap":["realsense/rssdk_v5"]};
    options.at = at;
    var PairCallback = function(err, rat) {
        if (err){
            //console.log("Error occurred while pairing: ", err);
            return;
        }
        if (rat) {
            //console.log("Got Rat. Start connection");
            self.default = {};
            self.default.endpoint = "ws://localhost:9000";
            self.default.realm = 'com.intel.api';
            self.rat = rat;
            self.mode = "debug";
            self.log = function(){
                if (self.mode === "debug"){
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
                onchallenge: function(session, method, extra){
                    if (method === "ticket"){
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

            if (typeof listeners === "object"){
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
    if (options && options.rat){
        self.rat = options.rat;
        PairCallback(null, self.rat);
    }
    else{
        if (options.at){
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
ITAWSConnection.prototype.attachMethods = function(){
    var self = this;
    // wire methods native to any wamp lib (call, subscribe etc)
    self.call = (self.session) ? self.session.call : function(){};
    self.subscribe = (self.session) ? self.session.subscribe : function(){};
    self.session.SendRPC = function(procedureName, args, responseHandler){
        //console.log("Sending RPC...");
        if (typeof args === "string") {
                //console.log("sending string");
                //console.log(procedureName);

               // send string as single element array
               self.session.call(procedureName, [args]).then(function(res){
                   //console.log(res);

                   return responseHandler(res);
               }, console.log);
        }
        else {
            if (Object.prototype.toString.call(args) === '[object Array]'){
                console.log("sending array");
                // binary, send array data
                self.session.call(procedureName, args).then(function(res){
                    responseHandler(res);
                });
            }
            else if (typeof args === "object"){
                console.log("sending object");
                //send object
                self.call(procedureName, [], args).then(function(res){
                    responseHandler(res);
                });
            }

        }
    };

    self.session.Subscribe = function(topic, args, eventHandler){
        self.session.subscribe(topic,eventHandler);
    };
}
/**
 * Set the websocket handlers to call user specified listeners
 */
ITAWSConnection.prototype.wrapEvents = function(){
    var self = this;
    // set wrappers for events
    self.ws.onopen = function(session, details){
        self.log("ITAWS session started");
        self.session = session;
        self.attachMethods();
        self.ws._onopen(self.session);
    };
    // TODO needs wrapper to work, wamp is rpc,pubsub not socket msg based
    self.ws.onmessage = function(e){
        self.log("ITAWS ws message: " + e.data);
        self.ws._onmessage(session);
    };
    self.ws.onclose = function(e){
        self.log("ITAWS ws session closed");
        self.ws._onclose(e);
    };
    self.ws.onerror = function(e){
        self.log("ITAWS ws error");
        self.ws._onerror(e);
    };

    //self.ws = ws;
}
/**
 * Set the function to be used for constructing websockets
 * @param fn
 */
ITAWSConnection.prototype.setWSConstructor = function(fn){
    var self = this;
    if (typeof fn === "function"){
        self.wsConstructor = fn;
    }
    else{
        self.wsConstructor = (typeof WebSocket === "function") ? WebSocket : null;
    }


}
/**
 * Set user supplied listeners to be called when communication events occur
 * @param listeners
 * @returns {boolean}
 */
ITAWSConnection.prototype.setListeners = function(listeners){
    var self = this;
    var noop = function(e){};
    if (!self.ws || typeof listeners !== "object") {
        throw "websocket property does not exist";
    }
    //self.ws._onopen = listeners.onopen || self.ws._onopen || function(session) {
    self.ws._onopen = listeners.onopen || function(session) {

    };
    /*TBD convenience fn - onmessage is not RPC,EVENT protocol (WAMP2 etc) */
    self.ws._onmessage = listeners.onmessage || self.ws._onmessage || noop;
    self.ws._onclose = listeners.onclose || self.ws._onclose || noop;
    self.ws._onerror = listeners.onerror || self.ws._onerror || noop;

};
/**
 * Connect using websocket
 */
ITAWSConnection.prototype.connect = function() {
    var self = this;
    if (!self.ws){
        if (self.wsConstructor){
            // TODO implement reconnect
        }
    }
    self.ws.open();

};

/**
 * Set all listeners to no ops
 */
ITAWSConnection.prototype.removeListeners = function(){
    var self = this;
    var noop = function(e){};
    var o = {
        onclose: noop,
        onopen: noop,
        onerror: noop,
        onmessage: noop
    };
    self.setListeners(o);
};

function getRAT(accessToken, cb){
    var rat = "";
    var at = accessToken;
    var getRATOptions = {
        "headers": {
            "api-key": "12345",
            "Content-Type": 'application/json'
        },
        "body": JSON.stringify(at)
    };
    
    var successCallback = function(result){
        var rat;
        if (result.responseText) {
            var res = JSON.parse(result.responseText);
            rat = res.ResourceAccessToken;
        }
        console.log('Successfuly obtained RAT: '+ rat);
        if (result && rat){
            cb(null, rat);
        }
        return;
    }
    var errorCallback = function(result){
        console.log('Error',result)
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
    function _buildUrl(url, options){
        // Dynamic URL key replacements.
        if (options.url) {
            for(var okey in options.url) { 
                if (options.url.hasOwnProperty(okey)) {
                    url = url.replace("{" + okey + "}", options.url[okey]);
                }
            }
        }

        // Attach query string.
        if (options.query) {
            var queryArray = [];
            for(var qkey in options.query) { 
                if (options.query.hasOwnProperty(qkey)) {
                    queryArray.push(encodeURI(qkey) + "=" + encodeURI(options.query[qkey]));
                }
            }

            url += "?" + queryArray.join("&");
        }

        return url;
    }

    // Set defaults.
    self.options            = options || {};
    self.method             = method  || "GET";
    self.url                = _buildUrl(url || "", options || {});
    self.body               = options.body || "";
    self.headers            = options.headers || {};
    self.request            = null;
    self.timeout            = options.timeout || -1;
    
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
    self._execute = function(successCB, errorCB) {
        var xhr;

        try {
            xhr = new XMLHttpRequest();
            //xhr.withCredentials = true;

            // Event callbacks.
            xhr.onload = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 204 || xhr.status === 303) {
                        successCB(xhr);
                    } else {
                        errorCB(xhr);
                    }
                }
            };

            xhr.onabort = function() {
                errorCB({'status': 'ABORTED', 'message': 'request aborted'});
            };

            xhr.onerror = function() {
                errorCB({'status': 'ERROR', 'message': 'An error occurred during request execution'});
            };

            // Init the request so we can prep for sending.
            xhr.open(self.method, self.url, true);

            // Set the request headers.
            if (self.headers) {
                for(var index in self.headers) { 
                    if (self.headers.hasOwnProperty(index)) {
                        xhr.setRequestHeader(index, self.headers[index]);
                    }
                }
            }
            
            // Set request timeout.
            if (self.timeout > 0) {
                xhr.timeout = self.timeout;
                xhr.ontimeout = function() {
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

GetResourceAccessToken = function(options, successCB, errorCB) {
        var url = "https://192.55.233.1/resourceaccesstoken";
        var restRequest = intel.rest("POST", url, options);
        restRequest._execute(successCB, errorCB);
};


function RealSenseConnection() {
    // this.socketUrl  = 'ws://localhost:4184'; 
    console.log('Realsense.Connection()');
    var self = this;
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
                    "onopen": function (session, details) { console.log('Opened!');self._onopen(session); },
                    "onmessage": function (response) { console.log('Message!'); self._onmessage(response); },
                    "onerror": this.onerror,
                    "onclose": this.onclose
                });
            this.websocket.binaryType = "arraybuffer"; // Receive binary messages as ArrayBuffer
        }

        // Construct request as id+instance+method+params
        var request = params;
        request.id = ++this.request_id;
        request.instance = { value: instance };
        request.method = method;
        request.version_major = 'v' + RealSenseVersion_Major; 

        // Convert request to JSON string
        var request_text = JSON.stringify(request);

        // Send request or put request into queue (if socket still in CONNECTING state)
        if (typeof this.wssession == undefined || this.wssession == null) {
            this.queue.push(request_text);
        } else if (this.wssession) {
            var t4 = performance.now();
            this.wssession.SendRPC("realsense/rssdk_v5/api", request_text, function(response){var t5 = performance.now();console.log("Response time: "+(t5-t4)); self._onmessage(response)});
        }

        // Create promise object
        var promise = new Promise(function (resolve, reject) {
            request.resolve = resolve;
            request.reject = reject;
        });

        // Add timeout handler
        /*request.timeoutHandler = function () {
            if (RealSense.connection.websocket.readyState > 1) {
                this.reject({ 'error': 'error opening websocket' });
            } else {
                this.reject({ 'error': 'request timeout on method ' + request.method });
            }
        } 
        if (this.websocket.session) {
            request.reject({ 'error': 'error opening websocket' });
        } else {
            request.timeout_id = setTimeout(function () { request.timeoutHandler() }, timeout)
        } */

        // Store request by id
        this.request_array[request.id] = request;
        return promise;
    };

    // Send queued messages when socket is open
    this._onopen = function (session) {
        //self.onopen(session);
        this.wssession = session;
        
        //subscribe to the realsense events
        this.wssession.Subscribe("realsense/rssdk_v5/api", self.queue[i], function(response){var t3 = performance.now(); console.log("Response time: "+(t3-t2));self._onmessage(response)});

        //console.log(self.session);
        for (var i = 0; i < self.queue.length; i++) {
            var t2 = performance.now();
            this.wssession.SendRPC("realsense/rssdk_v5/api", self.queue[i], function(response){var t3 = performance.now(); console.log("Response time: "+(t3-t2));self._onmessage(response)});
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
        console.log("received a response");
        console.log(response);
        console.log("<<");
        try {
            var t0 = performance.now();
            response = JSON.parse(event);
            var t1 = performance.now();
            response.parse_time = t1 - t0;
        } catch (err) {
            this.onmessage(event, null);
            return;
        }

        if (typeof response !== 'object') {console.log("Could not parse JSON"); return; }// error parsing JSON

        if (response.method !== 'undefined' && this.callbacks[response.method]) { // callback from server
            var callback = this.callbacks[response.method].callback;
            var obj = this.callbacks[response.method].obj;
            callback(response, obj);
            return;
        } else if (response.id !== 'undefined' && this.request_array[response.id]) { // result from server
            console.log("Found request id");
            console.log(response);
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
