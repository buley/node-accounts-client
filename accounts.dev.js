var Accounts = ( function() { 

	var Private = {};
	var subscribers = {};

	Private.sockets = [];
	Private.socket = {};
	Private.connected = false;
	Private.prefix = '_acc_';

	Private.allServices = [ 'facebook', 'google', 'linkedin', 'twitter', 'foursquare', 'yahoo',  'github', 'tumblr' ];
	Private.activeServices = [];

	var z = 0, zlen = Private.allServices.length;
	for( var z = 0; z < zlen; z += 1 ) {
		Private[ Private.allServices[ z ] ] = {};
	}
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
		var services = Private.activeServices;
		var already = false, x = 0; len = services.length;
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
		var arr = [];
		var changed = false, x = 0; len = services.length, serv;
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

	var Public = function( socket, services ) {
		
		if( 'undefined' !== typeof services && null !== services ) {
			Private.setActiveServices( services );
		} else {
			Public.prototype.enable();
		}

		if( 'undefined' !== socket && null !== socket ) {
			Private.sockets.push( socket );	
		}

		Private.socket.on( 'connect', function() {
			Private.connected = true;
			Private.confirm();
		} );

		Private.socket.on( 'disconnect', function() {
			Private.connected = false;
		});

		Private.socket.on( '_acc_response', function( response ) {	
			Public.prototype.request( response );
		} );

		Private.detect_login();

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
		//Todo: use indexOf for Mozilla (native C is faster)
		var services = Private.activeServices;
		var x = 0; len = services.length;
		for( x = 0; x < len; x += 1 ) {
			if( service === services[ x ] ) {
				return true;
			}
		}
		return false;
	};

	Public.prototype.disabled = function( service ) {
		if( 'undefined' === typeof service || null === service ) {
			var services = Private.getActiveServices();
			var all_services = Private.getActiveServices();
			var x = 0, z = 0, len = services.length, a_len = all_services.length;
			var results = [];
			for( x = 0; x < a_len; x += 1 ) {
				var disabled = true;
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


	Public.prototype.secret = function( type ) {
		return Private.getAccessTokenSecret( type );
	};

	Public.prototype.profile = function( type ) {
		return Private.getProfile( type );
	};
	
	Public.prototype.profiles = function() {
		return Private.getProfiles();
	};
	
	Public.prototype.socket = function( socket ) {
		Private.sockets = [];
		if( 'undefined' !== typeof socket && null !== socket ) {
			Private.sockets.push( socket );
		}
	};

	Public.prototype.sockets = function( socket ) {
		return Private.sockets.slice(0);
	};

	Public.prototype.socket.push = function() {
		Array.prototype.push.apply( Private.sockets, arguments );
	};

	Public.prototype.socket.unshift = function() {
		Array.prototype.unshift.apply( Private.sockets, arguments );
	};

	Public.prototype.socket.shift = function() {
		Array.prototype.shift.apply( Private.sockets, arguments );
	};

	Public.prototype.socket.splice = function() {
		Array.prototype.splice.apply( Private.sockets, arguments );
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
		Private.publish( 'subscribe', { event: event_name, callback: callback, id: id } );
		if( 'undefined' === typeof event_name || null === event_name || 'function' !== typeof callback ) {
			return false;
		}
		if( null === id || 'undefined' === typeof id ) {
			//create random id
			var text = "";
			var set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var x;
			for( x = 0; x < 5; x++ ) { text += set.charAt( Math.floor( Math.random() * set.length ) ); }

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

		if( 'undefined' === typeof event_name || null === event_name ) {
			return false;
		}
		var subs = subscribers[ event_name ];
		if( 'undefined' === typeof subs || null === subs ) {
			return false;
		}
		var attr, callback;
		for( attr in subs ) {
			callback = subs[ attr ];
			if( 'function' === typeof callback ) {
				callback( value, attr );
			};
		}
	};

	//acts as if you're emitting to single socket
	Private.socket.emit = function( channel, message ) {
		var x, socket, len = Private.sockets.length;
		for( x = 0; x < len; x += 1 ) {
			socket = Private.sockets[ x ];
			socket.emit( channel, message );
		}
	};

	//adds callbacks to all sockets in the stack
	Private.socket.on = function( event_name, callback ) {
		var x, socket, len = Private.sockets.length;
		for( x = 0; x < len; x += 1 ) {
			socket = Private.sockets[ x ];
			if( 'undefined' !== typeof socket && null !== socket ) {
				socket.on( event_name, callback );
			}
		}
	};

	//TODO: rename response var to request
	Public.prototype.request = function( response ) {

		if( 'twitter' === response.service && 'account' === response.response_type ) {
			Private.twitter.account_request( response );
		}

		if( 'facebook' === response.service && 'account' === response.response_type ) {
			Private.facebook.account_request( response );
		}

		if( 'google' === response.service && 'account' === response.response_type ) {
			Private.google.account_request( response );
		}

		if( 'foursquare' === response.service && 'account' === response.response_type ) {
			Private.foursquare.account_request( response );
		}

		if( 'tumblr' === response.service && 'account' === response.response_type ) {
			Private.tumblr.account_request( response );
		}

		if( 'github' === response.service && 'account' === response.response_type ) {
			Private.github.account_request( response );
		}

		if( 'yahoo' === response.service && 'account' === response.response_type ) {
			Private.yahoo.account_request( response );
		}

		if( 'linkedin' === response.service && 'account' === response.response_type ) {
			Private.linkedin.account_request( response );
		}


	};

	Private.debug = false;

	Private.connect = function( service, oauth_type ) {
		if( Public.prototype.disabled( service ) ) {
			return false;
		}
		var request = { 'command': 'connect' };
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

		Private.socket.emit( 'account', request );

	};	

	Private.getAccessTokens = function() {
		var services = Private.getActiveServices();
		var x = 0; xlen = services.length, service, tokens = {};
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
			case 'tumblr': 
				access_token = Private.storage.session.get( 'tumblr_access_token' );
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
			case 'github': 
				access_token_secret = Private.storage.session.get( 'github_access_token_secret' );
				break;
			case 'linkedin': 
				access_token_secret = Private.storage.session.get( 'linkedin_access_token_secret' );
				break;
			case 'yahoo': 
				access_token_secret = Private.storage.session.get( 'yahoo_access_token_secret' );
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
		Private.storage.session.set( Private.prefix + type + '_access_token_secret', secret );
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
		return Private.storage.local.get( Private.prefix + type + '_profile' );
	};
	
	Private.setProfile = function ( type, data ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		if( 'undefined' === typeof type || 'undefined' === typeof data || null === type || null === data ) {
			return false;
		}
		return Private.storage.local.set( Private.prefix + type + '_profile', data );
	};


	Private.getProfileIds = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, id, profiles = {};
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
					case 'twitter': 
						id = parseInt( profile.id_str, 10 );
						break;
					case 'yahoo':
						id = profile.guid;
						break;
					default:
						break;
				};
				profiles[ service ] = id;
			} else {
				profiles[ service ] = null;
			}
		};
		return profiles;
	};


	Private.getProfileDisplayNames = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, names, profiles = {};
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
						break;
					case 'twitter': 
						names.display = profile.name;
						break;
					case 'yahoo':
						break;
					default:
						break;
				};
			}
			profiles[ service ] = names;
		};
		return profiles;
	};


	Private.getProfileGenders = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, gender, profiles = {};
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
					case 'yahoo':
						if( "M" === profile.gender ) {
							gender = "male";
						} else if( "F" === profile.gender ) {
							gender = "female";
						} else {
							gender = profile.gender;
						}
						break;
					default:
						break;
				};
			}
			profiles[ service ] = gender;
		};
		return profiles;
	};

	Private.getProfileBirthdates = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, birthdate, profiles = {};
		for( service in services ) {
			profile = services[ service ];
			birthdate = { day: null, month: null, year: null };
			if( null !== profile ) {

				switch( service ) {
					case 'facebook':
						birthdate.day = new Date( profile.birthday ).getDate();
						birthdate.month = new Date( profile.birthday ).getMonth() + 1;
						birthdate.year = new Date( profile.birthday ).getFullYear();
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
					case 'yahoo':
						birthdate.year = profile.birthYear;
						break;
					default:
						break;
				};
			}
			profiles[ service ] = birthdate;
		};
		return profiles;
	};

	Private.getProfileImages = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, image, profiles = {};
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
					case 'yahoo':
						image = profile.image.imageUrl;
						break;
					default:
						break;
				};
			}
			profiles[ service ] = image;
		};
		return profiles;
	};

	Private.getProfilePersonalURLs = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, other = [], personal_url, profiles = {};
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
					default:
						break;
				};
			}
			profiles[ service ] = personal_url;
		};
		return profiles;
	};



	Private.getProfileURLs = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, other = [], profile_url, profiles = {};
		for( service in services ) {
			profile = services[ service ];
			profile_url = null;
			if( null !== profile ) {

				switch( service ) {
					case 'facebook':
						profile_url = profile.link;
						break;
					case 'foursquare':
						profile_url = profile.canonicalUrl;
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
					default:
						break;
				};
			}
			profiles[ service ] = profile_url;
		};
		return profiles;
	};

	Private.getProfileEmails = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, email, profiles = {};
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
					default:
						break;
				};
			}
			profiles[ service ] = email;
		};
		return profiles;
	};


	Private.getProfileUsernames = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, username, profiles = {};
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
					case 'yahoo':
						username = profile.nickname;
						break;
					default:
						break;
				};

			}
			profiles[ service ] = username;
		};
		return profiles;
	};

	Private.getProfileDescriptions = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, description, profiles = {};
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
						break;
					case 'google':
						description = profile.bio;
						break;
					case 'linkedin':
						description = profile.headline;
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						description = profile.description;
						break;
					case 'yahoo':
						break;
					default:
						break;
				};
			
			}
			profiles[ service ] = description;
		};
		return profiles;
	};

	Private.getProfileLocations = function () {
		var services = Private.getUnifiedProfiles();
		var attr, profile, location, profiles = {};
		for( service in services ) {
			profile = services[ service ];
			location = null;
			if( null !== profile ) {

				switch( service ) {
					case 'facebook':
						location = profile.location.name;
						break;
					case 'foursquare':
						location = profile.homeCity;
						break;
					case 'github':
						location = profile.location;
						break;
					case 'google':
						location = profile.bio;
						break;
					case 'linkedin':
						location = profile.location.name;
						break;
					case 'tumblr':
						break;
					case 'twitter': 
						location = profile.location;
						break;
					case 'yahoo':
						break;
					default:
						break;
				};
			
			}
			profiles[ service ] = location;
		};
		return profiles;
	};

	Private.unifyOptionsAttributes = function( options ) {

		var services = Private.getActiveServices();
		//1) check for consensus 
		var value = null;
		var consensus = false;
		var attr, val, vals = {}, max_vals = {}, maxes = {}, max_service = null;
		
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

		var attr3;
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
				var x = 0; xlen = services.length, service;
				for( x = 0; x < xlen; x += 1 ) {
					service = services[ x ];
					if( 'undefined' !== typeof options[ service ][ attr ] && ( 'undefined' === typeof max_vals[ attr ] || null === max_vals[ attr ] ) ) {
						max_vals[ attr ] = options[ service ][ attr ];
					}
				}
			}
		}

		return max_vals;
	
	};

	Private.unifyOptions = function( options ) {
	
		var services = Private.getActiveServices();
		//1) check for consensus 
		var value = null;
		var consensus = false;
		var attr, val, vals = {}, max = 0, max_service = null;
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
			//try to get highest ranked service with this response
			var x = 0; xlen = services.length, service;
			var profiles = {};
			for( x = 0; x < xlen; x += 1 ) {
				service = services[ x ];
				if( null !== options[ service ] && 'undefined' !== typeof options[ service ] && service === max_service ) {
					return options[ service ];
				}
			}
		}
		
		//2) else default by order
		var x = 0; xlen = services.length, service;
		var profiles = {};
		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			if( null !== options[ service ] && 'undefined' !== typeof options[ service ] ) {
				return options[ service ];
			}
		}
		return null;


	};

	Private.removeNulls = function( options ) {
		var opts = {}, attr;
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
			, 'name': Private.unifyOptionsAttributes( Private.getProfileDisplayNames() )
			, 'birthdate': Private.unifyOptionsAttributes( Private.getProfileBirthdates() )
			, 'gender': Private.unifyOptions( Private.getProfileGenders() )
			, 'image': Private.unifyOptions( Private.getProfileImages() )
			, 'location': Private.unifyOptions( Private.getProfileLocations() )
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
			, 'name': Private.getProfileDisplayNames()
			, 'birthdate': Private.getProfileBirthdates()
			, 'gender': Private.getProfileGenders()
			, 'image': Private.getProfileImages()
			, 'location': Private.getProfileLocations()
			, 'description': Private.getProfileDescriptions()
			, 'url': Private.getProfilePersonalURLs()
		};
	};



	Private.getUnifiedProfiles = function ( ) {
		var services = Private.getActiveServices();
		var x = 0; xlen = services.length, service;
		var profiles = {};
		for( x = 0; x < xlen; x += 1 ) {
			service = services[ x ];
			profiles[ service ] = Private.getProfile( service );
		}
		return profiles;
	};

	Private.do_logout = function ( type ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		var obj =  { 'request_type': 'account', 'command': 'logout', 'service': type };
		obj[ 'access_token' ] = Private.getAccessToken( type );
		Private.socket.emit( 'account', obj );
	};

	Private.do_login = function ( type ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		Private.socket.emit( 'account', { 'request_type': 'account', 'command': 'login', 'service': type } );
	};

	Private.do_confirm = function ( type, params ) {
		if( Public.prototype.disabled( type ) ) {
			return false;
		}
		params.request_type = 'account';
		params.command = 'confirm';
		params.service = type;
		Private.socket.emit( 'account', params );
	};

	/* Facebook */

	Private.facebook.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile_data ) {
			data =  params.profile_data || {};
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

	Private.foursquare.handle_confirm = function( params ) {

		var data = null;
		if( params.profile_data ) {
			data =  params.profile_data || {};
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

	/* Google */

	Private.google = Private.google || {};
	Private.google.handle_confirm = function( params ) {
		var data = null;
		if( params.profile_data ) {
			data = params.profile_data || {};
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

	Private.twitter.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile_data ) {
			data =  params.profile_data || {};
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

		var url_vars = Private.utilities.get_url_vars();
		
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

		var github_code = Private.storage.session.get( 'github_code' );
		if( 'undefined' !== typeof github_code && null !== github_code  ) {
			Private.publish( 'verifying', { service: 'github', 'code': github_code } );
			Private.do_confirm( 'github', { 'code': github_code } );
			Private.storage.session.delete( 'github_code' );
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



	};


	Private.detect_login = function() {

		var url_vars = Private.utilities.get_url_vars();
		
		if( 'undefined' !== typeof url_vars.code && 'facebook' === url_vars.service ) {
			Private.storage.session.set( 'facebook_code', url_vars.code );
			Private.publish( 'verified', { service: 'facebook', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.oauth_token && 'undefined' !== typeof url_vars.oauth_verifier ) {
			if( 'tumblr' === url_vars.service ) {
				Private.storage.session.set( 'tumblr_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'tumblr_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'tumblr', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 
			} else if( 'yahoo' === url_vars.service ) {
				Private.storage.session.set( 'yahoo_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'yahoo_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'yahoo', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 		
			} else if( 'linkedin' === url_vars.service ) {
				Private.storage.session.set( 'linkedin_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'linkedin_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'linkedin', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 		
			} else { //twitter doesn't use service var TODO: fix?
				Private.storage.session.set( 'twitter_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'twitter_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'twitter', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
			}
		}
		
		if( 'undefined' !== typeof url_vars.logout && 'undefined' !== typeof url_vars.service ) {
			if( 'facebook' === url_vars.service ) {
				Private.facebook.account_request( url_vars );
			}	
		}

		if( 'undefined' !== typeof url_vars.code && 'github' === url_vars.service ) {
			Private.storage.session.set( 'github_code', url_vars.code );
			Private.publish( 'verified', { service: 'github', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.code && 'foursquare' === url_vars.service ) {
			Private.storage.session.set( 'foursquare_code', url_vars.code );
			Private.publish( 'verified', { service: 'foursquare', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}


		if( 'undefined' !== typeof url_vars.code && 'google' === url_vars.service ) {
			Private.storage.session.set( 'google_code', url_vars.code );
			Private.publish( 'verified', { service: 'google', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
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

	/* Facebook */

	Private.facebook.account_request = function( data ) {
		if( 'undefined' !== typeof data.logout_url || 'undefined' !== typeof data.logout ) {
			if( null === data.logout_url ) {
				Private.publish( 'unsession', { service: 'facebook' } );
				Private.unsession( 'facebook' );
				Private.state.replaceCurrent( '/', 'home' );
			} else {
				Private.publish( 'unsession_redirect', { service: 'facebook', 'url': data.logout_url } );
				Private.publish( 'redirect', { service: 'facebook', 'url': data.logout_url } );
				window.location = data.logout_url;
			}
		} else if( 'facebook' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'facebook', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'facebook', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'facebook' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {
				
			Private.publish( 'confirm', { service: 'facebook' } );
			Private.facebook.handle_confirm( data );	

		} else if( 'facebook' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {	
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'facebook' } );
			} else {
				Private.unsession( 'facebook' );
			}
		} else if( 'facebook' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'facebook' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Foursquare */

	Private.foursquare.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'foursquare' } );	
			Private.unsession( 'foursquare' );
			Private.state.replaceCurrent( '/', 'home' );
		} else if( 'foursquare' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'foursquare', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'foursquare', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'foursquare' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'foursquare' } );
			Private.foursquare.handle_confirm( data );

		} else if( 'foursquare' === data.service && 'account' === data.response_type  && 'undefined' !== typeof data.connect_status ) {
			if( 'connected' === data.connect_status ) {
				Private.publish( 'confirmed', { service: 'foursquare' } );
			} else {
				Private.unsession( 'foursquare' );
			}

		} else if( 'foursquare' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'foursquare' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Google */

	Private.google = Private.google || {};

	Private.google.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

                        Private.publish( 'unsession', { service: 'google' } );
			Private.unsession( 'google' );
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'google' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.publish( 'session_redirect', { service: 'google', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'google', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'google' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {
			
			if( 'connected' === data.connect_status ) {

				Private.publish( 'confirmed', { service: 'google' } );

			} else {

				Private.unsession( 'google' );

			}
		
		} else if( 'google' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.unsession( 'google' );

		}
	};

	/* Yahoo */

	Private.yahoo.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile_data ) {
			var data =  params.profile_data || {};
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
		if( !!params.profile_data ) {
			data = params.profile_data || {};
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



	/* Tumblr */

	Private.tumblr.handle_confirm = function( params, on_success, on_error ) {

		var data;
		if( !!params.profile_data ) {
			data =  params.profile_data || {};
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

	/* Github */

	Private.github.handle_confirm = function( params ) {

		if( params.profile_data ) {
			var data =  params.profile_data || {};
			data.service = 'github';	
			Private.publish( 'profile', { service: 'github', data: data } );
			Private.setProfile( 'github', data );
		}

		var access_token = params.access_token;

		if( !!access_token ) {
			console.log('access token', access_token );
			Private.publish( 'sessioned', { service: 'github', oauth_token: access_token, profile: data } );
			Private.storage.session.set( 'github_access_token', access_token );
		}

	};

	/* Twitter */

	Private.twitter.handle_confirm = function( params ) {

		var data = null;
		if( !!params.profile_data ) {
			data =  params.profile_data || {};
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

		var url_vars = Private.utilities.get_url_vars();
		
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

		var github_code = Private.storage.session.get( 'github_code' );
		if( 'undefined' !== typeof github_code && null !== github_code  ) {
			Private.publish( 'verifying', { service: 'github', 'code': github_code } );
			Private.do_confirm( 'github', { 'code': github_code } );
			Private.storage.session.delete( 'github_code' );
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



	};

	//aaa

	Private.detect_login = function() {

		var url_vars = Private.utilities.get_url_vars();
		
		if( 'undefined' !== typeof url_vars.code && 'facebook' === url_vars.service ) {
			Private.storage.session.set( 'facebook_code', url_vars.code );
			Private.publish( 'verified', { service: 'facebook', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.oauth_token && 'undefined' !== typeof url_vars.oauth_verifier ) {
			if( 'tumblr' === url_vars.service ) {
				Private.storage.session.set( 'tumblr_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'tumblr_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'tumblr', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 
			} else if( 'yahoo' === url_vars.service ) {
				Private.storage.session.set( 'yahoo_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'yahoo_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'yahoo', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 		
			} else if( 'linkedin' === url_vars.service ) {
				Private.storage.session.set( 'linkedin_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'linkedin_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'linkedin', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
		 		
			} else { //twitter doesn't use service var TODO: fix?
				Private.storage.session.set( 'twitter_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'twitter_oauth_request_verifier', url_vars.oauth_verifier );
				Private.publish( 'verified', { service: 'twitter', oauth_token: url_vars.oauth_token, oauth_verifier: url_vars.oauth_verifier } );
				Private.state.replaceCurrent( '/', 'home' );
			}
		}
		
		if( 'undefined' !== typeof url_vars.logout && 'undefined' !== typeof url_vars.service ) {
			if( 'facebook' === url_vars.service ) {
				Private.facebook.account_request( url_vars );
			}	
		}

		if( 'undefined' !== typeof url_vars.code && 'github' === url_vars.service ) {
			Private.storage.session.set( 'github_code', url_vars.code );
			Private.publish( 'verified', { service: 'github', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.code && 'foursquare' === url_vars.service ) {
			Private.storage.session.set( 'foursquare_code', url_vars.code );
			Private.publish( 'verified', { service: 'foursquare', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
		}


		if( 'undefined' !== typeof url_vars.code && 'google' === url_vars.service ) {
			Private.storage.session.set( 'google_code', url_vars.code );
			Private.publish( 'verified', { service: 'google', 'code': url_vars.code } );
			Private.state.replaceCurrent( '/', 'home' );
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
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'yahoo' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'yahoo_oauth_request_token', data.request_token );
			Private.storage.session.set( 'yahoo_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'yahoo', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'yahoo', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'yahoo' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'yahoo' } );

			} else {

				Private.unsession( 'yahoo' );
			
			}

		} else if( 'yahoo' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'yahoo' } );
			Private.yahoo.handle_confirm( data, on_success, on_error );	

		} else if( 'yahoo' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'yahoo' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Github */

	Private.github.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			Private.publish( 'unsession', { service: 'github' } );
			Private.unsession( 'github' );
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'github' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'github_oauth_request_token', data.request_token );
			Private.storage.session.set( 'github_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'github', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'githubt', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'github' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'github' } );

			} else {

				Private.unsession( 'github' );
			
			}

		} else if( 'github' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'github' } );
			Private.github.handle_confirm( data );

		} else if( 'github' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {
		
			Private.unsession( 'github' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}


	/* Tumblr */

	Private.tumblr.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			Private.publish( 'unsession', { service: 'tumblr' } );
			Private.unsession( 'tumblr' );
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'tumblr' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'tumblr_oauth_request_token', data.request_token );
			Private.storage.session.set( 'tumblr_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'tumblr', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'tumblr', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'tumblr' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'tumblr' } );
			
			} else {

				Private.unsession( 'tumblr' );

			}

		} else if( 'tumblr' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'tumblr' } );
			Private.tumblr.handle_confirm( data );

		} else if( 'tumblr' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'tumblr' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Twitter */

	Private.twitter.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			private.publish( 'unsession', { service: 'twitter' } );
			private.unsession( 'twitter' );
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'twitter' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {
			
			Private.publish( 'session_redirect', { service: 'twitter', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'twitter', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'twitter' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				Private.publish( 'confirmed', { service: 'twitter' } );
			
			} else {

				Private.unsession( 'twitter' );

			}

		} else if( 'twitter' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'twitter' } );
			Private.twitter.handle_confirm( data );

		} else if( 'twitter' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'twitter' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Linkedin */

	Private.linkedin.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			private.publish( 'unsession', { service: 'linkedin' } );
			private.unsession( 'linkedin' );
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'linkedin' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.login_url ) {

			Private.storage.session.set( 'linkedin_oauth_request_token', data.request_token );
			Private.storage.session.set( 'linkedin_oauth_request_token_secret', data.request_token_secret );
			Private.publish( 'session_redirect', { service: 'linkedin', 'url': data.login_url } );
			Private.publish( 'redirect', { service: 'linkedin', 'url': data.login_url } );
			window.location = data.login_url;

		} else if( 'linkedin' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {

				Private.publish( 'confirmed', { service: 'linkedin' } );

			} else {

				Private.unsession( 'linkedin' );

			}

		} else if( 'linkedin' === data.service && 'account' === data.response_type && 'authorized' === data.account_status && 'undefined' === typeof data.connect_status ) {

			Private.publish( 'confirm', { service: 'linkedin' } );
			Private.linkedin.handle_confirm( data );

		} else if( 'linkedin' === data.service && 'account' === data.response_type && 'unauthorized' === data.account_status ) {

			Private.unsession( 'linkedin' );
			Private.state.replaceCurrent( '/', 'home' );

		}

	};


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
		return Private.store.setItem( Private.prefix + set_key, set_value );
	};
		
	Private.storage.local.delete = function( key ) {
		return Private.store.removeItem( Private.prefix + key );
	};
		
	Private.storage.local.get = function( get_key ) {
		return JSON.parse( Private.store.getItem( Private.prefix + get_key ) );
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
	Private.session = sessionStorage;

	Private.storage.session.set = function( set_key, set_value ) {
		return Private.session.setItem( Private.prefix + set_key, set_value );
	};
		
	Private.storage.session.delete = function( key ) {
		return Private.session.removeItem( Private.prefix + key );
	};
		
	Private.storage.session.get = function( get_key ) {
		return Private.session.getItem( Private.prefix + get_key );
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
	Private.utilities.get_url_vars = function() {
		var vars = {};
		var parts = window.location.href.replace( /[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		} );
		return vars;
	};

	return Public;

}() );
