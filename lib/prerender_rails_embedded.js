/**
 * TODO exceptions should exit immediately from phantomjs and they DON'T
 * TODO add a timeout for too long connections
 * TODO support 404 and error code in the same way prerender.io (server) does
 * @type {number}
 */
var EVALUATE_JAVASCRIPT_CHECK_TIMEOUT = 50;

var page = require('webpage').create(),
    system = require('system');
var surrender = {};
page.viewportSize = {
  width: 1024,
  height: 800
};

surrender.params = function() {
  if (system.args.length === 1) {
      throw 'Usage: googlizer.js <some URL>';
  }
  return { address: system.args[1]};
};


surrender.javascriptToExecuteOnPage = function() {
  var processHtml = function() {
    if (!window.prerenderRailsEmbedded || !window.prerenderRailsEmbedded.filterHtmlOutput || typeof(window.prerenderRailsEmbedded.filterHtmlOutput) !== "function") {
      return document.documentElement.innerHTML;
    } else {
      return window.prerenderRailsEmbedded.filterHtmlOutput.call(this);
    }
  }

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
    console.log('ERROR: ', e);
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
  try {
    var _this = this;
    page.address = this.params().address;
    page.settings.userAgent = 'EtaliaBotAgent';
    page.open(page.address, function (st) {
      if (st !== 'success') throw 'FAIL to load the address';
      _this.evaluateJavascriptOnPage();
    });
  } catch(e) {
      console.log(e);
      phantom.exit(1);
  }

  page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
      });
    }
    console.log(msgStack.join('\n'));
  };

  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
  };

};

surrender.run();