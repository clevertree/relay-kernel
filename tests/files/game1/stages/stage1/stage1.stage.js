/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var CHAR_TILDE = 192, CHAR_TAB = 9;
    var Config = window.games.game1;
    var ROOT = Config.path.root;
    var DIR_STAGE = ROOT + 'stages/stage1/';
    var PATH_TILE_DEFAULT = DIR_STAGE + 'tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = DIR_STAGE + 'map/bklayer.map.png';
    var SCRIPT_ASSETS = [
        ROOT + 'fragment/color.fragment.js',
        ROOT + 'fragment/texture.fragment.js',
        ROOT + 'fragment/spritesheet.fragment.js',
        ROOT + 'fragment/tilemap.fragment.js',

        ROOT + 'sprite/player1.sprite.js',
        ROOT + 'sprite/player2.sprite.js',

        // Levels
        DIR_STAGE + 'level/level1.level.js',
    ];

    // Load and Render

    function Stage1(e) {
        var Config = window.games.game1, THIS = this;
        var Util = Config.util;

        var canvas = e.target;

        var gl = canvas.getContext('webgl');
        window.addEventListener('resize', handleResize);
        handleResize();

        // Flags
        var stageFlags = Config.flags.MODE_DEFAULT;

        // Point of View / Perspective
        // var POV = UTIL.getPOV(gl);

        // Players
        var Player1 = new Config.character.Player1(gl);

        // Level Sprites
        var Level1 = new Config.level.Level1(gl);

        var renders = [
            Player1, Level1
        ];
        var selectedRender = -1; // renders.length - 1;

        // Default FOV
        this.mProjection = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1];

        // Set up render loop

        var lastKeyCount = 0, frameCount = 0;
        function onFrame(t) {
            frameCount++;
            window.requestAnimationFrame(onFrame);

            // THIS.mProjection[9]+=0.001;
            // this.mProjection = Util.projection(frameCount, frameCount, frameCount); // [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];



            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.03, 0.1, 0.03, 0.1);
            gl.clearDepth(1.0);

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Enable Depth testing
            // gl.enable(gl.DEPTH_TEST); // Depth test creates those ugly opaque textures
            // gl.depthFunc(gl.LESS);

            // Input

            handleKeyChange();

            // Render
            for(var i=0; i<renders.length; i++) {
                var flags = stageFlags;
                if(selectedRender === i)    flags |= Config.flags.RENDER_SELECTED;
                renders[i].update(t, THIS, flags);
                renders[i].render(t, gl, THIS, flags);
            }
        }

        var CHAR_SHIFT = 16;
        var keyTildeCount = 0, keyTabCount = 0;
        function handleKeyChange() {
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                if(keyTildeCount < Config.input.keyCount[CHAR_TILDE]) {
                    keyTildeCount = Config.input.keyCount[CHAR_TILDE];
                    if(stageFlags & Config.flags.MODE_EDITOR) {
                        stageFlags &= ~Config.flags.MODE_EDITOR;
                        stageFlags |= Config.flags.MODE_CONSOLE;
                        console.log("Stage Mode changed to: Console");

                    } else if(stageFlags & Config.flags.MODE_CONSOLE) {
                        stageFlags &= ~Config.flags.MODE_CONSOLE;
                        stageFlags |= Config.flags.MODE_DEFAULT;
                        console.log("Stage Mode changed to: Default");

                    } else {
                        stageFlags &= ~Config.flags.MODE_DEFAULT;
                        stageFlags |= Config.flags.MODE_EDITOR;
                        console.log("Stage Mode changed to: Editor");
                    }
                }

                if(keyTabCount < Config.input.keyCount[CHAR_TAB]) {
                    keyTabCount = Config.input.keyCount[CHAR_TAB];
                    selectedRender++;
                    if(selectedRender >= renders.length)
                        selectedRender = -1;
                    if(selectedRender === -1)
                        console.log("Selected: ", THIS);
                    else
                        console.log("Selected:", renders[selectedRender]);

                }
            }

            if(selectedRender === -1) {
                var V = 0.03;
                var pressedKeys = Config.input.pressedKeys;
                if(pressedKeys[39])     move(-V,  0,  0);  // Right:
                if(pressedKeys[37])     move( V,  0,  0);  // Left:
                if(pressedKeys[40])     move( 0,  V,  0);  // Down:
                if(pressedKeys[38])     move( 0, -V,  0);  // Up:
                if(pressedKeys[34])     move( 0,  0,  V);  // Page Down:
                if(pressedKeys[33])     move( 0,  0, -V);  // Page Up:
            }
        }

        function move(tx, ty, tz) {
            THIS.mProjection = Util.translate(THIS.mProjection, tx, ty, tz)
        }


        function handleResize() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            // console.log("Canvas Resized: ", canvas);
        }

        // Set up Stage Object

        this.move = move;
        this.startRender = function () {
            window.requestAnimationFrame(onFrame);
        };
    }


    // Event Listeners

    document.addEventListener('render:stages', handleRenderStage);

    function handleRenderStage (e) {
        if(!e.detail)
            throw new Error("Invalid Map Path");
        var scriptPath = e.detail;

        var PATH = DIR_STAGE + 'stage1.stage.js';
        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        e.preventDefault();

        var CONFIG = window.games.game1;
        CONFIG.util.loadScripts(SCRIPT_ASSETS, function() {
            var stage = new Stage1(e);
            stage.startRender();
        });
    }

})();