/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    window.games.game1.fragment.Fragment = Fragment;
    var Config = window.games.game1;
    var Util = Config.util;

    var PRGColor, PRGTexture;
    function Fragment(mVertices, mModelView, mVelocity, mAcceleration, texture, mColors, glLineMode) {
        var mProjection = defaultProjection;
        glLineMode = glLineMode || gl.TRIANGLES;

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

        function render(e, gl) {
            update(e.duration);

            if(mColors) {
                gl.useProgram(PRGColor);

                // Bind Vertex Position Buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, PRGColor.vertexPositionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, mVertices, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(PRGColor.vertexPosAttrib, PRGColor.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                // Bind Color Buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, PRGColor.triangleVertexColorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, mColors, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(PRGColor.vertexColorAttribute, PRGColor.triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                // Set Matrix Uniforms
                gl.uniformMatrix4fv(PRGColor.pMatrixUniform, false, mProjection);  // Set Projection
                gl.uniformMatrix4fv(PRGColor.mvMatrixUniform, false, mModelView);  // Set World Coordinates

                // Render
                gl.drawArrays(glLineMode, 0, PRGColor.vertexPositionBuffer.numItems); // gl.TRIANGLES, gl.POINTS, gl.LINE_LOOP
            }
            if(texture) {

            }
        }

        // Init programs
        PRGColor = PRGColor || getProgramColor(gl);
        PRGTexture = PRGTexture || getProgramTexture(gl);

        // Set up object
        this.render = render;
        this.update = update;
        this.setVelocity = setVelocity;
        this.setAcceleration = setAcceleration;
    }

    // Static

    Fragment.addColorFragment = function(gl, mColors) {
        return new Fragment(null, null, null, null, null, null, mColors, gl.LINE_LOOP);
    };










    // Defaults

    var defaultTriangleVerticies = new Float32Array([
        0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0
    ]);

    var defaultColors = new Float32Array([
        1.0, 0.0, 0.0, 0.8,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.5
    ]);

    var defaultModelView = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    var defaultProjection = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Color Program

    var programColor;
    function getProgramColor(gl) {
        if(programColor)
            return;

        // Init
        var program = Util.compileProgram(gl, VSColor, FSColor);

        // Position Buffer
        program.vertexPositionBuffer = gl.createBuffer();
        program.vertexPositionBuffer.itemSize = 3;
        program.vertexPositionBuffer.numItems = 3;

        // Color Buffer
        program.triangleVertexColorBuffer = gl.createBuffer();
        program.triangleVertexColorBuffer.itemSize = 4;
        program.triangleVertexColorBuffer.numItems = 3;
        program.vertexColorAttribute = gl.getAttribLocation(program, "aVertexColor");
        gl.enableVertexAttribArray(program.vertexColorAttribute);

        // Vertex Position Attribute
        program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
        gl.enableVertexAttribArray(program.vertexPositionAttribute);

        // Uniforms
        program.pMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
        program.mvMatrixUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        programColor = program;
        return program;
    }

    var VSColor = [
        "attribute vec3 aVertexPosition;",
        "attribute vec4 aVertexColor;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "   vColor = aVertexColor;",
        "}"
    ].join("\n");

    var FSColor = [
        "precision mediump float;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_FragColor = vColor;",
        "}"
    ].join("\n");

})();


// /*  2
//    /\
//   /. \
// 0/____\1
// */