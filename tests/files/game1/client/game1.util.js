/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    if(typeof window['games'] === 'undefined')
        window.games = {};

    var DIR = 'tests/files/game1/';
    window.games['game1'] = {
        "dir": {
            "root": DIR,
            "stage_default": DIR + 'stage/default.stage.js'
        },
        "util": {
            "getTileMapRenderer": getTileMapRenderer,
            "getGradientRenderer": getGradientRenderer,
        },
        "shader": {
            "tileMapVS": tilemapVS,
            "tileMapFS": tilemapFS
        }
    };

    // Util functions


    // Renders

    function getGradientRenderer(gl, vertexColorList) {

        // gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        // gl.clearDepth(1.0);                 // Clear everything
        // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


        // Get Program
        var program = compileProgram(gl, gradientVS, gradientFS);
        var attributes = program.attributes;
        var uniforms = program.uniforms;

        gl.enableVertexAttribArray(attributes.aVertexPosition);
        gl.enableVertexAttribArray(attributes.aVertexColor);

        // Create a buffer for the square's vertices.

        var squareVerticesBuffer = gl.createBuffer();

        // Select the squareVerticesBuffer as the one to apply vertex
        // operations to from here out.

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

        // Now create an array of vertices for the square. Note that the Z
        // coordinate is always 0 here.

        var vertices = [
            1.0,  1.0,  0.0,
            -1.0, 1.0,  0.0,
            1.0,  -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];

        // Now pass the list of vertices into WebGL to build the shape. We
        // do this by creating a Float32Array from the JavaScript array,
        // then use it to fill the current vertex buffer.

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Now set up the colors for the vertices

        var colors = vertexColorList || [
            1.0,  1.0,  1.0,  1.0,    // white
            1.0,  0.0,  0.0,  1.0,    // red
            0.0,  1.0,  0.0,  1.0,    // green
            0.0,  0.0,  1.0,  1.0     // blue
        ];

        var squareVerticesColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


        var mvMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -6, 1]);
        var perspectiveMatrix = new Float32Array([1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0]);

        return function() {

            // Clear the canvas before we start drawing on it.

//             gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Establish the perspective with which we want to view the
            // scene. Our field of view is 45 degrees, with a width/height
            // ratio of 640:480, and we only want to see objects between 0.1 units
            // and 100 units away from the camera.

            // var perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

            // Set the drawing position to the "identity" point, which is
            // the center of the scene.

            // loadIdentity();
            // mvMatrix = Matrix.I(4);

            // Now move the drawing position a bit to where we want to start
            // drawing the square.

            // mvTranslate([-0.0, 0.0, -6.0]);
            // mvMatrix.x(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());

            // Draw the square by binding the array buffer to the square's vertices
            // array, setting attributes, and pushing it to GL.

            // Load program
            gl.useProgram(program);

            gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
            gl.vertexAttribPointer(attributes.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

            // Set the colors attribute for the vertices.

            gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
            gl.vertexAttribPointer(attributes.aVertexColor, 4, gl.FLOAT, false, 0, 0);

            // Draw the square.

            gl.uniformMatrix4fv(uniforms.uPMatrix, false, perspectiveMatrix);

            gl.uniformMatrix4fv(uniforms.uMVMatrix, false, mvMatrix);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }




    function getTileMapRenderer(gl, textureMapPath, textureSpriteSheetPath, tileSize, special) {

        var textureMap = loadTexture(gl, textureMapPath);
        var textureSpriteSheet = loadTexture(gl, textureSpriteSheetPath);

        var canvas = gl.canvas;
        var inverseTileTextureSize = null;
        var inverseSpriteTextureSize = null;

        // Get Program
        var program = compileProgram(gl, tilemapVS, tilemapFS);
        var attributes = program.attributes;
        var uniforms = program.uniforms;

        // Create and load the buffer for quad verts.
        var quadVertBuffer = gl.createBuffer();


        var zoom = 1;
        var x = 1, y = 1;

        // Render routine
        return function() {
            if(!textureMap.loaded || !textureSpriteSheet.loaded)
                return false;

            if(!inverseTileTextureSize) {
                inverseTileTextureSize = new Float32Array([1/textureMap.width,1/textureMap.height]);
                inverseSpriteTextureSize = new Float32Array([1/textureSpriteSheet.width,1/textureSpriteSheet.height]);
            }

            zoom *= 0.999;
            x+=special;
            y+=2;
            if(x > 50000) x=-100;
            if(y > 1000) y=-100;
            if(zoom < 0.3) zoom = 5;

            // Enable blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            // Load program
            gl.useProgram(program);

            gl.bindBuffer(gl.ARRAY_BUFFER, quadVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW); // STATIC_DRAW means it won't change again

            var viewportSize = new Float32Array([canvas.offsetWidth*zoom, canvas.offsetHeight*zoom]); // TODO: optimize
            gl.uniform2fv(uniforms.viewportSize, viewportSize);

            gl.enableVertexAttribArray(attributes.position);
            gl.enableVertexAttribArray(attributes.texture);
            gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(attributes.texture, 2, gl.FLOAT, false, 16, 8);



            // Bind Sprite Sheet
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform2fv(uniforms.inverseSpriteTextureSize, inverseSpriteTextureSize);
            gl.uniform1f(uniforms.tileSize, tileSize);
            gl.uniform1f(uniforms.inverseTileSize, 1/tileSize);
            gl.uniform1i(uniforms.sprites, 0);
            gl.bindTexture(gl.TEXTURE_2D, textureSpriteSheet);

            // Render Map using sprite sheet
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.tiles, 1);
            gl.uniform2f(uniforms.viewOffset, x, y);
            gl.uniform2fv(uniforms.inverseTileTextureSize, inverseTileTextureSize);
            gl.uniform1i(uniforms.repeatTiles, 0);
            gl.bindTexture(gl.TEXTURE_2D, textureMap);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

        }
    }


    // Shaders & Program


    function compileProgram(gl, vertexShaderSource, fragmentShaderSource) {

        // Create the shader object
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // Check if it compiled
        var success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!success)
            throw "could not compile shader:" + gl.getShaderInfoLog(vertexShader);

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Check if it compiled
        success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        if (!success)
            throw "could not compile shader:" + gl.getShaderInfoLog(fragmentShader);



        // create a program.
        var program = gl.createProgram();

        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program.
        gl.linkProgram(program);

        // Check if it linked.
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success)
            throw ("program filed to link:" + gl.getProgramInfoLog (program));


        // Load all attributes and uniforms from the compiled shaders
        program.attributes = {};
        program.uniforms = {};

        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < count; i++) {
            var attrib = gl.getActiveAttrib(program, i);
            program.attributes[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }

        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (i = 0; i < count; i++) {
            var uniform = gl.getActiveUniform(program, i);
            var name = uniform.name.replace("[0]", "");
            program.uniforms[name] = gl.getUniformLocation(program, name);
        }

        return program;
    }




    // Textures

    var textureCache = {};
    function loadTexture(gl, mapPath, force) {
        if(typeof textureCache[mapPath] !== 'undefined')
            return textureCache[mapPath];

        var image = new Image();
        var texture = gl.createTexture();

        texture.loaded = false;
        textureCache[mapPath] = texture;

        image.setAttribute('src', mapPath);
        image.addEventListener("load", function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            // MUST be filtered with NEAREST or tile lookup fails
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Repeats tiles
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


            console.info("Map Texture Loaded: ", image.width + 'x' + image.height, image);
            texture.width = image.width;
            texture.height = image.height;
            texture.loaded = true;
        });
        return texture;
    }


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

    // TileMap Shader

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

    // Gradient Shader

    var gradientVS = [
        "attribute vec3 aVertexPosition;",
        "attribute vec4 aVertexColor;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",

        "varying lowp vec4 vColor;",

        "void main(void) {",
        "   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "   vColor = aVertexColor;",
        "}"
    ].join("\n");

    var gradientFS = [
        "varying lowp vec4 vColor;",

        "void main(void) {",
        "   gl_FragColor = vColor;",
        "}"
    ].join("\n");

})();