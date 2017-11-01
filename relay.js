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







    // Client-side DOM Methods

    function initDOMListeners(document) {
        // Set up WebWorker or SharedWorker
        var worker, port;
        var queuedCommands = [];
        var headersLoading = [];
        document.USE_SHARED_WORKER = true;

        var SCRIPT_ROOT = '';
        var scripts = document.head.getElementsByTagName('script');
        for(var i=0; i<scripts.length; i++) {
            var src = scripts[0].getAttribute('src');
            if(!src) continue;
            var pos = src.indexOf('relay.js');
            if(!pos) continue;
            SCRIPT_ROOT = src.substr(0, pos);
            console.log("Found script root: ", SCRIPT_ROOT);
            break;
        }

        // Set up SharedWorker or WebWorker
        if(typeof SharedWorker === 'function' && !document.USE_SHARED_WORKER) {
            // Create Shared WebWorker
            worker = new SharedWorker(SCRIPT_ROOT + 'relay.js');
            port = worker.port;
            port.start();

        } else if (typeof Worker === 'function') {
            // Create Normal WebWorker
            worker = new Worker(SCRIPT_ROOT + 'relay.js');
            port = worker;

        } else {
            throw new Error("WebWorker unavailable");
        }

        worker.postMessage("SCRIPT_ROOT " + SCRIPT_ROOT);
        worker.SCRIPT_ROOT = SCRIPT_ROOT;

        // Set up message handling
        port.addEventListener('message', function (e) {
            var commandString = e.data;
            if(e.defaultPrevented)
                return;
            handleWorkerResponse(commandString);
        }, true);

        function handleWorkerResponse (commandString) {
            if(!commandString)
                throw new Error("Ignoring empty message");

            var type = commandString.split(/[^\w]+/)[0].toLowerCase();
            switch(type) {
                case 'include':
                    var scriptPath = commandString.substr(8).trim().replace(';', '');
                    var ext = scriptPath.split('.').pop().toLowerCase();

                    switch(ext) {
                        case 'js':
                            includeHeadScript(scriptPath);
                            break;
                        case 'css':
                            includeHeadCSS(scriptPath);
                            break;
                        default:
                            throw new Error("Invalid Include file: " + ext);
                    }
                    return;
            }

            if(headersLoading > 0) {
//                 console.info("Queuing command: ", commandString);
                queuedCommands.push(commandString);
                return;
            }

            // Check for previously queued commands
            if(queuedCommands.length > 0) {
                console.info("Queuing early command: ", commandString);
                queuedCommands.push(commandString);
                return executeNextWorkerCommand();
            }

            var responseEvent = new CustomEvent('response:' + type, {
                detail: commandString,
                cancelable: true
            });
            document.dispatchEvent(responseEvent);
            if(responseEvent.defaultPrevented) // Check to see if it was handled by another listener
                return;

            throw new Error("Missing event listener 'response:" + type + "' " + commandString);
        }


        function includeHeadScript(scriptPath) {
            var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
            var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
            if (foundScript.length === 0) {
//                 console.log("Including " + scriptPath);
                var scriptElm = document.createElement('script');
                headersLoading++;
                scriptElm.src =  scriptPath;
                scriptElm.onload = function() {
                    headersLoading--;
                    executeNextWorkerCommand();
                };
                document.head.appendChild(scriptElm);

            } else {
                // If script is already in place, resume next command, if any
                executeNextWorkerCommand();
            }
        }


        function includeHeadCSS(cssPath) {
            var cssPathEsc = cssPath.replace(/[/.]/g, '\\$&');
            var foundCSS = document.head.querySelectorAll('link[href=' + cssPathEsc + ']');
            if (foundCSS.length === 0) {
//                 console.log("Including " + scriptPath);
                var linkElm = document.createElement('link');
                linkElm.setAttribute('rel', 'stylesheet');
                linkElm.setAttribute('type', 'text/css');
                linkElm.setAttribute('href', cssPath);
                document.head.appendChild(linkElm);
            }
        }

        function executeNextWorkerCommand() {
            if(queuedCommands.length===0)
                return false;
            if(headersLoading > 0)
                return false;
            var nextCommand = queuedCommands.shift();
//             console.log("Executing Queued Command: ", nextCommand, queuedCommands);
            executeWorkerCommand(nextCommand);
            executeNextWorkerCommand();
        }

        function executeWorkerCommand(commandString) {
            worker.postMessage(commandString);
            // console.log("Passing command to worker: " + commandString);
        }

        return executeWorkerCommand;
    }



    function initWorkerThread(importScripts) {

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

        var CLIPrompt = require('./system/cli/cli-prompt.js').CLIPrompt;
        initWorkerCommands(CLIPrompt);
        CLIPrompt.start();
    }



    function initWorkerCommands(worker) {
        worker.addEventListener('message', handleMessage);

        var PATHS = ['exec'];

        var typeCommands = {
            'script_root': function(e, commandString) {
                var SCRIPT_ROOT = commandString.split(' ')[1];
                if(!SCRIPT_ROOT) throw new Error("Invalid script root: " + commandString);
                worker.SCRIPT_ROOT = SCRIPT_ROOT;
                worker.RELATIVE_ROOT = '../'.repeat((SCRIPT_ROOT.match(/\//g) || []).length);
                // console.log("Set relative root: ", worker.RELATIVE_ROOT);
            }
        };

        // Define command
        function handleMessage(e) {
            var commandString = e.data || e.detail;
            if (!commandString)
                throw new Error("Ignoring empty message");
            var type = commandString.split(/[^\w]+/)[0].toLowerCase();

            if(typeof typeCommands[type] !== 'undefined')
                return typeCommands[type](e, commandString);

            // Attempt to load command file
            var handleWorkerCommand = null;
            for(var i=0; i<PATHS.length; i++) {
                try {
                    var path = PATHS[i] + '/' + type + '.js';
                    importScripts(path);
                    handleWorkerCommand = module.exports.handleWorkerCommand;
                } catch (ex) {
                }
            }

            if(!handleWorkerCommand)
                throw new Error("module.exports.handleWorkerCommand not found: " + type + ". PATHS=" + PATHS.join(', '));

            typeCommands[type] = handleWorkerCommand;
            // console.log("Imported " + filePath, typeCommands);
            return typeCommands[type](e, commandString);
        }
    }

})();