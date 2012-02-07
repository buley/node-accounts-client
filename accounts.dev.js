var Accounts = ( function() { 

	var Private = {};
	Private.sockets = [];
	Private.socket = {};
	Private.connected = false;

	Private.google = Private.google || {};
	Private.twitter = Private.twitter || {};
	Private.facebook = Private.facebook || {};
	Private.foursquare = Private.foursquare || {};
	Private.tumblr = Private.tumblr || {};

	var Public = function( socket ) {
		
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

	Public.prototype.connected = function() {
		return ( Private.connected ) ? true : false;
	};

	Public.prototype.disconnected = function() {
		return ! this.connected();
	};

	Public.prototype.token = function( type ) {
		return Private.getAccessToken( type );
	};

	Public.prototype.secret = function( type ) {
		return Private.getAccessTokenSecret( type );
	};

	Public.prototype.profile = function( type ) {
		return Private.getProfile( type );
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
		return Private.login_statuses();
	};

	Public.prototype.login = function( type ) {
		return Private.do_login( type );
	};

	Public.prototype.logout = function( type ) {
		return Private.do_logout( type );
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

		if( 'twitter' == response.service && 'account' == response.response_type ) {
			Private.twitter.account_request( response );
		}

		if( 'facebook' == response.service && 'account' == response.response_type ) {
			Private.facebook.account_request( response );
		}

		if( 'google' == response.service && 'account' == response.response_type ) {
			Private.google.account_request( response );
		}

		if( 'foursquare' == response.service && 'account' == response.response_type ) {
			Private.foursquare.account_request( response );
		}

		if( 'tumblr' == response.service && 'account' == response.response_type ) {
			Private.tumblr.account_request( response );
		}

	};

	Public.prototype.authenticate = function( type ) {
		Private.do_login( type );
	};
	
	Public.prototype.deauthenticate = function( type ) {
		Private.do_logout( type );
	};
	
	Public.prototype.get = function( request ) {

	};
	
	Private.debug = false;

	Private.update = function() {
		//get old
		var old = {};
		//get new
		var current = {};
		var attr1, attr2;
		//for each old
		for( attr1 in old ) {
			if( old.hasOwnProperty( attr1 ) ) {
				//for each current
				for( attr2 in current ) {
					if( current.hasOwnProperty( attr2 ) ) {
						//if new !== old, trigger change()
						if(  current[ attr2 ] !== old[ attr1 ] ) {
							Private.change( attr, current );
						}
					}
				}
			}
		}

	};

	Private.change = function( name, state ) {
		//
	};


	Private.connect = function( service, oauth_type ) {
		
		var request = { 'command': 'connect' };
		if( 1 == oauth_type ) {
			request.access_token = Private.storage.session.get( service + '_access_token' );
			request.access_token_secret = Private.storage.session.get( service + '_access_token_secret' );
		} else if ( 2 == oauth_type ) {
			request.access_token = Private.storage.session.get( service + '_access_token' );
			request.refresh_token = Private.storage.session.get( service + '_refresh_token' );	
		}
		if( 'undefined' !== typeof request.access_token && null !== request.access_token ) {
			request.service = service;
		} else {
			return;
		}

		console.log('Connecting to ' + service + '...', request );
		Private.socket.emit( 'account', request );

	};	

	Private.getAccessToken = function( type ) {
		var access_token = null;
		switch( type ) {
			case 'facebook': 
				access_token = Private.storage.session.get( 'facebook_access_token' );
				break;
			case 'twitter': 
				access_token = Private.storage.session.get( 'twitter_access_token' );
				break;
			case 'facebook': 
				access_token = Private.storage.session.get( 'foursquare_access_token' );
				break;
			case 'facebook': 
				access_token = Private.storage.session.get( 'google_access_token' );
				break;
			case 'tumblr': 
				access_token = Private.storage.session.get( 'tumblr_access_token' );
				break;
			default: 
				break;
		};
		return access_token;
	};

	Private.setAccessToken = function( type, token ) {
		if( 'undefined' === typeof type || 'undefined' === typeof token
			|| null === type || null === token ) {
			return false;
		}
		return Private.storage.session.set( type + '_access_token', token );
	};

	Private.getAccessTokenSecret = function( type ) {
		var access_token_secret = null;
		switch( type ) {
			case 'facebook': 
				access_token_secret = Private.storage.session.get( 'facebook_access_token_secret' );
				break;
			case 'twitter': 
				access_token_secret = Private.storage.session.get( 'twitter_access_token_secret' );
				break;
			case 'facebook': 
				access_token_secret = Private.storage.session.get( 'foursquare_access_token_secret' );
				break;
			case 'facebook': 
				access_token_secret = Private.storage.session.get( 'google_access_token_secret' );
				break;
			case 'tumblr': 
				access_token_secret = Private.storage.session.get( 'tumblr_access_token_secret' );
				break;
			default: 
				break;
		};
		return access_token_secret;
	};

	Private.setAccessTokenSecret = function( type, secret ) {
		if( 'undefined' === typeof type || 'undefined' === typeof secret
			|| null === type || null === secret ) {
			return false;
		}
		Private.storage.session.set( type + '_access_token_secret', secret );
	};

	Private.getProfile = function ( type ) {
		if( 'undefined' === typeof type || null === type ) {
			return false;
		}
		return Private.storage.local.get( type + '_profile' );
	};
	
	Private.setProfile = function ( type, data ) {
		if( 'undefined' === typeof type || 'undefined' === typeof data
			|| null === type || null === data ) {
			return false;
		}
		return Private.storage.local.set( type + '_profile', data );
	};
	
	Private.do_logout = function ( type ) {
		var obj =  { 'request_type': 'account', 'command': 'logout', 'service': type };
		obj[ 'access_token' ] = Private.getAccessToken( type );
		Private.socket.emit( 'account', obj );
	}

	Private.do_login = function ( type ) {
		console.log("DOING LOGIN", type );
		Private.socket.emit( 'account', { 'request_type': 'account', 'command': 'login', 'service': type } );
	}

	Private.do_confirm = function ( type, params ) {
		console.log("DOING CONFIRM", type, params );
		params.request_type = 'account';
		params.command = 'confirm';
		params.service = type;
		Private.socket.emit( 'account', params );
	}

	Private.facebook = Private.facebook || {};
	Private.facebook.connect = function() {
		Private.connect( 'facebook', 2 );	
	};

	Private.facebook.handle_confirm = function( params, on_success, on_error ) {

		var success = function( params ) {
			
			if( 'function' == typeof on_success ) {
				on_success( params );
			}

		};

		var error = function( params ) {
			
			if( 'function' == typeof on_error ) {
				on_error( params );
			}

		};

		console.log('Private.facebook.handle_confirm()', params );

		if( !!params.profile_data ) {
			var data =  params.profile_data || {};
			data.service = 'facebook';
			console.log( 'putting facebook', data );
			Private.setProfile( 'facebook', data );
		}	

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			console.log('access token', access_token );
			Private.storage.session.set( 'facebook_access_token', access_token );
			Private.storage.session.set( 'facebook_access_token_secret', access_token_secret );
		}
	};

	Private.foursquare = Private.foursquare || {};
	Private.foursquare.connect = function() {
		Private.connect( 'foursquare', 2 );	
	};


	Private.foursquare.handle_confirm = function( params, on_success, on_error ) {

		var success = function( params ) {
			
			if( 'function' == typeof on_success ) {
				on_success( params );
			}

		};

		var error = function( params ) {
			
			if( 'function' == typeof on_error ) {
				on_error( params );
			}
		};

		console.log('Private.foursquare.handle_confirm() foursquare', params );


		if( params.profile_data ) {
			var data =  params.profile_data || {};
			data.service = 'foursquare';	
			console.log('putting foursquare', data );
			Private.setProfile( 'foursquare', data );
		}

		var access_token = params.access_token;
		if( !!access_token ) {
			console.log('access token', access_token );

			Private.storage.session.set( 'foursquare_access_token', access_token );
		}
	};

	/* Tumblr */

	Private.tumblr = Private.tumblr || {};
	Private.tumblr.connect = function() {
		Private.connect( 'tumblr', 1 );	
	};

	Private.tumblr.handle_confirm = function( params, on_success, on_error ) {
		var success = function( params ) {
			
			if( 'function' == typeof on_success ) {
				on_success( params );
			}

		};

		var error = function( params ) {		
			if( 'function' == typeof on_error ) {
				on_error( params );
			}
		};

		console.log('Private.tumblr.handle_confirm()', params );
		if( !!params.profile_data ) {
			var data =  params.profile_data || {};
			data.service = 'tumblr';

			console.log('putting tumblr', data );
			Private.setProfile( 'tumblr', data );
		}

		var refresh_token = params.refresh_token;
		var refresh_token_secret = params.refresh_token_secret;
		if( !!refresh_token ) {
			console.log('refresh and secret tokens', refresh_token, refresh_token_secret );
			Private.storage.session.set( 'tumblr_refresh_token', refresh_token );
			Private.storage.session.set( 'tumblr_refresh_token_secret', refresh_token_secret );

			//Private.tumblr.connect();

		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			console.log('access and secret tokens', access_token, access_token_secret );
			Private.storage.session.set( 'tumblr_access_token', access_token );
			Private.storage.session.set( 'tumblr_access_token_secret', access_token_secret );

			//Private.tumblr.connect();

		}
	};

	Private.twitter = Private.twitter || {};
	Private.twitter.connect = function() {
		Private.connect( 'twitter', 1 );	
	};

	Private.twitter.handle_confirm = function( params, on_success, on_error ) {

		var success = function( params ) {
			
			if( 'function' == typeof on_success ) {
				on_success( params );
			}

		};

		var error = function( params ) {		
			if( 'function' == typeof on_error ) {
				on_error( params );
			}
		};

		console.log('Private.twitter.handle_confirm()', params );
		if( !!params.profile_data ) {
			var data =  params.profile_data || {};
			data.service = 'twitter';

			console.log('putting twitter', data );
			Private.setProfile( 'twitter', data );
		}

		var access_token = params.access_token;
		var access_token_secret = params.access_token_secret;
		if( !!access_token ) {
			console.log('access and secret tokens', access_token, access_token_secret );

			Private.storage.session.set( 'twitter_access_token', access_token );
			Private.storage.session.set( 'twitter_access_token_secret', access_token_secret );

			//Private.twitter.connect();

		}
	};

	Private.confirm = function() {

		var url_vars = Private.utilities.get_url_vars();
		var facebook_code = Private.storage.session.get( 'facebook_code' );
		if( 'undefined' !== typeof facebook_code && null !== facebook_code ) {
			console.log('FACEBOOK',facebook_code);
			Private.do_confirm( 'facebook', { 'code': facebook_code } );
			Private.storage.session.delete( 'facebook_code' );
		}	
		var twitter_token = Private.storage.session.get( 'twitter_oauth_request_token' );
		var twitter_verifier = Private.storage.session.get( 'twitter_oauth_request_verifier' );
		if( 'undefined' !== typeof twitter_token && null !== twitter_token && 'undefined' !== typeof twitter_verifier && null !== twitter_verifier ) {
			console.log('TWITTER',twitter_token,twitter_verifier);
			Private.do_confirm( 'twitter', { 'oauth_token': twitter_token, 'oauth_verifier': twitter_verifier } );
			Private.storage.session.delete( 'twitter_oauth_request_token' );
			Private.storage.session.delete( 'twitter_oauth_request_verifier' );
		}
		var foursquare_code = Private.storage.session.get( 'foursquare_code' );
		if( 'undefined' !== typeof foursquare_code && null !== foursquare_code  ) {
			console.log('FOURSQUARE',foursquare_code);
			Private.do_confirm( 'foursquare', { 'code': foursquare_code } );
			Private.storage.session.delete( 'foursquare_code' );
		}	
		var google_code = Private.storage.session.get( 'google_code' );
		if( 'undefined' !== typeof google_code && null !== google_code ) {
			Private.do_confirm( 'google', { 'code': google_code } );
			console.log('GOOGLE',google_code);
			Private.storage.session.delete( 'google_code' );
		}	
		var tumblr_token = Private.storage.session.get( 'tumblr_oauth_request_token' );
		var tumblr_token_secret = Private.storage.session.get( 'tumblr_oauth_request_token_secret' );
		var tumblr_verifier = Private.storage.session.get( 'tumblr_oauth_request_verifier' );
		if( 'undefined' !== typeof tumblr_token && null !== tumblr_token && 'undefined' !== typeof tumblr_verifier && null !== tumblr_verifier ) {
			console.log('TUMBLR',tumblr_token,tumblr_verifier);
			Private.do_confirm( 'tumblr', { 'oauth_token': tumblr_token, 'oauth_token_secret': tumblr_token_secret, 'oauth_verifier': tumblr_verifier } );
			Private.storage.session.delete( 'tumblr_oauth_request_token' );
			Private.storage.session.delete( 'tumblr_oauth_request_token_secret' );
			Private.storage.session.delete( 'tumblr_oauth_request_verifier' );
		}
	};


	Private.detect_login = function() {

		var url_vars = Private.utilities.get_url_vars();
		
		if( 'undefined' !== typeof url_vars.code && 'facebook' === url_vars.service ) {
			Private.storage.session.set( 'facebook_code', url_vars.code );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.oauth_token && 'undefined' !== typeof url_vars.oauth_verifier ) {
			if( 'tumblr' === url_vars.service ) {
				Private.storage.session.set( 'tumblr_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'tumblr_oauth_request_verifier', url_vars.oauth_verifier );
				Private.state.replaceCurrent( '/', 'home' );
		 
			} else {
				Private.storage.session.set( 'twitter_oauth_request_token', url_vars.oauth_token );
				Private.storage.session.set( 'twitter_oauth_request_verifier', url_vars.oauth_verifier );
				Private.state.replaceCurrent( '/', 'home' );
			}
		}
		
		if( 'undefined' !== typeof url_vars.logout && 'undefined' !== typeof url_vars.service ) {
			if( 'facebook' == url_vars.service ) {
				Private.facebook.account_request( url_vars );
			}	
		}
		
		if( 'undefined' !== typeof url_vars.code && 'foursquare' === url_vars.service ) {
			Private.storage.session.set( 'foursquare_code', url_vars.code );
			Private.state.replaceCurrent( '/', 'home' );
		}	
		
		if( 'undefined' !== typeof url_vars.code && 'google' === url_vars.service ) {
			Private.storage.session.set( 'google_code', url_vars.code );
			Private.state.replaceCurrent( '/', 'home' );
		}

	};

	Private.login_statuses = function() {

		var services = {
			'facebook': 'facebook_access_token'
			, 'twitter': 'twitter_access_token'
			, 'google': 'google_access_token'
			, 'foursquare': 'foursquare_access_token'
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

		return statuses;

	}

	Private.connected = function( on_or_off ) {
		var frag = jQuery( '#connectivity_status' );
		if( true === on_or_off && frag.hasClass( 'black_circle_icon' ) ) {
			frag.removeClass( 'black_circle_icon' ).addClass( 'white_circle_icon' );
		} else if( false === on_or_off && frag.hasClass( 'white_circle_icon' ) ) {
			frag.removeClass( 'white_circle_icon' ).addClass( 'black_circle_icon' );
		}
	}

	/* Facebook */
	Private.facebook.account_request = function( data ) {
		if( !!Private.debug ) {
			console.log('Private.facebook.account_request()', data );
		}
		if( 'undefined' !== typeof data.logout_url || 'undefined' !== typeof data.logout ) {
			if( null == data.logout_url ) {
				console.log( 'logged out of ' + data.service );
				//toggle status indicator
				//delete session storage
				Private.storage.session.delete( 'facebook_access_token' );
				Private.update();
				Private.state.replaceCurrent( '/', 'home' );
			} else {
				console.log('need to redirect');
				window.location = data.logout_url;
			}
		} else if( 'facebook' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.login_url ) {
			//
			console.log('hadling facebook login');
			window.location = data.login_url;
		} else if( 'facebook' == data.service && 'account' == data.response_type && 'authorized' == data.account_status && 'undefined' == typeof data.connect_status ) {

			var on_success = function() {
				Private.update();
			}
		
			var on_error = function() {
				Private.update();
			}
				
			Private.facebook.handle_confirm( data, on_success, on_error );	

		} else if( 'facebook' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.connect_status ) {	
			if( 'connected' == data.connect_status ) {
				console.log('Confirmed Facebook');	
			} else {
				console.log('Failed to confirm Facebook');
				Private.storage.session.delete( 'facebook_access_token' );
				Private.storage.session.delete( 'facebook_refresh_token' );
				Private.update();	
			}
		} else if( 'facebook' == data.service && 'account' == data.response_type && 'unauthorized' == data.account_status ) {

			console.log('error confirming account', data );
			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Foursquare */

	Private.foursquare.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			if( !!Private.debug ) {
				console.log( 'logged out of ' + data.service );
			}
			//toggle status indicator
			//delete session storage
			Private.storage.session.delete( 'foursquare_access_token' );
			Private.update();
			Private.state.replaceCurrent( '/', 'home' );
		} else if( 'foursquare' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.login_url ) {
			//
			if( !!Private.debug ) {
				console.log('hadling foursquare login');
			}
			window.location = data.login_url;

		} else if( 'foursquare' == data.service && 'account' == data.response_type && 'authorized' == data.account_status && 'undefined' == typeof data.connect_status ) {

			var on_success = function() {
				Private.update();	
			}
			
			var on_error = function() {
				Private.update();
			}
		
			Private.foursquare.handle_confirm( data, on_success, on_error );	

		} else if( 'foursquare' == data.service && 'account' == data.response_type  && 'undefined' !== typeof data.connect_status ) {
			if( 'connected' === data.connect_status ) {
				if( !!Private.debug ) {
					console.log('Confirmed Foursquare');	
				}
			} else {
				Private.storage.session.delete( 'foursquare_access_token' );
				Private.storage.session.delete( 'foursquare_refresh_token' );
				Private.update();	
				console.log('Failed to confirm Foursquare');
			}

		} else if( 'foursquare' == data.service && 'account' == data.response_type && 'unauthorized' == data.account_status ) {

			if( !!Private.debug ) {
				console.log('error confirming account', data );
			}

			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Google */

	Private.google = Private.google || {};

	Private.google.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {

			if( !!Private.debug ) {
				console.log( 'logged out of ' + data.service );
			}

			//toggle status indicator
			//delete session storage
			Private.storage.session.delete( 'google_access_token' );
			Private.storage.session.delete( 'google_refresh_token' );

			Private.update();
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'google' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.login_url ) {

			//
			if( !!Private.debug ) {
				console.log('hadling google login');
			}
			window.location = data.login_url;

		} else if( 'google' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.connect_status ) {
			
			if( 'connected' === data.connect_status ) {

				if( !!Private.debug ) {
					console.log('Confirmed Google');	

				}

			} else {

				Private.storage.session.delete( 'google_access_token' );
				Private.update();	

				if( !!Private.debug ) {
					console.log('Failed to confirm Google');
				}

			}
		
		} else if( 'google' == data.service && 'account' == data.response_type && 'authorized' == data.account_status && 'undefined' == typeof data.connect_status ) {

			var on_success = function() {
				Private.update();	
			}
		
			var on_error = function() {
				Private.update();
			}	

			Private.google.handle_confirm( data, on_success, on_error );	

		} else if( 'google' == data.service && 'account' == data.response_type && 'unauthorized' == data.account_status ) {

			if( !!Private.debug ) {
				console.log('error confirming account', data );
			}

			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	Private.google.handle_confirm = function( params, on_success, on_error ) {

		var success = function( params ) {
			
			if( 'function' == typeof on_success ) {
				on_success( params );
			}

		};

		var error = function( params ) {
			
			if( 'function' == typeof on_error ) {
				on_error( params );
			}
		};

		console.log('Private.google.handle_confirm() google ', params );

		if( params.profile_data ) {
			var data = params.profile_data || {};
			data.service = 'google';
			cponsole.log('putting google',data);
			Private.setProfile( 'google', data );
		}

		var access_token = params.access_token;
		if( !!access_token ) {
			console.log('access token', access_token );
			Private.storage.session.set( 'google_access_token', access_token );
		}
	};

	Private.google.connect = function() {
		Private.connect( 'google', 2 );	
	};

	/* Tumblr */

	Private.tumblr.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			if( !!Private.debug ) {
				console.log( 'logged out of ' + data.service );
			}
			//toggle status indicator
			//delete session storage
			Private.storage.session.delete( 'tumblr_access_token' );
			Private.storage.session.delete( 'tumblr_access_token_secret' );

			Private.update();
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'tumblr' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.login_url ) {

			if( !!Private.debug ) {
			//
				console.log('hadling tumblr login', data.login_url);
			}
			
			window.location = data.login_url;

		} else if( 'tumblr' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				if( !!Private.debug ) {
					console.log('Confirmed Tumblr');	
				}

			} else {

				Private.storage.session.delete( 'tumblr_access_token' );
				Private.storage.session.delete( 'tumblr_access_token_secret' );
				Private.update();	
				
				if( !!Private.debug ) {
					console.log('Failed to confirm Tumblr');
				}

			}

		} else if( 'tumblr' == data.service && 'account' == data.response_type && 'authorized' == data.account_status && 'undefined' == typeof data.connect_status ) {

			var on_success = function() {
				Private.update();	
				//Private.tumblr.connect();
			}
			
			var on_error = function() {
				Private.update();
			}

			Private.tumblr.handle_confirm( data, on_success, on_error );	

		} else if( 'tumblr' == data.service && 'account' == data.response_type && 'unauthorized' == data.account_status ) {

			if( !!Private.debug ) {
				console.log('error confirming account', data );
			}

			Private.state.replaceCurrent( '/', 'home' );

		}

	}

	/* Twitter */

	Private.twitter.account_request = function( data ) {

		if( 'undefined' !== typeof data.logout_url ) {
			if( !!Private.debug ) {
				console.log( 'logged out of ' + data.service );
			}
			//toggle status indicator
			//delete session storage
			Private.storage.session.delete( 'twitter_access_token' );
			Private.storage.session.delete( 'twitter_access_token_secret' );

			Private.update();
			Private.state.replaceCurrent( '/', 'home' );

		} else if( 'twitter' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.login_url ) {

			window.location = data.login_url;

		} else if( 'twitter' == data.service && 'account' == data.response_type && 'undefined' !== typeof data.connect_status ) {

			if( 'connected' === data.connect_status ) {
			
				if( !!Private.debug ) {
					console.log('Confirmed Twitter');	
				}

			} else {

				Private.storage.session.delete( 'twitter_access_token' );
				Private.storage.session.delete( 'twitter_access_token_secret' );

				Private.update();	
				
				if( !!Private.debug ) {
					console.log('Failed to confirm Twitter');
				}

			}

		} else if( 'twitter' == data.service && 'account' == data.response_type && 'authorized' == data.account_status && 'undefined' == typeof data.connect_status ) {

			var on_success = function() {
				Private.update();	
				//Private.twitter.connect();
			}
			
			var on_error = function() {
				Private.update();
			}

			Private.twitter.handle_confirm( data, on_success, on_error );	

		} else if( 'twitter' == data.service && 'account' == data.response_type && 'unauthorized' == data.account_status ) {

			if( !!Private.debug ) {
				console.log('error confirming account', data );
			}

			Private.state.replaceCurrent( '/', 'home' );

		}

	}


	/* History */

	Private.state = Private.state || {};
	Private.history = window.history;

	Private.state.replaceCurrent = function( stateUrl, stateTitle, stateObj ) {

		if( null == stateObj || 'undefined' == typeof stateObj ) {
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

		if( null == stateObj || 'undefined' == typeof stateObj ) {
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
		return Private.store.setItem( '_acc_' + set_key, set_value );
	};
		
	Private.storage.local.delete = function( key ) {
		return Private.store.removeItem( '_acc_' + key );
	};
		
	Private.storage.local.get = function( get_key ) {
		return JSON.parse( Private.store.getItem( '_acc_' + get_key ) );
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
		return Private.session.setItem( '_acc_' + set_key, set_value );
	};
		
	Private.storage.session.delete = function( key ) {
		return Private.session.removeItem( '_acc_' + key );
	};
		
	Private.storage.session.get = function( get_key ) {
		return Private.session.getItem( '_acc_' + get_key );
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
