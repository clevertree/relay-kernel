/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var DIR_CHARACTER = ROOT + 'sprite/';
    var DIR_SHEET_LEM = DIR_CHARACTER + 'sheet/lem/lem-default.sprite-sheet.png'
    Config.character.Player1 = Player1;

    function Player1(gl) {
        var Fragment = Config.fragment;

        this.renders = [
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/2 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/4 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/8 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/16 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/20 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, 256, 256, (1/24 * 1000)),
        ];

        for(var i=0; i<this.renders.length; i++) {
            var render = this.renders[i];
            render.setAcceleration(0,0,0.00002 * i);
            render.setVelocity(-0.003,-0.001,-0.01);
        }


        this.hitBoxes = [];
    }

    Player1.prototype.addHitBox = function(sprite) {
        this.hitBoxes.push(sprite);
    };

    /**
     * Update Sprite Logic
     * @param duration
     */
    Player1.prototype.update = function(duration) {

    };

    /**
     * Render Sprite
     * @param e Event
     * @param gl WebGL Instance
     * @param stage
     */
    Player1.prototype.render = function(e, gl, stage) {
        for(var i=0; i<this.renders.length; i++) {
            var render = this.renders[i];
            render.render(e, gl, stage);
        }
    };
})();