// PARSER: 0.3 UltraStar TXT

(function (Popcorn) {
  /**
   * UltraStar popcorn parser plug-in 
   * Parses karaoke files in the UltraStar TXT format.
   * http://ultrastardeluxe.xtremeweb-hosting.net/wiki/doku.php?id=editor:txt_file
   * Data parameter is given by Popcorn, will need a text.
   * Text is the file contents to be parsed
   * 
   * @param {Object} data
   * 
   */
  Popcorn.parser( "parseUltra", function( data ) {

    // declare needed variables
    var songObj = {
          title: '',
          artist: '',
          bpm: 100,
          gap: 0,
          relative: false,
		  videogap: 0,
		  start: 0,
          data: []
        },
        sections = [],
        lineData,
        i = 0,
        len = 0,
        code,
        lines,
        time,
        text,
        section,
        bps; //beats per second
        
    var leadTime = 2;
    
    var createTrack = function( name, attributes ) {
      var track = {};
      track[name] = attributes;
      return track;
    };
  
    // Here is where the magic happens
    // Split on line breaks
    lines = data.text.split( /(?:\r\n|\r|\n)/gm );
    len = lines.length;

	//parse header
	var header_re = /^#([A-Za-z0-9]+):(.*)/, tag, value;
	var tagTypes = {
		bpm: 'int',
		gap: 'int',
		relative: 'bool',
		videogap: 'float',
		start: 'float'
	};
    while (i < len && ((lineData = header_re.exec(lines[i])) || lines[i] === '')) {
    	if (lineData) {
			tag = lineData[1].toLowerCase();
			value = lineData[2];
			
			if (tagTypes[tag] === 'int') {
				value = parseInt(value, 10);
				if (!isNaN(value)) {
					songObj[tag] = value;
				}
			} else if (tagTypes[tag] === 'float') {
				value = parseFloat(value);
				if (!isNaN(value)) {
					songObj[tag] = value;
				}
			} else if (tagTypes[tag] === 'bool') {
				value = value.toLowerString();
				songObj[tag] = (value === 'yes' || value === 'true' || value === 'y');
			} else {
				songObj[tag] = value;
			}
		}
    	i++;
    }
    
    //convert gap time to seconds, and make it relative to video
    time = songObj.gap = songObj.gap / 1000 + songObj.videogap;
    bps = 4 * songObj.bpm / 60;  //for some reason, the bpm needs to be multiplied by 4
    
    //parse lyrics
    var lyric_re = /^([:F\*\-EP]) (\d+)( (\d+) (\d+) (.*))?/;
    var lastEndTime = 0;
    var word, thisTime, part = 1;
    
    section = {
    	words: [],
    	start: Math.max(time - leadTime, 0),
    	text: ''
    };
    
    for( ; i <= len; i++ ) {
      if (i === len || (lineData = lyric_re.exec(lines[i]))) {
        code = i === len ? 'E' : lineData[1];
        if ((code === ':' || code === '*' || code === 'F') && lineData.length >= 7) {
		  thisTime = parseInt(lineData[2], 10) / bps;
		  if (songObj.relative) {
            time += thisTime;
		  } else {
            time = thisTime + songObj.gap;
		  }

		  word = {
		    start: time,
		    end: time + parseInt(lineData[4], 10) / bps,
		    note: parseInt(lineData[5], 10),
		    type: code
		  };
		  
          // Escape HTML entities
		  word.text = lineData[6].replace( /</g, "&lt;" ).replace( />/g, "&gt;" );
		  if (word.text && word.end > word.start) {
		    section.words.push(word);
		    section.text += word.text;
		  }
		} else if (code === '-' || code === 'E') {
		    if (section.words.length) {
		    	sections.push(createTrack('karaoke', section));
		    	section.end = section.words[section.words.length - 1].end;
		    }
        	
        	if (code === 'E') {
        		break;
        	}
        	
        	thisTime = parseInt(lineData[2], 10) / bps;
        	if (songObj.relative) {
        		time += thisTime;
        	} else {
        		time = thisTime + songObj.gap;
        	}
        	section.end = time;
			section = {
				words: [],
				start: time,
				text: '',
				part: part
			};
        } else if (code === 'P') {
			part = parseFloat(lineData[2]) || 0;
			section.part = part;
		}
	  }
    }
    
    songObj.data = sections;
    return songObj;
  });

})( Popcorn );
