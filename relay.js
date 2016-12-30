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
            if(!commandString)
                throw new Error("Ignoring empty message");
            var type = commandString.split(/[^\w]+/)[0].toLowerCase();

            console.error("Unhandled worker Response (type=" + type + "): " + commandString);
        }, true);


        function executeDOMCommand(commandString, elm) {
            var type = commandString.split(/[^\w]+/)[0].toLowerCase();
            var commandEvent = new CustomEvent('message:' + type, {
                detail: commandString,
                cancelable: true
            });
            if(!elm) elm = document;
            elm.dispatchEvent(commandEvent);
            if(commandEvent.defaultPrevented) // Check to see if it was handled by another listener
                return commandEvent;

            // If unhandled, pass to worker thread
            worker.postMessage(commandString);
            commandEvent.preventDefault();
            return commandEvent;
        }

        return executeDOMCommand;
    }


    function initCLI(require) {
        var CLIPrompt = require('./client/cli/cli-prompt.js').CLIPrompt;
        CLIPrompt.start();
    }

    
    
})();