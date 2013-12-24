var Accounts = ( function() { 

    /* Private is a singleton-patterned private object */

	var Private = {}
	    , subscribers = {}
	    , z = 0
        , zlen;

	Private.connected = false;
	Private.prefix = 'accounts';
	Private.allServices = [ 'facebook', 'google', 'linkedin', 'twitter', 'windows', 'foursquare', 'yahoo',  'github', 'tumblr', 'instagram', 'wordpress', 'vimeo', 'youtube', 'blogger', 'evernote', 'reddit' ];
	Private.debug = false;
	Private.unhelpfulErrorMessage = 'Something went awry.';
	Private.activeServices = [];
	zlen = Private.allServices.length;

    for( z = 0; z < zlen; z += 1 ) {
		Private[ Private.allServices[ z ] ] = {};
	}

    Private.api = {};

    Private.api.request = function( req ) {
		var url = [ Private.base, Private.prefix, 'login', req.service ].join( '/' )
			, callback = function(err, data) {
				if ( null === err ) {
					Private.publish( data.request.action, data.response );
				}
		};
		if ( 'confirm' === req.action ) {
			this.post( url, {
				code: req.code /* other */
				, oauth_token: req.oauth_token
				, oauth_verifier: req.oauth_verifier
				, oauth_token_secret: req.oauth_token_secret
			}, callback, {} );
		} else if ( 'login' === req.action ) {
			this.put( url, {
				request_token: req.request_token /* oAuth 1 & 2 */
				, request_token_secret: req.request_token_secret /* oAuth 1 & 2 */
			}, callback, {} );
		} else {
			this.get( url, {
				access_token: req.access_token
				, refresh_token: req.refresh_token
			}, callback, {} );
		}
    };

	Private.api.get = function( url, data, callback, headers ) {
		headers = headers || {};
		var that = this;
		Private.api.ajax( {
			type: 'GET'
			, url: url
			, headers: headers
			, data: data
			, success: function(request) {
				var error = null
					, response = request.response;
				try {
					response = JSON.parse( response );
				} catch ( e ) {
					error = e;
				} finally {
					callback.apply( that, [ error, response ] );
				}
			}
			, error: function(request) {
				callback.apply( that, [ new Error( Private.unhelpfulErrorMessage ), null ] );
			}
		} );
	};

	Private.api.put = function( url, data, callback, headers ) {
		headers = headers || {};
		var that = this;
		Private.api.ajax( {
			type: 'PUT'
			, url: url
			, data: data
			, headers: headers
			, success: function(request) {
				var error = null
					, response = request.response;
				try {
					response = JSON.parse( response );
				} catch ( e ) {
					error = e;
				} finally {
					callback.apply( that, [ error, response ] );
				}
			}
			, error: function(request) {
				callback.apply( that, [ new Error( Private.unhelpfulErrorMessage ), null ] );
			}
		} );
	};

	Private.api.post = function( url, data, callback, headers ) {
		headers = headers || {};
		var that = this;
		Private.api.ajax( {
			type: 'POST'
			, url: url
			, data: data
			, headers: headers
			, success: function(request) {
				var error = null
					, response = request.response;
				try {
					response = JSON.parse( response );
				} catch ( e ) {
					error = e;
				} finally {
					callback.apply( that, [ error, response ] );
				}
			}
			, error: function(request) {
				callback.apply( that, [ new Error( Private.unhelpfulErrorMessage ), null ] );
			}
		} );
	};

	Private.api.ajax = function(req) {
		var request
			, type = ( type || '' ).toUpperCase()
			, that = this;
		if ( 'undefined' !== typeof window.XMLHttpRequest ) {
		  request = new XMLHttpRequest();
		} else {
		  request = new ActiveXObject( "Microsoft.XMLHTTP" );
		}
		request.onreadystatechange = function() {
		  if ( 4 === request.readyState ) {
			if ( 200 === request.status ) {
				if ( 'function' === typeof req.success ) {
					req.success.apply( that, [ request ] );
				}
			} else {
				if ( 'function' === typeof req.success ) {
					req.error.apply( that, [ request ] );
				}
			}
		  }
		};
		if ( 'string' !== typeof req.data ) {
			req.data = JSON.stringify( req.data );
		}
		request.open( req.type, req.url, true );
		request.setRequestHeader( "Content-Type", "application/json" );
		request.send( req.data );
	};

	Private.getActiveServices = function() {
		return Private.activeServices.slice( 0 );
	};

	Private.setActiveServices = function( services ) {
		return Private.activeServices = services;
	};

	Private.addActiveService = function( service ) {
		if( 'string' !== typeof service ) {
			return false;
		}
		var services = Private.activeServices
            , already = false
            , x = 0
            , len = services.length;
		for( x = 0; x < len; x += 1 ) {
			if( service === services[ x ] ) {
				return false;
			}
		}
		Private.activeServices.push( service );
		return true;
	};

	Private.removeActiveService = function( service ) {
		if( 'string' !== typeof service ) {
			return false;
		}
		var arr = []
            , changed = false
            , x = 0
            , len = services.length
            , serv;
		for( x = 0; x < len; x += 1 ) {
			serv = services[ x ];
			if( service === serv ) {
				changed = true;
			} else {
				arr.push( serv );
			}
		}
		return changed;
	};

	var Public = function( config ) {
		var services = config.services
			, redirect = config.redirect
			, base = config.base;
		if( 'undefined' !== typeof services && null !== services ) {
			Private.setActiveServices( services );
		} else {
			Public.prototype.enable();
		}
		if( 'undefined' !== typeof redirect ) {
			Private.redirectTo = redirect;
		} else {
			Private.redirectTo = document.location.pathname;
		}
		if( 'undefined' !== typeof base ) {
			Private.base = base;
		} else {
			Private.base = null;
		}
		Private.detectLogin( this.redirect );
		Private.confirm();
	};

	Public.prototype.display = function( slug ) {
		var result = slug;
		switch( slug ) {
			case 'facebook': result = 'Facebook'; break;
			case 'twitter': result = 'Twitter'; break;
			case 'github': result = 'Github'; break;
			case 'google': result = 'Google+'; break;
			case 'tumblr': result = 'Tumblr'; break;
			case 'yahoo': result = 'Yahoo'; break;
			case 'foursquare': result = 'Foursquare'; break;
			case 'linkedin': result = 'Linkedin'; break;
			case 'windows': result = 'Windows Live'; break;
            case 'evernote': result = 'Evernote'; break;
            case 'instagram': result = 'Instagram'; break;
            case 'vimeo': result = 'Vimeo'; break;
            case 'blogger': result = 'Blogger'; break;
            case 'wordpress': result = 'WordPress'; break;
            case 'reddit': result = 'Reddit'; break;
            case 'youtube': result = 'YouTube'; break;
			default: break;
		};
		return result;
	};

	Public.prototype.enable = function( service ) {
		Private.publish( 'enable', service );
		if( 'undefined' === typeof service || null === service ) {
			return Private.setActiveServices( Private.allServices );	
		} else {
			return Private.addActiveService( service );
		}
	};

	Public.prototype.enabled = function( service ) {
		if( 'undefined' === typeof service || null === service ) {
			return Private.getActiveServices();
		}
		var services = Private.activeServices
		    , x = 0
            , len = services.length;
		for( x = 0; x < len; x += 1 ) {
			if( service === services[ x ] ) {
				return true;
			}
		}
		return false;
	};

	Public.prototype.disabled = function( service ) {
		if( 'undefined' === typeof service || null === service ) {
			var services = Private.getActiveServices()
                , all_services = Private.getActiveServices()
			    , x = 0
                , z = 0
                , len = services.length
                , a_len = all_services.length
			    , results = []
                , disabled = true;
			for( x = 0; x < a_len; x += 1 ) {
				disabled = true;
				for( y = 0; y < len; y += 1 ) {
					if( services[ z ] === all_services[ x ] ) {
						disabled = false;
					}
				}
				if( true === disabled ) {
					results.push( all_services[ x ] );
				}
			}
			return results;
		}
		return ! Public.prototype.enabled( service );
	};

	Public.prototype.disable = function( service ) {
		Private.publish( 'disable', service );
		if( 'undefined' !== typeof service || null === service ) {
			return Private.setActiveServices( [] );	
		} else {
			return Private.removeActiveService( service );
		}
	};


	Public.prototype.connected = function() {
		return ( Private.connected ) ? true : false;
	};

	Public.prototype.disconnected = function() {
		return ! this.connected();
	};

	Public.prototype.token = function( type ) {
		return Private.getAccessToken( type );
	};

	Public.prototype.tokens = function() {
		return Private.getAccessTokens();
	};

	Public.prototype.ids = function() {
		return Private.getProfileIds();
	};

	Public.prototype.id = function( type ) {
		return Private.getId( type );
	};

	Public.prototype.secret = function( type ) {
		return Private.getAccessTokenSecret( type );
	};

	Public.prototype.secrets = function() {
		return Private.getAccessTokenSecrets();
	};

	Public.prototype.profile = function( type ) {
		return Private.getProfile( type );
	};
	
	Public.prototype.map = function() {
		return Private.getAllProfileAttributesMap();
	};
		
	Public.prototype.chosen = function() {
		return Private.getAllProfileAttributesChosen();
	};
	
	Public.prototype.options = function() {
		return Private.getAllProfileAttributes();
	};
	
	Public.prototype.profiles = function() {
		return Private.getProfiles();
	};
	
	Public.prototype.status = function() {
		var statuses = Private.login_statuses();
		return statuses;
	};

	Public.prototype.login = function( service ) {
		return Public.prototype.session( service );
	};

	Public.prototype.session = function( service ) {
		Private.publish( 'session', { service: service } );
		if( Public.prototype.enabled( service ) ) {
			Private.publish( 'sessioning', { service: service } );
			return Private.do_login( service );
		} else {
			return false;
		}
	};

	Public.prototype.logout = function( service ) {
		return Public.prototype.unsession( service );
	};

	Public.prototype.unsession = function( service ) {
		Private.publish( 'unsession', { service: service } );
		if( Public.prototype.enabled( service ) ) {
			Private.publish( 'unsessioning', { service: service } );
			return Private.do_logout( service );
		} else {
			return false;
		}
	};

	Public.prototype.subscribe = function( event_name, callback, id ) {
		if( 'undefined' === typeof event_name || null === event_name || 'function' !== typeof callback ) {
			return false;
		}
		Private.publish( 'subscribe', { event: event_name, callback: callback, id: id } );
		if( null === id || 'undefined' === typeof id ) {
			var text = ""
                , set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
			    , x
                , id_len = 5;
			for( x = 0; x < id_len; x++ ) {
                text += set.charAt( Math.floor( Math.random() * set.length ) );
            }
		}
		if( 'undefined' === typeof subscribers[ event_name ] ) {
			subscribers[ event_name ] = {};
		}
		subscribers[ event_name ][ id ] = callback;
		Private.publish( 'subscribed', { event: event_name, callback: callback, id: id } );
		return id;
	};

	Public.prototype.unsubscribe = function( event_name, id ) {
		Private.publish( 'unsubscribe', { event: event_name, id: id } );
		if( 'undefined' === typeof event_name || null === event_name ) {
			return false;
		}
		var subs = subscribers[ event_name ];
		if( 'undefined' === typeof subs || null === subs ) {
			return false;
		}
		if( 'undefined' !== typeof subs[ id ] ) { 
			delete subscribers[ event_name ][ id ];
			Private.publish( 'unsubscribed', { event: event_name, id: id } );
			return id;
		} else {
			return false;
		}
	};

	Private.publish = function( event_name, value ) {
        var subs = subscribers[ event_name ]
            , attr
            , callback;
		if( 'undefined' === typeof event_name || null === event_name ) {
			return false;
		}
        if( 'undefined' === typeof subs || null === subs ) {
			return false;
		}
		if ( 'login' === event_name || 'confirm' === event_name ) {
			Private[ value.service ].account_request( value );
		}
		for( id in subs ) {
			callback = subs[ id ];
			if( 'function' === typeof callback && true === subs.hasOwnProperty( id ) ) {
				callback( { event: event_name, data: value } );
			};
		}
	};

	//TODO: rename response var to request
	Public.prototype.request = function( response ) {
        if ( 'account' === response.response_type ) {
            switch( response.service ) {
                case 'twitter':
                    Private.twitter.account_request( response );
                    break;
                case 'google':
                    Private.google.account_request( response );
                    break;
                case 'facebook':
                    Private.facebook.account_request( response );
                    break;
                case 'foursquare':
                    Private.foursquare.account_request( response );
                    break;
                case 'tumblr':
                    Private.tumblr.account_request( response );
                    break;
                case 'github':
                    Private.github.account_request( response );
                    break;
                case 'yahoo':
                    Private.yahoo.account_request( response );
                    break;
                case 'linkedin':
                    Private.linkedin.account_request( response );
                    break;
                case 'windows':
                    Private.windows.account_request( response );
                    break;
                case 'reddit':
                    Private.reddit.account_request( response );
                    break;
                case 'evernote':
                    Private.evernote.account_request( response );
                    break;
                case 'blogger':
                    Private.blogger.account_request( response );
                    break;
                case 'youtube':
                    Private.youtube.account_request( response );
                    break;
                default:
                    break;
            }
        }
	};

	Private.connect = function( service, oauth_type ) {
		if( Public.prototype.disabled( service ) ) {
			return false;
		}
		var request = { 'action': 'connect' };
		if( 1 === oauth_type ) {
			request.access_token = Private.storage.session.get( service + '_access_token' );
			request.access_token_secret = Private.storage.session.get( service + '_access_token_secret' );
		} else if ( 2 === oauth_type ) {
			request.access_token = Private.storage.session.get( service + '_access_token' );
			request.refresh_token = Private.storage.session.get( service + '_refresh_token' );	
		}
		if( 'undefined' !== typeof request.access_token && null !== request.access_token ) {
			request.service = service;
		} else {
			return;
		}

		Private.publish( 'connect', { service: service, oauth_type: oauth_type } );

		Private.api.request( request );

	};	
	
	Private.getId = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileIds()[ type ];
	};
	Private.getStats = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileStats()[ type ];
	};
	Private.getUrl = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileURLs()[ type ];
	};
	Private.getPersonalUrl = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfilePersonalURLs()[ type ];
	};


	Private.getImage = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileImages()[ type ];
	};
	Private.getUsername = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileUsernames()[ type ];
	};
	Private.getIds = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileIds()[ type ];
	};
	Private.getBirthdate = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileBirthdates()[ type ];
	};
	Private.getDescription = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileDescriptions()[ type ];
	};
	Private.getEmail = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileEmails()[ type ];
	};
	Private.getGender = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileGenders()[ type ];
	};
	Private.getLocale = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileLocales()[ type ];
	};
	Private.getLocation = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileLocations()[ type ];
	};
	Private.getName = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileNames()[ type ];
	};
	Private.getUrls = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileUrls()[ type ];
	};
	Private.getUsernames = function() {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		return Private.getProfileUsernames()[ type ];
	};

	Private.getProfileAttributeByService = function (service, attr) {
		var val;
		switch( attr ) {
			case 'id':
				val = Private.getId(service);
				break;
			case 'username':
				val = Private.getUsername(service);
				break;
			case 'profile_url':
				val = Private.getUrl(service);
				break;
			case 'personal_url':
				val = Private.getPersonalUrl(service);
				break;
			case 'name':
				val = Private.getName(service);
				break;
			case 'location':
				val = Private.getLocation(service);
				break;
			case 'stats':
				val = Private.getStats(service);
				break;
			case 'locale':
				val = Private.getLocale(service);
				break;
			case 'image':
				val = Private.getImage(service);
				break;
			case 'gender':
				val = Private.getGenders(service);
				break;
			case 'email':
				val = Private.getEmail(service);
				break;
			case 'description':
				val = Private.getDescription(service);
				break;
			case 'birthdate':
				val = Private.getBirthdate(service);
				break;
			default:
				break;
		}
		return val;
	};

	Private.getAllProfileAttributes = function() {
		var attrs = [ 'birthdate', 'description', 'email', 'id', 'image', 'locale', 'location', 'name', 'profile_url', 'username', 'personal_url', 'stats' ]
			, attrlen = attrs.length
			, attr
			, x = 0
			, result = {};
		for ( ; x < attrlen ; x += 1 ) {
			attr = attrs[ x ];
			result[ attr ] = Private.getAllByProfileAttribute( attr );
		}
		return result;
	};

	Private.getAllProfileAttributesPickDefaults = function() {
		var map = Private.getAllProfileAttributesMap()
			, attr = null
			, item = null
			, result = {};
		var determine = function( stack ) {
			var sorted = stack.sort( function( el1, el2 ) {
				var idx1, idx2, x = 0, xlen = Private.allServices.length, xitem;
				for ( ; x < xlen ; x += 1 ) {
					xitem = Private.allServices[ x ];
					if ( el1.service === xitem ) {
						el1 = x;
					}
					if ( el2.service === xitem ) {
						el2 = x;
					}
				}
				return ( el1 > el2 ) ? 1 : ( el1 === el2 ) ? 0 : -1;
			} );
			return stack[ 0 ];
		};
		var process = function(item, at) {
			var a = 0, alen = item.length, aitem = null, cache = {};
			for ( ; a < alen ; a += 1 ) {
				aitem = item[ a ];
				if ( 'undefined' === typeof cache[ aitem.value ] ) {
					cache[ aitem.value ] = 1;
				} else {
					cache[ aitem.value ] += 1;
				}
			}
			var highest = -(Infinity), lowest = Infinity, att, val, hslug, lslug;
			for ( att in cache ) {
				if ( cache.hasOwnProperty( att ) ) {
					val = cache[ att ];
					if ( val < lowest ) {
						lslug = att;
						lowest = val;
					}
					if ( val > highest ) {
						hslug = att;
						highest = val;
					}
				}
			}
			var candidates = [];
			for ( att in cache ) {
				if ( cache.hasOwnProperty( att ) ) {
					val = cache[ att ];
					if ( val === highest ) {	
						for ( att2 in item ) {
							if ( item.hasOwnProperty( att2 ) ) {
								val2 = item[ att2 ];
								if ( val2.value === att ) {
									candidates.push( val2 );
								}
							}
						}
					}
				}
			}
			return candidates;
		};
		var processMulti = function(item, at) {
			var a = 0, alen = item.length, aitem = null, cache = {};
			//count values
			for ( ; a < alen ; a += 1 ) {
				aitem = item[ a ];
				var bitem, battr, aval = aitem.value;
				for ( battr in aval ) {
					if ( true === aval.hasOwnProperty( battr ) ) {
						bitem = aval[ battr ] || '';
						if ( '' === bitem || null === bitem || 'undefined' === typeof bitem ) {
							continue;
						}
						cache[ battr ] = cache[ battr ] || {};
						if ( 'undefined' === typeof cache[ battr ][ bitem ] ) {
							cache[ battr ][ bitem ] = 1;
						}
						cache[ battr ][ bitem ]++;
					}
				}
			}
			//go through counts, find highest
			var hmap = {};
			for ( battr in cache ) {
				if ( true === cache.hasOwnProperty( battr ) ) {
					var lowest = Infinity, highest = -(Infinity);
					var hslug, lslug;
					var items = cache[ battr ];
					for ( bitem in items ) {
						if ( items.hasOwnProperty( bitem ) ) {
							var z = cache[ battr ][ bitem ];
							console.log('z',z,battr,bitem);
							if ( 'undefined' !== typeof z ) {
								console.log('xz',z,'high',highest);
								if ( z < lowest && null !== bitem && "" !== bitem ) {
									lowest = z;
									lslug = bitem;
								}
								if ( z > highest && null !== bitem && "" !== bitem ) {
									highest = z;
									hmap[ battr ] = z; 
									hslug = bitem;
								}
							}
						}
					}
				}
			}
			var results = {}, candidates = [];
			for ( a = 0; a < alen ; a += 1 ) {
				aitem = item[ a ];
				var bitem, battr, aval = aitem.value;
				for ( battr in aval ) {
					if ( true === aval.hasOwnProperty( battr ) && 'undefined' !== typeof  cache[ battr ] ) {
						var z = cache[ battr ][ aitem.value[ battr ] ];
						candidates[ battr ] = candidates[ battr ] || [];
						if ( 'undefined' !== typeof z && z === hmap[ battr ] ) {
							candidates[ battr ].push( { service: aitem.service, value: aitem.value[ battr ] } );
						}
						if ( 0 === candidates[ battr ].length ) {
							delete candidates[ battr ];
						}
					}
				}
			}
			console.log('candidates',candidates);
			for ( a = 0; a < alen ; a += 1 ) {
				aitem = item[ a ];
				var bitem, battr, aval = aitem.value;
				for ( battr in aval ) {
					if ( true === aval.hasOwnProperty( battr ) ) {
						if ( 'undefined' === typeof candidates[ battr ] || null === candidates[ battr ] ) {
							results[ battr ] = [];
						} else {
							results[ battr ] = determine( candidates[ battr ] );
						}
						if ( 0 === results[ battr ].length ) {
							results[ battr ] = null;
						}
					}
				}
			}
			console.log('results',results);
			return results;
		}

		for ( attr in map ) {
			if ( map.hasOwnProperty( attr ) ) {
				if ( 'id' === attr ) {
					result[ 'ids' ] = map[ attr ];
				} else if ( 'profile_url' === attr ) {
					result[ 'profiles' ] = map[ attr ];
				} else if ( 'image' === attr ) {
					result[ 'images' ] = map[ attr ];
				} else if ( 'stats' === attr ) {
					result[ 'stats' ] = map[ attr ];
				} else if ( 'name' === attr ) {
					result[ attr ] = processMulti( map[ attr ], attr );
				} else if ( 'birthdate' === attr ) {
					result[ attr ] = processMulti( map[ attr ], attr );
				} else {
					result[ attr ] = determine( process( map[ attr ], attr ) );
				}
			}
		}
		console.log('result',result);
	}

	Private.getAllProfileAttributesChosen = function() {
		Private.getAllProfileAttributesPickDefaults();
		var map = Private.getAllProfileAttributesMap()
			, picked = Private.picked;
		console.log('picked',picked);
	}
	Private.getAllProfileAttributesMap = function() {
		var attrs = [ 'birthdate', 'description', 'email', 'id', 'image', 'locale', 'location', 'name', 'profile_url', 'username', 'personal_url', 'stats' ]
			, attrlen = attrs.length
			, attr
			, x = 0
			, result = {};
		for ( ; x < attrlen ; x += 1 ) {
			attr = attrs[ x ];
			result[ attr ] = Private.getAllByProfileAttributeMap( attr );
		}
		return result;
	};


	Private.getAllByProfileAttribute = function (attr) {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , id
			, val
			, result = [];
		for( service in services ) {
			profile = services[ service ];
			if( profile !== null ) {
				val = Private.getProfileAttributeByService( service, attr );
				if ( null !== val ) {
					result.push( val )
				}
			}
		};
		return result;
	};


	Private.getAllByProfileAttributeMap = function (attr) {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , id
			, val
			, result = [];
		for( service_slug in services ) {
			( function( service ) { 
				profile = services[ service ];
				if( profile !== null ) {
					val = Private.getProfileAttributeByService( service, attr );
					if ( null !== val ) {
						result.push( { service: service, value: val } )
					}
				}
			} )( service_slug );
		};
		return result;
	};



	Private.getAccessTokens = function() {
		var services = Private.getActiveServices();
		var x = 0, xlen = services.length, service, tokens = {};
		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			tokens[ service ] = Private.getAccessToken( service );
		}
		return tokens;
	};

	
	Private.getAccessToken = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return null;
		}
		var access_token = null;
		switch( type ) {
			case 'facebook': 
				access_token = Private.storage.session.get( 'facebook_access_token' );
				break;
			case 'twitter': 
				access_token = Private.storage.session.get( 'twitter_access_token' );
				break;
			case 'foursquare': 
				access_token = Private.storage.session.get( 'foursquare_access_token' );
				break;
			case 'google': 
				access_token = Private.storage.session.get( 'google_access_token' );
				break;
			case 'windows': 
				access_token = Private.storage.session.get( 'windows_access_token' );
				break;
			case 'tumblr': 
				access_token = Private.storage.session.get( 'tumblr_access_token' );
				break;
			case 'wordpress': 
				access_token = Private.storage.session.get( 'wordpress_access_token' );
				break;
			case 'instagram': 
				access_token = Private.storage.session.get( 'instagram_access_token' );
				break;
			case 'vimeo': 
				access_token = Private.storage.session.get( 'vimeo_access_token' );
				break;
			case 'github': 
				access_token = Private.storage.session.get( 'github_access_token' );
				break;
			case 'yahoo':
				access_token = Private.storage.session.get( 'yahoo_access_token' );
				break;
			case 'linkedin':
				access_token = Private.storage.session.get( 'linkedin_access_token' );
				break;
            case 'reddit':
                access_token = Private.storage.session.get( 'reddit_access_token' );
                break;
            case 'youtube':
                access_token = Private.storage.session.get( 'youtube_access_token' );
                break;
            case 'blogger':
                access_token = Private.storage.session.get( 'blogger_access_token' );
                break;
            case 'evernote':
                access_token = Private.storage.session.get( 'evernote_access_token' );
                break;
			default:
				break;
		};
		return access_token;
	};

	Private.setAccessToken = function( type, token ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		if( 'undefined' === typeof type || 'undefined' === typeof token || null === type || null === token ) {
			return false;
		}
		return Private.storage.session.set( type + '_access_token', token );
	};

	Private.getAccessTokenSecrets = function() {
		var services = Private.getActiveServices();
		var x = 0, xlen = services.length, service, secrets = {};
		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			secrets[ service ] = Private.getAccessTokenSecret( service );
		}
		return secrets;
	};	

	Private.getAccessTokenSecret = function( type ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		var access_token_secret = null;
		switch( type ) {
			case 'facebook': 
				access_token_secret = Private.storage.session.get( 'facebook_access_token_secret' );
				break;
			case 'twitter': 
				access_token_secret = Private.storage.session.get( 'twitter_access_token_secret' );
				break;
			case 'foursquare': 
				access_token_secret = Private.storage.session.get( 'foursquare_access_token_secret' );
				break;
			case 'google': 
				access_token_secret = Private.storage.session.get( 'google_access_token_secret' );
				break;
			case 'tumblr': 
				access_token_secret = Private.storage.session.get( 'tumblr_access_token_secret' );
				break;
			case 'windows': 
				access_token_secret = Private.storage.session.get( 'windows_access_token_secret' );
				break;
			case 'github': 
				access_token_secret = Private.storage.session.get( 'github_access_token_secret' );
				break;
			case 'linkedin': 
				access_token_secret = Private.storage.session.get( 'linkedin_access_token_secret' );
				break;
			case 'yahoo': 
				access_token_secret = Private.storage.session.get( 'yahoo_access_token_secret' );
				break;
			case 'wordpress': 
				access_token_secret = Private.storage.session.get( 'wordpress_access_token_secret' );
				break;
			case 'instagram': 
				access_token_secret = Private.storage.session.get( 'instagram_access_token_secret' );
				break;
			case 'vimeo': 
				access_token_secret = Private.storage.session.get( 'vimeo_access_token_secret' );
				break;
            case 'reddit':
                access_token_secret = Private.storage.session.get( 'reddit_access_token_secret' );
                break;
            case 'youtube':
                access_token_secret = Private.storage.session.get( 'youtube_access_token_secret' );
                break;
            case 'blogger':
                access_token_secret = Private.storage.session.get( 'blogger_access_token_secret' );
                break;
            case 'evernote':
                access_token_secret = Private.storage.session.get( 'evernote_access_token_secret' );
                break;
			default:
				break;
		};
		return access_token_secret;
	};

	Private.setAccessTokenSecret = function( type, secret ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		if( 'undefined' === typeof type || 'undefined' === typeof secret || null === type || null === secret ) {
			return false;
		}
		Private.storage.session.set( type + '_access_token_secret', secret );
	};

	Private.getProfiles = function () {
		return Private.getUnifiedProfiles();
	};

	Private.getProfile = function ( type ) {
		if( !Public.prototype.enabled( type ) ) {
			return false;
		}
		if( 'undefined' === typeof type || null === type ) {
			return Private.getUnifiedProfile();
		}
		return Private.storage.local.get( type + '_profile' );
	};
	
	Private.setProfile = function ( type, data ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		if( 'undefined' === typeof type || 'undefined' === typeof data || null === type || null === data ) {
			return false;
		}
		return Private.storage.local.set( type + '_profile', data );
	};


	Private.getProfileIds = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , id
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			if( profile !== null ) {
				id = null;
				switch( service ) {
					case 'facebook':
						id = parseInt( profile.id, 10 );
						break;
					case 'foursquare':
						id = parseInt( profile.id, 10 );
						break;
					case 'github':
						id = profile.id;
						break;
					case 'google':
						id = parseInt( profile.id, 10 );
						break;
					case 'linkedin':
						id = profile.id;
						break;
					case 'tumblr':
						id = null;
						break;
					case 'windows':
						id = profile.id;
						break;	
					case 'twitter': 
						id = parseInt( profile.id_str, 10 );
						break;
					case 'yahoo':
						id = profile.guid;
						break;
                    case 'instagram':
						id = profile.id;
                        break;
                    case 'wordpress':
						id = profile.ID;
                        break;
                    case 'vimeo':
						id = profile.id;
                        break;
                    case 'youtube':
						id = profile.id;
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
						id = profile.id;
                        break;
					default:
						break;
				};
				profiles[ service ] = ( 'undefined' !== typeof id && '' !== id ) ? id : null;
			} else {
				profiles[ service ] = null;
			}
		};
		return profiles;
	};


	Private.getProfileNames = function () {
		var services = Private.getUnifiedProfiles()
            , attr
            , profile
            , names = {}
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			names = { display: null, first: null, last: null };
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						names.display = profile.name;
						names.first = profile.first_name;
						names.last = profile.last_name;
						break;
					case 'foursquare':
						names.first = profile.firstName;
						names.last = profile.lastName;
						break;
					case 'github':
						names.display = profile.name;
						break;
					case 'google':
						names.display = profile.displayName;
						names.first = profile.name.givenName;
						names.last = profile.name.familyName;
						break;
					case 'linkedin':
						names.display = profile.formattedName;
						names.first = profile.firstName;
						names.last = profile.lastName;
						break;
					case 'tumblr':
						names = null;
						break;
					case 'twitter': 
						names.display = profile.name;
						break;
					case 'yahoo':
						names = null;
						break;
					case 'windows':
						names.display = profile.name;
						names.first = profile.first_name;
						names.last = profile.last_name;
						break;		
                    case 'instagram':
                        names.display = profile.full_name;
                        break;
                    case 'wordpress':
                        names.display = profile.display_name;
                        break;
                    case 'vimeo':
                        names.display = profile.display_name;
                        break;
                    case 'youtube':
                        names.display = profile.snippet.title;
                        break;
                    case 'blogger':
						names = null;
                        break;
                    case 'reddit':
						names = null;
                        break;
					default:
						names = null;
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof names && '' !== names ) ? names : null;
		};
		return profiles;
	};


	Private.getProfileGenders = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , gender
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			gender = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						gender = profile.gender;
						break;
					case 'foursquare':
						gender = profile.gender;
						break;
					case 'github':
						break;
					case 'google':
						gender = profile.gender;
						break;
					case 'linkedin':
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						break;
					case 'windows':
						gender = profile.gender;
						break;					
					case 'yahoo':
						if( "M" === profile.gender ) {
							gender = "male";
						} else if( "F" === profile.gender ) {
							gender = "female";
						} else {
							gender = profile.gender;
						}
						break;
                    case 'instagram':
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof gender && '' !== gender ) ? gender : null;
		};
		return profiles;
	};

	Private.getProfileBirthdates = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , birthdate = {}
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			birthdate = { day: null, month: null, year: null };
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						if ( 'undefined' !== typeof profile.birthday && null !== profile.birthday ) {
							birthdate.day = new Date( profile.birthday ).getDate();
							birthdate.month = new Date( profile.birthday ).getMonth() + 1;
							birthdate.year = new Date( profile.birthday ).getFullYear();
						} else {
							birthdate = null;
						}
						break;
					case 'foursquare':
						birthdate = null;
						break;
					case 'github':
						birthdate = null;
						break;
					case 'google':
						birthdate = null;
						break;
					case 'linkedin':
						birthdate = null;
						break;
					case 'tumblr':
						birthdate = null;
						break;
					case 'twitter': 
						birthdate = null;
						break;
					case 'windows':
						if ( null !== profile.birth_day || null !== profile.birth_month || null !== profile.birth_year ) {
							birthdate.day = profile.birth_day;
							birthdate.month = profile.birth_month;
							birthdate.year = profile.birth_year;
						} else {
							birthdate = null;
						}
						break;
					case 'yahoo':
						if ( 'undefined' !== typeof profile.birthYear && null !== profile.birthYear ) {
							birthdate.year = profile.birthYear;
						} else {
							birthdate = null;
						}
						break;
                    case 'instagram':
						birthdate = null;
                        break;
                    case 'wordpress':
						birthdate = null;
                        break;
                    case 'vimeo':
						birthdate = null;
                        break;
                    case 'youtube':
						birthdate = null;
                        break;
                    case 'blogger':
						birthdate = null;
                        break;
                    case 'reddit':
						birthdate = null;
                        break;
					default:
						birthdate = null;
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof birthdate && '' !== birthdate ) ? birthdate : null;
		};
		return profiles;
	};

	Private.getProfileImages = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile = {}
            , image
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			image = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						break;
					case 'foursquare':
						image = profile.photo;
						break;
					case 'github':
						image = profile.avatar_url;
						break;
					case 'google':
						image = profile.image.url;
						break;
					case 'linkedin':
						image = profile.pictureUrl;
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						image = profile.profile_image_url;
						break;
					case 'windows':
						break;
					case 'yahoo':
						image = profile.image.imageUrl;
						break;
                    case 'instagram':
                        image = profile.profile_picture;
                        break;
                    case 'wordpress':
                        image = profile.avatar_URL;
                        break;
                    case 'vimeo':
                        image = profile.portraits.portrait[ profile.portraits.portrait.length - 1 ]._content;
                        break;
                    case 'youtube':
                        image = profile.snippet.thumbnails.high.url;
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof image && '' !== image ) ? image : null;
		};
		return profiles;
	};

	Private.getProfilePersonalURLs = function () {
		var services = Private.getUnifiedProfiles()
            , attr
            , profile
            , other = []
            , personal_url
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			personal_url = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						personal_url = profile.website;
						break;
					case 'foursquare':
						break;
					case 'github':
						personal_url = profile.blog;
						break;
					case 'google':
						break;
					case 'linkedin':
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						personal_url = profile.url;
						break;
					case 'yahoo':
						break;
                    case 'instagram':
						personal_url = profile.website;
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
						personal_url = profile.url[ 0 ]
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;

					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof personal_url && '' !== personal_url ) ? personal_url : null;
		};
		return profiles;
	};

	Private.getProfileStats = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , other = []
            , stats
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			stats = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						stats = {
							updated: profile.updated_time
							, created: null
						};
						break;
					case 'foursquare':
						stats = {
							todos: profile.todos.count
							, tips: profile.tips.count
							, mayorships: profile.mayorships.count
							, checkins: profile.checkins.count
							, badges: profile.badges.count
							, friends: profile.friends.count
							, following: profile.following.count
							, incoming: profile.following.count + profile.friends.count
							, outgoing: profile.friends.count
							, created: profile.createdAt
							, updated: null
						};
						break;
					case 'github':
						stats = {
							followers: profile.followers
							, following: profile.following
							, public_gists: profile.public_gists
							, public_repos: profile.public_repos
							, created: profile.created_at
							, updated: profile.updated_at
						};
						break;
					case 'google':
						break;
					case 'linkedin':
						stats = {
							connections: profile.numConnections
							, created: null
							, updated: null
						};
						break;
					case 'tumblr':
						var a = 0, alen = profile.blogs.length, blog, posts_count = 0, followers_count = 0, messages_count = 0;
						for ( ; a < alen ; a += 1 ) {
							blog = profile.blogs[ a ];
							posts_count += blog.posts;
							followers_count += blog.followers;
							messages_count += blog.messages;
						}
						stats = {
							following: profile.following
							, likes: profile.likes
							, posts: posts_count
							, followers: followers_count
							, messages: messages_count
							, created: null
							, updated: null
						};
						break;
					case 'twitter': 
						stats = {
							created: profile.created_at
							, updated: null
							, statuses_count: profile.statuses_count
							, listed_count: profile.listed_count
							, friends_count: profile.friends_count
							, followers_count: profile.followers_count
							, favorites_count: profile.favorites_count
						};
						break;
					case 'yahoo':
						stats = {
							created: profile.memberSince
							, updated: profile.updated
						};
						break;
					case 'windows':
						break;
                    case 'instagram':
						stats = {
							followed_by: profile.counts.followed_by
							, follows: profile.counts.follows
							, media: profile.counts.media
							, created: null
							, updated: null
						};
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
						stats = {
							created: profile.created_on
							, updated: null
							, number_of_albums: profile.number_of_albums
							, number_of_channels: profile.number_of_channels 
							, number_of_contacts: profile.number_of_contacts 
							, number_of_groups: profile.number_of_groups 
							, number_of_likes: profile.number_of_likes 
							, number_of_uploads: profile.number_of_uploads 
							, number_of_videos: profile.number_of_videos
							, number_of_videos_appears_in: profile.number_of_videos_appears_in
						};
                        break;
                    case 'youtube':
						stats = {
							comment_count: profile.statistics.commentCount
							, subscriber_count: profile.statistics.subscriberCount
							, video_count: profile.statistics.videoCount
							, view_count: profile.statistics.viewCount
							, created: profile.snippet.publishedAt
							, updated: null
						};
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
						stats = {
							comment_karma: profile.comment_karma
							, link_karma: profile.link_karma
							, created: profile.created
							, updated: null
						};
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof stats && '' !== stats ) ? stats : null;
		};
		return profiles;
	};



	Private.getProfileURLs = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , other = []
            , profile_url
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			profile_url = null;
			if( null !== profile ) {

				switch( service ) {
					case 'facebook':
						profile_url = profile.link;
						break;
					case 'foursquare':
						profile_url = "https://foursquare.com/user/" + profile.id;
						break;
					case 'github':
						profile_url = profile.html_url;
						break;
					case 'google':
						profile_url = profile.url;
						break;
					case 'linkedin':
						profile_url = profile.publicProfileUrl;
						break;
					case 'tumblr':
						profile_url = "http://" + profile.name + ".tumblr.com/";
						break;
					case 'twitter': 
						profile_url = "http://twitter.com/#!/" + profile.screen_name;
						break;
					case 'yahoo':
						profile_url = profile.profileUrl;
						break;
					case 'windows':
						profile_url = "https://profile.live.com/cid-" + profile.id
						break;
                    case 'instagram':
						profile_url = "http://instagram.com/" + profile.username;
                        break;
                    case 'wordpress':
						prifile_url = profile.profile_URL;
                        break;
                    case 'vimeo':
						profile_url = profile.profileurl;
                        break;
                    case 'youtube':
						profile_url = "http://www.youtube.com/channel/" + profile.id;
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
						profile_url = "http://www.reddit.com/user/" + profile.name
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof profile_url && '' !== profile_url ) ? profile_url : null;
		};
		return profiles;
	};

	Private.getProfileEmails = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , email
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			email = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						email = profile.email;
						break;
					case 'foursquare':
						email = profile.contact.email;
						break;
					case 'github':
						email = profile.email;
						break;
					case 'google':
						break;
					case 'linkedin':
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						break;
					case 'yahoo':
						break;
					case 'windows':
						email = profile.emails.preferred;
						break;
                    case 'instagram':
                        break;
                    case 'wordpress':
						email = profile.email;
                        break;
                    case 'vimeo':
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;

					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof email && '' !== email ) ? email : null;
		};
		return profiles;
	};


	Private.getProfileUsernames = function () {
		var services = Private.getUnifiedProfiles()
		    , attr
            , profile
            , username
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			username = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						username = profile.username;
						break;
					case 'foursquare':
						break;
					case 'github':
						username = profile.login;
						break;
					case 'google':
						break;
					case 'linkedin':
						break;
					case 'tumblr':
						username = profile.name;
						break;
					case 'twitter': 
						username = profile.screen_name;
						break;
					case 'windows':
						break;
					case 'yahoo':
						username = profile.nickname;
						break;
                    case 'instagram':
						useranme = profile.username;
                        break;
                    case 'wordpress':
						useranme = profile.username;
                        break;
                    case 'vimeo':
						useranme = profile.username;
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
						username = profile.name;
                        break;
					default:
						break;
				};

			}
			profiles[ service ] = ( 'undefined' !== typeof username && '' !== username ) ? username : null;
		};
		return profiles;
	};

	Private.getProfileDescriptions = function () {
		var services = Private.getUnifiedProfiles()
            , attr
            , profile
            , description
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			description = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						break;
					case 'foursquare':
						break;
					case 'github':
						description = profile.bio;
						break;
					case 'google':
						break;
					case 'linkedin':
						description = profile.headline;
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						description = profile.description;
						break;
					case 'windows':
						break;
					case 'yahoo':
						break;
                    case 'instagram':
						description = profile.bio;
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
						description = profile.bio;
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof description && '' !== description ) ? description : null;
		};
		return profiles;
	};

	Private.getProfileLocations = function () {
		var services = Private.getUnifiedProfiles()
            , attr
            , profile
            , location
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			location = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						location = ( 'undefined' !== typeof profile.location && null !== profile.location && 'undefined' !== typeof profile.location.name ) ? profile.location.name : null;
						break;
					case 'foursquare':
						location = profile.homeCity;
						break;
					case 'github':
						location = profile.location;
						break;
					case 'google':
						if ( 'undefined' !== typeof profile.placesLived ) {
							var a = 0, alen = profile.placesLived.length, aitem;
							for ( ; a < alen ; a += 1 ) {
								aitem = profile.placesLived[ a ];
								if ( true === aitem.primary ) {
									location = aitem.value;
								}
							}
						}
						break;
					case 'linkedin':
						location =  ( 'undefined' === typeof profile.location ) ? null : profile.location.name;
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						location = profile.location;
						break;
					case 'windows':
						break;
					case 'yahoo':
						break;
                    case 'instagram':
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
						location = profile.location;
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof location && '' !== location ) ? location : null;
		};
		return profiles;
	};


	Private.getProfileLocales = function () {
		var services = Private.getUnifiedProfiles()
            , attr
            , profile
            , locale
            , profiles = {};
		for( service in services ) {
			profile = services[ service ];
			locale = null;
			if( null !== profile ) {
				switch( service ) {
					case 'facebook':
						locale = profile.locale;
						break;
					case 'foursquare':
						break;
					case 'github':
						break;
					case 'google':
						break;
					case 'linkedin':
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						break;
					case 'windows':
						locale = profile.locale;
						break;
					case 'yahoo':
						break;
                    case 'instagram':
                        break;
                    case 'wordpress':
                        break;
                    case 'vimeo':
                        break;
                    case 'youtube':
                        break;
                    case 'blogger':
                        break;
                    case 'reddit':
                        break;
					default:
						break;
				};
			}
			profiles[ service ] = ( 'undefined' !== typeof locale && '' !== locale ) ? locale : null;
		};
		return profiles;
	};


	Private.unifyOptionsAttributes = function( options ) {

        var services = Private.getActiveServices()
		    , value = null
		    , consensus = false
            , attr
            , val
            , vals = {}
            , max_vals = {}
            , maxes = {}
            , max_service = null
            , attr3
            , x = 0
            , xlen = services.length
            , service;

        for( attr in options ) {
			for( attr2 in options[ attr ] ) {
				if( 'undefined' === typeof vals[ attr2 ] ) {
					vals[ attr2 ] = {};
				}
				val = options[ attr ][ attr2 ];
				if( null !== val ) {
					vals[ attr2 ][ val ] = ( 'undefined' === typeof vals[ val ] ) ? 1 : ( vals[ val ] + 1 );
					if( 'undefined' === typeof maxes[ attr2 ] || ( vals[ attr2 ][ val ] > maxes[ attr2 ] ) ) {
						maxes[ attr2 ] = vals[ attr2 ][ val ];
					}
				}
			}
		}

		for( attr3 in maxes ) {
			if( maxes[ attr3 ] > 1 ) {
				consensus = true;
			}
		}

		if( true === consensus ) {
			for( attr in vals ) {
				if( maxes[ attr ] === max[ attr ] ) {
					max_vals[ attr2 ] = max[ attr ];
				}
			}
		} else {
			for( attr in maxes ) {
				for( x = 0; x < xlen; x += 1 ) {
					service = services[ x ];
					if( null !== options[ service ] && 'undefined' !== typeof options[ service ][ attr ] && null !== options[ service ][ attr ] && ( 'undefined' === typeof max_vals[ attr ] || null === max_vals[ attr ] ) ) {
						max_vals[ attr ] = options[ service ][ attr ];
					}
				}
			}
		}
		return max_vals;
	};

	Private.unifyOptions = function( options ) {
		var services = Private.getActiveServices()
		    , value = null
		    , consensus = false
            , attr
            , val
            , vals = {}
            , max = 0
            , max_service = null
            , x = 0
            , xlen = services.length
            , service
            , profiles = {};
		for( attr in options ) {
			val = options[ attr ];
			vals[ val ] = ( 'undefined' === typeof vals[ val ] ) ? 1 : ( vals[ val ] + 1 );
			if( vals[ val ] > max ) {
				max = vals[ val ];
				max_service = attr;
			}
		}
		if( max > 1 ) {
			consensus = true;
		}
		if( true === consensus ) {
			for( x = 0; x < xlen; x += 1 ) {
				service = services[ x ];
				if( null !== options[ service ] && 'undefined' !== typeof options[ service ] && service === max_service ) {
					return options[ service ];
				}
			}
		}
		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			if( null !== options[ service ] && 'undefined' !== typeof options[ service ] ) {
				return options[ service ];
			}
		}
		return null;
	};

	Private.removeNulls = function( options ) {
		var opts = {}
            , attr;
		for( attr in options ) {
			if( 'undefined' !== typeof options[ attr ] && null !== options[ attr ] ) {
				opts[ attr ] = options[ attr ];
			}
		}
		return opts;
	};

	Private.getUnifiedProfile = function ( ) {
		return {
			'ids': Private.removeNulls( Private.getProfileIds() )
			, 'profiles': Private.removeNulls( Private.getProfileURLs() )
			, 'username': Private.unifyOptions( Private.getProfileUsernames() )
			, 'email': Private.unifyOptions( Private.getProfileEmails() )
			, 'name': Private.unifyOptionsAttributes( Private.getProfileNames() )
			, 'birthdate': Private.unifyOptionsAttributes( Private.getProfileBirthdates() )
			, 'gender': Private.unifyOptions( Private.getProfileGenders() )
			, 'image': Private.unifyOptions( Private.getProfileImages() )
			, 'location': Private.unifyOptions( Private.getProfileLocations() )
			, 'locale': Private.unifyOptions( Private.getProfileLocales() )
			, 'description': Private.unifyOptions( Private.getProfileDescriptions() )
			, 'url': Private.unifyOptions( Private.getProfilePersonalURLs() )
		};
	};

	Private.getUnifiedOptions = function ( ) {
		return {
			'ids': Private.getProfileIds()
			, 'profiles': Private.getProfileURLs()
			, 'username': Private.getProfileUsernames()
			, 'email': Private.getProfileEmails()
			, 'name': Private.getProfileNames()
			, 'birthdate': Private.getProfileBirthdates()
			, 'gender': Private.getProfileGenders()
			, 'image': Private.getProfileImages()
			, 'location': Private.getProfileLocations()
			, 'locale': Private.getProfileLocales()
			, 'description': Private.getProfileDescriptions()
			, 'url': Private.getProfilePersonalURLs()
		};
	};



	Private.getUnifiedProfiles = function ( ) {

		var services = Private.getActiveServices()
            , x = 0
            , xlen = services.length
            , service
		    , profiles = {};

		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			profiles[ service ] = Private.getProfile( service );
		}

		return profiles;

	};

	Private.do_logout = function ( type ) {
		return Private.unsession( type );
	};
	
	Private.unsession = function ( type ) {

		if( Public.prototype.disabled( type ) ) {
			return false;
		}

		var obj =  { 'action': 'logout', 'service': type };
		obj[ 'access_token' ] = Private.getAccessToken( type );
	
		if( null !== obj.access_token && 'undefined' !== typeof obj.access_token ) {
			Private.api.request( obj );
		}


	};

	Private.do_login = function( type ) {
		return Private.session( type );
	};
	
	Private.session = function ( type ) {

		if( Public.prototype.disabled( type ) ) {
			return false;
		}

		Private.api.request( { 'action': 'login', 'service': type } );

	};

	Private.do_confirm = function ( type, params ) {

		if( Public.prototype.disabled( type ) ) {
			return false;
		}

		params.action = 'confirm';
		params.service = type;
		Private.api.request( params );

	};

	/* Instagram */

	Private.instagram.handle_confirm = function( params ) {

		var data = null;

		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'instagram';
			Private.publish( 'profile', { service: 'instagram', data: data } );
			Private.setProfile( 'instagram', data );
		}	

		var access_token = params.access_token;

		if( !!access_token ) {

			Private.storage.session.set( 'instagram_access_token', access_token );
			Private.publish( 'sessioned', { service: 'instagram', oauth_token: access_token, profile: data } );

		}

	};


	/* Facebook */

	Private.facebook.handle_confirm = function( params ) {

		var data = null;

		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'facebook';
			Private.publish( 'profile', { service: 'facebook', data: data } );
			Private.setProfile( 'facebook', data );
		}	

		var access_token = params.access_token;

		if( !!access_token ) {

			Private.storage.session.set( 'facebook_access_token', access_token );
			Private.publish( 'sessioned', { service: 'facebook', oauth_token: access_token, profile: data } );

		}

	};

	/* Foursquare */

	Private.foursquare.handle_confirm = function( params ) {

		var data = null;
		
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'foursquare';	
			Private.publish( 'profile', { service: 'foursquare', data: data } );
			Private.setProfile( 'foursquare', data );
		}

		var access_token = params.access_token;
		
		if( !!access_token ) {
			Private.storage.session.set( 'foursquare_access_token', access_token );
			Private.publish( 'sessioned', { service: 'foursquare', oauth_token: access_token, profile: data } );
		}

	};

	/* WordPress */

	Private.wordpress.handle_confirm = function( params ) {
		
		var data = null;
		
		if( !!params.profile ) {
			data = params.profile || {};
			data.service = 'wordpress';
			Private.publish( 'profile', { service: 'wordpress', data: data } );
			Private.setProfile( 'wordpress', data );
		}

		var access_token = params.access_token;
		
		if( !!access_token ) {
			Private.storage.session.set( 'wordpress_access_token', access_token );
			Private.publish( 'sessioned', { service: 'wordpress', oauth_token: access_token, profile: data } );
		}

	};


	/* Google */

	Private.google.handle_confirm = function( params ) {
		
		var data = null;
		
		if( !!params.profile ) {
			data = params.profile || {};
			data.service = 'google';
			Private.publish( 'profile', { service: 'google', data: data } );
			Private.setProfile( 'google', data );
		}

		var access_token = params.access_token;
		
		if( !!access_token ) {
			Private.storage.session.set( 'google_access_token', access_token );
			Private.publish( 'sessioned', { service: 'google', oauth_token: access_token, profile: data } );
		}

	};

    /* YouTube */

    Private.youtube.handle_confirm = function( params ) {

        var data = null;

        if( !!params.profile ) {
            data = params.profile || {};
            data.service = 'youtube';
            Private.publish( 'profile', { service: 'youtube', data: data } );
            Private.setProfile( 'youtube', data );
        }

        var access_token = params.access_token;

        if( !!access_token ) {
            Private.storage.session.set( 'youtube_access_token', access_token );
            Private.publish( 'sessioned', { service: 'youtube', oauth_token: access_token, profile: data } );
        }

    };

    /* Blogger */

    Private.blogger.handle_confirm = function( params ) {

        var data = null;

        if( !!params.profile ) {
            data = params.profile || {};
            data.service = 'blogger';
            Private.publish( 'profile', { service: 'blogger', data: data } );
            Private.setProfile( 'blogger', data );
        }

        var access_token = params.access_token;

        if( !!access_token ) {
            Private.storage.session.set( 'blogger_access_token', access_token );
            Private.publish( 'sessioned', { service: 'blogger', oauth_token: access_token, profile: data } );
        }

    };

	/* Twitter */

	Private.twitter.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'twitter';
			Private.publish( 'profile', { service: 'twitter', data: data } );
			Private.setProfile( 'twitter', data );
		
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		
		if( !!access_token ) {
		
			Private.storage.session.set( 'twitter_access_token', access_token );
			Private.storage.session.set( 'twitter_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'twitter', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
		
		}
	};


    /* Evernote */

    Private.evernote.handle_confirm = function( params ) {

        var data = null;
        if( !!params.profile ) {
            data =  params.profile || {};
            data.service = 'evernote';
            Private.publish( 'profile', { service: 'evernote', data: data } );
            Private.setProfile( 'evernote', data );

        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;

        if( !!access_token ) {

            Private.storage.session.set( 'evernote_access_token', access_token );
            Private.storage.session.set( 'evernote_access_token_secret', access_token_secret );
            Private.publish( 'sessioned', { service: 'evernote', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );

        }
    };

    /* Reddit */

    Private.reddit.handle_confirm = function( params ) {

        var data = null;

        if( !!params.profile ) {
            data = params.profile || {};
            data.service = 'reddit';
            Private.publish( 'profile', { service: 'reddit', data: data } );
            Private.setProfile( 'reddit', data );
        }

        var access_token = params.access_token;

        if( !!access_token ) {
            Private.storage.session.set( 'reddit_access_token', access_token );
            Private.publish( 'sessioned', { service: 'reddit', oauth_token: access_token, profile: data } );
        }

    };

	/* Facebook */

	Private.facebook.account_request = function( data ) {
		if( 'undefined' !== typeof data.logout_url || 'undefined' !== typeof data.logout ) {
			if( null === data.logout_url ) {
				Private.publish( 'unsession', { service: 'facebook' } );
				Private.unsession( 'facebook' );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'facebook' ) );
			} else {
				Private.publish( 'unsession_redirect', { service: 'facebook', 'url': data.logout_url } );
				Private.publish( 'redirect', { service: 'facebook', 'url': data.logout_url } );
				window.location = data.logout_url;
			}
		} else if( 'facebook' === data.service && 'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'facebook', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'facebook', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'facebook' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {
				
			Private.publish( 'confirm', { service: 'facebook' } );
			Private.facebook.handle_confirm( data );	

		} else if( 'facebook' === data.service &&  'undefined' !== typeof data.connect_status ) {	
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'facebook' } );
			} else {
				Private.unsession( 'facebook' );
			}
		} else if( 'facebook' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'facebook' );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'facebook' ) );

		}

	}

	/* Foursquare */

	Private.foursquare.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'foursquare' } );	
			Private.unsession( 'foursquare' );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'foursquare' ) );
		} else if( 'foursquare' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'foursquare', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'foursquare', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'foursquare' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'foursquare' } );
			Private.foursquare.handle_confirm( data );

		} else if( 'foursquare' === data.service && 'account' === data.response_type  && 'undefined' !== typeof data.connect_status ) {
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'foursquare' } );
			} else {
				Private.unsession( 'foursquare' );
			}

		} else if( 'foursquare' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'foursquare' );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'foursquare' ) );

		}

	}
    /* Blogger */

    Private.blogger.account_request = function( data ) {
        if( 'undefined' !== typeof data.logout_url ) {
            Private.publish( 'unsession', { service: 'blogger' } );
            Private.unsession( 'blogger' );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'blogger' ) );
        } else if( 'blogger' === data.service &&  'undefined' !== typeof data.login_url ) {
            Private.publish( 'session_redirect', { service: 'blogger', 'url': data.login_url } );
            Private.publish( 'redirect', { service: 'blogger', 'url': data.login_url } );
            window.location = data.login_url;
        } else if( 'blogger' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {
            Private.publish( 'confirm', { service: 'blogger' } );
            Private.blogger.handle_confirm( data );
        } else if( 'blogger' === data.service &&  'authorized' === data.status ) {
            if( 'connected' === data.connect_status ) {
                Private.publish( 'confirmed', { service: 'blogger' } );
            } else {
                Private.unsession( 'blogger' );
            }
        } else if( 'blogger' === data.service &&  'unauthorized' === data.account_status ) {
            Private.unsession( 'blogger' );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'blogger' ) );
        }
    }

    /* YouTube */

    Private.youtube.account_request = function( data ) {
        if( 'undefined' !== typeof data.logout_url ) {
            Private.publish( 'unsession', { service: 'youtube' } );
            Private.unsession( 'youtube' );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'youtube' ) );
        } else if( 'youtube' === data.service &&  'undefined' !== typeof data.login_url ) {
            Private.publish( 'session_redirect', { service: 'youtube', 'url': data.login_url } );
            Private.publish( 'redirect', { service: 'youtube', 'url': data.login_url } );
            window.location = data.login_url;

        } else if( 'youtube' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

            Private.publish( 'confirm', { service: 'youtube' } );
            Private.youtube.handle_confirm( data );

        } else if( 'youtube' === data.service &&  'authorized' === data.status ) {
            if( 'connected' === data.connect_status ) {
                Private.publish( 'confirmed', { service: 'youtube' } );
            } else {
                Private.unsession( 'youtube' );
            }

        } else if( 'youtube' === data.service &&  'unauthorized' === data.account_status ) {

            Private.unsession( 'youtube' );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'youtube' ) );

        }

    }

	/* Google */

	Private.google.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'google' } );	
			Private.unsession( 'google' );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'google' ) );
		} else if( 'google' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'google', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'google', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'google' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'google' } );
			Private.google.handle_confirm( data );

		} else if( 'google' === data.service &&  'authorized' === data.status ) {
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'google' } );
			} else {
				Private.unsession( 'google' );
			}

		} else if( 'google' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'google' );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'google' ) );

		}

	}

	/* Yahoo */

	Private.yahoo.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'yahoo';
			Private.publish( 'profile', { service: 'yahoo', data: data } );
			Private.setProfile( 'yahoo', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			Private.storage.session.set( 'yahoo_access_token', access_token );
			Private.storage.session.set( 'yahoo_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'yahoo', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
		}
	};

	/* Linkedin */

	Private.linkedin.handle_confirm = function( params ) {
		var data = null;
		if( !!params.profile ) {
			data = params.profile || {};
			data.service = 'linkedin';
			Private.publish( 'profile', { service: 'linkedin', data: data } );
			Private.setProfile( 'linkedin', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			Private.storage.session.set( 'linkedin_access_token', access_token );
			Private.storage.session.set( 'linkedin_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'linkedin', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
		}
	};

	/* Vimeo */

	Private.vimeo.handle_confirm = function( params, on_success, on_error ) {

		var data;
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'vimeo';
			Private.publish( 'profile', { service: 'vimeo', data: data } );
			Private.setProfile( 'vimeo', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			Private.storage.session.set( 'vimeo_access_token', access_token );
			Private.storage.session.set( 'vimeo_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'vimeo', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
		}

	};


	/* Tumblr */

	Private.tumblr.handle_confirm = function( params, on_success, on_error ) {

		var data;
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'tumblr';
			Private.publish( 'profile', { service: 'tumblr', data: data } );
			Private.setProfile( 'tumblr', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			Private.storage.session.set( 'tumblr_access_token', access_token );
			Private.storage.session.set( 'tumblr_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'tumblr', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
		}

	};

	/* Windows Live */

	Private.windows.handle_confirm = function( params ) {

		if( params.profile ) {
			var data =  params.profile || {};
			data.service = 'windows';	
			Private.publish( 'profile', { service: 'windows', data: data } );
			Private.setProfile( 'windows', data );
		}

		var access_token = params.access_token;

		if( !!access_token ) {
			Private.publish( 'sessioned', { service: 'windows', oauth_token: access_token, profile: data } );
			Private.storage.session.set( 'windows_access_token', access_token );
		}

	};


	/* Github */

	Private.github.handle_confirm = function( params ) {

		if( params.profile ) {
			var data =  params.profile || {};
			data.service = 'github';	
			Private.publish( 'profile', { service: 'github', data: data } );
			Private.setProfile( 'github', data );
		}

		var access_token = params.access_token;

		if( !!access_token ) {
			Private.publish( 'sessioned', { service: 'github', oauth_token: access_token, profile: data } );
			Private.storage.session.set( 'github_access_token', access_token );
		}

	};

	/* Twitter */

	Private.twitter.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile ) {
			data =  params.profile || {};
			data.service = 'twitter';
			Private.publish( 'profile', { service: 'twitter', data: data } );
			Private.setProfile( 'twitter', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			Private.storage.session.set( 'twitter_access_token', access_token );
			Private.storage.session.set( 'twitter_access_token_secret', access_token_secret );
			Private.publish( 'sessioned', { service: 'twitter', oauth_token: access_token, oauth_secret: access_token_secret, profile: data } );
			//Private.twitter.connect();
		}
	};

	Private.confirm = function() {

		var url_vars = Private.utilities.getUrlVars();
		
		var facebook_code = Private.storage.session.get( 'facebook_code' );
		if( 'undefined' !== typeof facebook_code && null !== facebook_code ) {
			Private.publish( 'verifying', { service: 'facebook', 'code': facebook_code } );
			Private.do_confirm( 'facebook', { 'code': facebook_code } );
			Private.storage.session.delete( 'facebook_code' );
		}	
		
		var twitter_token = Private.storage.session.get( 'twitter_oauth_request_token' );
		var twitter_verifier = Private.storage.session.get( 'twitter_oauth_request_verifier' );
		if( 'undefined' !== typeof twitter_token && null !== twitter_token && 'undefined' !== typeof twitter_verifier && null !== twitter_verifier ) {
			Private.publish( 'verifying', { service: 'twitter', 'oauth_token': twitter_token, 'oauth_verifier': twitter_verifier } );
			Private.do_confirm( 'twitter', { 'oauth_token': twitter_token, 'oauth_verifier': twitter_verifier } );
			Private.storage.session.delete( 'twitter_oauth_request_token' );
			Private.storage.session.delete( 'twitter_oauth_request_verifier' );
		}

		var foursquare_code = Private.storage.session.get( 'foursquare_code' );
		if( 'undefined' !== typeof foursquare_code && null !== foursquare_code  ) {
			Private.publish( 'verifying', { service: 'foursquare', 'code': foursquare_code } );
			Private.do_confirm( 'foursquare', { 'code': foursquare_code } );
			Private.storage.session.delete( 'foursquare_code' );
		}

		var google_code = Private.storage.session.get( 'google_code' );
		if( 'undefined' !== typeof google_code && null !== google_code ) {
			Private.publish( 'verifying', { service: 'google', 'code': google_code } );
			Private.do_confirm( 'google', { 'code': google_code } );
			Private.storage.session.delete( 'google_code' );
		}

        var blogger_code = Private.storage.session.get( 'blogger_code' );
        if( 'undefined' !== typeof blogger_code && null !== blogger_code ) {
            Private.publish( 'verifying', { service: 'blogger', 'code': blogger_code } );
            Private.do_confirm( 'blogger', { 'code': blogger_code } );
            Private.storage.session.delete( 'blogger_code' );
        }

        var youtube_code = Private.storage.session.get( 'youtube_code' );
        if( 'undefined' !== typeof youtube_code && null !== youtube_code ) {
            Private.publish( 'verifying', { service: 'youtube', 'code': youtube_code } );
            Private.do_confirm( 'youtube', { 'code': youtube_code } );
            Private.storage.session.delete( 'youtube_code' );
        }

		var windows_code = Private.storage.session.get( 'windows_code' );
		if( 'undefined' !== typeof windows_code && null !== windows_code  ) {
			Private.publish( 'verifying', { service: 'windows', 'code': windows_code } );
			Private.do_confirm( 'windows', { 'code': windows_code } );
			Private.storage.session.delete( 'windows_code' );
		}

		var github_code = Private.storage.session.get( 'github_code' );
		if( 'undefined' !== typeof github_code && null !== github_code  ) {
			Private.publish( 'verifying', { service: 'github', 'code': github_code } );
			Private.do_confirm( 'github', { 'code': github_code } );
			Private.storage.session.delete( 'github_code' );
		}

		var instagram_code = Private.storage.session.get( 'instagram_code' );
		if( 'undefined' !== typeof instagram_code && null !== instagram_code  ) {
			Private.publish( 'verifying', { service: 'instagram', 'code': instagram_code } );
			Private.do_confirm( 'instagram', { 'code': instagram_code } );
			Private.storage.session.delete( 'instagram_code' );
		}

		var wordpress_code = Private.storage.session.get( 'wordpress_code' );
		if( 'undefined' !== typeof wordpress_code && null !== wordpress_code  ) {
			Private.publish( 'verifying', { service: 'wordpress', 'code': github_code } );
			Private.do_confirm( 'wordpress', { 'code': wordpress_code } );
			Private.storage.session.delete( 'wordpress_code' );
		}

        var reddit_code = Private.storage.session.get( 'reddit_code' );
        if( 'undefined' !== typeof reddit_code && null !== reddit_code  ) {
            Private.publish( 'verifying', { service: 'reddit', 'code': github_code } );
            Private.do_confirm( 'reddit', { 'code': reddit_code } );
            Private.storage.session.delete( 'reddit_code' );
        }

		var tumblr_token = Private.storage.session.get( 'tumblr_oauth_request_token' );
		var tumblr_token_secret = Private.storage.session.get( 'tumblr_oauth_request_token_secret' );
		var tumblr_verifier = Private.storage.session.get( 'tumblr_oauth_request_verifier' );
		if( 'undefined' !== typeof tumblr_token && null !== tumblr_token && 'undefined' !== typeof tumblr_verifier && null !== tumblr_verifier ) {
			Private.publish( 'verifying', { service: 'tumblr', 'oauth_token': tumblr_token, 'oauth_verifier': tumblr_verifier } );
			Private.do_confirm( 'tumblr', { 'oauth_token': tumblr_token, 'oauth_token_secret': tumblr_token_secret, 'oauth_verifier': tumblr_verifier } );
			Private.storage.session.delete( 'tumblr_oauth_request_token' );
			Private.storage.session.delete( 'tumblr_oauth_request_token_secret' );
			Private.storage.session.delete( 'tumblr_oauth_request_verifier' );
		}


		var vimeo_token = Private.storage.session.get( 'vimeo_oauth_request_token' );
		var vimeo_token_secret = Private.storage.session.get( 'vimeo_oauth_request_token_secret' );
		var vimeo_verifier = Private.storage.session.get( 'vimeo_oauth_request_verifier' );
		if( 'undefined' !== typeof vimeo_token && null !== vimeo_token && 'undefined' !== typeof vimeo_verifier && null !== vimeo_verifier ) {
			Private.publish( 'verifying', { service: 'tumblr', 'oauth_token': vimeo_token, 'oauth_verifier': vimeo_verifier } );
			Private.do_confirm( 'vimeo', { 'oauth_token': vimeo_token, 'oauth_token_secret': vimeo_token_secret, 'oauth_verifier': vimeo_verifier } );
			Private.storage.session.delete( 'vimeo_oauth_request_token' );
			Private.storage.session.delete( 'vimeo_oauth_request_token_secret' );
			Private.storage.session.delete( 'vimeo_oauth_request_verifier' );
		}



		var yahoo_token = Private.storage.session.get( 'yahoo_oauth_request_token' );
		var yahoo_token_secret = Private.storage.session.get( 'yahoo_oauth_request_token_secret' );
		var yahoo_verifier = Private.storage.session.get( 'yahoo_oauth_request_verifier' );
		if( 'undefined' !== typeof yahoo_token && null !== yahoo_token && 'undefined' !== typeof yahoo_verifier && null !== yahoo_verifier ) {
			Private.publish( 'verifying', { service: 'yahoo', 'oauth_token': yahoo_token, 'oauth_verifier': yahoo_verifier } );
			Private.do_confirm( 'yahoo', { 'oauth_token': yahoo_token, 'oauth_token_secret': yahoo_token_secret, 'oauth_verifier': yahoo_verifier } );
			Private.storage.session.delete( 'yahoo_oauth_request_token' );
			Private.storage.session.delete( 'yahoo_oauth_request_token_secret' );
			Private.storage.session.delete( 'yahoo_oauth_request_verifier' );
		}

		var linkedin_token = Private.storage.session.get( 'linkedin_oauth_request_token' );
		var linkedin_token_secret = Private.storage.session.get( 'linkedin_oauth_request_token_secret' );
		var linkedin_verifier = Private.storage.session.get( 'linkedin_oauth_request_verifier' );
		if( 'undefined' !== typeof linkedin_token && null !== linkedin_token && 'undefined' !== typeof linkedin_verifier && null !== linkedin_verifier ) {
			Private.publish( 'verifying', { service: 'linkedin', 'oauth_token': linkedin_token, 'oauth_verifier': linkedin_verifier } );
			Private.do_confirm( 'linkedin', { 'oauth_token': linkedin_token, 'oauth_token_secret': linkedin_token_secret, 'oauth_verifier': linkedin_verifier } );
			Private.storage.session.delete( 'linkedin_oauth_request_token' );
			Private.storage.session.delete( 'linkedin_oauth_request_token_secret' );
			Private.storage.session.delete( 'linkedin_oauth_request_verifier' );
		}


        var evernote_token = Private.storage.session.get( 'evernote_oauth_request_token' );
        var evernote_token_secret = Private.storage.session.get( 'evernote_oauth_request_token_secret' );
        var evernote_verifier = Private.storage.session.get( 'evernote_oauth_request_verifier' );
        if( 'undefined' !== typeof evernote_token && null !== evernote_token && 'undefined' !== typeof evernote_verifier && null !== evernote_verifier ) {
            Private.publish( 'verifying', { service: 'evernote', 'oauth_token': evernote_token, 'oauth_verifier': evernote_verifier } );
            Private.do_confirm( 'evernote', { 'oauth_token': evernote_token, 'oauth_token_secret': evernote_token_secret, 'oauth_verifier': evernote_verifier } );
            Private.storage.session.delete( 'evernote_oauth_request_token' );
            Private.storage.session.delete( 'evernote_oauth_request_token_secret' );
            Private.storage.session.delete( 'evernote_oauth_request_verifier' );
        }


	};

	Private.detectLogin = function( redirect ) {

		var url_vars = Private.utilities.getUrlVars();
		
		if( 'undefined' !== typeof url_vars.code && 'facebook' === url_vars.service ) {
			Private.storage.session.set( 'facebook_code', url_vars.code );
			Private.publish( 'verified', { service: 'facebook', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'facebook' ) );
		}	
		
		if( 'undefined' !== typeof url_vars.oauth_token && 'undefined' !== typeof url_vars.oauth_verifier ) {
			if( 'tumblr' === url_vars.service ) {
				Private.storage.session.set( 'tumblr_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'tumblr_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'tumblr', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier, oauth_token_secret: url_vars.oauth_token_secret } );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'tumblr' ) );
			} else if( 'yahoo' === url_vars.service ) {
				Private.storage.session.set( 'yahoo_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'yahoo_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'yahoo', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'yahoo' ) );
			} else if( 'linkedin' === url_vars.service ) {
				Private.storage.session.set( 'linkedin_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'linkedin_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'linkedin', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'linkedin' ) );
			} else if( 'vimeo' === url_vars.service ) {
				Private.storage.session.set( 'vimeo_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'vimeo_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'vimeo', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier, oauth_token_secret: url_vars.oauth_token_secret } );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'vimeo' ) );
			} else if( 'evernote' === url_vars.service ) {
                Private.storage.session.set( 'evernote_oauth_request_token', url_vars.oauth_token );
                Private.storage.session.set( 'evernote_oauth_request_verifier', url_vars.oauth_verifier );
                Private.publish( 'verified', { service: 'evernote', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier, oauth_token_secret: url_vars.oauth_token_secret } );
                Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'evernote' ) );
            } else { //twitter doesn't use service var TODO: fix?
				Private.storage.session.set( 'twitter_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'twitter_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'twitter', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'twitter' ) );
			}
		}
		
		if( 'undefined' !== typeof url_vars.logout && 'undefined' !== typeof url_vars.service ) {
			if( 'facebook' === url_vars.service ) {
				Private.facebook.account_request( url_vars );
			}	
		}

		if( 'undefined' !== typeof url_vars.code && 'windows' === url_vars.service ) {
			Private.storage.session.set( 'windows_code', url_vars.code );
			Private.publish( 'verified', { service: 'windows', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'windows' ) );
		}	
		
		if( 'undefined' !== typeof url_vars.code && 'github' === url_vars.service ) {
			Private.storage.session.set( 'github_code', url_vars.code );
			Private.publish( 'verified', { service: 'github', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'github' ) );
		}	
		
		if( 'undefined' !== typeof url_vars.code && 'foursquare' === url_vars.service ) {
			Private.storage.session.set( 'foursquare_code', url_vars.code );
			Private.publish( 'verified', { service: 'foursquare', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'foursquare' ) );
		}


		if( 'undefined' !== typeof url_vars.code && 'google' === url_vars.service ) {
			Private.storage.session.set( 'google_code', url_vars.code );
			Private.publish( 'verified', { service: 'google', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'google' ) );
		}

		if( 'undefined' !== typeof url_vars.code && 'instagram' === url_vars.service ) {
			Private.storage.session.set( 'instagram_code', url_vars.code );
			Private.publish( 'verified', { service: 'instagram', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'instagram' ) );
		}

		if( 'undefined' !== typeof url_vars.code && 'wordpress' === url_vars.service ) {
			Private.storage.session.set( 'wordpress_code', url_vars.code );
			Private.publish( 'verified', { service: 'wordpress', 'code': url_vars.code } );
			Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'wordpress' ) );
		}

        if( 'undefined' !== typeof url_vars.code && 'reddit' === url_vars.service ) {
            Private.storage.session.set( 'reddit_code', url_vars.code );
            Private.publish( 'verified', { service: 'reddit', 'code': url_vars.code } );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'reddit' ) );
        }

        if( 'undefined' !== typeof url_vars.code && 'youtube' === url_vars.service ) {
            Private.storage.session.set( 'youtube_code', url_vars.code );
            Private.publish( 'verified', { service: 'youtube', 'code': url_vars.code } );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'youtube' ) );
        }

        if( 'undefined' !== typeof url_vars.code && 'blogger' === url_vars.service ) {
            Private.storage.session.set( 'blogger_code', url_vars.code );
            Private.publish( 'verified', { service: 'blogger', 'code': url_vars.code } );
            Private.state.replaceCurrent( Private.redirectTo.replace( ':service', 'blogger' ) );
        }

	};

	Private.login_statuses = function() {

		var services = {
			'facebook': 'facebook_access_token'
			, 'twitter': 'twitter_access_token'
			, 'google': 'google_access_token'
			, 'foursquare': 'foursquare_access_token'
			, 'github': 'github_access_token'
			, 'yahoo': 'yahoo_access_token'
			, 'tumblr': 'tumblr_access_token'
			, 'linkedin': 'linkedin_access_token'
			, 'windows': 'windows_access_token'
			, 'instagram': 'instagram_access_token'
			, 'wordpress': 'wordpress_access_token'
            , 'vimeo': 'wordpress_access_token'
            , 'blogger': 'blogger_access_token'
            , 'youtube': 'youtube_access_token'
            , 'evernote': 'evernote_access_token'
            , 'reddit': 'reddit_access_token'
		};

		var statuses = {};
		for( service in services ) {
			var test = Private.storage.session.get( services[ service ] );
			if( 'undefined' !== typeof test && null !== test && '' !== test ) {
				statuses[ service ] = true;
			} else {
				statuses[ service ] = false;
			}
		}

		Private.publish( 'status', { status: statuses } );
		
		return statuses;

	}

	/* Yahoo */

	Private.yahoo.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			Private.publish( 'unsession', { service: 'yahoo' } );
			Private.unsession( 'yahoo' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'yahoo' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'yahoo_oauth_request_token', data.request_token );
			Private.storage.session.set( 'yahoo_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'yahoo', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'yahoo', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'yahoo' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'yahoo' } );
			
			}

		} else if( 'yahoo' === data.service &&  'authorized' === data.status && 'authorized' === data.status ) {

			Private.publish( 'confirm', { service: 'yahoo' } );
			Private.yahoo.handle_confirm( data );

		} else if( 'yahoo' === data.service &&  'unauthorized' === data.account_status ) {

			Private.state.replaceCurrent( Private.redirectTo );

		}

	}

	/* Windows Live */

	Private.windows.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			Private.publish( 'unsession', { service: 'windows' } );
			Private.unsession( 'windows' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'windows' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'windows_oauth_request_token', data.request_token );
			Private.storage.session.set( 'windows_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'windows', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'windows', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'windows' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'windows' } );
			}

		} else if( 'windows' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'windows' } );
			Private.windows.handle_confirm( data );

		} else if( 'windows' === data.service &&  'unauthorized' === data.status ) {
		
			Private.state.replaceCurrent( Private.redirectTo );

		}

	}


	/* WordPress */

	Private.wordpress.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			Private.publish( 'unsession', { service: 'wordpress' } );
			Private.unsession( 'wordpress' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'wordpress' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'wordpress_oauth_request_token', data.request_token );
			Private.storage.session.set( 'wordpress_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'wordpress', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'wordpress', 'url': data.login_url } );
			window.location = data.login_url;
		} else if( 'wordpress' === data.service &&  'undefined' !== typeof data.connect_status ) {
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'wordpress' } );
			} else {
				Private.unsession( 'wordpress' );
			}
		} else if( 'wordpress' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {
			Private.publish( 'confirm', { service: 'wordpress' } );
			Private.wordpress.handle_confirm( data );
		} else if( 'wordpress' === data.service &&  'unauthorized' === data.account_status ) {
			Private.unsession( 'wordpress' );
			Private.state.replaceCurrent( Private.redirectTo );
		}
	}



	/* Github */

	Private.github.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			Private.publish( 'unsession', { service: 'github' } );
			Private.unsession( 'github' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'github' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'github_oauth_request_token', data.request_token );
			Private.storage.session.set( 'github_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'github', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'github', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'github' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'github' } );

			} else {

				Private.unsession( 'github' );
			
			}

		} else if( 'github' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'github' } );
			Private.github.handle_confirm( data );

		} else if( 'github' === data.service &&  'unauthorized' === data.account_status ) {
		
			Private.unsession( 'github' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	}


	/* Vimeo */

	Private.vimeo.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'vimeo' } );
			Private.unsession( 'vimeo' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'vimeo' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'vimeo_oauth_request_token', data.request_token );
			Private.storage.session.set( 'vimeo_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'vimeo', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'vimeo', 'url': data.login_url } );

			window.location = data.login_url;

		} else if( 'vimeo' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'vimeo' } );
			
			} else {

				Private.unsession( 'vimeo' );

			}

		} else if( 'vimeo' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'vimeo' } );
			Private.vimeo.handle_confirm( data );

		} else if( 'vimeo' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'vimeo' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	}


	/* Tumblr */

	Private.tumblr.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'tumblr' } );
			Private.unsession( 'tumblr' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'tumblr' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'tumblr_oauth_request_token', data.request_token );
			Private.storage.session.set( 'tumblr_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'tumblr', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'tumblr', 'url': data.login_url } );

			window.location = data.login_url;

		} else if( 'tumblr' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'tumblr' } );
			
			} else {

				Private.unsession( 'tumblr' );

			}

		} else if( 'tumblr' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'tumblr' } );
			Private.tumblr.handle_confirm( data );

		} else if( 'tumblr' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'tumblr' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	}

	/* Twitter */

	Private.twitter.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			private.publish( 'unsession', { service: 'twitter' } );
			private.unsession( 'twitter' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'twitter' === data.service &&  'undefined' !== typeof data.login_url ) {
			
			Private.publish( 'session_redirect', { service: 'twitter', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'twitter', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'twitter' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'twitter' } );
			
			} else {

				Private.unsession( 'twitter' );

			}

		} else if( 'twitter' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'twitter' } );
			Private.twitter.handle_confirm( data );

		} else if( 'twitter' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'twitter' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	}

	/* Instagram */

	Private.instagram.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			private.publish( 'unsession', { service: 'instagram' } );
			private.unsession( 'instagram' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'instagram' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'instagram_oauth_request_token', data.request_token );
			Private.storage.session.set( 'instagram_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'instagram', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'instagram', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'instagram' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {

				Private.publish( 'confirmed', { service: 'instagram' } );

			} else {

				Private.unsession( 'instagram' );

			}

		} else if( 'instagram' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'instagram' } );
			Private.instagram.handle_confirm( data );

		} else if( 'instagram' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'instagram' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	};


	/* Linkedin */

	Private.linkedin.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			private.publish( 'unsession', { service: 'linkedin' } );
			private.unsession( 'linkedin' );
			Private.state.replaceCurrent( Private.redirectTo );

		} else if( 'linkedin' === data.service &&  'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'linkedin_oauth_request_token', data.request_token );
			Private.storage.session.set( 'linkedin_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'linkedin', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'linkedin', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'linkedin' === data.service &&  'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {

				Private.publish( 'confirmed', { service: 'linkedin' } );

			} else {

				Private.unsession( 'linkedin' );

			}

		} else if( 'linkedin' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'linkedin' } );
			Private.linkedin.handle_confirm( data );

		} else if( 'linkedin' === data.service &&  'unauthorized' === data.account_status ) {

			Private.unsession( 'linkedin' );
			Private.state.replaceCurrent( Private.redirectTo );

		}

	};


    /* Reddit */

    Private.reddit.account_request = function( data ) {

        if( 'undefined' !== typeof data.logout_url ) {

            private.publish( 'unsession', { service: 'reddit' } );
            private.unsession( 'reddit' );
            Private.state.replaceCurrent( Private.redirectTo );

        } else if( 'reddit' === data.service &&  'undefined' !== typeof data.login_url ) {

            Private.storage.session.set( 'reddit_oauth_request_token', data.request_token );
            Private.storage.session.set( 'reddit_oauth_request_token_secret', data.request_token_secret );
            Private.publish( 'session_redirect', { service: 'reddit', 'url': data.login_url } );
            Private.publish( 'redirect', { service: 'reddit', 'url': data.login_url } );
            window.location = data.login_url;

        } else if( 'reddit' === data.service &&  'undefined' !== typeof data.connect_status ) {

            if( 'connected' === data.connect_status ) {

                Private.publish( 'confirmed', { service: 'reddit' } );

            } else {

                Private.unsession( 'reddit' );

            }

        } else if( 'reddit' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

            Private.publish( 'confirm', { service: 'reddit' } );
            Private.reddit.handle_confirm( data );

        } else if( 'reddit' === data.service &&  'unauthorized' === data.account_status ) {

            Private.unsession( 'reddit' );
            Private.state.replaceCurrent( Private.redirectTo );

        }

    };

    /* Evernote */

    Private.evernote.account_request = function( data ) {

        if( 'undefined' !== typeof data.logout_url ) {
            Private.publish( 'unsession', { service: 'evernote' } );
            Private.unsession( 'evernote' );
            Private.state.replaceCurrent( Private.redirectTo );

        } else if( 'evernote' === data.service &&  'undefined' !== typeof data.login_url ) {

            Private.storage.session.set( 'evernote_oauth_request_token', data.request_token );
            Private.storage.session.set( 'evernote_oauth_request_token_secret', data.request_token_secret );
            Private.publish( 'session_redirect', { service: 'evernote', 'url': data.login_url } );
            Private.publish( 'redirect', { service: 'evernote', 'url': data.login_url } );

            window.location = data.login_url;

        } else if( 'evernote' === data.service &&  'undefined' !== typeof data.connect_status ) {

            if( 'connected' === data.connect_status ) {

                Private.publish( 'confirmed', { service: 'evernote' } );

            } else {

                Private.unsession( 'evernote' );

            }

        } else if( 'evernote' === data.service &&  'authorized' === data.status && 'undefined' === typeof data.connect_status ) {

            Private.publish( 'confirm', { service: 'evernote' } );
            Private.evernote.handle_confirm( data );

        } else if( 'evernote' === data.service &&  'unauthorized' === data.account_status ) {

            Private.unsession( 'evernote' );
            Private.state.replaceCurrent( Private.redirectTo );

        }

    }


    /* History */

	Private.state = Private.state || {};
	Private.history = window.history;

	Private.state.replaceCurrent = function( stateUrl, stateTitle, stateObj ) {

		if( null === stateObj || 'undefined' === typeof stateObj ) {
			stateObj = Private.history.getCurrentStateObj;
		}

		Private.history.replaceState( stateObj, stateTitle, stateUrl );
	};

	Private.state.push = function( state, stateTitle, stateObj ) {

		if( 'string' !== typeof state && state.length > 0 ) {
			stateUrl = state.join( '/' );
		} else {
			stateUrl = state;
		}

		if( null === stateObj || 'undefined' === typeof stateObj ) {
			stateObj = Private.history.getCurrentStateObj;
		}

		Private.history.pushState( stateObj, stateTitle, stateUrl );

	};

	/* Storage */

	Private.storage = {};

	/* Local Storage */

	Private.store = localStorage;
	Private.storage.local = {};

	Private.storage.local.set = function( set_key, set_value ) {
		if( 'string' !== typeof set_value ) {
			set_value = JSON.stringify( set_value );
		}
		return Private.store.setItem( Private.prefix + '_' + set_key, set_value );
	};
		
	Private.storage.local.delete = function( key ) {
		return Private.store.removeItem( Private.prefix + '_' + key );
	};
		
	Private.storage.local.get = function( get_key ) {
		return JSON.parse( Private.store.getItem( Private.prefix + '_' + get_key ) );
	};

	Private.storage.local.set_batch = function( dictionary ) {
		for( item in dictionary ) {
			if( dictionary.hasOwnProperty( item ) ) {	
				Private.storage.local.set( item, dictionary[ item ] );
			}
		}
	};

	Private.storage.local.delete_batch = function( keys ) {
		var i;
		for( i = 0; i <= keys.length; i += 1 ) {
			Private.storage.local.delete( keys[ i ] );
		}
	}

	/* Session Storage */

	Private.storage.session = {};
	Private.sessionStorage = sessionStorage;

	Private.storage.session.set = function( set_key, set_value ) {
		return Private.sessionStorage.setItem( Private.prefix + '_' + set_key, set_value );
	};
		
	Private.storage.session.delete = function( key ) {
		return Private.sessionStorage.removeItem( Private.prefix + '_' + key );
	};
		
	Private.storage.session.get = function( get_key ) {
		return Private.sessionStorage.getItem( Private.prefix + '_' + get_key );
	};

	Private.storage.session.set_batch = function( dictionary ) {
		for( item in dictionary ) {
			if( dictionary.hasOwnProperty( item ) ) {	
				Private.storage.session.set( item, dictionary[ item ] );
			}
		}
	};

	Private.storage.session.delete_batch = function( keys ) {
		var i;
		for( i = 0; i <= keys.length; i += 1 ) {
			Private.storage.session.delete( keys[ i ] );
		}
	};

	Private.utilities = Private.utilities || {};
	// Cleverness via: http://papermashup.com/read-url-get-variables-withjavascript/
	Private.utilities.getUrlVars = function() {
		var vars = {}
			, pieces = window.document.location.href.split('?').splice(1).join('&').split('#')
			, parts = ("?" + pieces[ 0 ]).replace( /[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		} );
		return vars;
	};

	return Public;

}() );
