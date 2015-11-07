(function() {

	Popcorn.player('remote', {
		_setup: function(options) {
			var media = this,
				paused = true,
				part = 0,
				container,
				timingInterval,
				playTime,
				pauseTime,
				duration,
				synced = false,
				socket,
				minDiff = Infinity, maxDiff = -Infinity, timingDiff = 0;

			function nop() {
			}

				document.body.style.backgroundColor = '#aaa';

			function updateState() {
				var oldState = media.readyState;

				if (duration !== undefined) {
					if (synced) {
						media.readyState = 4;
					} else if (timingInterval !== undefined) {
						media.readyState = 3;
					} else {
						media.readyState = 2;
					}

					if (media.readyState >= 2 && oldState < 2) {
						media.dispatchEvent('loadedmetadata');
						media.dispatchEvent('data');
					}

					if (media.readyState >= 3 && oldState < 3) {
						//media.dispatchEvent('loadedmetadata');
					}

					if (media.readyState >= 4 && oldState < 4) {
						document.body.style.backgroundColor = '';
						media.dispatchEvent('canplay');
						media.dispatchEvent('canplaythrough');
						media.dispatchEvent( "load" );
						timeUpdate();
					}

				} else {
				}

			}

			function play() {
				paused = false;
				media.dispatchEvent( "play" );
				media.dispatchEvent( "playing" );
			}

			function pause() {
				paused = true;
				//pauseTime = Date.now() / 1000;
				media.dispatchEvent( "pause" );
			}

			function seek() {
				media.dispatchEvent( "seeked" );
				//todo: set currentTime
				media.dispatchEvent( "timeupdate" );
			}

			function timeUpdate() {
				//todo: set currentTime
				if (!paused) {
					media.dispatchEvent( "timeupdate" );
				}
				setTimeout( timeUpdate, 10 );
			}

			function onMessage(message) {
				if (!message) return;
				var clientReceived = Date.now(),
					accuracy;
				if (message && message.timing !== undefined) {
					minDiff = Math.min(minDiff, clientReceived - message.timing);

					if (minDiff !== undefined) {
						if (message.maxDiff !== undefined) {
							maxDiff = message.maxDiff;
							timingDiff = minDiff + (maxDiff - minDiff) / 2;

							accuracy = Math.abs(maxDiff - minDiff);
							console.log('accuracy', accuracy);
							if (accuracy < 200) {
								if (!synced) {
									synced = true;
									updateState();
								}

								if (accuracy < 50) {
									clearInterval(timingInterval);
									console.log('done');
								}
							}
						} else {
							timingDiff = minDiff;
						}
					}
				}

				if (message.playTime) {
					if (playTime !== message.playTime) {
						playTime = message.playTime;
						seek();
					}
				}

				if (message.part !== undefined) {
					part = message.part;
					// document.getElementById('part').innerHTML = part;
				}

				if (message.action === 'play') {
					play();
				} else if (message.action === 'pause') {
					pauseTime = Math.min(duration, ((Date.now() - timingDiff) - playTime) / 1000);
					pause();
				}

				if (message.duration !== undefined && message.duration !== duration) {
					duration = message.duration;
					media.dispatchEvent( "durationchange" );
					updateState();
				}
			}

			function requestTiming() {
				socket.json.send({
					action: 'sync',
					minDiff:	minDiff,
					timing:		Date.now()
				});
			}

			media.play = nop;
			media.pause = nop;

			Popcorn.player.defineProperty( media, "currentTime", {
				set: nop,
				get: function() {
					if (paused) {
						return pauseTime;
					} else if (playTime) {
						return Math.min(duration, ((Date.now() - timingDiff) - playTime) / 1000);
					} else {
						return 0;
					}
				}
			});

			Popcorn.player.defineProperty( media, "muted", {
				set: nop,
				get: function() {
					return false;
				}
			});

			Popcorn.player.defineProperty( media, "part", {
				set: nop,
				get: function() {
					return part;
				}
			});

			Popcorn.player.defineProperty( media, "volume", {
				set: nop,
				get: function() {
					return 1;
				}
			});

			Popcorn.player.defineProperty( media, "paused", {
				set: nop,
				get: function() {
					return paused;
				}
			});

			Popcorn.player.defineProperty( media, "duration", {
				set: nop,
				get: function() {
					return duration;
				}
			});

			media.readyState = 0;

			//socket = new io.Socket(null, {port: 8080, rememberTransport: false});
			//socket.connect();
			socket = io.connect(location.origin);
			socket.on('message', onMessage);
			socket.on('connect', function() {
				media.readyState = 1;
				requestTiming();
				timingInterval = setInterval(requestTiming, 1000);
			});
			media.dispatchEvent('loadstart');
			
		}
	});
})();
