/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {

    var UTIL = window.games.game1.util;

    var DIR = 'tests/files/game1/';
    var PATH = DIR + 'stage/default.stage.js';
    var PATH_TILE_DEFAULT = DIR + 'stage/tiles/default.tiles.png';
    var PATH_MAP_BKLAYER = DIR + 'stage/map/bklayer.map.png';

    // Load and Render

    function run(e) {
        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        var gl = canvas.getContext('webgl');

        // Load resources

        var BKLayer = UTIL.getTileMapRenderer(gl, PATH_MAP_BKLAYER, PATH_TILE_DEFAULT, 64, 4);

        // Set up Stage Logic



        // Set up render loop
        window.requestAnimationFrame(onFrame);
        function onFrame(e){
            window.requestAnimationFrame(onFrame);


            // Set viewport size (Todo: optimize)
            if(canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
                console.log("Resizing: ", canvas.width, canvas.height);
            }

            // Clear background
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.3, 0.9, 0.3, 0.5);
            gl.clearDepth(1.0);

            // Render
            BKLayer(e, gl);
        }

    }

    // Event Listeners
    
    document.addEventListener('render:stage', handleRenderStage);

    function handleRenderStage (e) {
        if(!e.detail)
            throw new Error("Invalid Map Path");
        var scriptPath = e.detail;

        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        e.preventDefault();
        run(e);
    }



})();