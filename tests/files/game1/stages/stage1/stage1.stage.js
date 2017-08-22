/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var ROOT = Config.path.root;
    var DIR_STAGE = ROOT + 'stages/stage1/';
    var PATH_TILE_DEFAULT = DIR_STAGE + 'tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = DIR_STAGE + 'map/bklayer.map.png';
    var SCRIPT_ASSETS = [
        ROOT + 'fragment/color.fragment.js',
        ROOT + 'fragment/texture.fragment.js',
        ROOT + 'fragment/spritesheet.fragment.js',

        ROOT + 'sprite/player1.sprite.js',
        ROOT + 'sprite/player2.sprite.js',
        ROOT + 'level/level1.sprite.js',
    ];

    // Load and Render

    function Stage1(e) {
        var Config = window.games.game1;
        // var Util = Config.util;

        var canvas = e.target;

        var gl = canvas.getContext('webgl');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Point of View / Perspective
        // var POV = UTIL.getPOV(gl);

        // PlayersTriangle
        var Player1 = new Config.character.Player1(gl);

        // Level Sprites
        var Level1 = new Config.level.Level1(gl);
        Player1.addHitBox(Level1);


        // Default FOV
        this.mProjection = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];
        this.startRender = function () {
            window.requestAnimationFrame(onFrame);
        };

        // Set up render loop

        var lastTime = 0;
        function onFrame(t){
            var elapsedTime = t - lastTime;
            lastTime = t;

            window.requestAnimationFrame(onFrame);

            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.3, 0.1, 0.3, 0.1);
            gl.clearDepth(1.0);

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Enable Depth testing
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            // Render
            Level1.render(elapsedTime, gl, this);
            Player1.render(elapsedTime, gl, this);
        }

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