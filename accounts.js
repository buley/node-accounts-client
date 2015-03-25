define([], function() {

    /* API is a singleton-patterned private object */

    var API = {},
        subscribers = {},
        z = 0,
        zlen;

    API.connected = false;
    API.attributes = ['birthdate', 'description', 'email', 'id', 'image', 'locale', 'location', 'name', 'profile_url', 'username', 'personal_url', 'stats'];
    API.prefix = 'accounts';
    API.allServices = ['facebook', 'google', 'linkedin', 'twitter', 'windows', 'foursquare', 'yahoo', 'github', 'tumblr', 'instagram', 'wordpress', 'vimeo', 'youtube', 'blogger', 'evernote', 'reddit', 'soundcloud'];
    API.debug = false;
    API.unhelpfulErrorMessage = 'Something went awry.';
    API.activeServices = [];
    zlen = API.allServices.length;

    for (z = 0; z < zlen; z += 1) {
        API[API.allServices[z]] = {};
    }

    API.api = {};

    API.api.request = function (req) {
        var url = [API.base, API.prefix, req.action, req.service].join('/'),
            callback = function (err, data) {
                if (null === err) {
                    API.publish(data.request.action, data.response);
                }
                if ('function' === typeof req.callback) {
                    req.callback.apply(this, arguments);
                } else if (null === err && 'function' === typeof req.success) {
                    req.success.apply(this, [data]);
                } else if (null !== err && 'function' === typeof req.error) {
                    req.error.apply(this, [err]);
                }
            };
        if ('confirm' === req.action) {
            this.post(url, {
                code: req.code /* other */
                ,
                oauth_token: req.oauth_token,
                oauth_verifier: req.oauth_verifier,
                oauth_token_secret: req.oauth_token_secret
            }, callback, {});
        } else if ('login' === req.action) {
            this.put(url, {
                request_token: req.request_token /* oAuth 1 & 2 */
                ,
                request_token_secret: req.request_token_secret /* oAuth 1 & 2 */
            }, callback, {});
        } else if ('logout' === req.action) {
            this['delete'](url, {
                access_token: req.access_token
            }, callback, {});
        } else if ('proxy' === req.action) {
            this.post(url, {
                access_token: req.access_token,
                access_token_secret: req.access_token_secret,
                url: req.url,
                method: req.method,
                body: req.body,
                type: req.type
            }, callback, {});
        } else {
            this.get(url, {
                access_token: req.access_token,
                refresh_token: req.refresh_token
            }, callback, {});
        }
    };

    API.api.get = function (url, data, callback, headers) {
        headers = headers || {};
        var that = this;
        API.api.ajax({
            type: 'GET',
            url: url,
            headers: headers,
            data: data,
            success: function (request) {
                var error = null,
                    response = request.response;
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    error = e;
                } finally {
                    callback.apply(that, [error, response]);
                }
            },
            error: function (request) {
                callback.apply(that, [new Error(API.unhelpfulErrorMessage), null]);
            }
        });
    };

    API.api.put = function (url, data, callback, headers) {
        headers = headers || {};
        var that = this;
        API.api.ajax({
            type: 'PUT',
            url: url,
            data: data,
            headers: headers,
            success: function (request) {
                var error = null,
                    response = request.response;
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    error = e;
                } finally {
                    callback.apply(that, [error, response]);
                }
            },
            error: function (request) {
                callback.apply(that, [new Error(API.unhelpfulErrorMessage), null]);
            }
        });
    };

    API.api.post = function (url, data, callback, headers) {
        headers = headers || {};
        var that = this;
        API.api.ajax({
            type: 'POST',
            url: url,
            data: data,
            headers: headers,
            success: function (request) {
                var error = null,
                    response = request.response;
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    error = e;
                } finally {
                    callback.apply(that, [error, response]);
                }
            },
            error: function (request) {
                callback.apply(that, [new Error(API.unhelpfulErrorMessage), null]);
            }
        });
    };

    API.api['delete'] = function (url, data, callback, headers) {
        headers = headers || {};
        var that = this;
        API.api.ajax({
            type: 'DELETE',
            url: url,
            data: data,
            headers: headers,
            success: function (request) {
                var error = null,
                    response = request.response;
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    error = e;
                } finally {
                    callback.apply(that, [error, response]);
                }
            },
            error: function (request) {
                callback.apply(that, [new Error(API.unhelpfulErrorMessage), null]);
            }
        });
    };


    API.api.ajax = function (req) {
        var request, type = (type || '').toUpperCase(),
            that = this;
        if ('undefined' !== typeof window.XMLHttpRequest) {
            request = new XMLHttpRequest();
        } else {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        }
        request.onreadystatechange = function () {
            if (4 === request.readyState) {
                if (200 === request.status) {
                    if ('function' === typeof req.success) {
                        req.success.apply(that, [request]);
                    }
                } else {
                    if ('function' === typeof req.success) {
                        req.error.apply(that, [request]);
                    }
                }
            }
        };
        if ('string' !== typeof req.data) {
            req.data = JSON.stringify(req.data);
        }
        request.open(req.type, req.url, true);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(req.data);
    };

    API.getActiveServices = function () {
        return API.activeServices.slice(0);
    };

    API.setActiveServices = function (services) {
        return API.activeServices = services;
    };

    API.addActiveService = function (service) {
        if ('string' !== typeof service) {
            return false;
        }
        var services = API.activeServices,
            already = false,
            x = 0,
            len = services.length;
        for (x = 0; x < len; x += 1) {
            if (service === services[x]) {
                return false;
            }
        }
        API.activeServices.push(service);
        return true;
    };

    API.removeActiveService = function (service) {
        if ('string' !== typeof service) {
            return false;
        }
        var arr = [],
            changed = false,
            x = 0,
            len = services.length,
            serv;
        for (x = 0; x < len; x += 1) {
            serv = services[x];
            if (service === serv) {
                changed = true;
            } else {
                arr.push(serv);
            }
        }
        return changed;
    };

    var Public = function (config) {
            var services = config.services,
                redirect = config.redirect,
                base = config.base;
            if ('undefined' !== typeof services && null !== services) {
                API.setActiveServices(services);
            } else {
                Public.prototype.enable();
            }
            if ('undefined' !== typeof redirect) {
                API.redirectTo = redirect;
            } else {
                API.redirectTo = document.location.pathname;
            }
            if ('undefined' !== typeof base) {
                API.base = base;
            } else {
                API.base = null;
            }
            API.detectLogin(this.redirect);
            API.confirm();
        };

    Public.prototype.display = function (slug) {
        var result = slug;
        switch (slug) {
        case 'facebook':
            result = 'Facebook';
            break;
        case 'twitter':
            result = 'Twitter';
            break;
        case 'github':
            result = 'Github';
            break;
        case 'google':
            result = 'Google+';
            break;
        case 'tumblr':
            result = 'Tumblr';
            break;
        case 'yahoo':
            result = 'Yahoo';
            break;
        case 'foursquare':
            result = 'Foursquare';
            break;
        case 'linkedin':
            result = 'Linkedin';
            break;
        case 'windows':
            result = 'Windows Live';
            break;
        case 'evernote':
            result = 'Evernote';
            break;
        case 'instagram':
            result = 'Instagram';
            break;
        case 'vimeo':
            result = 'Vimeo';
            break;
        case 'blogger':
            result = 'Blogger';
            break;
        case 'wordpress':
            result = 'WordPress';
            break;
        case 'reddit':
            result = 'Reddit';
            break;
        case 'youtube':
            result = 'YouTube';
            break;
        case 'soundcloud':
            result = 'SoundCloud';
            break;
        default:
            break;
        };
        return result;
    };

    Public.prototype.enable = function (service) {
        API.publish('enable', service);
        if ('undefined' === typeof service || null === service) {
            return API.setActiveServices(API.allServices);
        } else {
            return API.addActiveService(service);
        }
    };

    Public.prototype.enabled = function (service) {
        if ('undefined' === typeof service || null === service) {
            return API.getActiveServices();
        }
        var services = API.activeServices,
            x = 0,
            len = services.length;
        for (x = 0; x < len; x += 1) {
            if (service === services[x]) {
                return true;
            }
        }
        return false;
    };

    Public.prototype.disabled = function (service) {
        if ('undefined' === typeof service || null === service) {
            var services = API.getActiveServices(),
                all_services = API.getActiveServices(),
                x = 0,
                z = 0,
                len = services.length,
                a_len = all_services.length,
                results = [],
                disabled = true;
            for (x = 0; x < a_len; x += 1) {
                disabled = true;
                for (y = 0; y < len; y += 1) {
                    if (services[z] === all_services[x]) {
                        disabled = false;
                    }
                }
                if (true === disabled) {
                    results.push(all_services[x]);
                }
            }
            return results;
        }
        return !Public.prototype.enabled(service);
    };

    Public.prototype.disable = function (service) {
        API.publish('disable', service);
        if ('undefined' !== typeof service || null === service) {
            return API.setActiveServices([]);
        } else {
            return API.removeActiveService(service);
        }
    };


    Public.prototype.connected = function () {
        return (API.connected) ? true : false;
    };

    Public.prototype.disconnected = function () {
        return !this.connected();
    };

    Public.prototype.authenticated = function (type) {
        return API.authenticated(type);
    };

    Public.prototype.token = function (type) {
        return API.getAccessToken(type);
    };

    Public.prototype.tokens = function () {
        return API.getAccessTokens();
    };

    Public.prototype.ids = function () {
        return API.getProfileIds();
    };

    Public.prototype.id = function (type) {
        return API.getId(type);
    };

    Public.prototype.secret = function (type) {
        return API.getAccessTokenSecret(type);
    };

    Public.prototype.secrets = function () {
        return API.getAccessTokenSecrets();
    };

    Public.prototype.profile = function (type) {
        return API.getProfile(type);
    };

    Public.prototype.map = function () {
        return API.getAllProfileAttributesMap.apply(this, arguments);
    };

    Public.prototype.services = function () {
        return API.allServices;
    };

    Public.prototype.pick = function (attr, value) {
        var pieces = attr.split('.');
        if ('undefined' !== typeof pieces[1]) {
            API.picked[pieces[0]] = API.picked[pieces[0]] || {};
            API.picked[pieces[0]][pieces[1]] = value;
        } else {
            API.picked[pieces[0]] = value;
            if ('profile_url' === attr) {
                var map = this.map(true),
                    x = 0,
                    xitems = map['username'],
                    xlen = xitems.length,
                    xitem;
                for (; x < xlen; x += 1) {
                    xitem = xitems[x];
                    if (xitem.service === value.service) {
                        API.picked['username'] = xitem;
                    }
                }
            } else if ('username' === attr) {
                var map = this.map(true),
                    x = 0,
                    xitems = map['profile_url'],
                    xlen = xitems.length,
                    xitem;
                for (; x < xlen; x += 1) {
                    xitem = xitems[x];
                    if (xitem.service === value.service) {
                        API.picked['profile_url'] = xitem;
                    }
                }
            }
        }
        API.storage.local.set('profile_picks', API.picked);
        return API.picked;
    };

    Public.prototype.chosen = function () {
        return API.getAllProfileAttributesChosen();
    };

    Public.prototype.common = function (service) {
        return API.getAllProfileAttributesCommon(service);
    };

    Public.prototype.options = function () {
        return API.getAllProfileAttributes();
    };

    Public.prototype.profiles = function () {
        return API.getProfiles();
    };

    Public.prototype.status = function () {
        var statuses = API.login_statuses();
        return statuses;
    };

    Public.prototype.login = function (service) {
        return Public.prototype.session(service);
    };

    Public.prototype.proxy = function (req) {
        return API.proxy(req.service, req.url, req.callback, req.method, req.body, req.type);
    };

    Public.prototype.session = function (service) {
        API.publish('session', {
            service: service
        });
        if (Public.prototype.enabled(service)) {
            API.publish('sessioning', {
                service: service
            });
            return API.do_login(service);
        } else {
            return false;
        }
    };

    Public.prototype.logout = function (service) {
        return Public.prototype.unsession(service);
    };

    Public.prototype.unsession = function (service) {
        API.publish('unsession', {
            service: service
        });
        if (Public.prototype.enabled(service)) {
            API.publish('unsessioning', {
                service: service
            });
            return API.do_logout(service);
        } else {
            return false;
        }
    };

    Public.prototype.subscribe = function (event_name, callback, id) {
        if ('undefined' === typeof event_name || null === event_name || 'function' !== typeof callback) {
            return false;
        }
        API.publish('subscribe', {
            event: event_name,
            callback: callback,
            id: id
        });
        if (null === id || 'undefined' === typeof id) {
            var text = "",
                set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                x, id_len = 5;
            for (x = 0; x < id_len; x++) {
                text += set.charAt(Math.floor(Math.random() * set.length));
            }
        }
        if ('undefined' === typeof subscribers[event_name]) {
            subscribers[event_name] = {};
        }
        subscribers[event_name][id] = callback;
        API.publish('subscribed', {
            event: event_name,
            callback: callback,
            id: id
        });
        return id;
    };

    Public.prototype.unsubscribe = function (event_name, id) {
        API.publish('unsubscribe', {
            event: event_name,
            id: id
        });
        if ('undefined' === typeof event_name || null === event_name) {
            return false;
        }
        var subs = subscribers[event_name];
        if ('undefined' === typeof subs || null === subs) {
            return false;
        }
        if ('undefined' !== typeof subs[id]) {
            delete subscribers[event_name][id];
            API.publish('unsubscribed', {
                event: event_name,
                id: id
            });
            return id;
        } else {
            return false;
        }
    };

    API.publish = function (event_name, value) {
        var subs = subscribers[event_name],
            attr, callback;
        if ('undefined' === typeof event_name || null === event_name) {
            return false;
        }
        if ('undefined' === typeof subs || null === subs) {
            return false;
        }
        if ('login' === event_name || 'confirm' === event_name) {
            API[value.service].account_request(value);
        }
        for (id in subs) {
            callback = subs[id];
            if ('function' === typeof callback && true === subs.hasOwnProperty(id)) {
                callback({
                    event: event_name,
                    data: value
                });
            };
        }
    };

    API.connect = function (service, oauth_type) {
        if (Public.prototype.disabled(service)) {
            return false;
        }
        var request = {
            'action': 'connect'
        };
        if (1 === oauth_type) {
            request.access_token = API.storage.session.get(service + '_access_token');
            request.access_token_secret = API.storage.session.get(service + '_access_token_secret');
        } else if (2 === oauth_type) {
            request.access_token = API.storage.session.get(service + '_access_token');
            request.refresh_token = API.storage.session.get(service + '_refresh_token');
        }
        if ('undefined' !== typeof request.access_token && null !== request.access_token) {
            request.service = service;
        } else {
            return;
        }

        API.publish('connect', {
            service: service,
            oauth_type: oauth_type
        });

        API.api.request(request);

    };

    API.getId = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileIds()[type];
    };
    API.getStats = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileStats()[type];
    };
    API.getUrl = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileURLs()[type];
    };
    API.getPersonalUrl = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfilePersonalURLs()[type];
    };


    API.getImage = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileImages()[type];
    };
    API.getUsername = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileUsernames()[type];
    };
    API.getIds = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileIds()[type];
    };
    API.getBirthdate = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileBirthdates()[type];
    };
    API.getDescription = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileDescriptions()[type];
    };
    API.getEmail = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileEmails()[type];
    };
    API.getGender = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileGenders()[type];
    };
    API.getLocale = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileLocales()[type];
    };
    API.getLocation = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileLocations()[type];
    };
    API.getName = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileNames()[type];
    };
    API.getUrls = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileUrls()[type];
    };
    API.getUsernames = function () {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        return API.getProfileUsernames()[type];
    };

    API.getProfileAttributeByService = function (service, attr) {
        var val;
        switch (attr) {
        case 'id':
            val = API.getId(service);
            break;
        case 'username':
            val = API.getUsername(service);
            break;
        case 'profile_url':
            val = API.getUrl(service);
            break;
        case 'personal_url':
            val = API.getPersonalUrl(service);
            break;
        case 'name':
            val = API.getName(service);
            break;
        case 'location':
            val = API.getLocation(service);
            break;
        case 'stats':
            val = API.getStats(service);
            break;
        case 'locale':
            val = API.getLocale(service);
            break;
        case 'image':
            val = API.getImage(service);
            break;
        case 'gender':
            val = API.getGenders(service);
            break;
        case 'email':
            val = API.getEmail(service);
            break;
        case 'description':
            val = API.getDescription(service);
            break;
        case 'birthdate':
            val = API.getBirthdate(service);
            break;
        default:
            break;
        }
        return val;
    };

    API.getAllProfileAttributes = function () {
        var attrs = ['birthdate', 'description', 'email', 'id', 'image', 'locale', 'location', 'name', 'profile_url', 'username', 'personal_url', 'stats'],
            attrlen = attrs.length,
            attr, x = 0,
            result = {};
        for (; x < attrlen; x += 1) {
            attr = attrs[x];
            result[attr] = API.getAllByProfileAttribute(attr);
        }
        return result;
    };

    API.getAllProfileAttributesPickDefaults = function () {
        var map = API.getAllProfileAttributesMap(),
            attr = null,
            item = null,
            result = {};
        var determine = function (stack) {
                var sorted = stack.sort(function (el1, el2) {
                    var idx1, idx2, x = 0,
                        xlen = API.allServices.length,
                        xitem;
                    for (; x < xlen; x += 1) {
                        xitem = API.allServices[x];
                        if (el1.service === xitem) {
                            el1 = x;
                        }
                        if (el2.service === xitem) {
                            el2 = x;
                        }
                    }
                    return (el1 > el2) ? 1 : (el1 === el2) ? 0 : -1;
                });
                return stack[0];
            };
        var process = function (item, at) {
                var a = 0,
                    alen = item.length,
                    aitem = null,
                    cache = {};
                for (; a < alen; a += 1) {
                    aitem = item[a];
                    if ('undefined' === typeof cache[aitem.value]) {
                        cache[aitem.value] = 1;
                    } else {
                        cache[aitem.value] += 1;
                    }
                }
                var highest = -(Infinity),
                    lowest = Infinity,
                    att, val, hslug, lslug;
                for (att in cache) {
                    if (cache.hasOwnProperty(att)) {
                        val = cache[att];
                        if (val < lowest) {
                            lslug = att;
                            lowest = val;
                        }
                        if (val > highest) {
                            hslug = att;
                            highest = val;
                        }
                    }
                }
                var candidates = [];
                for (att in cache) {
                    if (cache.hasOwnProperty(att)) {
                        val = cache[att];
                        if (val === highest) {
                            for (att2 in item) {
                                if (item.hasOwnProperty(att2)) {
                                    val2 = item[att2];
                                    if (val2.value === att) {
                                        candidates.push(val2);
                                    }
                                }
                            }
                        }
                    }
                }
                return candidates;
            };
        var processMulti = function (item, at) {
                var a = 0,
                    alen = item.length,
                    aitem = null,
                    cache = {};
                for (; a < alen; a += 1) {
                    aitem = item[a];
                    var bitem, battr, aval = aitem.value;
                    for (battr in aval) {
                        if (true === aval.hasOwnProperty(battr)) {
                            bitem = aval[battr] || '';
                            if ('' === bitem || null === bitem || 'undefined' === typeof bitem) {
                                continue;
                            }
                            cache[battr] = cache[battr] || {};
                            if ('undefined' === typeof cache[battr][bitem]) {
                                cache[battr][bitem] = 1;
                            }
                            cache[battr][bitem]++;
                        }
                    }
                }
                var hmap = {};
                for (battr in cache) {
                    if (true === cache.hasOwnProperty(battr)) {
                        var lowest = Infinity,
                            highest = -(Infinity),
                            hslug, lslug, items = cache[battr];
                        for (bitem in items) {
                            if (items.hasOwnProperty(bitem)) {
                                var z = cache[battr][bitem];
                                if ('undefined' !== typeof z) {
                                    if (z < lowest && null !== bitem && "" !== bitem) {
                                        lowest = z;
                                        lslug = bitem;
                                    }
                                    if (z > highest && null !== bitem && "" !== bitem) {
                                        highest = z;
                                        hmap[battr] = z;
                                        hslug = bitem;
                                    }
                                }
                            }
                        }
                    }
                }
                var results = {},
                    candidates = [];
                for (a = 0; a < alen; a += 1) {
                    aitem = item[a];
                    var bitem, battr, aval = aitem.value;
                    for (battr in aval) {
                        if (true === aval.hasOwnProperty(battr) && 'undefined' !== typeof cache[battr]) {
                            var z = cache[battr][aitem.value[battr]];
                            candidates[battr] = candidates[battr] || [];
                            if ('undefined' !== typeof z && z === hmap[battr]) {
                                candidates[battr].push({
                                    service: aitem.service,
                                    value: aitem.value[battr]
                                });
                            }
                            if (0 === candidates[battr].length) {
                                delete candidates[battr];
                            }
                        }
                    }
                }
                for (a = 0; a < alen; a += 1) {
                    aitem = item[a];
                    var bitem, battr, aval = aitem.value;
                    for (battr in aval) {
                        if (true === aval.hasOwnProperty(battr)) {
                            if ('undefined' === typeof candidates[battr] || null === candidates[battr]) {
                                results[battr] = [];
                            } else {
                                results[battr] = determine(candidates[battr]);
                            }
                            if (0 === results[battr].length) {
                                results[battr] = null;
                            }
                        }
                    }
                }
                return results;
            }

        for (attr in map) {
            if (map.hasOwnProperty(attr)) {
                if ('id' === attr) {
                    result['ids'] = map[attr];
                } else if ('stats' === attr) {
                    result['stats'] = map[attr];
                } else if ('name' === attr) {
                    result[attr] = processMulti(map[attr], attr);
                } else if ('birthdate' === attr) {
                    result[attr] = processMulti(map[attr], attr);
                } else {
                    result[attr] = determine(process(map[attr], attr));
                }
            }
        }
        return result;
    };

    API.getAllProfileAttributesCommon = function (service) {
        var x = 0,
            xlen = API.attributes.length,
            xitem, result = {};
        for (; x < xlen; x += 1) {
            xitem = API.attributes[x];
            if ('name' === xitem || 'birthdate' === xitem) {
                var attr2, value = API.getProfileAttributeByService(service, xitem),
                    next = {};
                for (attr2 in value) {
                    if (true === value.hasOwnProperty(attr2)) {
                        next[attr2] = {
                            service: service,
                            value: value[attr2]
                        };
                    }
                }
                result[xitem] = next;
            } else {
                result[xitem] = {
                    service: service,
                    value: API.getProfileAttributeByService(service, xitem)
                };
            }
        }
        result['authenticated'] = API.authenticated(service);
        return result;
    };

    API.getAllProfileAttributesChosen = function () {
        var defaults = API.getAllProfileAttributesPickDefaults(),
            picked = API.picked || {},
            attr, copy = defaults;
        for (attr in defaults) {
            if (true === defaults.hasOwnProperty(attr)) {
                if ('name' === attr || 'birthdate' === attr) {
                    var attr2;
                    for (attr2 in copy[attr]) {
                        if (true === copy[attr].hasOwnProperty(attr2) && 'undefined' !== typeof picked[attr] && 'undefined' !== typeof picked[attr][attr2]) {
                            copy[attr][attr2] = picked[attr][attr2];
                        }
                    }
                } else {
                    if ('undefined' !== typeof picked[attr]) {
                        copy[attr] = picked[attr];
                    }
                }
            }
        }
        return copy;
    };

    API.getAllProfileAttributesMap = function (pretty) {
        var attrs = API.attributes,
            attrlen = attrs.length,
            attr, x = 0,
            result = {};
        for (; x < attrlen; x += 1) {
            attr = attrs[x];
            result[attr] = API.getAllByProfileAttributeMap(attr, pretty);
        }
        return result;
    };


    API.getAllByProfileAttribute = function (attr) {
        var services = API.getUnifiedProfiles(),
            attr, profile, id, val, result = [];
        for (service in services) {
            profile = services[service];
            if (profile !== null) {
                val = API.getProfileAttributeByService(service, attr);
                if (null !== val) {
                    result.push(val)
                }
            }
        };
        result.push({
            service: null,
            value: null
        });
        return result;
    };


    API.getAllByProfileAttributeMap = function (attr, pretty) {
        var services = API.getUnifiedProfiles(),
            attr, profile, id, val, result = [];

        for (service_slug in services) {
            (function (service) {
                profile = services[service];
                if (profile !== null) {
                    val = API.getProfileAttributeByService(service, attr);
                    if (null !== val) {
                        result.push({
                            service: service,
                            value: val
                        })
                    }
                }
            })(service_slug);
        };
        if (true === pretty && ('name' === attr || 'birthdate' === attr)) {
            var xformed = {
                'name': {},
                'birthdate': {}
            };
            var x = 0,
                xlen = result.length,
                xitem, xval;
            for (; x < xlen; x += 1) {
                xitem = result[x];
                xval = xitem.value;
                for (att in xval) {
                    if (xval.hasOwnProperty(att)) {
                        xformed[attr] = xformed[attr] || {}
                        xformed[attr][att] = xformed[attr][att] || [];
                        xformed[attr][att].push({
                            service: xitem.service,
                            value: xval[att]
                        });
                    }
                }
            }
            result = xformed[attr];
        }
        return result;
    };


    API.authenticated = function (type) {
        var token = Public.prototype.token(type);
        return (null === token || 'undefined' === typeof token) ? false : true;
    };

    API.getAccessTokens = function () {
        var services = API.getActiveServices();
        var x = 0,
            xlen = services.length,
            service, tokens = {};
        for (x = 0; x < xlen; x += 1) {
            service = services[x];
            tokens[service] = API.getAccessToken(service);
        }
        return tokens;
    };


    API.getAccessToken = function (type) {
        if (Public.prototype.disabled(type)) {
            return null;
        }
        var access_token = null;
        switch (type) {
        case 'facebook':
            access_token = API.storage.local.get('facebook_access_token');
            break;
        case 'twitter':
            access_token = API.storage.local.get('twitter_access_token');
            break;
        case 'foursquare':
            access_token = API.storage.local.get('foursquare_access_token');
            break;
        case 'google':
            access_token = API.storage.local.get('google_access_token');
            break;
        case 'windows':
            access_token = API.storage.local.get('windows_access_token');
            break;
        case 'tumblr':
            access_token = API.storage.local.get('tumblr_access_token');
            break;
        case 'wordpress':
            access_token = API.storage.local.get('wordpress_access_token');
            break;
        case 'instagram':
            access_token = API.storage.local.get('instagram_access_token');
            break;
        case 'vimeo':
            access_token = API.storage.local.get('vimeo_access_token');
            break;
        case 'github':
            access_token = API.storage.local.get('github_access_token');
            break;
        case 'yahoo':
            access_token = API.storage.local.get('yahoo_access_token');
            break;
        case 'linkedin':
            access_token = API.storage.local.get('linkedin_access_token');
            break;
        case 'reddit':
            access_token = API.storage.local.get('reddit_access_token');
            break;
        case 'youtube':
            access_token = API.storage.local.get('youtube_access_token');
            break;
        case 'blogger':
            access_token = API.storage.local.get('blogger_access_token');
            break;
        case 'evernote':
            access_token = API.storage.local.get('evernote_access_token');
            break;
        case 'soundcloud':
            access_token = API.storage.local.get('soundcloud_access_token');
            break;
        default:
            break;
        };
        return access_token;
    };

    API.setAccessToken = function (type, token) {
        if (Public.prototype.disabled(type)) {
            return false;
        }
        if ('undefined' === typeof type || 'undefined' === typeof token || null === type || null === token) {
            return false;
        }
        return API.storage.local.set(type + '_access_token', token);
    };

    API.getAccessTokenSecrets = function () {
        var services = API.getActiveServices();
        var x = 0,
            xlen = services.length,
            service, secrets = {};
        for (x = 0; x < xlen; x += 1) {
            service = services[x];
            secrets[service] = API.getAccessTokenSecret(service);
        }
        return secrets;
    };

    API.getAccessTokenSecret = function (type) {
        if (Public.prototype.disabled(type)) {
            return false;
        }
        var access_token_secret = null;
        switch (type) {
        case 'facebook':
            access_token_secret = API.storage.local.get('facebook_access_token_secret');
            break;
        case 'twitter':
            access_token_secret = API.storage.local.get('twitter_access_token_secret');
            break;
        case 'foursquare':
            access_token_secret = API.storage.local.get('foursquare_access_token_secret');
            break;
        case 'google':
            access_token_secret = API.storage.local.get('google_access_token_secret');
            break;
        case 'tumblr':
            access_token_secret = API.storage.local.get('tumblr_access_token_secret');
            break;
        case 'windows':
            access_token_secret = API.storage.local.get('windows_access_token_secret');
            break;
        case 'github':
            access_token_secret = API.storage.local.get('github_access_token_secret');
            break;
        case 'linkedin':
            access_token_secret = API.storage.local.get('linkedin_access_token_secret');
            break;
        case 'yahoo':
            access_token_secret = API.storage.local.get('yahoo_access_token_secret');
            break;
        case 'wordpress':
            access_token_secret = API.storage.local.get('wordpress_access_token_secret');
            break;
        case 'instagram':
            access_token_secret = API.storage.local.get('instagram_access_token_secret');
            break;
        case 'vimeo':
            access_token_secret = API.storage.local.get('vimeo_access_token_secret');
            break;
        case 'reddit':
            access_token_secret = API.storage.local.get('reddit_access_token_secret');
            break;
        case 'youtube':
            access_token_secret = API.storage.local.get('youtube_access_token_secret');
            break;
        case 'blogger':
            access_token_secret = API.storage.local.get('blogger_access_token_secret');
            break;
        case 'soundcloud':
            access_token_secret = API.storage.local.get('soundcloud_access_token_secret');
            break;
        case 'evernote':
            access_token_secret = API.storage.local.get('evernote_access_token_secret');
            break;
        default:
            break;
        };
        return access_token_secret;
    };

    API.setAccessTokenSecret = function (type, secret) {
        if (Public.prototype.disabled(type)) {
            return false;
        }
        if ('undefined' === typeof type || 'undefined' === typeof secret || null === type || null === secret) {
            return false;
        }
        API.storage.local.set(type + '_access_token_secret', secret);
    };

    API.getProfiles = function () {
        return API.getUnifiedProfiles();
    };

    API.getProfile = function (type) {
        if (!Public.prototype.enabled(type)) {
            return false;
        }
        if ('undefined' === typeof type || null === type) {
            return API.getUnifiedProfile();
        }
        return API.storage.local.get(type + '_profile');
    };

    API.setProfile = function (type, data) {
        if (Public.prototype.disabled(type)) {
            return false;
        }
        if ('undefined' === typeof type || 'undefined' === typeof data || null === type || null === data) {
            return false;
        }
        return API.storage.local.set(type + '_profile', data);
    };


    API.getProfileIds = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, id, profiles = {};
        for (service in services) {
            profile = services[service];
            if (profile !== null) {
                id = null;
                switch (service) {
                case 'facebook':
                    id = parseInt(profile.id, 10);
                    break;
                case 'foursquare':
                    id = parseInt(profile.id, 10);
                    break;
                case 'github':
                    id = profile.id;
                    break;
                case 'google':
                    id = parseInt(profile.id, 10);
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
                    id = parseInt(profile.id_str, 10);
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
                case 'soundcloud':
                    id = profile.id;
                default:
                    break;
                };
                profiles[service] = ('undefined' !== typeof id && '' !== id) ? id : null;
            } else {
                profiles[service] = null;
            }
        };
        return profiles;
    };


    API.getProfileNames = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, names = {},
            profiles = {};
        for (service in services) {
            profile = services[service];
            names = {
                display: null,
                first: null,
                last: null
            };
            if (null !== profile) {
                switch (service) {
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
                case 'soundcloud':
                    names.display = profile.full_name;
                default:
                    names = null;
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof names && '' !== names) ? names : null;
        };
        return profiles;
    };


    API.getProfileGenders = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, gender, profiles = {};
        for (service in services) {
            profile = services[service];
            gender = null;
            if (null !== profile) {
                switch (service) {
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
                    if ("M" === profile.gender) {
                        gender = "male";
                    } else if ("F" === profile.gender) {
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
                case 'soundcloud':
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof gender && '' !== gender) ? gender : null;
        };
        return profiles;
    };

    API.getProfileBirthdates = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, birthdate = {},
            profiles = {};
        for (service in services) {
            profile = services[service];
            birthdate = {
                day: null,
                month: null,
                year: null
            };
            if (null !== profile) {
                switch (service) {
                case 'facebook':
                    if ('undefined' !== typeof profile.birthday && null !== profile.birthday) {
                        birthdate.day = new Date(profile.birthday).getDate();
                        birthdate.month = new Date(profile.birthday).getMonth() + 1;
                        birthdate.year = new Date(profile.birthday).getFullYear();
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
                    if (null !== profile.birth_day || null !== profile.birth_month || null !== profile.birth_year) {
                        birthdate.day = profile.birth_day;
                        birthdate.month = profile.birth_month;
                        birthdate.year = profile.birth_year;
                    } else {
                        birthdate = null;
                    }
                    break;
                case 'yahoo':
                    if ('undefined' !== typeof profile.birthYear && null !== profile.birthYear) {
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
                case 'soundcloud':
                    birthdate = null;
                    break;
                default:
                    birthdate = null;
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof birthdate && '' !== birthdate) ? birthdate : null;
        };
        return profiles;
    };

    API.getProfileImages = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile = {},
            image, profiles = {};
        for (service in services) {
            profile = services[service];
            image = null;
            if (null !== profile) {
                switch (service) {
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
                    image = profile.portraits.portrait[profile.portraits.portrait.length - 1]._content;
                    break;
                case 'youtube':
                    image = profile.snippet.thumbnails.high.url;
                    break;
                case 'blogger':
                    break;
                case 'reddit':
                    break;
                case 'soundcloud':
                    image = profile.avatar_url;
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof image && '' !== image) ? image : null;
        };
        return profiles;
    };

    API.getProfilePersonalURLs = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, other = [],
            personal_url, profiles = {};
        for (service in services) {
            profile = services[service];
            personal_url = null;
            if (null !== profile) {
                switch (service) {
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
                    personal_url = profile.url[0]
                    break;
                case 'youtube':
                    break;
                case 'blogger':
                    break;
                case 'reddit':
                    break;
                case 'soundcloud':
                    personal_url = profile.website;
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof personal_url && '' !== personal_url) ? personal_url : null;
        };
        return profiles;
    };

    API.getProfileStats = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, other = [],
            stats, profiles = {};
        for (service in services) {
            profile = services[service];
            stats = null;
            if (null !== profile) {
                switch (service) {
                case 'facebook':
                    stats = {
                        updated: profile.updated_time,
                        created: null
                    };
                    break;
                case 'foursquare':
                    stats = {
                        todos: profile.todos.count,
                        tips: profile.tips.count,
                        mayorships: profile.mayorships.count,
                        checkins: profile.checkins.count,
                        badges: profile.badges.count,
                        friends: profile.friends.count,
                        following: profile.following.count,
                        incoming: profile.following.count + profile.friends.count,
                        outgoing: profile.friends.count,
                        created: profile.createdAt,
                        updated: null
                    };
                    break;
                case 'github':
                    stats = {
                        followers: profile.followers,
                        following: profile.following,
                        public_gists: profile.public_gists,
                        public_repos: profile.public_repos,
                        created: profile.created_at,
                        updated: profile.updated_at
                    };
                    break;
                case 'google':
                    break;
                case 'linkedin':
                    stats = {
                        connections: profile.numConnections,
                        created: null,
                        updated: null
                    };
                    break;
                case 'tumblr':
                    var a = 0,
                        alen = profile.blogs.length,
                        blog, posts_count = 0,
                        followers_count = 0,
                        messages_count = 0;
                    for (; a < alen; a += 1) {
                        blog = profile.blogs[a];
                        posts_count += blog.posts;
                        followers_count += blog.followers;
                        messages_count += blog.messages;
                    }
                    stats = {
                        following: profile.following,
                        likes: profile.likes,
                        posts: posts_count,
                        followers: followers_count,
                        messages: messages_count,
                        created: null,
                        updated: null
                    };
                    break;
                case 'twitter':
                    stats = {
                        created: profile.created_at,
                        updated: null,
                        statuses_count: profile.statuses_count,
                        listed_count: profile.listed_count,
                        friends_count: profile.friends_count,
                        followers_count: profile.followers_count,
                        favorites_count: profile.favorites_count
                    };
                    break;
                case 'yahoo':
                    stats = {
                        created: profile.memberSince,
                        updated: profile.updated
                    };
                    break;
                case 'windows':
                    break;
                case 'instagram':
                    stats = {
                        followed_by: profile.counts.followed_by,
                        follows: profile.counts.follows,
                        media: profile.counts.media,
                        created: null,
                        updated: null
                    };
                    break;
                case 'wordpress':
                    break;
                case 'vimeo':
                    stats = {
                        created: profile.created_on,
                        updated: null,
                        number_of_albums: profile.number_of_albums,
                        number_of_channels: profile.number_of_channels,
                        number_of_contacts: profile.number_of_contacts,
                        number_of_groups: profile.number_of_groups,
                        number_of_likes: profile.number_of_likes,
                        number_of_uploads: profile.number_of_uploads,
                        number_of_videos: profile.number_of_videos,
                        number_of_videos_appears_in: profile.number_of_videos_appears_in
                    };
                    break;
                case 'youtube':
                    stats = {
                        comment_count: profile.statistics.commentCount,
                        subscriber_count: profile.statistics.subscriberCount,
                        video_count: profile.statistics.videoCount,
                        view_count: profile.statistics.viewCount,
                        created: profile.snippet.publishedAt,
                        updated: null
                    };
                    break;
                case 'blogger':
                    break;
                case 'reddit':
                    stats = {
                        comment_karma: profile.comment_karma,
                        link_karma: profile.link_karma,
                        created: profile.created,
                        updated: null
                    };
                    break;
                case 'soundcloud':
                    stats = {
                        followers_count: profile.followers_count,
                        followings_count: profile.followings_count,
                        subscriptions: profile.subscriptions,
                        public_favorites_count: profile.public_favorites_count,
                        track_count: profile.track_count,
                        playlist_count: profile.playlist_count,
                        private_tracks_count: profile.private_tracks_count,
                        private_playlists_count: profile.private_playlists_count
                    };
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof stats && '' !== stats) ? stats : null;
        };
        return profiles;
    };



    API.getProfileURLs = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, other = [],
            profile_url, profiles = {};
        for (service in services) {
            profile = services[service];
            profile_url = null;
            if (null !== profile) {

                switch (service) {
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
                case 'soundcloud':
                    profile_url = "http://soundcloud.com/" + profile.username
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof profile_url && '' !== profile_url) ? profile_url : null;
        };
        return profiles;
    };

    API.getProfileEmails = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, email, profiles = {};
        for (service in services) {
            profile = services[service];
            email = null;
            if (null !== profile) {
                switch (service) {
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
                case 'soundcloud':
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof email && '' !== email) ? email : null;
        };
        return profiles;
    };


    API.getProfileUsernames = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, username, profiles = {};
        for (service in services) {
            profile = services[service];
            username = null;
            if (null !== profile) {
                switch (service) {
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
                case 'soundcloud':
                    username = profile.username;
                    break;
                default:
                    break;
                };

            }
            profiles[service] = ('undefined' !== typeof username && '' !== username) ? username : null;
        };
        return profiles;
    };

    API.getProfileDescriptions = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, description, profiles = {};
        for (service in services) {
            profile = services[service];
            description = null;
            if (null !== profile) {
                switch (service) {
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
                case 'soundcloud':
                    description = profile.description;
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof description && '' !== description) ? description : null;
        };
        return profiles;
    };

    API.getProfileLocations = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, location, profiles = {};
        for (service in services) {
            profile = services[service];
            location = null;
            if (null !== profile) {
                switch (service) {
                case 'facebook':
                    location = ('undefined' !== typeof profile.location && null !== profile.location && 'undefined' !== typeof profile.location.name) ? profile.location.name : null;
                    break;
                case 'foursquare':
                    location = profile.homeCity;
                    break;
                case 'github':
                    location = profile.location;
                    break;
                case 'google':
                    if ('undefined' !== typeof profile.placesLived) {
                        var a = 0,
                            alen = profile.placesLived.length,
                            aitem;
                        for (; a < alen; a += 1) {
                            aitem = profile.placesLived[a];
                            if (true === aitem.primary) {
                                location = aitem.value;
                            }
                        }
                    }
                    break;
                case 'linkedin':
                    location = ('undefined' === typeof profile.location) ? null : profile.location.name;
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
                case 'soundcloud':
                    location = profile.city || profile.country;
                    break;
                default:
                    break;
                };
            }
            profiles[service] = ('undefined' !== typeof location && '' !== location) ? location : null;
        };
        return profiles;
    };


    API.getProfileLocales = function () {
        var services = API.getUnifiedProfiles(),
            attr, profile, locale, profiles = {};
        for (service in services) {
            profile = services[service];
            locale = null;
            if (null !== profile) {
                switch (service) {
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
            profiles[service] = ('undefined' !== typeof locale && '' !== locale) ? locale : null;
        };
        return profiles;
    };


    API.unifyOptionsAttributes = function (options) {

        var services = API.getActiveServices(),
            value = null,
            consensus = false,
            attr, val, vals = {},
            max_vals = {},
            maxes = {},
            max_service = null,
            attr3, x = 0,
            xlen = services.length,
            service;

        for (attr in options) {
            for (attr2 in options[attr]) {
                if ('undefined' === typeof vals[attr2]) {
                    vals[attr2] = {};
                }
                val = options[attr][attr2];
                if (null !== val) {
                    vals[attr2][val] = ('undefined' === typeof vals[val]) ? 1 : (vals[val] + 1);
                    if ('undefined' === typeof maxes[attr2] || (vals[attr2][val] > maxes[attr2])) {
                        maxes[attr2] = vals[attr2][val];
                    }
                }
            }
        }

        for (attr3 in maxes) {
            if (maxes[attr3] > 1) {
                consensus = true;
            }
        }

        if (true === consensus) {
            for (attr in vals) {
                if (maxes[attr] === max[attr]) {
                    max_vals[attr2] = max[attr];
                }
            }
        } else {
            for (attr in maxes) {
                for (x = 0; x < xlen; x += 1) {
                    service = services[x];
                    if (null !== options[service] && 'undefined' !== typeof options[service][attr] && null !== options[service][attr] && ('undefined' === typeof max_vals[attr] || null === max_vals[attr])) {
                        max_vals[attr] = options[service][attr];
                    }
                }
            }
        }
        return max_vals;
    };

    API.unifyOptions = function (options) {
        var services = API.getActiveServices(),
            value = null,
            consensus = false,
            attr, val, vals = {},
            max = 0,
            max_service = null,
            x = 0,
            xlen = services.length,
            service, profiles = {};
        for (attr in options) {
            val = options[attr];
            vals[val] = ('undefined' === typeof vals[val]) ? 1 : (vals[val] + 1);
            if (vals[val] > max) {
                max = vals[val];
                max_service = attr;
            }
        }
        if (max > 1) {
            consensus = true;
        }
        if (true === consensus) {
            for (x = 0; x < xlen; x += 1) {
                service = services[x];
                if (null !== options[service] && 'undefined' !== typeof options[service] && service === max_service) {
                    return options[service];
                }
            }
        }
        for (x = 0; x < xlen; x += 1) {
            service = services[x];
            if (null !== options[service] && 'undefined' !== typeof options[service]) {
                return options[service];
            }
        }
        return null;
    };

    API.removeNulls = function (options) {
        var opts = {},
            attr;
        for (attr in options) {
            if ('undefined' !== typeof options[attr] && null !== options[attr]) {
                opts[attr] = options[attr];
            }
        }
        return opts;
    };

    API.getUnifiedProfile = function () {
        return {
            'ids': API.removeNulls(API.getProfileIds()),
            'profiles': API.removeNulls(API.getProfileURLs()),
            'username': API.unifyOptions(API.getProfileUsernames()),
            'email': API.unifyOptions(API.getProfileEmails()),
            'name': API.unifyOptionsAttributes(API.getProfileNames()),
            'birthdate': API.unifyOptionsAttributes(API.getProfileBirthdates()),
            'gender': API.unifyOptions(API.getProfileGenders()),
            'image': API.unifyOptions(API.getProfileImages()),
            'location': API.unifyOptions(API.getProfileLocations()),
            'locale': API.unifyOptions(API.getProfileLocales()),
            'description': API.unifyOptions(API.getProfileDescriptions()),
            'url': API.unifyOptions(API.getProfilePersonalURLs())
        };
    };

    API.getUnifiedOptions = function () {
        return {
            'ids': API.getProfileIds(),
            'profiles': API.getProfileURLs(),
            'username': API.getProfileUsernames(),
            'email': API.getProfileEmails(),
            'name': API.getProfileNames(),
            'birthdate': API.getProfileBirthdates(),
            'gender': API.getProfileGenders(),
            'image': API.getProfileImages(),
            'location': API.getProfileLocations(),
            'locale': API.getProfileLocales(),
            'description': API.getProfileDescriptions(),
            'url': API.getProfilePersonalURLs()
        };
    };



    API.getUnifiedProfiles = function () {

        var services = API.getActiveServices(),
            x = 0,
            xlen = services.length,
            service, profiles = {};

        for (x = 0; x < xlen; x += 1) {
            service = services[x];
            profiles[service] = API.getProfile(service);
        }

        return profiles;

    };

    API.do_logout = function (type) {
        return API.unsession(type);
    };

    API.unsession = function (type) {

        if (Public.prototype.disabled(type)) {
            return false;
        }

        var obj = {
            'action': 'logout',
            'service': type
        };
        obj['access_token'] = API.getAccessToken(type);

        if (null !== obj.access_token && 'undefined' !== typeof obj.access_token) {
            API.api.request(obj);
        }

        API.storage.local['delete'](type + '_access_token');
        API.storage.local['delete'](type + '_profile');

    };

    API.do_login = function (type) {
        return API.session(type);
    };

    API.session = function (type) {

        if (Public.prototype.disabled(type)) {
            return false;
        }

        API.api.request({
            'action': 'login',
            'service': type
        });

    };

    API.do_confirm = function (type, params) {

        if (Public.prototype.disabled(type)) {
            return false;
        }

        params.action = 'confirm';
        params.service = type;
        API.api.request(params);

    };

    API.proxy = function (type, url, callback, method, body, content_type) {

        var success = function (data) {
                if ('function' === typeof callback) {
                    callback.apply(this, [null, data]);
                }
            },
            error = function (error) {
                if ('function' === typeof callback) {
                    callback.apply(this, [error, null]);
                }
            };

        if (Public.prototype.disabled(type)) {
            return false;
        }

        var access_token = API.getAccessToken(type),
            access_token_secret = API.getAccessTokenSecret(type);

        API.api.request({
            'action': 'proxy',
            'service': type,
            'url': url,
            'method': method,
            'success': success,
            'error': error,
            'access_token': access_token,
            'access_token_secret': access_token_secret,
            'body': body,
            'type': content_type
        });

    };


    /* Instagram */

    API.instagram.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'instagram';
            API.publish('profile', {
                service: 'instagram',
                data: data
            });
            API.setProfile('instagram', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {

            API.storage.local.set('instagram_access_token', access_token);
            API.publish('sessioned', {
                service: 'instagram',
                oauth_token: access_token,
                profile: data
            });

        }

    };


    /* Facebook */

    API.facebook.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'facebook';
            API.publish('profile', {
                service: 'facebook',
                data: data
            });
            API.setProfile('facebook', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {

            API.storage.local.set('facebook_access_token', access_token);
            API.publish('sessioned', {
                service: 'facebook',
                oauth_token: access_token,
                profile: data
            });

        }

    };

    /* Foursquare */

    API.foursquare.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'foursquare';
            API.publish('profile', {
                service: 'foursquare',
                data: data
            });
            API.setProfile('foursquare', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('foursquare_access_token', access_token);
            API.publish('sessioned', {
                service: 'foursquare',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* SoundCloud */

    API.soundcloud.handle_confirm = function (params) {

        var data = null;
        console.log('confirming soundcloud', params);

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'soundcloud';
            API.publish('profile', {
                service: 'soundcloud',
                data: data
            });
            API.setProfile('soundcloud', data);
        }

        var access_token = params.access_token,
            refresh_token = params.refresh_token;

        if ( !! access_token) {
            API.storage.local.set('soundcloud_access_token', access_token);
            API.storage.local.set('soundcloud_refresh_token', refresh_token);
            API.publish('sessioned', {
                service: 'soundcloud',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* WordPress */

    API.wordpress.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'wordpress';
            API.publish('profile', {
                service: 'wordpress',
                data: data
            });
            API.setProfile('wordpress', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('wordpress_access_token', access_token);
            API.publish('sessioned', {
                service: 'wordpress',
                oauth_token: access_token,
                profile: data
            });
        }

    };


    /* Google */

    API.google.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'google';
            API.publish('profile', {
                service: 'google',
                data: data
            });
            API.setProfile('google', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('google_access_token', access_token);
            API.publish('sessioned', {
                service: 'google',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* YouTube */

    API.youtube.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'youtube';
            API.publish('profile', {
                service: 'youtube',
                data: data
            });
            API.setProfile('youtube', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('youtube_access_token', access_token);
            API.publish('sessioned', {
                service: 'youtube',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* Blogger */

    API.blogger.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'blogger';
            API.publish('profile', {
                service: 'blogger',
                data: data
            });
            API.setProfile('blogger', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('blogger_access_token', access_token);
            API.publish('sessioned', {
                service: 'blogger',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* Twitter */

    API.twitter.handle_confirm = function (params) {

        var data = null;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'twitter';
            API.publish('profile', {
                service: 'twitter',
                data: data
            });
            API.setProfile('twitter', data);

        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;

        if ( !! access_token) {

            API.storage.local.set('twitter_access_token', access_token);
            API.storage.local.set('twitter_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'twitter',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });

        }
    };


    /* Evernote */

    API.evernote.handle_confirm = function (params) {

        var data = null;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'evernote';
            API.publish('profile', {
                service: 'evernote',
                data: data
            });
            API.setProfile('evernote', data);

        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;

        if ( !! access_token) {

            API.storage.local.set('evernote_access_token', access_token);
            API.storage.local.set('evernote_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'evernote',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });

        }
    };

    /* Reddit */

    API.reddit.handle_confirm = function (params) {

        var data = null;

        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'reddit';
            API.publish('profile', {
                service: 'reddit',
                data: data
            });
            API.setProfile('reddit', data);
        }
        console.log('confirming reddit', params.access_token, params);
        var access_token = params.access_token;

        if ( !! access_token) {
            API.storage.local.set('reddit_access_token', access_token);
            API.publish('sessioned', {
                service: 'reddit',
                oauth_token: access_token,
                profile: data
            });
        }

    };

    /* Facebook */

    API.facebook.account_request = function (data) {
        if ('undefined' !== typeof data.logout_url || 'undefined' !== typeof data.logout) {
            if (null === data.logout_url) {
                API.publish('unsession', {
                    service: 'facebook'
                });
                API.unsession('facebook');
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'facebook'));
            } else {
                API.publish('unsession_redirect', {
                    service: 'facebook',
                    'url': data.logout_url
                });
                API.publish('redirect', {
                    service: 'facebook',
                    'url': data.logout_url
                });
                window.location = data.logout_url;
            }
        } else if ('facebook' === data.service && 'undefined' !== typeof data.login_url) {

            API.publish('session_redirect', {
                service: 'facebook',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'facebook',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('facebook' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'facebook'
            });
            API.facebook.handle_confirm(data);

        } else if ('facebook' === data.service && 'undefined' !== typeof data.connect_status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'facebook'
                });
            } else {
                API.unsession('facebook');
            }
        } else if ('facebook' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('facebook');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'facebook'));

        }

    }

    /* Foursquare */

    API.foursquare.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'foursquare'
            });
            API.unsession('foursquare');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'foursquare'));
        } else if ('foursquare' === data.service && 'undefined' !== typeof data.login_url) {

            API.publish('session_redirect', {
                service: 'foursquare',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'foursquare',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('foursquare' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'foursquare'
            });
            API.foursquare.handle_confirm(data);

        } else if ('foursquare' === data.service && 'account' === data.response_type && 'undefined' !== typeof data.connect_status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'foursquare'
                });
            } else {
                API.unsession('foursquare');
            }

        } else if ('foursquare' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('foursquare');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'foursquare'));

        }

    } /* Blogger */

    API.blogger.account_request = function (data) {
        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'blogger'
            });
            API.unsession('blogger');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'blogger'));
        } else if ('blogger' === data.service && 'undefined' !== typeof data.login_url) {
            API.publish('session_redirect', {
                service: 'blogger',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'blogger',
                'url': data.login_url
            });
            window.location = data.login_url;
        } else if ('blogger' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {
            API.publish('confirm', {
                service: 'blogger'
            });
            API.blogger.handle_confirm(data);
        } else if ('blogger' === data.service && 'authorized' === data.status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'blogger'
                });
            } else {
                API.unsession('blogger');
            }
        } else if ('blogger' === data.service && 'unauthorized' === data.account_status) {
            API.unsession('blogger');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'blogger'));
        }
    }

    /* YouTube */

    API.youtube.account_request = function (data) {
        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'youtube'
            });
            API.unsession('youtube');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'youtube'));
        } else if ('youtube' === data.service && 'undefined' !== typeof data.login_url) {
            API.publish('session_redirect', {
                service: 'youtube',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'youtube',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('youtube' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'youtube'
            });
            API.youtube.handle_confirm(data);

        } else if ('youtube' === data.service && 'authorized' === data.status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'youtube'
                });
            } else {
                API.unsession('youtube');
            }

        } else if ('youtube' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('youtube');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'youtube'));

        }

    }

    /* Google */

    API.google.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'google'
            });
            API.unsession('google');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'google'));
        } else if ('google' === data.service && 'undefined' !== typeof data.login_url) {

            API.publish('session_redirect', {
                service: 'google',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'google',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('google' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'google'
            });
            API.google.handle_confirm(data);

        } else if ('google' === data.service && 'authorized' === data.status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'google'
                });
            } else {
                API.unsession('google');
            }

        } else if ('google' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('google');
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'google'));

        }

    }

    /* Yahoo */

    API.yahoo.handle_confirm = function (params) {

        var data = null;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'yahoo';
            API.publish('profile', {
                service: 'yahoo',
                data: data
            });
            API.setProfile('yahoo', data);
        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;
        if ( !! access_token) {
            API.storage.local.set('yahoo_access_token', access_token);
            API.storage.local.set('yahoo_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'yahoo',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });
        }
    };

    /* Linkedin */

    API.linkedin.handle_confirm = function (params) {
        var data = null;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'linkedin';
            API.publish('profile', {
                service: 'linkedin',
                data: data
            });
            API.setProfile('linkedin', data);
        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;
        if ( !! access_token) {
            API.storage.local.set('linkedin_access_token', access_token);
            API.storage.local.set('linkedin_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'linkedin',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });
        }
    };

    /* Vimeo */

    API.vimeo.handle_confirm = function (params, on_success, on_error) {

        var data;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'vimeo';
            API.publish('profile', {
                service: 'vimeo',
                data: data
            });
            API.setProfile('vimeo', data);
        }
        console.log("CONFIRM VIMEO", params);
        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;
        if ( !! access_token) {
            API.storage.local.set('vimeo_access_token', access_token);
            API.storage.local.set('vimeo_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'vimeo',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });
        }

    };


    /* Tumblr */

    API.tumblr.handle_confirm = function (params, on_success, on_error) {

        var data;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'tumblr';
            API.publish('profile', {
                service: 'tumblr',
                data: data
            });
            API.setProfile('tumblr', data);
        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;
        if ( !! access_token) {
            API.storage.local.set('tumblr_access_token', access_token);
            API.storage.local.set('tumblr_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'tumblr',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });
        }

    };

    /* Windows Live */

    API.windows.handle_confirm = function (params) {

        if (params.profile) {
            var data = params.profile || {};
            data.service = 'windows';
            API.publish('profile', {
                service: 'windows',
                data: data
            });
            API.setProfile('windows', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.publish('sessioned', {
                service: 'windows',
                oauth_token: access_token,
                profile: data
            });
            API.storage.local.set('windows_access_token', access_token);
        }

    };


    /* Github */

    API.github.handle_confirm = function (params) {

        if (params.profile) {
            var data = params.profile || {};
            data.service = 'github';
            API.publish('profile', {
                service: 'github',
                data: data
            });
            API.setProfile('github', data);
        }

        var access_token = params.access_token;

        if ( !! access_token) {
            API.publish('sessioned', {
                service: 'github',
                oauth_token: access_token,
                profile: data
            });
            API.storage.local.set('github_access_token', access_token);
        }

    };

    /* Twitter */

    API.twitter.handle_confirm = function (params) {

        var data = null;
        if ( !! params.profile) {
            data = params.profile || {};
            data.service = 'twitter';
            API.publish('profile', {
                service: 'twitter',
                data: data
            });
            API.setProfile('twitter', data);
        }

        var access_token = params.access_token;
        var access_token_secret = params.access_token_secret;
        if ( !! access_token) {
            API.storage.local.set('twitter_access_token', access_token);
            API.storage.local.set('twitter_access_token_secret', access_token_secret);
            API.publish('sessioned', {
                service: 'twitter',
                oauth_token: access_token,
                oauth_secret: access_token_secret,
                profile: data
            });
            //API.twitter.connect();
        }
    };

    API.confirm = function () {

        var url_vars = API.utilities.getUrlVars();

        var facebook_code = API.storage.local.get('facebook_code');
        if ('undefined' !== typeof facebook_code && null !== facebook_code) {
            API.publish('verifying', {
                service: 'facebook',
                'code': facebook_code
            });
            API.do_confirm('facebook', {
                'code': facebook_code
            });
            API.storage.local['delete']('facebook_code');
        }

        var twitter_token = API.storage.local.get('twitter_oauth_request_token');
        var twitter_verifier = API.storage.local.get('twitter_oauth_request_verifier');
        if ('undefined' !== typeof twitter_token && null !== twitter_token && 'undefined' !== typeof twitter_verifier && null !== twitter_verifier) {
            API.publish('verifying', {
                service: 'twitter',
                'oauth_token': twitter_token,
                'oauth_verifier': twitter_verifier
            });
            API.do_confirm('twitter', {
                'oauth_token': twitter_token,
                'oauth_verifier': twitter_verifier
            });
            API.storage.local['delete']('twitter_oauth_request_token');
            API.storage.local['delete']('twitter_oauth_request_verifier');
        }

        var foursquare_code = API.storage.local.get('foursquare_code');
        if ('undefined' !== typeof foursquare_code && null !== foursquare_code) {
            API.publish('verifying', {
                service: 'foursquare',
                'code': foursquare_code
            });
            API.do_confirm('foursquare', {
                'code': foursquare_code
            });
            API.storage.local['delete']('foursquare_code');
        }

        var google_code = API.storage.local.get('google_code');
        if ('undefined' !== typeof google_code && null !== google_code) {
            API.publish('verifying', {
                service: 'google',
                'code': google_code
            });
            API.do_confirm('google', {
                'code': google_code
            });
            API.storage.local['delete']('google_code');
        }

        var blogger_code = API.storage.local.get('blogger_code');
        if ('undefined' !== typeof blogger_code && null !== blogger_code) {
            API.publish('verifying', {
                service: 'blogger',
                'code': blogger_code
            });
            API.do_confirm('blogger', {
                'code': blogger_code
            });
            API.storage.local['delete']('blogger_code');
        }

        var youtube_code = API.storage.local.get('youtube_code');
        if ('undefined' !== typeof youtube_code && null !== youtube_code) {
            API.publish('verifying', {
                service: 'youtube',
                'code': youtube_code
            });
            API.do_confirm('youtube', {
                'code': youtube_code
            });
            API.storage.local['delete']('youtube_code');
        }

        var windows_code = API.storage.local.get('windows_code');
        if ('undefined' !== typeof windows_code && null !== windows_code) {
            API.publish('verifying', {
                service: 'windows',
                'code': windows_code
            });
            API.do_confirm('windows', {
                'code': windows_code
            });
            API.storage.local['delete']('windows_code');
        }

        var github_code = API.storage.local.get('github_code');
        if ('undefined' !== typeof github_code && null !== github_code) {
            API.publish('verifying', {
                service: 'github',
                'code': github_code
            });
            API.do_confirm('github', {
                'code': github_code
            });
            API.storage.local['delete']('github_code');
        }

        var instagram_code = API.storage.local.get('instagram_code');
        if ('undefined' !== typeof instagram_code && null !== instagram_code) {
            API.publish('verifying', {
                service: 'instagram',
                'code': instagram_code
            });
            API.do_confirm('instagram', {
                'code': instagram_code
            });
            API.storage.local['delete']('instagram_code');
        }

        var soundcloud_code = API.storage.local.get('soundcloud_code');
        if ('undefined' !== typeof soundcloud_code && null !== soundcloud_code) {
            API.publish('verifying', {
                service: 'soundcloud',
                'code': github_code
            });
            API.do_confirm('soundcloud', {
                'code': soundcloud_code
            });
            API.storage.local['delete']('soundcloud_code');
        }

        var wordpress_code = API.storage.local.get('wordpress_code');
        if ('undefined' !== typeof wordpress_code && null !== wordpress_code) {
            API.publish('verifying', {
                service: 'wordpress',
                'code': github_code
            });
            API.do_confirm('wordpress', {
                'code': wordpress_code
            });
            API.storage.local['delete']('wordpress_code');
        }

        var reddit_code = API.storage.local.get('reddit_code');
        if ('undefined' !== typeof reddit_code && null !== reddit_code) {
            API.publish('verifying', {
                service: 'reddit',
                'code': github_code
            });
            API.do_confirm('reddit', {
                'code': reddit_code
            });
            API.storage.local['delete']('reddit_code');
        }

        var tumblr_token = API.storage.local.get('tumblr_oauth_request_token');
        var tumblr_token_secret = API.storage.local.get('tumblr_oauth_request_token_secret');
        var tumblr_verifier = API.storage.local.get('tumblr_oauth_request_verifier');
        if ('undefined' !== typeof tumblr_token && null !== tumblr_token && 'undefined' !== typeof tumblr_verifier && null !== tumblr_verifier) {
            API.publish('verifying', {
                service: 'tumblr',
                'oauth_token': tumblr_token,
                'oauth_verifier': tumblr_verifier
            });
            API.do_confirm('tumblr', {
                'oauth_token': tumblr_token,
                'oauth_token_secret': tumblr_token_secret,
                'oauth_verifier': tumblr_verifier
            });
            API.storage.local['delete']('tumblr_oauth_request_token');
            API.storage.local['delete']('tumblr_oauth_request_token_secret');
            API.storage.local['delete']('tumblr_oauth_request_verifier');
        }


        var vimeo_token = API.storage.local.get('vimeo_oauth_request_token');
        var vimeo_token_secret = API.storage.local.get('vimeo_oauth_request_token_secret');
        var vimeo_verifier = API.storage.local.get('vimeo_oauth_request_verifier');
        if ('undefined' !== typeof vimeo_token && null !== vimeo_token && 'undefined' !== typeof vimeo_verifier && null !== vimeo_verifier) {
            API.publish('verifying', {
                service: 'tumblr',
                'oauth_token': vimeo_token,
                'oauth_verifier': vimeo_verifier
            });
            API.do_confirm('vimeo', {
                'oauth_token': vimeo_token,
                'oauth_token_secret': vimeo_token_secret,
                'oauth_verifier': vimeo_verifier
            });
            API.storage.local['delete']('vimeo_oauth_request_token');
            API.storage.local['delete']('vimeo_oauth_request_token_secret');
            API.storage.local['delete']('vimeo_oauth_request_verifier');
        }



        var yahoo_token = API.storage.local.get('yahoo_oauth_request_token');
        var yahoo_token_secret = API.storage.local.get('yahoo_oauth_request_token_secret');
        var yahoo_verifier = API.storage.local.get('yahoo_oauth_request_verifier');
        if ('undefined' !== typeof yahoo_token && null !== yahoo_token && 'undefined' !== typeof yahoo_verifier && null !== yahoo_verifier) {
            API.publish('verifying', {
                service: 'yahoo',
                'oauth_token': yahoo_token,
                'oauth_verifier': yahoo_verifier
            });
            API.do_confirm('yahoo', {
                'oauth_token': yahoo_token,
                'oauth_token_secret': yahoo_token_secret,
                'oauth_verifier': yahoo_verifier
            });
            API.storage.local['delete']('yahoo_oauth_request_token');
            API.storage.local['delete']('yahoo_oauth_request_token_secret');
            API.storage.local['delete']('yahoo_oauth_request_verifier');
        }

        var linkedin_token = API.storage.local.get('linkedin_oauth_request_token');
        var linkedin_token_secret = API.storage.local.get('linkedin_oauth_request_token_secret');
        var linkedin_verifier = API.storage.local.get('linkedin_oauth_request_verifier');
        if ('undefined' !== typeof linkedin_token && null !== linkedin_token && 'undefined' !== typeof linkedin_verifier && null !== linkedin_verifier) {
            API.publish('verifying', {
                service: 'linkedin',
                'oauth_token': linkedin_token,
                'oauth_verifier': linkedin_verifier
            });
            API.do_confirm('linkedin', {
                'oauth_token': linkedin_token,
                'oauth_token_secret': linkedin_token_secret,
                'oauth_verifier': linkedin_verifier
            });
            API.storage.local['delete']('linkedin_oauth_request_token');
            API.storage.local['delete']('linkedin_oauth_request_token_secret');
            API.storage.local['delete']('linkedin_oauth_request_verifier');
        }


        var evernote_token = API.storage.local.get('evernote_oauth_request_token');
        var evernote_token_secret = API.storage.local.get('evernote_oauth_request_token_secret');
        var evernote_verifier = API.storage.local.get('evernote_oauth_request_verifier');
        if ('undefined' !== typeof evernote_token && null !== evernote_token && 'undefined' !== typeof evernote_verifier && null !== evernote_verifier) {
            API.publish('verifying', {
                service: 'evernote',
                'oauth_token': evernote_token,
                'oauth_verifier': evernote_verifier
            });
            API.do_confirm('evernote', {
                'oauth_token': evernote_token,
                'oauth_token_secret': evernote_token_secret,
                'oauth_verifier': evernote_verifier
            });
            API.storage.local['delete']('evernote_oauth_request_token');
            API.storage.local['delete']('evernote_oauth_request_token_secret');
            API.storage.local['delete']('evernote_oauth_request_verifier');
        }


    };

    API.detectLogin = function (redirect) {

        var url_vars = API.utilities.getUrlVars();

        if ('undefined' !== typeof url_vars.code && 'facebook' === url_vars.service) {
            API.storage.local.set('facebook_code', url_vars.code);
            API.publish('verified', {
                service: 'facebook',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'facebook'));
        }

        if ('undefined' !== typeof url_vars.oauth_token && 'undefined' !== typeof url_vars.oauth_verifier) {
            if ('tumblr' === url_vars.service) {
                API.storage.local.set('tumblr_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('tumblr_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'tumblr',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier,
                    oauth_token_secret: url_vars.oauth_token_secret
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'tumblr'));
            } else if ('yahoo' === url_vars.service) {
                API.storage.local.set('yahoo_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('yahoo_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'yahoo',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'yahoo'));
            } else if ('linkedin' === url_vars.service) {
                API.storage.local.set('linkedin_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('linkedin_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'linkedin',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'linkedin'));
            } else if ('vimeo' === url_vars.service) {
                API.storage.local.set('vimeo_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('vimeo_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'vimeo',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier,
                    oauth_token_secret: url_vars.oauth_token_secret
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'vimeo'));
            } else if ('evernote' === url_vars.service) {
                API.storage.local.set('evernote_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('evernote_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'evernote',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier,
                    oauth_token_secret: url_vars.oauth_token_secret
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'evernote'));
            } else { //twitter doesn't use service var TODO: fix?
                API.storage.local.set('twitter_oauth_request_token', url_vars.oauth_token);
                API.storage.local.set('twitter_oauth_request_verifier', url_vars.oauth_verifier);
                API.publish('verified', {
                    service: 'twitter',
                    oauth_token: url_vars.oauth_token,
                    oauth_verifier: url_vars.oauth_verifier
                });
                API.state.replaceCurrent(API.redirectTo.replace(':service', 'twitter'));
            }
        }

        if ('undefined' !== typeof url_vars.logout && 'undefined' !== typeof url_vars.service) {
            if ('facebook' === url_vars.service) {
                API.facebook.account_request(url_vars);
            }
        }

        if ('undefined' !== typeof url_vars.code && 'windows' === url_vars.service) {
            API.storage.local.set('windows_code', url_vars.code);
            API.publish('verified', {
                service: 'windows',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'windows'));
        }

        if ('undefined' !== typeof url_vars.code && 'github' === url_vars.service) {
            API.storage.local.set('github_code', url_vars.code);
            API.publish('verified', {
                service: 'github',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'github'));
        }

        if ('undefined' !== typeof url_vars.code && 'foursquare' === url_vars.service) {
            API.storage.local.set('foursquare_code', url_vars.code);
            API.publish('verified', {
                service: 'foursquare',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'foursquare'));
        }


        if ('undefined' !== typeof url_vars.code && 'google' === url_vars.service) {
            API.storage.local.set('google_code', url_vars.code);
            API.publish('verified', {
                service: 'google',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'google'));
        }

        if ('undefined' !== typeof url_vars.code && 'instagram' === url_vars.service) {
            API.storage.local.set('instagram_code', url_vars.code);
            API.publish('verified', {
                service: 'instagram',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'instagram'));
        }

        if ('undefined' !== typeof url_vars.code && 'soundcloud' === url_vars.service) {
            API.storage.local.set('soundcloud_code', url_vars.code);
            API.publish('verified', {
                service: 'soundcloud',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'soundcloud'));
        }

        if ('undefined' !== typeof url_vars.code && 'wordpress' === url_vars.service) {
            API.storage.local.set('wordpress_code', url_vars.code);
            API.publish('verified', {
                service: 'wordpress',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'wordpress'));
        }

        if ('undefined' !== typeof url_vars.code && 'reddit' === url_vars.service) {
            API.storage.local.set('reddit_code', url_vars.code);
            API.publish('verified', {
                service: 'reddit',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'reddit'));
        }

        if ('undefined' !== typeof url_vars.code && 'youtube' === url_vars.service) {
            API.storage.local.set('youtube_code', url_vars.code);
            API.publish('verified', {
                service: 'youtube',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'youtube'));
        }

        if ('undefined' !== typeof url_vars.code && 'blogger' === url_vars.service) {
            API.storage.local.set('blogger_code', url_vars.code);
            API.publish('verified', {
                service: 'blogger',
                'code': url_vars.code
            });
            API.state.replaceCurrent(API.redirectTo.replace(':service', 'blogger'));
        }

    };

    API.login_statuses = function () {

        var services = {
            'facebook': 'facebook_access_token',
            'twitter': 'twitter_access_token',
            'google': 'google_access_token',
            'foursquare': 'foursquare_access_token',
            'github': 'github_access_token',
            'yahoo': 'yahoo_access_token',
            'tumblr': 'tumblr_access_token',
            'linkedin': 'linkedin_access_token',
            'windows': 'windows_access_token',
            'instagram': 'instagram_access_token',
            'wordpress': 'wordpress_access_token',
            'vimeo': 'wordpress_access_token',
            'blogger': 'blogger_access_token',
            'youtube': 'youtube_access_token',
            'evernote': 'evernote_access_token',
            'reddit': 'reddit_access_token',
            'soundcloud': 'soundcloud_access_token'
        };

        var statuses = {};
        for (service in services) {
            var test = API.storage.session.get(services[service]);
            if ('undefined' !== typeof test && null !== test && '' !== test) {
                statuses[service] = true;
            } else {
                statuses[service] = false;
            }
        }

        API.publish('status', {
            status: statuses
        });

        return statuses;

    }

    /* Yahoo */

    API.yahoo.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'yahoo'
            });
            API.unsession('yahoo');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('yahoo' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('yahoo_oauth_request_token', data.request_token);
            API.storage.local.set('yahoo_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'yahoo',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'yahoo',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('yahoo' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'yahoo'
                });

            }

        } else if ('yahoo' === data.service && 'authorized' === data.status && 'authorized' === data.status) {

            API.publish('confirm', {
                service: 'yahoo'
            });
            API.yahoo.handle_confirm(data);

        } else if ('yahoo' === data.service && 'unauthorized' === data.account_status) {

            API.state.replaceCurrent(API.redirectTo);

        }

    }

    /* Windows Live */

    API.windows.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'windows'
            });
            API.unsession('windows');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('windows' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('windows_oauth_request_token', data.request_token);
            API.storage.local.set('windows_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'windows',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'windows',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('windows' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'windows'
                });
            }

        } else if ('windows' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'windows'
            });
            API.windows.handle_confirm(data);

        } else if ('windows' === data.service && 'unauthorized' === data.status) {

            API.state.replaceCurrent(API.redirectTo);

        }

    }


    /* WordPress */

    API.wordpress.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'wordpress'
            });
            API.unsession('wordpress');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('wordpress' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('wordpress_oauth_request_token', data.request_token);
            API.storage.local.set('wordpress_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'wordpress',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'wordpress',
                'url': data.login_url
            });
            window.location = data.login_url;
        } else if ('wordpress' === data.service && 'undefined' !== typeof data.connect_status) {
            if ('connected' === data.connect_status) {
                API.publish('confirmed', {
                    service: 'wordpress'
                });
            } else {
                API.unsession('wordpress');
            }
        } else if ('wordpress' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {
            API.publish('confirm', {
                service: 'wordpress'
            });
            API.wordpress.handle_confirm(data);
        } else if ('wordpress' === data.service && 'unauthorized' === data.account_status) {
            API.unsession('wordpress');
            API.state.replaceCurrent(API.redirectTo);
        }
    }



    /* Github */

    API.github.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'github'
            });
            API.unsession('github');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('github' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('github_oauth_request_token', data.request_token);
            API.storage.local.set('github_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'github',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'github',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('github' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'github'
                });

            } else {

                API.unsession('github');

            }

        } else if ('github' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'github'
            });
            API.github.handle_confirm(data);

        } else if ('github' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('github');
            API.state.replaceCurrent(API.redirectTo);

        }

    }


    /* Vimeo */

    API.vimeo.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'vimeo'
            });
            API.unsession('vimeo');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('vimeo' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('vimeo_oauth_request_token', data.request_token);
            API.storage.local.set('vimeo_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'vimeo',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'vimeo',
                'url': data.login_url
            });

            window.location = data.login_url;

        } else if ('vimeo' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'vimeo'
                });

            } else {

                API.unsession('vimeo');

            }

        } else if ('vimeo' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'vimeo'
            });
            API.vimeo.handle_confirm(data);

        } else if ('vimeo' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('vimeo');
            API.state.replaceCurrent(API.redirectTo);

        }

    }


    /* Tumblr */

    API.tumblr.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'tumblr'
            });
            API.unsession('tumblr');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('tumblr' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('tumblr_oauth_request_token', data.request_token);
            API.storage.local.set('tumblr_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'tumblr',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'tumblr',
                'url': data.login_url
            });

            window.location = data.login_url;

        } else if ('tumblr' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'tumblr'
                });

            } else {

                API.unsession('tumblr');

            }

        } else if ('tumblr' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'tumblr'
            });
            API.tumblr.handle_confirm(data);

        } else if ('tumblr' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('tumblr');
            API.state.replaceCurrent(API.redirectTo);

        }

    }

    /* Twitter */

    API.twitter.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'twitter'
            });
            API.unsession('twitter');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('twitter' === data.service && 'undefined' !== typeof data.login_url) {

            API.publish('session_redirect', {
                service: 'twitter',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'twitter',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('twitter' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'twitter'
                });

            } else {

                API.unsession('twitter');

            }

        } else if ('twitter' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'twitter'
            });
            API.twitter.handle_confirm(data);

        } else if ('twitter' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('twitter');
            API.state.replaceCurrent(API.redirectTo);

        }

    }

    /* Instagram */

    API.instagram.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'instagram'
            });
            API.unsession('instagram');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('instagram' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('instagram_oauth_request_token', data.request_token);
            API.storage.local.set('instagram_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'instagram',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'instagram',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('instagram' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'instagram'
                });

            } else {

                API.unsession('instagram');

            }

        } else if ('instagram' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.storage.local['delete']('instagram_oauth_request_token');
            API.storage.local['delete']('instagram_oauth_request_token_secret');
            API.publish('confirm', {
                service: 'instagram'
            });
            API.instagram.handle_confirm(data);

        } else if ('instagram' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('instagram');
            API.state.replaceCurrent(API.redirectTo);

        }

    };


    /* Linkedin */

    API.linkedin.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'linkedin'
            });
            API.unsession('linkedin');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('linkedin' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('linkedin_oauth_request_token', data.request_token);
            API.storage.local.set('linkedin_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'linkedin',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'linkedin',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('linkedin' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'linkedin'
                });

            } else {

                API.unsession('linkedin');

            }

        } else if ('linkedin' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'linkedin'
            });
            API.linkedin.handle_confirm(data);

        } else if ('linkedin' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('linkedin');
            API.state.replaceCurrent(API.redirectTo);

        }

    };


    /* Reddit */

    API.reddit.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'reddit'
            });
            API.unsession('reddit');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('reddit' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('reddit_oauth_request_token', data.request_token);
            API.storage.local.set('reddit_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'reddit',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'reddit',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('reddit' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'reddit'
                });

            } else {

                API.unsession('reddit');

            }

        } else if ('reddit' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'reddit'
            });
            API.reddit.handle_confirm(data);

        } else if ('reddit' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('reddit');
            API.state.replaceCurrent(API.redirectTo);

        }

    };

    /* SoundCloud */

    API.soundcloud.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {

            API.publish('unsession', {
                service: 'soundcloud'
            });
            API.unsession('soundcloud');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('soundcloud' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('soundcloud_oauth_request_token', data.request_token);
            API.storage.local.set('soundcloud_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'soundcloud',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'soundcloud',
                'url': data.login_url
            });
            window.location = data.login_url;

        } else if ('soundcloud' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'soundcloud'
                });

            } else {

                API.unsession('soundcloud');

            }

        } else if ('soundcloud' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'soundcloud'
            });
            API.soundcloud.handle_confirm(data);

        } else if ('soundcloud' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('soundcloud');
            API.state.replaceCurrent(API.redirectTo);

        }

    };

    /* Evernote */

    API.evernote.account_request = function (data) {

        if ('undefined' !== typeof data.logout_url) {
            API.publish('unsession', {
                service: 'evernote'
            });
            API.unsession('evernote');
            API.state.replaceCurrent(API.redirectTo);

        } else if ('evernote' === data.service && 'undefined' !== typeof data.login_url) {

            API.storage.local.set('evernote_oauth_request_token', data.request_token);
            API.storage.local.set('evernote_oauth_request_token_secret', data.request_token_secret);
            API.publish('session_redirect', {
                service: 'evernote',
                'url': data.login_url
            });
            API.publish('redirect', {
                service: 'evernote',
                'url': data.login_url
            });

            window.location = data.login_url;

        } else if ('evernote' === data.service && 'undefined' !== typeof data.connect_status) {

            if ('connected' === data.connect_status) {

                API.publish('confirmed', {
                    service: 'evernote'
                });

            } else {

                API.unsession('evernote');

            }

        } else if ('evernote' === data.service && 'authorized' === data.status && 'undefined' === typeof data.connect_status) {

            API.publish('confirm', {
                service: 'evernote'
            });
            API.evernote.handle_confirm(data);

        } else if ('evernote' === data.service && 'unauthorized' === data.account_status) {

            API.unsession('evernote');
            API.state.replaceCurrent(API.redirectTo);

        }

    }


    /* History */

    API.state = API.state || {};
    API.history = window.history;

    API.state.replaceCurrent = function (stateUrl, stateTitle, stateObj) {

        if (null === stateObj || 'undefined' === typeof stateObj) {
            stateObj = API.history.getCurrentStateObj;
        }

        API.history.replaceState(stateObj, stateTitle, stateUrl);
    };

    API.state.push = function (state, stateTitle, stateObj) {

        if ('string' !== typeof state && state.length > 0) {
            stateUrl = state.join('/');
        } else {
            stateUrl = state;
        }

        if (null === stateObj || 'undefined' === typeof stateObj) {
            stateObj = API.history.getCurrentStateObj;
        }

        API.history.pushState(stateObj, stateTitle, stateUrl);

    };

    /* Storage */

    API.storage = {};

    /* Local Storage */

    API.store = localStorage;
    API.storage.local = {};

    API.storage.local.set = function (set_key, set_value) {
        if ('string' !== typeof set_value) {
            set_value = JSON.stringify(set_value);
        }
        return API.store.setItem(API.prefix + '_' + set_key, set_value);
    };

    API.storage.local['delete'] = function (key) {
        return API.store.removeItem(API.prefix + '_' + key);
    };

    API.storage.local.get = function (get_key) {
        var res = API.store.getItem(API.prefix + '_' + get_key);
        try {
            parsed = JSON.parse(API.store.getItem(API.prefix + '_' + get_key));
            res = parsed;
        } catch (e) { /* do nothing */
        }
        return res;
    };

    API.storage.local.set_batch = function (dictionary) {
        for (item in dictionary) {
            if (dictionary.hasOwnProperty(item)) {
                API.storage.local.set(item, dictionary[item]);
            }
        }
    };

    API.storage.local.delete_batch = function (keys) {
        var i;
        for (i = 0; i <= keys.length; i += 1) {
            API.storage.local['delete'](keys[i]);
        }
    }

    /* Session Storage */

    API.storage.session = {};
    API.sessionStorage = sessionStorage;

    API.storage.session.set = function (set_key, set_value) {
        return API.sessionStorage.setItem(API.prefix + '_' + set_key, set_value);
    };

    API.storage.session['delete'] = function (key) {
        return API.sessionStorage.removeItem(API.prefix + '_' + key);
    };

    API.storage.session.get = function (get_key) {
        return API.sessionStorage.getItem(API.prefix + '_' + get_key);
    };

    API.storage.session.set_batch = function (dictionary) {
        for (item in dictionary) {
            if (dictionary.hasOwnProperty(item)) {
                API.storage.session.set(item, dictionary[item]);
            }
        }
    };

    API.storage.session.delete_batch = function (keys) {
        var i;
        for (i = 0; i <= keys.length; i += 1) {
            API.storage.session['delete'](keys[i]);
        }
    };

    API.utilities = API.utilities || {};
    // Cleverness via: http://papermashup.com/read-url-get-variables-withjavascript/
    API.utilities.getUrlVars = function () {
        var vars = {},
            pieces = window.document.location.href.split('?').splice(1).join('&').split('#'),
            parts = ("?" + pieces[0]).replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
        return vars;
    };

    API.picked = API.storage.local.get('profile_picks') || {};

    return Public;

});