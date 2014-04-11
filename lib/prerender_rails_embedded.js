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

surrender.params = function() {
    if (system.args.length === 1) {
        throw 'Usage: googlizer.js <some URL>';
    }
    return { address: system.args[1]};
};

surrender.javascriptToExecuteOnPage = function() {
    try {
        var doctype = ''
            , html = document && document.getElementsByTagName('html');

        if(document.doctype) {
            doctype = "<!DOCTYPE "
                + document.doctype.name
                + (document.doctype.publicId ? ' PUBLIC "' + document.doctype.publicId + '"' : '')
                + (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '')
                + (document.doctype.systemId ? ' "' + document.doctype.systemId + '"' : '')
                + '>';
        }

        if (html && html[0]) {
            return {
                html: doctype + html[0].outerHTML,
                shouldWaitForPrerenderReady: typeof window.prerenderReady === 'boolean',
                prerenderReady: window.prerenderReady
            };
        }

    } catch (e) {
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

        page.open(page.address, function (st) {
            if (st !== 'success') throw 'FAIL to load the address';

            _this.evaluateJavascriptOnPage();
        });
    } catch(e) {
        console.log(e);
        phantom.exit(1);
    }
};

surrender.run();