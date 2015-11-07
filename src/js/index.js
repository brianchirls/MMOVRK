(function () {
	'use strict';

	const SPE = require('shader-particle-engine');
	const Popcorn = require('exports?Popcorn!popcorn');
	require('./lib/popcorn-base');
	require('./lib/popcorn.parserUltra');
	require('./lib/popcorn.remote');
	// require('./lib/popcorn.vrkaraoke');

	//temporary popcorn plugin for just words that will be replaced by full-on karaoke
	Popcorn.plugin('karaoke', function (options) {
		var parent = options.target || VR,
			text = parent.text(options),
			x = options.x || 0,
			y = options.y || 0,
			z = options.z || 0;

		text.visible = false;
		text.moveTo(x, y, z);
		text.setScale(0.5);

		return {
			start: function () {
				text.visible = true;
			},
			end: function () {
				text.visible = false;
			}
		};
	});

	let
		particleGroup,
		emitter,
		scene = VR.scene;

	// Create particle group and emitter
	function initParticles() {
		particleGroup = new SPE.Group({
			texture: {
				value: THREE.ImageUtils.loadTexture('./img/smokeparticle.png')
			}
		});

		emitter = new SPE.Emitter({
			maxAge: 3,
			position: {
				value: new THREE.Vector3(0, 0, 0)
			},

			acceleration: {
				value: new THREE.Vector3(0, -5, 0),
				spread: new THREE.Vector3(5, 0, 5)
			},

			velocity: {
				value: new THREE.Vector3(0, 10, 0)
			},

			color: {
				value: [ new THREE.Color( 0.5, 0.5, 0.5 ), new THREE.Color() ],
				spread: new THREE.Vector3(1, 1, 1)
			},
			size: {
				value: [5, 0]
			},

			particleCount: 1500
		});

		particleGroup.addEmitter( emitter );
		scene.add( particleGroup.mesh );

	}

	const popcorn = Popcorn.remote('#status', { frameAnimation: true });
	popcorn.parseUltra('data/eclipse4.txt');
}());