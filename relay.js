/**
 * Created by ari on 6/19/2015.
 */

(function() {
    // If we're in a worker thread, set up the worker
    if (typeof importScripts !== 'undefined')
        return initWorkerThread(importScripts);

    // If we're in the document scope, included as a script
    if (typeof document !== 'undefined')
        return initWorkerListener(document);

    if (typeof require !== 'undefined')
        // If we're in a cli environment, set up CLI
        return initCLI(require);

    throw new Error("Invalid Environment");







    // init Methods

    function initWorkerThread(importScripts) {

        // If we're in a worker thread
        if(self.SharedWorkerGlobalScope && self instanceof SharedWorkerGlobalScope) {
            // Listen for connecting ports
            self.addEventListener('connect', onConnect);
            console.log("Initiated SharedWorker thread", self);

        } else if (self.DedicatedWorkerGlobalScope && self instanceof DedicatedWorkerGlobalScope) {
            // Listen for main thread messages
            self.addEventListener('message', onMessageCommand);
            console.log("Initiated WebWorker thread", self);
        }


        function onMessageCommand(e) {
            var commandString = e.data;
            if(!commandString)
                throw new Error("Ignoring empty message");
            var type = commandString.split(/[^\w]+/)[0].toLowerCase();

            var messageEvent = new CustomEvent('message:'+type, {
                detail: commandString,
                cancelable: true
            });
            self.dispatchEvent(messageEvent);
            if(messageEvent.defaultPrevented)
                return;

            throw new Error("Unhandled command (type=" + type + "): " + commandString);
        }

        // For Shared Workers

        var portCount=0;
        function onConnect(e) {
            var port = e.ports[0];
            port.i = ++portCount;
            port.addEventListener('message', onMessageCommand);

            // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
            port.start();
            //port.postMessage("INFO New SharedWorker port connected #" + port.i);
            console.log("New SharedWorker port connected #", port.i, port);
        }

    }

    function initWorkerListener(document) {
        // Set up WebWorker or SharedWorker

        var worker, port;
        //document.FORCE_WEB_WORKER = true;

        // Set up SharedWorker or WebWorker
        if(typeof SharedWorker == 'function' && !document.FORCE_WEB_WORKER) {
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
            console.log("IN:  ", commandString);
            var messageEvent = new CustomEvent('message:' + type, {
                detail: commandString,
                cancelable: true
            });
            document.dispatchEvent(messageEvent);
            if(messageEvent.defaultPrevented)
                return;

            console.error("Unhandled worker response (type=" + type + "): " + commandString);
        }, true);

        // Set up execution handling
        document.addEventListener('message', function(e) {
            var commandString = e.detail;
            var type = commandString.split(/[^\w]+/)[0].toLowerCase();
            console.log("OUT: ", commandString);
            var messageEvent = new CustomEvent('command:' + type, {
                detail: commandString,
                cancelable: true
            });
            document.dispatchEvent(messageEvent);
            if(messageEvent.defaultPrevented)
                return;
            e.preventDefault();
            // Don't pass commands to worker.
            console.error("Unhandled command (type=" + type + "): " + commandString);
        });

    }


    function initCLI(require) {
        var CLIPrompt = require('./client/cli/cli-prompt.js').CLIPrompt;
        CLIPrompt.start();
    }


})();