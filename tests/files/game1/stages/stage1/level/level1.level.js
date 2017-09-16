/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var DIR_STAGE = ROOT + 'stages/stage1/';
    var DIR_LEVEL_MAP = DIR_STAGE + 'map/default.map.png';
    var DIR_TILE_SHEET = DIR_STAGE + 'tiles/default.tiles.png';
    Config.level.Level1 = Level1;
    var loadTexture = Util.loadTexture;

    function Level1(gl) {
        var tLevelMap = Config.fragment.TileMap.loadLevelTexture(gl, DIR_LEVEL_MAP);
        var tTileSheet = Config.fragment.TileMap.loadTileTexture(gl, DIR_TILE_SHEET);

        var renders = [
            new Config.fragment.TileMap(gl, tTileSheet, tLevelMap, 64),
            // new Fragment.TileMap(gl, DIR_LEVEL_MAP, DIR_TILE_SHEET, 16),
        ];

        for(var i=0; i<renders.length; i++) {
            var render = renders[i];
            // render.setAcceleration(0,0,-0.00002 * i);
            // render.setVelocity(-0.001,0.0003,0.003);
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

        this.getFirstPixel = function(x, y, z) {
            for(var i=0; i<renders.length; i++) {
                var render = renders[i];
                var pixel = render.getPixel(x, y, z);
                if(pixel)
                    return pixel;
            }
            return null;
        };

    }

})();