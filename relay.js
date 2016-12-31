/**
 * Created by ari on 6/19/2015.
 */

var relay = (function() {
    // If we're in the document scope, included as a script
    if (typeof document !== 'undefined')
        return initDOMListeners(document);

    // If we're in a worker thread, set up the worker
    if (typeof importScripts !== 'undefined')
        return initWorkerThread(importScripts);

    if (typeof require !== 'undefined')
        // If we're in a cli environment, set up CLI
        return initCLI(require);

    throw new Error("Invalid Environment");







    // init Methods

    function initDOMListeners(document) {
        // Set up WebWorker or SharedWorker
        var worker, port;
        document.USE_SHARED_WORKER = true;

        // Set up SharedWorker or WebWorker
        if(typeof SharedWorker == 'function' && !document.USE_SHARED_WORKER) {
            // Create Shared WebWorker
            worker = new SharedWorker('relay.js');
            port = worker.port;
            port.start();

        } else if (typeof Worker == 'function') {
            // Create Normal WebWorker
            worker = new Worker('relay.js');
            port = worker;

        } else {
            throw new Error("WebWorker unavailable");
        }

        // Set up message handling
        port.addEventListener('message', function (e) {
            var commandString = e.data;
            if(e.defaultPrevented)
                return;
            handleWorkerResponse(commandString)
        }, true);

        function handleWorkerResponse (commandString ) {
            if(!commandString)
                throw new Error("Ignoring empty message");

            var type = commandString.split(/[^\w]+/)[0].toLowerCase();
            switch(type) {
                case 'include':
                    includeHeadScript(commandString);
                    return;
            }

            var responseEvent = new CustomEvent('response:' + type, {
                detail: commandString,
                cancelable: true
            });
            document.dispatchEvent(responseEvent);
            if(responseEvent.defaultPrevented) // Check to see if it was handled by another listener
                return;

            console.error("Unhandled worker Response (type=" + type + "): " + commandString);
        }

        function executeWorkerCommand(commandString) {
            worker.postMessage(commandString);
            // console.log("Passing command to worker: " + commandString);
        }

        function includeHeadScript(commandString) {
            var nextCommand = '';
            var p = commandString.indexOf(';');
            if(p > -1) {
                nextCommand = commandString.substr(p+1);
                commandString = commandString.substr(0, p);
            }
            var scriptPath = commandString.substr(8);
            var foundScript = document.head.querySelectorAll('script[src=' + scriptPath.replace(/[/.]/g, '\\$&') + ']');
            if (foundScript.length === 0) {
                // console.log("Including " + scriptPath);
                var scriptElm = document.createElement('script');
                scriptElm.src = scriptPath;
                if(typeof scriptElm.pendingCommands != 'object') scriptElm.pendingCommands = [];
                // Queue pending command until script is loaded
                scriptElm.pendingCommands.push(nextCommand);
                scriptElm.onload = function() {
                    for(var i=0; i<scriptElm.pendingCommands.length; i++)
                        handleWorkerResponse(scriptElm.pendingCommands[i]);
                    delete scriptElm.pendingCommands;
                };
                document.head.appendChild(scriptElm);

            } else {
                if(typeof foundScript[0].pendingCommands == 'object')
                    foundScript[0].pendingCommands.push(nextCommand);
                else
                    handleWorkerResponse(nextCommand)
            }
        }

        return executeWorkerCommand;
    }



    function initWorkerThread(importScripts) {

        importScripts('worker/commands.js');
        var initWorkerCommands = module.exports.initWorkerCommands;

        // If we're in a worker thread
        if(self.SharedWorkerGlobalScope && self instanceof SharedWorkerGlobalScope) {
            // Listen for connecting ports
            self.addEventListener('connect', onConnect);
            console.log("Initiated SharedWorker thread", self);

            var portCount=0;
            function onConnect(e) {
                var port = e.ports[0];
                port.i = ++portCount;
                // Listen for port messages
                initWorkerCommands(port);
                // port.addEventListener('message', onMessageCommand);

                // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
                port.start();
                //port.postMessage("INFO New SharedWorker port connected #" + port.i);
                console.info("New SharedWorker port connected #", port.i, port);
            }

        } else if (self.DedicatedWorkerGlobalScope && self instanceof DedicatedWorkerGlobalScope) {
            // Listen for main thread messages
            initWorkerCommands(self);
            // self.addEventListener('message', onMessageCommand);
            console.log("Initiated WebWorker thread", self);
        }
    }


    function initCLI(require) {
        var initWorkerCommands = require('./worker/commands.js').initWorkerCommands;

        var CLIPrompt = require('./worker/cli/cli-prompt.js').CLIPrompt;
        initWorkerCommands(CLIPrompt);
        CLIPrompt.start();
    }

    
    
})();