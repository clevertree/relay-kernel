/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('render:map', handleRenderMap);

    var DIR = 'tests/files/game1/';
    var PATH = DIR + 'stage/default.stage.js';
    var LAYERS = [
        function(e, gl) {
            // Load Resources
            var tMap = loadMap(DIR + 'stage/map/default.map.png');
            var tTiles = loadTiles(DIR + 'stage/tiles/default.tiles.png');

            // Create Shaders
            var vertexShader = compileShader(gl, tilemapVS, gl.VERTEX_SHADER);
            var fragmentShader = compileShader(gl, tilemapFS, gl.FRAGMENT_SHADER);
            var program = createProgram(gl, vertexShader, fragmentShader);

            // Render routine
            return function() {
                gl.clearColor(0.3, 0.9, 0.3, 0.5);
                gl.clearDepth(1.0);
                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                /*gl.enable(gl.BLEND);
                 gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);*/

                gl.useProgram(program);

                // gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);
                //
                // gl.enableVertexAttribArray(shader.attribute.position);
                // gl.enableVertexAttribArray(shader.attribute.texture);
                // gl.vertexAttribPointer(shader.attribute.position, 2, gl.FLOAT, false, 16, 0);
                // gl.vertexAttribPointer(shader.attribute.texture, 2, gl.FLOAT, false, 16, 8);
                //
                // gl.uniform2fv(shader.uniform.viewportSize, this.scaledViewportSize);
                // gl.uniform2fv(shader.uniform.inverseSpriteTextureSize, this.inverseSpriteTextureSize);
                // gl.uniform1f(shader.uniform.tileSize, this.tileSize);
                // gl.uniform1f(shader.uniform.inverseTileSize, 1/this.tileSize);
                //
                // gl.activeTexture(gl.TEXTURE0);
                // gl.uniform1i(shader.uniform.sprites, 0);
                // gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);
                //
                // gl.activeTexture(gl.TEXTURE1);
                // gl.uniform1i(shader.uniform.tiles, 1);

                // // Draw each layer of the map
                // var i, layer;
                // for(i = this.layers.length; i >= 0; --i) {
                //     layer = this.layers[i];
                //     if(layer) {
                //         gl.uniform2f(shader.uniform.viewOffset, Math.floor(x * layer.scrollScaleX), Math.floor(y * layer.scrollScaleY));
                //         gl.uniform2fv(shader.uniform.inverseTileTextureSize, layer.inverseTextureSize);
                //         gl.uniform1i(shader.uniform.repeatTiles, layer.repeat ? 1 : 0);
                //
                //         gl.bindTexture(gl.TEXTURE_2D, layer.tileTexture);
                //
                //         gl.drawArrays(gl.TRIANGLES, 0, 6);
                //     }
                // }
            }
        }
    ];

    // Event Listeners

    function handleRenderMap (e) {
        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        if(!e.detail)
            throw new Error("Invalid Map Path");
        var scriptPath = e.detail;

        if(scriptPath !== PATH)
            return;     // TODO: disable active maps on canvas

        e.preventDefault();

        var gl = canvas.getContext('webgl');
        // console.info("Map Context initiated: ", gl);

        // Load All Layers
        var loadedLayers = [];
        for(var i=0; i<LAYERS.length; i++)
            loadedLayers.push(LAYERS[i](e, gl));

        // Rendering
        window.requestAnimationFrame(onFrame);
        function onFrame(){
            window.requestAnimationFrame(onFrame);
            for(var i=0; i<loadedLayers.length; i++)
                loadedLayers[i]();
        }
    }


    // Loading

    function loadMap(mapPath) {
        return loadTexture(mapPath);
    }

    function loadTiles(tilesPath) {
        return loadTexture(tilesPath, function(gl, texture, image) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        });
    }

    function loadTexture(texturePath, callback) {
        var image = new Image();
        var texture = null;

        image.setAttribute('src', texturePath);
        image.addEventListener("load", function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            if(callback)
                callback(gl, texture, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
        return texture;
    }

    // Shader

    var tilemapVS = [
        "attribute vec2 position;",
        "attribute vec2 texture;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform vec2 viewOffset;",
        "uniform vec2 viewportSize;",
        "uniform vec2 inverseTileTextureSize;",
        "uniform float inverseTileSize;",

        "void main(void) {",
        "   pixelCoord = (texture * viewportSize) + viewOffset;",
        "   texCoord = pixelCoord * inverseTileTextureSize * inverseTileSize;",
        "   gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n");

    var tilemapFS = [
        "precision highp float;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform sampler2D tiles;",
        "uniform sampler2D sprites;",

        "uniform vec2 inverseTileTextureSize;",
        "uniform vec2 inverseSpriteTextureSize;",
        "uniform float tileSize;",
        "uniform int repeatTiles;",

        "void main(void) {",
        "   if(repeatTiles == 0 && (texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0)) { discard; }",
        "   vec4 tile = texture2D(tiles, texCoord);",
        "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
        "   vec2 spriteCoord = mod(pixelCoord, tileSize);",
        "   gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        //"   gl_FragColor = tile;",
        "}"
    ].join("\n");

    /**
     * Creates and compiles a shader.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} The shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
        // Create the shader object
        var shader = gl.createShader(shaderType);

        // Set the shader source code.
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check if it compiled
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            // Something went wrong during compilation; get the error
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }

        return shader;
    }

    /**
     * Creates a program from 2 shaders.
     *
     * @param {!WebGLRenderingContext) gl The WebGL context.
     * @param {!WebGLShader} vertexShader A vertex shader.
     * @param {!WebGLShader} fragmentShader A fragment shader.
     * @return {!WebGLProgram} A program.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
        // create a program.
        var program = gl.createProgram();

        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program.
        gl.linkProgram(program);

        // Check if it linked.
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            // something went wrong with the link
            throw ("program filed to link:" + gl.getProgramInfoLog (program));
        }

        return program;
    };

})();