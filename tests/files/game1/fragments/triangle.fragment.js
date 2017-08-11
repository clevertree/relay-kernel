/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    window.games.game1.fragment.Triangle = Triangle;

    function Triangle(gl) {
        var Config = window.games.game1;
        var Util = Config.util;
        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        var vertices = [-0.5, -0.5, 0.5, -0.5, 0, 0.5];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.program = Util.compileProgram(gl, VS, FS);
        this.program.vertexPosAttrib = gl.getAttribLocation(this.program, 'pos');
    }

    /**
     * Update Sprite Logic
     * @param duration
     */
    Triangle.prototype.update = function(duration) {

    };

    /**
     * Render Sprite
     * @param e Event
     * @param gl WebGL Instance
     */
    Triangle.prototype.render = function(e, gl) {
        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.program.vertexPosAttrib);
        gl.vertexAttribPointer(this.program.vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Shader Source Code

    var VS = [
        "attribute vec2 pos;",
        "void main(void) {",
        "   gl_Position = vec4(pos, 0, 1);",
        "}"
    ].join("\n");

    var FS = [
        "precision mediump float;",
        "void main(void) {",
        "   gl_FragColor = vec4(0,0.8,0,1);",
        "}"
    ].join("\n");

})();


// /*  2
//    /\
//   /. \
// 0/____\1
// */