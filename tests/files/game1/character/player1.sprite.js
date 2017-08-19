/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    window.games.game1.character.Player1 = Player1;

    function Player1(gl) {
        var Config = window.games.game1;
        var ColorFragment = Config.fragment.ColorFragment;
        this.fragment = new ColorFragment();

        this.fragment.setAcceleration(0,0,-0.001);
        this.fragment.setVelocity(-0.02,0,0.1);
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
        // this.rectangle.render(e, gl);
        this.fragment.render(e, gl);
    };
})();