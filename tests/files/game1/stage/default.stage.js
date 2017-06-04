/**
 * Created by ari on 5/14/2017.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('render:stage', handleRenderStage);

    var DIR = 'tests/files/game1/';
    var PATH = DIR + 'stage/default.stage.js';
    var LAYERS = [
        function(e, gl) {

            var tMap = loadMap(gl, DIR + 'stage/map/default.map.png');
            var tSpriteSheet = loadSpriteSheet(gl, DIR + 'stage/tiles/default.tiles.png');

            return getTileMapRenderer(gl, tMap, tSpriteSheet, 2);
        },
        function(e, gl) {

            var tMap = loadMap(gl, DIR + 'stage/map/default.map.png');
            var tSpriteSheet = loadSpriteSheet(gl, DIR + 'stage/tiles/default.tiles.png');

            return getTileMapRenderer(gl, tMap, tSpriteSheet, 4);
        },
        function(e, gl) {

            var tMap = loadMap(gl, DIR + 'stage/map/default.map.png');
            var tSpriteSheet = loadSpriteSheet(gl, DIR + 'stage/tiles/default.tiles.png');

            return getTileMapRenderer(gl, tMap, tSpriteSheet, 8);
        },
        function(e, gl) {

            var tMap = loadMap(gl, DIR + 'stage/map/default.map.png');
            var tSpriteSheet = loadSpriteSheet(gl, DIR + 'stage/tiles/default.tiles.png');

            return getTileMapRenderer(gl, tMap, tSpriteSheet, 16);
        },
        function(e, gl) {

            var tMap = loadMap(gl, DIR + 'stage/map/default.map.png');
            var tSpriteSheet = loadSpriteSheet(gl, DIR + 'stage/tiles/default.tiles.png');

            return getTileMapRenderer(gl, tMap, tSpriteSheet, 32);
        }
    ];

    // Event Listeners

    function handleRenderStage (e) {
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

            for(var i=0; i<loadedLayers.length; i++)
                loadedLayers[i](e, gl);
        }

    }

    // Rendering

    function getTileMapRenderer(gl, textureMap, textureSpriteSheet, special) {
        var canvas = gl.canvas;
        var tileSize = 16;
        var spriteSheetSize = 512;

        // Create Shaders (TODO: reuse)
        var vertexShader = compileShader(gl, tilemapVS, gl.VERTEX_SHADER);
        var fragmentShader = compileShader(gl, tilemapFS, gl.FRAGMENT_SHADER);
        var program = createProgram(gl, vertexShader, fragmentShader);


        // Tell WebGL how to draw quadrangles.
        var quadVerts = [
            //x  y  u  v
            -1, -1, 0, 1,
            1, -1, 1, 1,
            1,  1, 1, 0,

            -1, -1, 0, 1,
            1,  1, 1, 0,
            -1,  1, 0, 0
        ];
        // Create and load the buffer for quad verts.
        var quadVertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW); // STATIC_DRAW means it won't change again

        // Load all attributes and uniforms from the compiled shaders
        var attributes = {};
        var uniforms = {};

        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < count; i++) {
            var attrib = gl.getActiveAttrib(program, i);
            attributes[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }

        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (i = 0; i < count; i++) {
            var uniform = gl.getActiveUniform(program, i);
            var name = uniform.name.replace("[0]", "");
            uniforms[name] = gl.getUniformLocation(program, name);
        }


        var zoom = 1;
        var x = 1, y = 1;

        // Render routine
        return function() {
            if(!textureMap.loaded || !textureSpriteSheet.loaded)
                return false;

            // zoom *= 0.999;
            x+=special;
            y+=2;
            if(x > 80000) x=-100;
            if(y > 1000) y=-100;

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Load program
            gl.useProgram(program);

            gl.enableVertexAttribArray(attributes.position);
            gl.enableVertexAttribArray(attributes.texture);
            gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(attributes.texture, 2, gl.FLOAT, false, 16, 8);

            gl.uniform2fv(uniforms.inverseSpriteTextureSize, new Float32Array([1/spriteSheetSize,1/spriteSheetSize]));
            gl.uniform1f(uniforms.tileSize, tileSize);
            gl.uniform1f(uniforms.inverseTileSize, 1/tileSize);


            // Load Sprite Sheet
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureSpriteSheet);
            gl.uniform1i(uniforms.sprites, 0);

            gl.uniform1i(uniforms.tiles, 1);
            gl.uniform2fv(uniforms.inverseTileTextureSize, new Float32Array([1/512,1/512]));
            gl.uniform1i(uniforms.repeatTiles, 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textureMap);

            var viewportSize = new Float32Array([canvas.offsetWidth*zoom, canvas.offsetHeight*zoom]);
            gl.uniform2fv(uniforms.viewportSize, viewportSize);


            gl.uniform2f(uniforms.viewOffset, x, y);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textureMap);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        }
    }


    // Loading

    function loadMap(gl, mapPath) {
        var image = new Image();
        var texture = gl.createTexture();
        texture.loaded = false;

        image.setAttribute('src', mapPath);
        image.addEventListener("load", function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            // MUST be filtered with NEAREST or tile lookup fails
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Repeats tiles
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


            console.info("Map Texture Loaded: ", image.width + 'x' + image.height, image);
            texture.loaded = true;
        });
        return texture;
    }

    function loadSpriteSheet(gl, tilesPath) {
        var image = new Image();
        var texture = gl.createTexture();
        texture.loaded = false;


        image.setAttribute('src', tilesPath);
        image.addEventListener("load", function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Worth it to mipmap here?

            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Repeats map
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // gl.generateMipmap(gl.TEXTURE_2D);
            console.info("TileSheet Texture loaded: ", image.width + 'x' + image.height, image);
            texture.loaded = true;
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