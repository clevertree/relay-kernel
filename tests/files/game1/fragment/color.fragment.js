/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.ColorFragment = ColorFragment;

    var PRGColor, PRGTexture;

    function ColorFragment(mColors, mVertices, mModelView, glLineMode, mVelocity, mAcceleration) {
        // Variables
        var mProjection =       ColorFragment.P_DEFAULT;
        mVertices = mVertices   || ColorFragment.V_DEFAULT;
        mModelView = mModelView || ColorFragment.MV_DEFAULT;
        mColors = mColors       || ColorFragment.C_DEFAULT;

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

        function render(e, gl) {
            // Compile program
            if(!PRGColor) {
                // Init Render Mode
                glLineMode = glLineMode || gl.TRIANGLES;

                // Init Program
                PRGColor = Util.compileProgram(gl, ColorFragment.VS, ColorFragment.FS);

                // Position Buffer
                PRGColor.vertexPositionBuffer = gl.createBuffer();
                PRGColor.vertexPositionBuffer.itemSize = 3;
                PRGColor.vertexPositionBuffer.numItems = 3;

                // Color Buffer
                PRGColor.triangleVertexColorBuffer = gl.createBuffer();
                PRGColor.triangleVertexColorBuffer.itemSize = 4;
                PRGColor.triangleVertexColorBuffer.numItems = 3;
                PRGColor.vertexColorAttribute = gl.getAttribLocation(PRGColor, "aVertexColor");
                gl.enableVertexAttribArray(PRGColor.vertexColorAttribute);

                // Vertex Position Attribute
                PRGColor.vertexPositionAttribute = gl.getAttribLocation(PRGColor, "aVertexPosition");
                gl.enableVertexAttribArray(PRGColor.vertexPositionAttribute);

                // Uniforms
                PRGColor.pMatrixUniform = gl.getUniformLocation(PRGColor, "uPMatrix");
                PRGColor.mvMatrixUniform = gl.getUniformLocation(PRGColor, "uMVMatrix");
            }

            // Update
            update(e.duration);

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
    }

    // Shapes
    ColorFragment.V_TRIANGLE_EQUILATERAL = new Float32Array([           // /*  2
        0.0,  1.0,  0.0,                                                //    /\
        -1.0, -1.0,  0.0,                                               //   /. \
        1.0, -1.0,  0.0                                                 // 0/____\1
    ]);                                                                 // */
    ColorFragment.V_DEFAULT = ColorFragment.V_TRIANGLE_EQUILATERAL;


    // Colors
    ColorFragment.C_DEFAULT = new Float32Array([
        1.0, 0.0, 0.0, -1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.5
    ]);

    ColorFragment.MV_DEFAULT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    ColorFragment.P_DEFAULT = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Color Program

    ColorFragment.VS = [
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

    ColorFragment.FS = [
        "precision mediump float;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_FragColor = vColor;",
        "}"
    ].join("\n");

})();

