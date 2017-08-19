/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var m4 = {};
    var Util = {
        "m4": m4,
        "compileProgram": function (gl, vertexShaderSource, fragmentShaderSource) {

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
                throw ("program filed to link:" + gl.getProgramInfoLog(program));


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
        },

        // Textures
        "loadTexture": function(gl, mapPath) {
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
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


                console.info("Map Texture Loaded: ", image.width + 'x' + image.height, image);
                texture.width = image.width;
                texture.height = image.height;
                texture.loaded = true;
            });
            return texture;
        },

        // Scripts
        "loadScript": function(scriptPath, callback) {
            var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
            var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
            if (foundScript.length === 0) {
                console.log("Including Script " + scriptPath);
                var scriptElm = document.createElement('script');
                scriptElm.src = scriptPath;
                scriptElm.onload = callback;
                document.head.appendChild(scriptElm);

            } else {
                if(callback) callback();
            }
        },
        "loadScripts": function(scriptPathList, callback) {
            var counter = 0;
            for(var i=0; i<scriptPathList.length; i++) {
                counter++;
                Util.loadScript(scriptPathList[i], scriptLoaded);
            }
            if(counter === 0)
                callback();

            function scriptLoaded() {
                counter--;
                if(counter === 0 && callback)
                    callback();
            }
        }
    };

    window.games.game1.util = Util;

    // Matrix Utils


    m4.projection = function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1
        ];
    };

    m4.multiply = function(a, b) {
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
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
        ];
    };

    m4.translation = function(tx, ty, tz) {
        return [
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1
        ];
    };

    m4.xRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ];
    };

    m4.yRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ];
    };

    m4.zRotation = function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    };

    m4.scaling = function(sx, sy, sz) {
        return [
            sx, 0,  0,  0,
            0, sy,  0,  0,
            0,  0, sz,  0,
            0,  0,  0,  1
        ];
    };

    m4.translate = function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    };

    m4.xRotate = function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    };

    m4.yRotate = function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    };

    m4.zRotate = function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    };

    m4.scale = function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    };

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
        "uniform sampler2D sprite;",

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
        "   gl_FragColor = texture2D(sprite, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        //"   gl_FragColor = tile;",
        "}"
    ].join("\n");

})();