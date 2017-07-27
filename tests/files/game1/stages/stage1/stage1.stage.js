/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var DIR = 'tests/files/game1/';
    var DIR_STAGE = 'tests/files/game1/stages/stage1/';
    var PATH_TILE_DEFAULT = DIR_STAGE + 'tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = DIR_STAGE + 'map/bklayer.map.png';
    var SCRIPT_ASSETS = [
        DIR + 'sprites/player1.sprite.js',
        DIR + 'sprites/player2.sprite.js'
    ];

    // Load and Render

    function run(e) {
        var Config = window.games.game1;
        var Util = Config.util;
        var Sprite = Config.sprite;

        var canvas = e.target;

        var gl = canvas.getContext('webgl');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Point of View / Perspective
        // var POV = UTIL.getPOV(gl);

        // Controllers
        var Player1 = new Sprite.Player1(0);

        // Sprites
        var Sprite1 = new Util.Sprite();
        Sprite1.setController(Player1);


        // Backgrounds
        var BKLayer = Util.getGradientRenderer(gl, 1);


        // Set up Stage Logic

        // Set up render loop
        window.requestAnimationFrame(onFrame);
        function onFrame(e){
            window.requestAnimationFrame(onFrame);


            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.3, 0.9, 0.3, 0.5);
            gl.clearDepth(1.0);

            // Render
            BKLayer(e, gl);
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
            run(e);
        });
    }

})();