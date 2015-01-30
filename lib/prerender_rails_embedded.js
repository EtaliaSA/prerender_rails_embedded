/**
 * TODO exceptions should exit immediately from phantomjs and they DON'T
 * TODO support 404 and error code in the same way prerender.io (server) does
 * @type {number}
 */
var EVALUATE_JAVASCRIPT_CHECK_TIMEOUT = 50;

var page = require('webpage').create(),
    system = require('system'),
    URI = require('./URI'),
    fs = require('fs');

var surrender = {};
page.viewportSize = {
  width: 1024,
  height: 800
};

surrender.params = function() {
  if (system.args.length === 1) {
      throw 'Usage: prerender_rails_embedded.js <some URL>';
  }
  return { address: system.args[1]};
};


surrender.javascriptToExecuteOnPage = function() {
  function removeScriptTag() {
    var element = document.getElementsByTagName("script");
    for (var index = element.length - 1; index >= 0; index--) {
      element[index].parentNode.removeChild(element[index]);
    }
  }

  var processHtml = function() {
    if (!window.prerenderRailsEmbedded || !window.prerenderRailsEmbedded.filterHtmlOutput || typeof(window.prerenderRailsEmbedded.filterHtmlOutput) !== "function") {
      removeScriptTag();
      return document.documentElement.outerHTML;
    } else {
      removeScriptTag();
      return window.prerenderRailsEmbedded.filterHtmlOutput.call(this);
    }
  };

  try {

    if (!document) {
      throw 'document is undefined. this function must be called inside page.evaluate ';
    }
    var html = processHtml();
    var doctype = '';

    if(document && document.doctype) {
      doctype = "<!DOCTYPE "
        + document.doctype.name
        + (document.doctype.publicId ? ' PUBLIC "' + document.doctype.publicId + '"' : '')
        + (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '')
        + (document.doctype.systemId ? ' "' + document.doctype.systemId + '"' : '')
        + '>';
    }

    return {
      html: doctype + html,
      shouldWaitForPrerenderReady: typeof window.prerenderReady === 'boolean',
      prerenderReady: window.prerenderReady
    };

  } catch (e) {
    //console.log('ERROR: ', e);
    return  {
      html: '',
      shouldWaitForPrerenderReady: false,
      prerenderReady: window.prerenderReady
    };
  }
};

surrender.millisElapsed = function () {
  return new Date().getTime() - this.requestStarted.getTime();
};

surrender.serveHtml = function(html) {
    system.stdout.writeLine(html);

    this.logDebug('page returned to rails: ' + page.address + " (" + this.millisElapsed() + "ms)");
    phantom.exit(0);
};

surrender.evaluateJavascriptOnPage = function(t, msPassed) {
  var _this = t || this
      , out = page.evaluate(_this.javascriptToExecuteOnPage);

  if (msPassed === undefined) msPassed = 0;

  if(!out.shouldWaitForPrerenderReady || (out.shouldWaitForPrerenderReady && out.prerenderReady) || msPassed >= 20000) {

    if (msPassed >= 20000) _this.logWarning("prerenderReady=true not found after 20s for page: " + page.url);

    _this.serveHtml(out.html);

  } else {
      _this.evaluateJavascriptTimeout = setTimeout(function(){_this.evaluateJavascriptOnPage(_this, msPassed + EVALUATE_JAVASCRIPT_CHECK_TIMEOUT)}, EVALUATE_JAVASCRIPT_CHECK_TIMEOUT);
  }
  return _this;
};

surrender.run = function() {
  var _this = this;

  try {

    page.address = this.replaceHostWithLocalhost(this.removeEscapedFragmentParameter(this.params().address));
    page.settings.userAgent = 'EtaliaBotAgent';
    page.settings.resourceTimeout = 15000;

    _this.logDebug('requested: ' + page.address);
    surrender.requestStarted = new Date();

    page.open(page.address, function (st) {
      _this.logDebug('opened: ' + page.address + 'with status: ' + st);

      if (st !== 'success') throw 'FAIL to load the address';

      _this.evaluateJavascriptOnPage();
    });

  } catch(e) {
      _this.logError(e);
      console.log(e);
      phantom.exit(1);
  }

  page.onError = function(message, trace) {
    _this.logError(message);
  };

  page.onConsoleMessage = function(message, lineNum, sourceId) {
    _this.logInfo('CONSOLE: ' + message + '(' + sourceId + '/L#"' + lineNum + '")');
  };

  page.onResourceTimeout = function(request) {
    console.log('<html><head><meta name="robots" content="noindex, noarchive" /></head><body></body></html>');
    _this.logWarning('Response (#' + request.id + '): ' + JSON.stringify(request));
    setTimeout(function() { phantom.exit(1); }, 0); // workaround to avoid PhantomJS crashes
  };

  //page.onResourceRequested = function(requestData, networkRequest) {
  //  _this.logWarning('-------- (#' + requestData.id + '): ' + requestData.url + ' ' + JSON.stringify(requestData.headers));
  //};
};
surrender.removeEscapedFragmentParameter = function (addressUrl) {
  var parts = new URI(addressUrl);

  // Remove the _escaped_fragment_ query parameter
  if (parts.hasSearch('_escaped_fragment_')) {
    if(parts.search(true)['_escaped_fragment_']) {
      parts.hash("#!" + parts.search(true)['_escaped_fragment_']);
    }
    parts.removeSearch('_escaped_fragment_');
  }

  var newUrl = parts.toString();
  if(newUrl[0] === '/') newUrl = newUrl.substr(1);

  return newUrl;
};

surrender.replaceHostWithLocalhost = function (addressUrl) {
  this.logDebug(new URI(addressUrl).hostname('localhost'));
  return new URI(addressUrl).hostname('localhost');
};

surrender.logFilePath = function() {
  if (fs.exists("/opt/sites/frontend/current/log"))
    return "/opt/sites/frontend/current/log";
  else
    return "/tmp";
};
surrender.flog = function(message) {
  try {
    fs.write(this.logFilePath() + '/etalia-prerender.log', message + "\n", 'a');
  } catch(e) {
    // can't fallback on anything
  }
};
surrender.logDebug = function(message) {
  this.flog(this.timestamp() + ' [DEBUG] ' + message);
};
surrender.logInfo = function(message) {
  this.flog(this.timestamp() + ' [INFO ] ' + message);
};
surrender.logWarning = function(message) {
  this.flog(this.timestamp() + ' [WARN ] ' + message);
};
surrender.logError = function(message) {
  this.flog(this.timestamp() + ' [ERROR] ' + message);
};

surrender.timestamp = function() {
  return new Date().toString().substring(0,24);
};

surrender.run();