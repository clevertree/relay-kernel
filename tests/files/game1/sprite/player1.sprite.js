/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = ROOT + 'sprite/';
    var DIR_SHEET_LEM = DIR_CHARACTER + 'sheet/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';
    Config.character.Player1 = Player1;

    function Player1(gl) {
        var Fragment = Config.fragment;

        var renders = [
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/8 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/10 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/12 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/16 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/20 * 1000)),
            new Fragment.SpriteSheet(gl, DIR_SHEET_LEM, SPRITE_RESOLUTION, SPRITE_RESOLUTION, (1/24 * 1000)),
        ];

        for(var i=0; i<renders.length; i++) {
            var render = renders[i];
            render.setAcceleration(0,0,0.00002 * i);
            render.setVelocity(-0.003,-0.001,-0.01);
        }


        /**
         * Update Sprite Logic
         * @param t
         */
        this.update = function(t) {

        };

        /**
         * Render Sprite
         * @param t time elapsed
         * @param gl WebGL Instance
         * @param stage
         * @param flags
         */
        this.render = function(t, gl, stage, flags) {
            for(var i=0; i<renders.length; i++) {
                var render = renders[i];
                render.render(t, gl, stage, flags);
            }
        };
    }

})();