/**
 * TODO exceptions should exit immediately from phantomjs and they DON'T
 * TODO add a timeout for too long connections
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
  var processHtml = function() {
    if (!window.prerenderRailsEmbedded || !window.prerenderRailsEmbedded.filterHtmlOutput || typeof(window.prerenderRailsEmbedded.filterHtmlOutput) !== "function") {
      return document.documentElement.outerHTML;
    } else {
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

surrender.serveHtml = function(html) {
    system.stdout.writeLine(html);
    phantom.exit();
};

surrender.evaluateJavascriptOnPage = function(t) {
  var _this = t || this
      , out = page.evaluate(_this.javascriptToExecuteOnPage);

  if(!out.shouldWaitForPrerenderReady || (out.shouldWaitForPrerenderReady && out.prerenderReady)) {
      _this.serveHtml(out.html);
  } else {
      setTimeout(function(){_this.evaluateJavascriptOnPage(_this)}, EVALUATE_JAVASCRIPT_CHECK_TIMEOUT);
  }
  return _this;
};

surrender.run = function() {
  var _this = this;

  try {
    page.address = this.removeEscapedFragmentParameter(this.params().address);
    page.settings.userAgent = 'EtaliaBotAgent';
    page.settings.resourceTimeout = 30000;
    page.open(page.address, function (st) {
      if (st !== 'success') throw 'FAIL to load the address';
      _this.evaluateJavascriptOnPage();
    });
  } catch(e) {
      console.log(e);
      phantom.exit(1);
  }

  page.onError = function(message, trace) {
    _this.logError(message);

    //if (trace && trace.length) {
    //  msgStack.push('TRACE:');
    //  trace.forEach(function(t) {
    //    msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    //  });
    //}
  //  console.log(msgStack.join('\n'));
  };

  page.onConsoleMessage = function(message, lineNum, sourceId) {
    _this.logInfo('CONSOLE: ' + message + '(' + sourceId + '/L#"' + lineNum + '")');
  };

  page.onResourceTimeout = function(request) {
    console.log('<html><head><meta name="robots" content="noindex, noarchive" /></head><body></body></html>');
    _this.logWarning('Response (#' + request.id + '): ' + JSON.stringify(request));
    setTimeout(function() { phantom.exit(1); }, 0); // workaround to avoid PhantomJS crashes
  }
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