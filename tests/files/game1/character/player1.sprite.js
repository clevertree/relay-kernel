/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var DIR = 'tests/files/game1/';
    var DIR_CHARACTER = DIR + 'character/';
    var DIR_GRAPHICS = DIR + 'graphics/';
    window.games.game1.character.Player1 = Player1;

    function Player1(gl) {
        var Config = window.games.game1;
        var Fragment = Config.fragment;
        var ColorFragment = Fragment.ColorFragment;
        var TextureFragment = Fragment.TextureFragment;

        this.textures = {
            'default': TextureFragment.loadTexture(gl, DIR_GRAPHICS + 'misc/test-shape-square.png')
        };

        this.renders = [
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
            new ColorFragment(),
            new TextureFragment(this.textures.default),
        ];

        for(var i=0; i<this.renders.length; i++) {
            var render = this.renders[i];
            render.setAcceleration(0,0,0.0001 * i);
            render.setVelocity(-0.01,-0.003,-0.1);
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
     */
    Player1.prototype.render = function(e, gl) {
        for(var i=0; i<this.renders.length; i++) {
            var render = this.renders[i];
            render.render(e, gl);
        }
    };
})();