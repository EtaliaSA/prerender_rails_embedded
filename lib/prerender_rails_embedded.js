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

surrender.javascriptToExecuteOnPage = function(filterHtmlOutput) {
  try {
    if (!filterHtmlOutput || typeof(filterHtmlOutput) !== "function") {
      throw 'you must pass a function to javascriptToExecuteOnPage ';
    }
    if (!document) {
      throw 'document is undefined. this function must be called inside page.evaluate ';
    }

    var doctype = '';
    var html = filterHtmlOutput.call(this);

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

  var filterHtmlOutput = function() {
    var trimToTextLengthPercentage = function(parent, percentage) {
      var node, x;
      var countChar = 0;
      var limit = Math.round(text.innerText.length * percentage / 100);
      var x = 0;
      var nodes = parent.childNodes;

      while (x < nodes.length) {
        node = nodes[x];
        elem = node.data;
        if(elem === undefined) {
          elem = node.innerText;
        }

        // Se il limite (30%) e' superato, elimino tt i nodi seguenti
        if (countChar > limit) {
          // parent.removeChild(node);
          if (elem != undefined && elem.length > 0)  {
            nodes[x].data = '';
            nodes[x].innerText = '';
          }
          x++;
          continue;
        } else {
          if (elem != null && elem.length > 1) {
            countChar = countChar + elem.length;
            // Se il limite e' superato taglio il contenuto del nodo fino al limite massimo e non ne aggiungo altri dopo. 
            if (countChar >= limit) {
              countChar = countChar - elem.length;
              max = limit - countChar;
              elem = elem.substring(0, max) + "...";
              cloned = node.cloneNode();
              cloned.data = elem;
              nodes[x] = cloned;
              countChar = limit + 1;
            };
          };                
        }
        x++;
      }
      // return text.cloneNode();
    };

        // , html = document && document.getElementsByTagName('html');
    if(document.getElementById('articles-show') != null) {

        // articles
        article = document.getElementsByTagName('article')[0];
        text = article.getElementsByClassName('text')[0];

        // text.parentNode.removeChild(text);

        trimToTextLengthPercentage(text, 30);
        // textNodes = trimToTextLengthPercentage(text, 30);

        // console.log(textNodes);

        // text.parent.replaceChild(text, newText);

        // while (text.firstChild) {
        //   text.removeChild(text.firstChild);
        // };

        // for (var i = 0; i < newText.length; i++) {
        //   text.appendChild(textNodes[0]);
        // };

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
      }
      
      var head = document.getElementsByTagName('head')[0];
      var body = document.getElementsByTagName('body')[0];

      return head.innerHTML + body.innerHTML;

    };
    // fine metodo filterHtmlOutput

    var _this = t || this
        , out = page.evaluate(_this.javascriptToExecuteOnPage, filterHtmlOutput);

    if(!out.shouldWaitForPrerenderReady || (out.shouldWaitForPrerenderReady && out.prerenderReady)) {
        _this.serveHtml(out.html);
    } else {
        setTimeout(function(){_this.evaluateJavascriptOnPage(_this)}, EVALUATE_JAVASCRIPT_CHECK_TIMEOUT);
    }
    return _this;
};

surrender.run = function() {
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