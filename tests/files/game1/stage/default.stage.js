/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {
    var PATH_TILE_DEFAULT = 'stage/tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = 'stage/map/bklayer.map.png';


    // Load and Render

    function run(e) {
        var CONFIG = window.games.game1;
        var UTIL = CONFIG.util;
        var ROOT = CONFIG.dir.root;

        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        var gl = canvas.getContext('webgl');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);


        // Backgrounds
        var BKLayer = UTIL.getTileMapRenderer(gl, ROOT+PATH_MAP_BKLAYER, ROOT+PATH_TILE_DEFAULT, 64, 4);

        // Sprites
        var Sprite1 = UTIL.getGradientRenderer(gl, 1);
        var Sprite2 = UTIL.getGradientRenderer(gl, 5);
        var Sprite3 = UTIL.getGradientRenderer(gl, 50);

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
            Sprite1(e, gl);
            Sprite2(e, gl);
            Sprite3(e, gl);
        }

    }

    // Event Listeners
    
    document.addEventListener('render:stage', handleRenderStage);

    function handleRenderStage (e) {
        if(!e.detail)
            throw new Error("Invalid Map Path");
        var scriptPath = e.detail;

        var CONFIG = window.games.game1;
        var PATH = CONFIG.dir.root + 'stage/default.stage.js';
        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        e.preventDefault();
        run(e);
    }



})();