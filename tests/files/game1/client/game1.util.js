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
        "sprites": {
            "getGradientBackgroundRenderer": getGradientBackgroundRenderer
        },
        "util": {
            "m4" : {
                "projection": projection,
                "multiply": multiply,
                "translation": translation,
                "xRotation": xRotation,
                "yRotation": yRotation,
                "zRotation": zRotation,
                "scaling": scaling,
                "translate": translate,
                "xRotate": xRotate,
                "yRotate": yRotate,
                "zRotate": zRotate,
                "scale": scale
            },
            "getTileMapRenderer": getTileMapRenderer,
            "getGradientRenderer": getGradientRenderer
        }
    };

    // Sprites

    function getGradientBackgroundRenderer(gl, colorHandler, positionHandler, povHandler) {
        if(!colorHandler)       colorHandler = function () { return null; };
        if(!positionHandler)    positionHandler = function () { return null; };
        if(!povHandler)         povHandler = function () { return null; };

        var colors = colorHandler() || [
            0.4,  0.5,  0.6,  1.0,    // white
            0.4,  0.5,  0.4,  1.0,    // white
            0.0,  0.0,  0.0,  1.0,    // green
            0.0,  0.0,  0.0,  1.0     // blue
        ];

        var BK = getGradientRenderer(gl, colors);

        function GradientBackgroundRenderer() {
            BK(
                colorHandler(),
                positionHandler(),
                povHandler()
            );
        }

        return GradientBackgroundRenderer;
    }

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

    var gradientRendererProgram = null;
    function getGradientRenderer(gl, colors) {
        var i=1;
        // Get Program
        var program = gradientRendererProgram || compileProgram(gl, gradientVS, gradientFS);
        gradientRendererProgram = program;
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


        var squareVerticesColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors));


        var mvMatrix = new Float32Array([i, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -6, 1]);
        var perspectiveMatrix = new Float32Array([1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, i/10, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0]);

        function render(newColors, newPositionMatrix, newPOVMatrix) {
            if(newColors) {
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newColors)); // , gl.STATIC_DRAW
            }

            if(newPositionMatrix) {
                mvMatrix = new Float32Array(newPositionMatrix);
            }
            if(newPOVMatrix) {
                perspectiveMatrix = new Float32Array(newPOVMatrix);
            }
            // Clear the canvas before we start drawing on it.
//             gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Select program
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

        return render;
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

    // Matrix Utils


    function projection(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1,
        ];
    }

    function multiply(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }

    function translation(tx, ty, tz) {
        return [
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1,
        ];
    }

    function xRotation(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    }

    function yRotation(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    }

    function zRotation(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }

    function scaling(sx, sy, sz) {
        return [
            sx, 0,  0,  0,
            0, sy,  0,  0,
            0,  0, sz,  0,
            0,  0,  0,  1,
        ];
    }

    function translate(m, tx, ty, tz) {
        return multiply(m, translation(tx, ty, tz));
    }

    function xRotate(m, angleInRadians) {
        return multiply(m, xRotation(angleInRadians));
    }

    function yRotate(m, angleInRadians) {
        return multiply(m, yRotation(angleInRadians));
    }

    function zRotate(m, angleInRadians) {
        return multiply(m, zRotation(angleInRadians));
    }

    function scale(m, sx, sy, sz) {
        return multiply(m, scaling(sx, sy, sz));
    }

})();