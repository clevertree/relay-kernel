/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var DIR_STAGE = ROOT + 'stages/stage1/';
    var DIR_LEVEL_MAP = DIR_STAGE + 'map/default.tilemap.png';
    var DIR_TILE_SHEET = DIR_STAGE + 'tiles/default.tiles.png';
    var DIR_HEIGHT_MAP = DIR_STAGE + 'map/main.heightmap.png';
    Config.level.Level1 = Level1;

    function Level1(gl) {
        var pfMain = new Config.fragment.TileMap(gl, DIR_LEVEL_MAP, DIR_TILE_SHEET, 64);
        var hmMain = new Config.fragment.HeightMap(gl, DIR_HEIGHT_MAP);
        // pfMain.move(0, -15);

        var renders = [
            pfMain,
            hmMain
            // new Fragment.TileMap(gl, DIR_LEVEL_MAP, DIR_TILE_SHEET, 16),
        ];

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

        /**
         * Update Sprite Logic
         * @param t
         */
        this.update = function(t) {

        };

        this.testHit = function(x, y, z) {
            for(var i=0; i<renders.length; i++) {
                var render = renders[i];
                var pixel = render.testHit(x, y, z);
                if(pixel)
                    return pixel;
            }
            return null;
        }

    }

})();