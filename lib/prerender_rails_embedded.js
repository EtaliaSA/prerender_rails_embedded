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
    var fillHTMLRecursive = function(parent, limit) {
        var node, x, _results;
        var _that = this;
        var countChar = 0;
        bb = document.getElementsByTagName('body')[0]
        x = 0;
        while (x < parent.childNodes.length) {
            debugger
            node = parent.childNodes[x];
            elem = node.data;
            if(elem === undefined) {
                elem = node.innerText;
            }

            // Se il limite (70%) e' superato, elimino tt i nodi seguenti
            if (countChar > limit) {
                parent.removeChild(node);
                x++;
                continue;
            };

            if (elem != null && elem.length > 1) {
                countChar = countChar + elem.length;
                if (countChar > limit) {
                    parent.removeChild(node);
                };
                // fillHTMLRecursive(node, true);
            };




            // debugger
            // if (node.childNodes.length === 0) {
            //     x++;
            //     continue;
            // }
            // else {

            //     // elem = node.data;

            //     if (elem != null && elem.length > 1) {
            //         countChar = countChar + elem.length;
            //         if (countChar > limit) {
            //             parent.removeChild(node);
            //         };

            //         // fillHTMLRecursive(node, true);
            //     };
                
            // }        
            x++;
        }
        // return _results;
    };


    try {
        
        var doctype = '';
        var html = '';
            // , html = document && document.getElementsByTagName('html');
        if(document.getElementById('articles-show') != null) {
            // articles
            
            article = document.getElementsByTagName('article')[0];
            // articleParent = article.parentElement;
            text = article.getElementsByClassName('text')[0];
            textLength = text.innerText.length;
            limit = Math.round(textLength * 70 / 100);

            // text.innerText.substring(0, Math.round(textLength * 70 / 100)) + '...';

            // nodes = text.childNodes;
            // nodesNumber = nodes.length;
            // count = 0;

            // currentLength = 0;

            fillHTMLRecursive(text, limit);

            // while ( count < nodesNumber) {
            //     elem = nodes[count];
            //     console.log(count, ' ', elem);
            //     if (elem.innerText) {
            //         elem.innerText
            //     };
            //     count++;
            // }

            // metto il 30% del testo
            // article.innerHTML = text.innerText.substring(0, Math.round(textLength * 30 / 100)) + '...';
            // calcolo la lunghezza del testo ridotto al 30%
            // maxLen = article.innerHTML.length;
            // article.innerHTML = maxLen;

            html = document && document.getElementsByTagName('head');

        } else if(document.getElementById('publications-show') != null) {
            // remove all advs
            // advs = document.getElementsByClassName('adv');
            // while (advs.length > 0) {
            //     advs = document.getElementsByClassName('adv');                
            //     advs[0].parentNode.removeChild(advs[0]);
            // }
            // var article, articles, _i, textLength;
            // articles = document.getElementsByTagName('article');
            // for (index = 0; index < articles.length; index++) {
            //     textLength = articles[index].innerText.length;
            //     articles[index].innerHTML = articles[index].innerText.substring(0, Math.round(textLength * 70 / 100));
            // }
            html = document && document.getElementsByTagName('head');

        }

        if(document.doctype) {
            doctype = "<!DOCTYPE "
                + document.doctype.name
                + (document.doctype.publicId ? ' PUBLIC "' + document.doctype.publicId + '"' : '')
                + (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '')
                + (document.doctype.systemId ? ' "' + document.doctype.systemId + '"' : '')
                + '>';
        }
        bb = document.getElementsByTagName('body')[0]
        if (html && html[0]) {
            return {
                html: doctype + html[0].innerHTML + bb.innerHTML,
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

            // ESEMPIO UTILIZZO DI JQUERY IN PHANTOM
            // page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js", function() {
            //     _this.evaluateJavascriptOnPage();
            // });
        });
    } catch(e) {
        console.log(e);
        phantom.exit(1);
    }
};

surrender.run();