/**
 * Flowplayer Accessible Controls - A plugin for Flowplayer
 * This is part of ZAD Accessible Player - An extension for Contao CMS
 *
 * @package   zad_aplayer
 * @author    Antonello Dessì
 * @license   LGPL
 * @copyright Antonello Dessì 2011-2013
 */


//---------- FLOWPLAYER PLUGIN ----------//

$f.addPlugin('accessibleControls', function(id, options, fullscreenMode) {
  
  
  //---------- VARIABLES ----------//


  var 
  
    // player object
    player = this,
    
    // default options	
    opts = {
      captionsEnabled: true,
      fullscreenEnabled: true,
      buttonWidth: 25,
      playLabel: 'Play',
      pauseLabel: 'Pause',
      volumeLabel: [ 'Mute', 'Low', 'Medium', 'High' ],
      captionsOnLabel: 'Captions On',
      captionsOffLabel: 'Captions Off',
      fullScreenLabel: 'Full screen',
      normalScreenLabel: 'Exit full screen',
      sliderHelp: '<strong>Left/Down:</strong> 10 seconds backward<br /><strong>Right/Up:</strong> 10 seconds forward<br /><strong>Page Down:</strong> 1 minute backward<br /><strong>Page Up:</strong> 1 minute forward<br /><strong>Home:</strong> clip begin<br /><strong>End:</strong> clip end',
      volumeHelp: '<strong>Left/Down:</strong> decrease volume<br /><strong>Right/Up:</strong> increase volume<br /><strong>Home:</strong> no sound<br /><strong>End:</strong> max volume'
  	},
  
    // HTML template for control bar structure
  	template = 
      '<a class="play" href="javascript:;" title="" role="button"></a>' +
    	'<div class="track">' +
        '<div class="buffer"></div>' +
    		'<div class="progress"></div>' +
    		'<button class="playhead" title="" role="slider"></button>' +
    	'</div>' +        
    	'<div class="time"></div>' +
    	'<button class="volume" title="" role="slider"></button>' +  	
      '<a class="fullscreen" href="javascript:;" title="" role="button"></a>' + 
      '<a class="captions" href="javascript:;" title="" role="button"></a>' + 
      '<div class="help"></div>',
   
    // control bar elements
    play, track, buffer, progress, playhead, time, volume, fullscreen, captions, help,
  
    // slider control 
    slider = Slider(),
  
    // player HTML container
  	playerContainer = player.getParent(),

    // player width
  	playerWidth,

    // time info width
    timeWidth,
  
    // track bar width
  	trackWidth,
  
  	// init timer 
  	timer = null,
     
    // volume level values
  	volumeSet = [ 0, 40, 80, 100 ],
  	
  	// volume class names
  	volumeClass = [ 'volumeMute', 'volumeLow', 'volumeMedium', 'volumeHigh' ],
  	
  	// initial volume level
  	volumeLevel = 2,
  
  	// duration of the clip in seconds
  	duration = 0,
    
    // used for overwriting options
    key;


  //---------- FUNCTIONS ----------//


  // resize and show the control bar
	function resize() {
    // control bar	
  	playerWidth = playerContainer.clientWidth;
    id.style.width = playerWidth + 'px';	
    // time info
    timeWidth = (playerWidth >= 400) ? 130 : (playerWidth >= 320) ? 100 : 0;
    if (timeWidth == 0) {
      time.style.display = 'none';
      time.style.width = '0px';
    } else {
      time.style.display = 'block';
      time.style.width = timeWidth + 'px';
      time.style.right = (opts.buttonWidth * (1 + (opts.captionsEnabled ? 1 : 0) + (opts.fullscreenEnabled ? 1 : 0))) + 'px';
    }  
    // track bar container  
    trackWidth = playerWidth - timeWidth - 10 - opts.buttonWidth * (2 + (opts.captionsEnabled ? 1 : 0) + (opts.fullscreenEnabled ? 1 : 0));    
  	track.style.width = trackWidth + 'px';	
    // show control bar
    id.style.display = 'block';      
  	// initialize slider
    slider.init();
	}

  // get element in control bar by class name
	function byClass(name) {
		var 
      els = id.getElementsByTagName('*'),
      i = 0;
		for (; i < els.length; i++) {
			if (els[i].className == name) {
				return els[i];
			}
		}
	}

	// return seconds in h:mm:ss format
	function toTime(sec) {		
		var 
      h = Math.floor(sec / 3600),
      min = Math.floor(sec / 60);
		sec = Math.floor(sec - (min * 60));
		if (h >= 1) {
			min -= h * 60;
			return h + ':' + ((min >= 10) ? min : '0' + min) + ':' + ((sec >= 10) ? sec : '0' + sec);
		}		
		return ((min >= 10) ? min : '0' + min) + ':' + ((sec >= 10) ? sec : '0' + sec);
	}
	
  // return time info 
	function getTime(tm, totaltm) {
		return '<span>' + toTime(tm) + '</span> <strong>' + toTime(totaltm) + '</strong>';	
	}
	 
	// set volume level (0-3) 
  function setVolumeLevel(level) {  
    volumeLevel = level;        
    volume.className = volumeClass[volumeLevel];
  	volume.title = opts.volumeLabel[volumeLevel];
  	volume.setAttribute('aria-valuenow', volumeSet[volumeLevel]);
  	volume.setAttribute('aria-valuetext', opts.volumeLabel[volumeLevel]);
	  player.setVolume(volumeSet[volumeLevel]);
  }
  
  // slider object
  function Slider() {
    
    //--- variables ---//

    var 
      dragging,
      dragOffset,
      maxTime,
      maxBufferTime,
      maxX,
      offset,
      deltaX,
      deltaT,
      lastX;

    //--- public methods ---//

    // initialize object  
    function init() {
      // init variables
      offset = Math.round(playhead.clientWidth / 2);
      maxX = playhead.parentNode.clientWidth - playhead.clientWidth;
      maxBufferTime = 0;      
      setMaxTime(duration);      
      dragging = false;
      dragOffset = 0;
      lastX = -1;
      // init controls
      buffer.style.width = '0px';
      progress.style.width = '0px';
			playhead.style.left = '0px';
      // init events
      playhead.onkeydown = getKey;
      playhead.onmousedown = startDragging;        
    }
    
    // return TRUE if in dragging mode 
		function isDragging() {
			return dragging;	
		};
 
    // set the duration time for the clip 
		function setMaxTime(val) {
			maxTime = val;
      deltaX = maxTime / maxX; 
      deltaT = (maxTime > 0) ? (maxX / maxTime) : 0; 
    }

		// set time reached by buffer and show buffer bar
    function setBufferTime(val) {
      if (val > maxBufferTime) {
        var x = Math.floor(val * deltaT);
        maxBufferTime = val;
        // show buffer bar      
        if (x >= maxX) {
          x = maxX + playhead.clientWidth;
        } else if (x > 0) {
          x+= offset;
        }            
  			buffer.style.width = x + 'px';
      }
    }

		// set progress bar and playhead position, given current time 
		function setProgressTime(val) {
		  var x = Math.floor(val * deltaT);
			progress.style.width = x + 'px';
			playhead.style.left = x + 'px';
			lastX = x;
    }
 
		// set progress bar and playhead position, given click event 
    function goTo(e) {
      var x, t;
  		if (typeof e == 'undefined') { 
        e = window.event; 
      }
      if (e.target === playhead) {
        // click on playhead: ignore
        return;      
      }
  		if (typeof e.layerX == 'undefined') { 
        x = e.offsetX - offset; 
      } else {
        x = e.layerX - offset;
      }
      if (x < 0) {
        x = 0;
      } else if (x > maxX) {
        x = maxX;
      }
		  t = x * deltaX;
		  if (maxBufferTime > 0 && t <= maxBufferTime) {		    
			  player.seek((t == maxTime) ? (t - 0.1) : t);		
  			progress.style.width = x + 'px';
  			playhead.style.left = x + 'px';                  		  
  			lastX = x; 
      }
    }
    
    //--- private methods ---//
		    
  	// playhead event: onKeyDown   	 
    function getKey(e) {
      if (!player.isLoaded()) {
        return true;			
      }
      var t = player.getTime();
  		if (typeof e == 'undefined') { 
        e = window.event; 
      }
  		switch(e.keyCode) {
  			case 37: // Left arrow
  			case 40: // Down arrow
  				t -= 10;
  				break;
  			case 39: // Right arrow
  			case 38: // Up arrow
  				t += 10;
  				break;				
  			case 33: // Page up
  				t += 60;
  				break;			
  			case 34: // Page down
  				t -= 60;
  				break;
  			case 36: // Home
  				t = 0;
  				break;	
  			case 35: // End
  				t = maxTime - 0.1;
  				break;
  			default:
          return true;			
  			  break;
  		};
      if (t < 0) {
        t = 0;
      } else if (t >= maxTime) {
        t = maxTime - 0.1;
      }
      // move to time
      setProgressTime(t);      
			player.seek(t);		
  		return false;
  	}

		// playhead event: onMouseDown
    function startDragging(e) {
  		if (typeof e == 'undefined') { 
        e = window.event; 
      }
			dragging = true;
      dragOffset = e.clientX - lastX;		
			document.onmousemove = drag;
			document.onmouseup = endDragging;
			return false;	
		}

		// playhead event: onMouseMove
    function drag(e) {
      var x, t;
  		if (typeof e == 'undefined') { 
        e = window.event; 
      }			
			x = e.clientX - dragOffset; 
      if (x < 0) {
        x = 0;
      } else if (x > maxX) {
        x = maxX;
      }
		  t = x * deltaX;
		  if (maxBufferTime > 0 && t <= maxBufferTime) {
  			progress.style.width = x + 'px';
  			playhead.style.left = x + 'px';
  			lastX = x; 
      }
			return false;
		}

		// playhead event: onMouseUp
    function endDragging(e) {
      var t = lastX * deltaX;
			dragging = false;
			document.onmousemove = null;
			document.onmouseup = null;
		  player.seek(t == maxTime ? (t - 0.1) : t);
		}
 	
    //--- return values ---//
    
    // public methods
    return {
      init: init,
      isDragging: isDragging,
      setMaxTime: setMaxTime,
      setBufferTime: setBufferTime,
      setProgressTime: setProgressTime,
      goTo: goTo
    };    
  }


  //---------- MAIN CODE ----------//
  

	// get control bar id 
	if (typeof id != 'string' || !(id = document.getElementById(id))) {
		// fatal error
    return;
	}
  // overwrite default options with new ones
	if (options) {
		for (key in options) {
			if (key) {
				opts[key] = options[key];		
			} 
		}
	}
  // write control bar structure
  id.innerHTML = template;		
  // get controls id
  play = byClass('play');
	time = byClass('time');
	track = byClass('track');		
	buffer = byClass('buffer');
	progress = byClass('progress');
	playhead = byClass('playhead');
  volume = byClass('volume');
  fullscreen = byClass('fullscreen');
	captions = byClass('captions');
  help = byClass('help');
  // init time info
	time.innerHTML = getTime(0, duration);	
  // init volume button  
  volume.style.right = (opts.buttonWidth * ((opts.captionsEnabled ? 1 : 0) + (opts.fullscreenEnabled ? 1 : 0))) + 'px';
  volume.setAttribute('aria-valuemin', 0);  
  volume.setAttribute('aria-valuemax', 100);
  setVolumeLevel(volumeLevel);
  // init fullscreen button  
	if (opts.fullscreenEnabled) {
    fullscreen.style.right = (opts.buttonWidth * (opts.captionsEnabled ? 1 : 0)) + 'px';
    if (fullscreenMode['enable']) {
      fullscreen.className = 'normalscreen';
      fullscreen.title = opts.normalScreenLabel;
      fullscreen.label = opts.normalScreenLabel;
      window.onresize = fullscreenResize; 
      document.onkeydown = fullscreenKeys;            
    } else {
      fullscreen.title = opts.fullScreenLabel;
      fullscreen.label = opts.fullScreenLabel;
    }       
  } else {
    fullscreen.style.display = 'none';
    fullscreen.style.width = '0px';
  }
  // init captions button 
	if (opts.captionsEnabled) {
    captions.title = opts.captionsOnLabel;
    captions.label = opts.captionsOnLabel;  
  } else {
    captions.style.display = 'none';
    captions.style.width = '0px';
  }
  // init help tips 
  help.style.display = 'none';
  // resize and show control bar
  resize();  

  
  //---------- EVENTS ----------//


  // play button event: onClick
	play.onclick = function() {
		if (player.isLoaded()) {
			player.toggle();		
		} else {
			player.play();	
		}
	};

  // track event: onClick	
	track.onclick = function(e) {
	  if (player.isLoaded()) {
      slider.goTo(e);
    }
	};
	
	// playhead event: onFocus 
  playhead.onfocus = function() {
    if (!fullscreenMode.enable) {
      help.innerHTML = opts.sliderHelp;
      help.style.display = 'block';
    }
  };                        
  
	// playhead event: onBlur 
  playhead.onblur = function() {
    help.style.display = 'none';
  };

  // volume button event: onClick
	volume.onclick = function() {
    setVolumeLevel((volumeLevel + 1) % 4);
	};

	// volume event: onKeyDown 
	volume.onkeydown = function(e) {
		if (typeof e == 'undefined') { 
      e = window.event; 
    }
		switch(e.keyCode) {
			case 37: // Left arrow
			case 40: // Down arrow
				setVolumeLevel((volumeLevel - 1 < 0) ? 0 : (volumeLevel - 1));
				break;
			case 39: // Right arrow
			case 38: // Up arrow
				setVolumeLevel((volumeLevel + 1 > 3) ? 3 : (volumeLevel + 1));
				break;				
			case 36: // Home
        setVolumeLevel(0);        
				break;	
			case 35: // End
        setVolumeLevel(3);        
			  break;
			default:
        return true;			
			  break;
		};
		return false;
	}

	// volume event: onFocus 
  volume.onfocus = function() {
    if (!fullscreenMode.enable) {
      help.innerHTML = opts.volumeHelp;
      help.style.display = 'block';
    }  
  };
  
	// volume event: onBlur 
  volume.onblur = function() {
    help.style.display = 'none';
  };

  // fullscreen button event: onClick
	fullscreen.onclick = function() {
    // variables	  
    var screenWidth, screenHeight, 
        fullscreenWidth, fullscreenHeight, fullscreenLeft, 
        fullscreenOverlay, fullscreenPlayer, fullscreenControls, 
        body, cfg, fullscreenCfg;
    // set/unset full screen mode 	  
    if (fullscreenMode.enable) {
      // disable events
      window.onresize = null; 
      document.onkeydown = null;
      // set normal screen player
      fullscreenCfg = {};      
      fullscreenCfg.play = false;    
      if (player.isPlaying()) {
        player.pause();
        fullscreenCfg.play = true;    
      }
      fullscreenCfg.time = (player.getTime() > 0) ? player.getTime() : 0;
      // remove HTML elements
      body = document.getElementsByTagName('body')[0];
      fullscreenOverlay = document.getElementById('zad_aplayer_overlay_fullscreen');
      fullscreenPlayer = document.getElementById('zad_aplayer_fullscreen');
      fullscreenControls = document.getElementById('zad_aplayer_controls_fullscreen');
      body.removeChild(fullscreenOverlay);
      body.removeChild(fullscreenPlayer);
      body.removeChild(fullscreenControls);
      // show players
      $f("*").each(function() { this.show(); });
      if (!$f(fullscreenMode.index).isLoaded()) {
        $f(fullscreenMode.index).load();
      }              
      if (fullscreenCfg.play) {      
        $f(fullscreenMode.index).seek(fullscreenCfg.time - 0.3);
        $f(fullscreenMode.index).play();
      } else {
        $f(fullscreenMode.index).seek(fullscreenCfg.time);
        $f(fullscreenMode.index).pause();      
        $f(fullscreenMode.index).setPlayerTime(fullscreenCfg.time);	
      }
    } else {
      // stop player and save status
      fullscreenCfg = {};      
      fullscreenCfg.play = false;
      if (!player.isLoaded()) {
        player.load();
      } else if (player.isPlaying()) {
        player.pause();
        fullscreenCfg.play = true;
      }
      fullscreenCfg.time = (player.getTime() > 0) ? (player.getTime() - 0.2) : 0;        
      fullscreenCfg.index = player.getIndex();        
      fullscreenCfg.enable = true;              
      cfg = player.getConfig(true);
      cfg.playerId = 'zad_aplayer_fullscreen';
      cfg.clip.autoPlay = false;
      // get screen size
      if (window.innerHeight) {
        screenHeight = window.innerHeight;          
        screenWidth = window.innerWidth;
      } else {
        screenHeight = document.body.clientHeight;                
        screenWidth = document.body.clientWidth;
      }
      // set new player size and position
      fullscreenHeight = screenHeight - 25;                
      fullscreenWidth = Math.floor(playerWidth / playerContainer.clientHeight * fullscreenHeight);
      fullscreenLeft = Math.floor((screenWidth - fullscreenWidth) / 2);        
      // create background overlay
      fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'zad_aplayer_overlay_fullscreen';
      fullscreenOverlay.className = 'zad_aplayer_overlay';
      fullscreenOverlay.style.position = 'fixed';
      fullscreenOverlay.style.zIndex = 99;
      fullscreenOverlay.style.top = '0px';
      fullscreenOverlay.style.left = '0px';
      fullscreenOverlay.style.width = screenWidth + 'px';
      fullscreenOverlay.style.height = screenHeight + 'px';
      fullscreenOverlay.style.display = 'block';
      // create player HTML elements
      fullscreenPlayer = document.createElement('div');
      fullscreenPlayer.id = 'zad_aplayer_fullscreen';
      fullscreenPlayer.className = 'zad_aplayer';
      fullscreenPlayer.style.position = 'fixed';
      fullscreenPlayer.style.zIndex = 100;
      fullscreenPlayer.style.top = '0px';
      fullscreenPlayer.style.left = fullscreenLeft + 'px';
      fullscreenPlayer.style.width = fullscreenWidth + 'px';
      fullscreenPlayer.style.height = fullscreenHeight + 'px';
      fullscreenPlayer.style.display = 'block';
      // create controls HTML elements
      fullscreenControls = document.createElement('div');
      fullscreenControls.id = 'zad_aplayer_controls_fullscreen';
      fullscreenControls.className = 'zad_aplayer_controls';
      fullscreenControls.style.position = 'fixed';
      fullscreenControls.style.zIndex = 100;
      fullscreenControls.style.bottom = '0px';
      fullscreenControls.style.left = fullscreenLeft + 'px';
      // hide all players
      $f("*").each(function() { this.hide(); });      
      // append HTML elements
      body = document.getElementsByTagName('body')[0];        
      body.appendChild(fullscreenOverlay);
      body.appendChild(fullscreenPlayer);
      body.appendChild(fullscreenControls);      
      // create player
      $f(fullscreenPlayer, 'system/modules/zad_aplayer/vendor/flowplayer/flowplayer-3.2.16.swf', cfg)
        .accessibleControls('zad_aplayer_controls_fullscreen', options, fullscreenCfg);
    }
	};

  // resize event in full screen mode
  function fullscreenResize(e) { 
    // variables	  
    var screenWidth, screenHeight, 
        fullscreenWidth, fullscreenHeight, fullscreenLeft, 
        fullscreenOverlay, fullscreenPlayer, fullscreenControls, body;
    // get screen size
    if (window.innerHeight) {
      screenHeight = window.innerHeight;          
      screenWidth = window.innerWidth;
    } else {
      screenHeight = document.body.clientHeight;                
      screenWidth = document.body.clientWidth;
    }
    // set new player size and position
    fullscreenHeight = screenHeight - 25;                
    fullscreenWidth = Math.floor(playerWidth / playerContainer.clientHeight * fullscreenHeight);
    fullscreenLeft = Math.floor((screenWidth - fullscreenWidth) / 2);        
    // get id of HTML elements
    body = document.getElementsByTagName('body')[0];        
    fullscreenOverlay = document.getElementById('zad_aplayer_overlay_fullscreen');
    fullscreenPlayer = document.getElementById('zad_aplayer_fullscreen');
    fullscreenControls = document.getElementById('zad_aplayer_controls_fullscreen');
    // resize background overlay
    fullscreenOverlay.style.width = screenWidth + 'px';
    fullscreenOverlay.style.height = screenHeight + 'px';
    // resize player 
    fullscreenPlayer.style.left = fullscreenLeft + 'px';
    fullscreenPlayer.style.width = fullscreenWidth + 'px';
    fullscreenPlayer.style.height = fullscreenHeight + 'px';
    // resize controls 
    fullscreenControls.style.left = fullscreenLeft + 'px';
    resize();  
  }

  // key down event in full screen mode
  function fullscreenKeys(e) {
  	if (typeof e == 'undefined') { 
      e = window.event; 
    }
    if (e.keyCode == 27) {
      // ESC key: exit full screen mdde
      fullscreen.onclick();
    } else if (e.target === play || e.target === playhead || e.target === volume || e.target === fullscreen || e.target === captions ||
               e.altKey || e.ctrlKey || e.metaKey) {
      // process event
      return true;
    } else if (e.keyCode == 9) {
      // TAB key: focus to play button
      play.focus();                  
    } 
    // abort event
    return false;
  }      

  // captions button event: onClick
	captions.onclick = function() {
    if (captions.className == 'captions') {
      captions.className = 'captionsOff';
      captions.title = opts.captionsOffLabel;
      captions.label = opts.captionsOffLabel;
      player.getPlugin('captionsContent').hide();
    } else {
      captions.className = 'captions';
      captions.title = opts.captionsOnLabel;
      captions.label = opts.captionsOnLabel;
      player.getPlugin('captionsContent').show();
    }
	};

  // player event: onUnload
	player.onUnload(function() {
		clearInterval(timer);
		time.innerHTML = getTime(0, duration);
	});

  // clip event: onBegin
	player.onBegin(function(clip) {
		play.className = 'pause';
    play.title = opts.pauseLabel;		
    play.innerHTML = opts.pauseLabel;
	});

  // clip event: onFinish
	player.onFinish(function(clip) {		
		play.className = 'play';
    play.title = opts.playLabel;		
    play.innerHTML = opts.playLabel;
    player.pause();
    player.seek(0);    
		time.innerHTML = getTime(0, duration);
		slider.setProgressTime(0);
	}); 

  // clip event: onStart
  player.onStart(function(clip) {
    var initial = true;
    // video length in seconds
		duration = player.getClip().fullDuration || 0;
    slider.setMaxTime(duration);
		// clear previous timer		
		clearInterval(timer);    		
		// start timer		
		timer = setInterval(function()  {
		  var status;			
      // init full screen player 
      if (fullscreenMode.enable && initial) {
        initial = false;
        if (fullscreenMode.play) {
          player.seek(fullscreenMode.time - 0.3);
          player.play();
        } else {
          slider.setProgressTime(fullscreenMode.time);
			    time.innerHTML = getTime(fullscreenMode.time, duration);	
          player.seek(fullscreenMode.time);
          player.pause();
        }
      }
    	// get status		
		  status = player.getStatus();			
			if (!status.time)  {				
			  // fix for audio clip
		    status.time = player.getTime();			
			}
			if (!status.bufferEnd)  {				
			  // fix for audio clip
		    status.bufferEnd = status.time;			
			}
			if (!duration)  {				
			  // fix for audio clip
		    duration = player.getClip().fullDuration || 0;
        slider.setMaxTime(duration);
			}			
			// time display
			time.innerHTML = getTime(status.time, duration);	
			// set buffer value
			slider.setBufferTime(status.bufferEnd);
			// set current time value
			if (!player.isPaused() && !slider.isDragging()) {
		    slider.setProgressTime(status.time);
      }			
      // WAI-ARIA slider support
      playhead.setAttribute('aria-valuemin', 0);
      playhead.setAttribute('aria-valuemax', Math.floor(status.bufferEnd));
      playhead.setAttribute('aria-valuenow', Math.floor(status.time));
      playhead.setAttribute('aria-valuetext', toTime(status.time));
		}, 500);
	});

  // clip event: onPause
	player.onPause(function() {
		play.className = 'play';
    play.title = opts.playLabel;		
    play.innerHTML = opts.playLabel;    		
	});

  // clip event: onResume
	player.onResume(function() {
		play.className = 'pause';
    play.title = opts.pauseLabel;		
    play.innerHTML = opts.pauseLabel;		
	});
 
  // clip event: onBeforeFullscreen
	player.onBeforeFullscreen(function() {
	  // disable native full screen mode
	  return false;
	});

    
  //---------- PUBLIC FUNCTIONS ----------//
  
  
  // set time progress bar
  this.setPlayerTime = function(time) {
    slider.setProgressTime(time);
  };
  
  
  //---------- RETURN VALUES ----------//


  // the player instance should be returned to enable plugin and method chaining
	return player;

});

