/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.TextureFragment = TextureFragment;

    var PROGRAM;

    function TextureFragment(texture, mVertices, mModelView, glLineMode, mVelocity, mAcceleration) {
        if(!texture)
            throw new Error("Missing Texture");

        // Variables
        var mProjection =       TextureFragment.P_DEFAULT;
        mVertices = mVertices   || TextureFragment.V_DEFAULT;
        mModelView = mModelView || TextureFragment.MV_DEFAULT;

        // Set up object
        this.render = render;
        this.update = update;
        this.setVelocity = setVelocity;
        this.setAcceleration = setAcceleration;

        // Functions

        function setVelocity(vx, vy, vz) {
            mVelocity = Util.m4.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.m4.translation(ax, ay, az);
        }

        function update(duration) {
            if(mAcceleration)
                mVelocity = Util.m4.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.m4.multiply(mModelView, mVelocity);
        }

        function initProgram(gl) {
            // Init Render Mode
            glLineMode = glLineMode || gl.TRIANGLES;

            // Init Program
            var program = Util.compileProgram(gl, TextureFragment.VS, TextureFragment.FS);

            // look up where the vertex data needs to go.
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");

            // lookup uniforms
            uPMatrix = gl.getUniformLocation(program, "uPMatrix");
            uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
            uSampler = gl.getUniformLocation(program, "uSampler");

            // Create a buffer.
            bufVertexPosition = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);

            // Put a unit quad in the buffer
            var positions = [
                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            bufVertexPosition.itemSize = 2;
            bufVertexPosition.numItems = 4;

            // Create a buffer for texture coords
            bufTextureCoordinate = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);

            // Put texcoords in the buffer
            var texcoords = [
                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);



            // Create a texture.
            // var texture = gl.createTexture();

            // use texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);

            // bind to the TEXTURE_2D bind point of texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Fill the texture with a 1x1 blue pixel.
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            //     new Uint8Array([0, 0, 255, 255]));

            // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            // let's assume all images are not a power of 2
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


            // textureInfo.width = img.width;
            // textureInfo.height = img.height;
            //
            // gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            PROGRAM = program;
            return program;
        }

        function render(e, gl) {
            // Compile program
            if(!PROGRAM) {
                initProgram(gl);
            }

            // Update
            update(e.duration);


            // Render

            // gl.bindTexture(gl.TEXTURE_2D, tex);

            // Tell WebGL to use our shader program pair
            gl.useProgram(PROGRAM);

            // Setup the attributes to pull data from our buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.enableVertexAttribArray(aTextureCoordinate);
            gl.enableVertexAttribArray(aVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.enableVertexAttribArray(aTextureCoordinate);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // this matirx will convert from pixels to clip space
            // var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

            // this matrix will translate our quad to dstX, dstY
            // matrix = m4.translate(matrix, dstX, dstY, 0);

            // this matrix will scale our 1 unit quad
            // from 1 unit to texWidth, texHeight units
            // matrix = m4.scale(matrix, texWidth, texHeight, 1);

            // Set the matrix.
            gl.uniformMatrix4fv(uPMatrix, false, mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);

            // Tell the shader to get the texture from texture unit 0
            gl.uniform1i(uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);



            // gl.uniform1i(uSampler, 0);
            // gl.drawArrays(gl.TRIANGLE_STRIP, 0, bufVertexPosition.numItems);
        }
    }

    // Static

    TextureFragment.loadTexture = function(gl, filePath) {
        // Create a texture.
        var texture = gl.createTexture();
        texture.loaded = false;
        texture.onLoad = function(e, texture, image) {};
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        // Asynchronously load an image
        var image = new Image();
        image.src = filePath;
        image.addEventListener('load', function(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);

            // Callback
            texture.onLoad(e, texture, image);
        });

        return texture;
    };


    TextureFragment.MV_DEFAULT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    TextureFragment.P_DEFAULT = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Color Program

    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uSampler;

    TextureFragment.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        "    vTextureCoordinate = aTextureCoordinate;",
        "}"
    ].join("\n");

    TextureFragment.FS = [
        "precision mediump float;",

        "varying vec2 vTextureCoordinate;",

        "uniform sampler2D uSampler;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate);",
        "}"
    ].join("\n");

})();

