/*
 |----------------------------------------------------------------------------------------------------------------------
 | CONTENTSCRIPT.JS
 |----------------------------------------------------------------------------------------------------------------------
 |
 | == Force My Browser Fonts ==
 |
 | A Chrome extension that forces websites to substitute the fonts you choose for serif, sans-serif and monospace,
 | while trying not to break icon fonts
 |
 | == Changelog ==
 |     = 1.0.2 - 2024-01-26 =
 |     - Prep for public post to github
 |
 |     = 1.0.1 - 2023-04-24 =
 |     - Change manifest.json "run_at": "document_idle" to "run_at": "document_end" to speed up browser font rendering
 |     - Change manifest.json to "matches": ["<all_urls>"]
 |     - Add to manifest.json "match_about_blank": true like Stylus
 |
 |     = 1.0.0 - 2022-10-24 =
 |     - Release
 |
 | == Issues ==
 |     - WordPress wp-admin admin bar 3 icons render as arial instead of their intended icon font: (1) wp-logo,
 |       (2) comments, (3) new-content. Not sure how to fix.
 |
 | == Issues Fixed ==
 |     - After switching to getFontsViaDocumentStyleSheets()...
 |         - Fixed: On some pages Arial is turned into Courier New (thefederalist.com/anyArticle, mailinator.com)
 |           The fix: some webmasters use font stacks "Arial, monospace"! 99.9% fixed
 |         - Fixed: caniuse.com/flexbox will not take @font-face monospace size-adjust 81.25%
 |           The fix: filter !items[0].match(/courier new/i) in function buildFontFaceCssStr()
 |
 |     - This plugin introduces a "stutter" when smooth-scrolling some long pages with ScrollAnywhere Chromium plugin,
 |       like any stackoverflow.com page. There is no stutter on other long pages like wikipedia.org and
 |       developer.mozilla.org.
 |
 |       The fix was to rewrite getFontsViaGetComputedStyle() into getFontsViaDocumentStyleSheets() because
 |       getComputedStyle() is a performance degredation problem. The getComputedStyle() version was more reliable.
 |
 |     - Using Stylus to replace our generated CSS rules is literally 10x faster, but it is impossible to make
 |       Stylus work for our needs because it doesn't allow conditionals.
 |
 |     - Misc fixes
 |         - deleteAtFontFaceRule()
 |             - fixes thecoinperspective.com
 |             - fixes developer.mozilla.org
 |         - manualDefaultCssStr
 |             - caniuse.com/flexbox (shadowRoot)
 |             - stackoverflow.com (textarea font size on edit)
 |         - buildSiteCssStr()
 |             - server.mxrouting.net:2222 (buttons, inputs)
 |             - youtube.com/watch?v=83TDzfla6q0 (title)
 |         - setTimeout() fixes if timer is long enough (currently 100ms)
 |             - This is only necessary to fix one site after switching to getFontsViaDocumentStyleSheets() (hearthstone.blizzard.com - titles)
 |             - account.venmo.com (some text)
 |             - logicalincrements.com (some text)
 |             - profit-mine.com (headings)
 |             - hearthstone.blizzard.com (everything)
 |         - leaguename.baseball.cbssports.com (menu)
 |             - @font-face rule for "FS Industrie NW" is NOT deleted because it's unreadable (cross domain origin)
 |             - Somehow now mysteriously fixed
 |             - Old fix: Enable $getRemoteCss to fix
 |
 | == Notes ==
 |     - Overall the new version works good despite not using getComputedStyle(), and even works better in some
 |       cases (logicalincrements.com, account.venmo.com), but worse in others (have to manually add some webfonts).
 |       The main drawback of the new version is you have to manually add some fonts to the list.
 |     - The plugin version and Violentmonkey version work exactly the same
 |     - This also changes fonts inside youtube.com and twitter.com iframe embeds
 |     - Chromium shows bold fonts at weight 550+
 |     - font-display: swap does nothing discernable
 |     - addStylesTag() by itself does not work on google.com
 |     - addStylesSheet() cannot be run twice in this script or it breaks google.com and rantingly.com
 |
 | == Optimizations ==
 |     - Variables in this script can be optimized by declaring them once at script start
 |     - Jotform CSS parser is buggy, mangles some @keyframes
 */

// ---------------------------------------------------------------------------------------------------------------------

    "use strict";

    var debug = false;
    var href = window.location.href;

    if (debug && !href.match(/(youtube|twitter)/i)) console.log("=== Force My Browser Fonts Start ===");
    if (debug && !href.match(/(youtube|twitter)/i)) console.log("Processing HREF:", href);

// ---------------------------------------------------------------------------------------------------------------------

    /* rework-css-parse-bundle-standalone.js
     *
     * How to use
     *
     *  var obj = css.parse(cssString, options);
     *
     * How to convert this Node.js script to standalone
     *
     *  - Edit index.js: comment the line "exports.stringify"
     *  - Run command: $ browserify index.js --standalone css -o rework-css-parse-bundle-standalone.js
     *
     * @link https://github.com/reworkcss/css
     * @link https://browserify.org/
     * @link https://github.com/browserify/browserify-handbook
     *
     * @return object */
    !function(r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r():"function"==typeof define&&define.amd?define([],r):("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).css=r()}(function(){return function t(i,o,s){function u(e,r){if(!o[e]){if(!i[e]){var n="function"==typeof require&&require;if(!r&&n)return n(e,!0);if(a)return a(e,!0);throw(n=new Error("Cannot find module '"+e+"'")).code="MODULE_NOT_FOUND",n}n=o[e]={exports:{}},i[e][0].call(n.exports,function(r){return u(i[e][1][r]||r)},n,n.exports,t,i,o,s)}return o[e].exports}for(var a="function"==typeof require&&require,r=0;r<s.length;r++)u(s[r]);return u}({1:[function(r,e,n){n.parse=r("./lib/parse")},{"./lib/parse":2}],2:[function(r,e,n){var k=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;function E(r){return r?r.replace(/^\s+|\s+$/g,""):""}e.exports=function(t,n){n=n||{};var i=1,o=1;function s(r){var e=r.match(/\n/g);e&&(i+=e.length);e=r.lastIndexOf("\n");o=~e?r.length-e:o+r.length}function u(){var e={line:i,column:o};return function(r){return r.position=new a(e),d(),r}}function a(r){this.start=r,this.end={line:i,column:o},this.source=n.source}a.prototype.content=t;var f=[];function c(r){var e=new Error(n.source+":"+i+":"+o+": "+r);if(e.reason=r,e.filename=n.source,e.line=i,e.column=o,e.source=t,!n.silent)throw e;f.push(e)}function p(){return v(/^{\s*/)}function m(){return v(/^}/)}function l(){var r,e,n=[];for(d(),g(n);t.length&&"}"!=t.charAt(0)&&(e=("@"!=t[0]?void 0:function(){var r=u(),e=v(/^@([-\w]+)?keyframes\s*/);if(!e)return;var n=e[1];if(!(e=v(/^([-\w]+)\s*/)))return c("@keyframes missing name");var t,e=e[1];if(!p())return c("@keyframes missing '{'");var i=g();for(;t=function(){var r,e=[],n=u();for(;r=v(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/);)e.push(r[1]),v(/^,\s*/);return e.length?n({type:"keyframe",values:e,declarations:w()}):void 0}();)i.push(t),i=i.concat(g());return m()?r({type:"keyframes",name:e,vendor:n,keyframes:i}):c("@keyframes missing '}'")}()||function(){var r=u(),e=v(/^@media *([^{]+)/);if(!e)return;var n=E(e[1]);if(!p())return c("@media missing '{'");e=g().concat(l());return m()?r({type:"media",media:n,rules:e}):c("@media missing '}'")}()||function(){var r=u(),e=v(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);return e?r({type:"custom-media",name:E(e[1]),media:E(e[2])}):void 0}()||function(){var r=u(),e=v(/^@supports *([^{]+)/);if(!e)return;var n=E(e[1]);if(!p())return c("@supports missing '{'");e=g().concat(l());return m()?r({type:"supports",supports:n,rules:e}):c("@supports missing '}'")}()||b()||x()||A()||function(){var r=u(),e=v(/^@([-\w]+)?document *([^{]+)/);if(!e)return;var n=E(e[1]),t=E(e[2]);if(!p())return c("@document missing '{'");e=g().concat(l());return m()?r({type:"document",document:t,vendor:n,rules:e}):c("@document missing '}'")}()||function(){var r=u();if(!v(/^@page */))return;var e=y()||[];if(!p())return c("@page missing '{'");var n,t=g();for(;n=h();)t.push(n),t=t.concat(g());return m()?r({type:"page",selectors:e,declarations:t}):c("@page missing '}'")}()||function(){var r=u();if(!v(/^@host\s*/))return;if(!p())return c("@host missing '{'");var e=g().concat(l());return m()?r({type:"host",rules:e}):c("@host missing '}'")}()||function(){var r=u();if(!v(/^@font-face\s*/))return;if(!p())return c("@font-face missing '{'");var e,n=g();for(;e=h();)n.push(e),n=n.concat(g());return m()?r({type:"font-face",declarations:n}):c("@font-face missing '}'")}())||(e=r=void 0,r=u(),(e=y())?(g(),r({type:"rule",selectors:e,declarations:w()})):c("selector missing")));)!1!==e&&(n.push(e),g(n));return n}function v(r){var e=r.exec(t);if(e){r=e[0];return s(r),t=t.slice(r.length),e}}function d(){v(/^\s*/)}function g(r){var e;for(r=r||[];e=function(){var r=u();if("/"!=t.charAt(0)||"*"!=t.charAt(1))return;var e=2;for(;""!=t.charAt(e)&&("*"!=t.charAt(e)||"/"!=t.charAt(e+1));)++e;if(e+=2,""===t.charAt(e-1))return c("End of comment missing");var n=t.slice(2,e-2);return o+=2,s(n),t=t.slice(e),o+=2,r({type:"comment",comment:n})}();)!1!==e&&r.push(e);return r}function y(){var r=v(/^([^{]+)/);if(r)return E(r[0]).replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g,"").replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g,function(r){return r.replace(/,/g,"‌")}).split(/\s*(?![^(]*\)),\s*/).map(function(r){return r.replace(/\u200C/g,",")})}function h(){var r=u(),e=v(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);if(e){if(e=E(e[0]),!v(/^:\s*/))return c("property missing ':'");var n=v(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/),n=r({type:"declaration",property:e.replace(k,""),value:n?E(n[0]).replace(k,""):""});return v(/^[;\s]*/),n}}function w(){var r,e=[];if(!p())return c("missing '{'");for(g(e);r=h();)!1!==r&&(e.push(r),g(e));return m()?e:c("missing '}'")}var r,b=e("import"),x=e("charset"),A=e("namespace");function e(t){var i=new RegExp("^@"+t+"\\s*([^;]+);");return function(){var r=u(),e=v(i);if(e){var n={type:t};return n[t]=e[1].trim(),r(n)}}}return function e(r,n){var t=r&&"string"==typeof r.type;var i=t?r:n;for(var o in r){var s=r[o];Array.isArray(s)?s.forEach(function(r){e(r,i)}):s&&"object"==typeof s&&e(s,i)}t&&Object.defineProperty(r,"parent",{configurable:!0,writable:!0,enumerable:!1,value:n||null});return r}((r=l(),{type:"stylesheet",stylesheet:{source:n.source,rules:r,parsingErrors:f}}))}},{}]},{},[1])(1)});

    /* jotform-css-parser.js 27-02-2018
     *
     * Misses a lot of classes
     *
     * How to use
     *
     *  var cssJsObject = new cssjs();
     *  var cssJsObjectParsed = cssJsObject.parseCSS(cssString);
     *
     * @link https://github.com/jotform/css.js
     * @link https://www.jotform.com/blog/writing-a-css-parser-in-javascript/ */
    //!function(e){"use strict";var t=function(){this.cssImportStatements=[],this.cssKeyframeStatements=[],this.cssRegex=new RegExp("([\\s\\S]*?){([\\s\\S]*?)}","gi"),this.cssMediaQueryRegex="((@media [\\s\\S]*?){([\\s\\S]*?}\\s*?)})",this.cssKeyframeRegex="((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})",this.combinedCSSRegex="((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",this.cssCommentsRegex="(\\/\\*[\\s\\S]*?\\*\\/)",this.cssImportStatementRegex=new RegExp("@import .*?;","gi")};t.prototype.stripComments=function(e){var t=new RegExp(this.cssCommentsRegex,"gi");return e.replace(t,"")},t.prototype.parseCSS=function(e){if(void 0===e)return[];for(var t=[];;){var s=this.cssImportStatementRegex.exec(e);if(null===s)break;this.cssImportStatements.push(s[0]),t.push({selector:"@imports",type:"imports",styles:s[0]})}e=e.replace(this.cssImportStatementRegex,"");for(var r,i=new RegExp(this.cssKeyframeRegex,"gi");null!==(r=i.exec(e));)t.push({selector:"@keyframes",type:"keyframes",styles:r[0]});e=e.replace(i,"");for(var n=new RegExp(this.combinedCSSRegex,"gi");null!==(r=n.exec(e));){var o="";o=void 0===r[2]?r[5].split("\r\n").join("\n").trim():r[2].split("\r\n").join("\n").trim();var l=new RegExp(this.cssCommentsRegex,"gi"),p=l.exec(o);if(null!==p&&(o=o.replace(l,"").trim()),-1!==(o=o.replace(/\n+/,"\n")).indexOf("@media")){var a={selector:o,type:"media",subStyles:this.parseCSS(r[3]+"\n}")};null!==p&&(a.comments=p[0]),t.push(a)}else{var c={selector:o,rules:this.parseRules(r[6])};"@font-face"===o&&(c.type="font-face"),null!==p&&(c.comments=p[0]),t.push(c)}}return t},t.prototype.parseRules=function(e){var t=[];e=(e=e.split("\r\n").join("\n")).split(";");for(var s=0;s<e.length;s++){var r=e[s];if(-1!==(r=r.trim()).indexOf(":")){var i=(r=r.split(":"))[0].trim(),n=r.slice(1).join(":").trim();if(i.length<1||n.length<1)continue;t.push({directive:i,value:n})}else"base64,"===r.trim().substr(0,7)?t[t.length-1].value+=r.trim():r.length>0&&t.push({directive:"",value:r,defective:!0})}return t},t.prototype.findCorrespondingRule=function(e,t,s){void 0===s&&(s=!1);for(var r=!1,i=0;i<e.length&&(e[i].directive!==t||(r=e[i],s!==e[i].value));i++);return r},t.prototype.findBySelector=function(e,t,s){void 0===s&&(s=!1);for(var r=[],i=0;i<e.length;i++)!1===s?e[i].selector===t&&r.push(e[i]):-1!==e[i].selector.indexOf(t)&&r.push(e[i]);if("@imports"===t||r.length<2)return r;var n=r[0];for(i=1;i<r.length;i++)this.intelligentCSSPush([n],r[i]);return[n]},t.prototype.deleteBySelector=function(e,t){for(var s=[],r=0;r<e.length;r++)e[r].selector!==t&&s.push(e[r]);return s},t.prototype.compressCSS=function(e){for(var t=[],s={},r=0;r<e.length;r++){var i=e[r];if(!0!==s[i.selector]){var n=this.findBySelector(e,i.selector);0!==n.length&&(t=t.concat(n),s[i.selector]=!0)}}return t},t.prototype.cssDiff=function(e,t){if(e.selector!==t.selector)return!1;if("media"===e.type||"media"===t.type)return!1;for(var s,r,i={selector:e.selector,rules:[]},n=0;n<e.rules.length;n++)s=e.rules[n],!1===(r=this.findCorrespondingRule(t.rules,s.directive,s.value))?i.rules.push(s):s.value!==r.value&&i.rules.push(s);for(var o=0;o<t.rules.length;o++)r=t.rules[o],!1===(s=this.findCorrespondingRule(e.rules,r.directive))&&(r.type="DELETED",i.rules.push(r));return 0!==i.rules.length&&i},t.prototype.intelligentMerge=function(e,t,s){void 0===s&&(s=!1);for(var r=0;r<t.length;r++)this.intelligentCSSPush(e,t[r],s);for(r=0;r<e.length;r++){var i=e[r];"media"!==i.type&&"keyframes"!==i.type&&(i.rules=this.compactRules(i.rules))}},t.prototype.intelligentCSSPush=function(e,t,s){var r=t.selector,i=!1;if(void 0===s&&(s=!1),!1===s){for(var n=0;n<e.length;n++)if(e[n].selector===r){i=e[n];break}}else for(var o=e.length-1;o>-1;o--)if(e[o].selector===r){i=e[o];break}if(!1===i)e.push(t);else if("media"!==t.type)for(var l=0;l<t.rules.length;l++){var p=t.rules[l],a=this.findCorrespondingRule(i.rules,p.directive);!1===a?i.rules.push(p):"DELETED"===p.type?a.type="DELETED":a.value=p.value}else i.subStyles=i.subStyles.concat(t.subStyles)},t.prototype.compactRules=function(e){for(var t=[],s=0;s<e.length;s++)"DELETED"!==e[s].type&&t.push(e[s]);return t},t.prototype.getCSSForEditor=function(e,t){void 0===t&&(t=0);var s="";void 0===e&&(e=this.css);for(var r=0;r<e.length;r++)"imports"===e[r].type&&(s+=e[r].styles+"\n\n");for(r=0;r<e.length;r++){var i=e[r];if(void 0!==i.selector){var n="";void 0!==i.comments&&(n=i.comments+"\n"),"media"===i.type?(s+=n+i.selector+"{\n",s+=this.getCSSForEditor(i.subStyles,t+1),s+="}\n\n"):"keyframes"!==i.type&&"imports"!==i.type&&(s+=this.getSpaces(t)+n+i.selector+" {\n",s+=this.getCSSOfRules(i.rules,t+1),s+=this.getSpaces(t)+"}\n\n")}}for(r=0;r<e.length;r++)"keyframes"===e[r].type&&(s+=e[r].styles+"\n\n");return s},t.prototype.getImports=function(e){for(var t=[],s=0;s<e.length;s++)"imports"===e[s].type&&t.push(e[s].styles);return t},t.prototype.getCSSOfRules=function(e,t){for(var s="",r=0;r<e.length;r++)void 0!==e[r]&&(void 0===e[r].defective?s+=this.getSpaces(t)+e[r].directive+": "+e[r].value+";\n":s+=this.getSpaces(t)+e[r].value+";\n");return s||"\n"},t.prototype.getSpaces=function(e){for(var t="",s=0;s<4*e;s++)t+=" ";return t},t.prototype.applyNamespacing=function(e,t){var s=e,r="."+this.cssPreviewNamespace;void 0!==t&&(r=t),"string"==typeof e&&(s=this.parseCSS(e));for(var i=0;i<s.length;i++){var n=s[i];if(!(n.selector.indexOf("@font-face")>-1||n.selector.indexOf("keyframes")>-1||n.selector.indexOf("@import")>-1||n.selector.indexOf(".form-all")>-1||n.selector.indexOf("#stage")>-1))if("media"!==n.type){for(var o=n.selector.split(","),l=[],p=0;p<o.length;p++)-1===o[p].indexOf(".supernova")?l.push(r+" "+o[p]):l.push(o[p]);n.selector=l.join(",")}else n.subStyles=this.applyNamespacing(n.subStyles,t)}return s},t.prototype.clearNamespacing=function(e,t){void 0===t&&(t=!1);var s=e,r="."+this.cssPreviewNamespace;"string"==typeof e&&(s=this.parseCSS(e));for(var i=0;i<s.length;i++){var n=s[i];if("media"!==n.type){for(var o=n.selector.split(","),l=[],p=0;p<o.length;p++)l.push(o[p].split(r+" ").join(""));n.selector=l.join(",")}else n.subStyles=this.clearNamespacing(n.subStyles,!0)}return!1===t?this.getCSSForEditor(s):s},t.prototype.createStyleElement=function(e,t,s){if(void 0===s&&(s=!1),!1===this.testMode&&"nonamespace"!==s&&(t=this.applyNamespacing(t)),"string"!=typeof t&&(t=this.getCSSForEditor(t)),!0===s&&(t=this.getCSSForEditor(this.parseCSS(t))),!1!==this.testMode)return this.testMode("create style #"+e,t);var r=document.getElementById(e);r&&r.parentNode.removeChild(r);var i=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.id=e,n.type="text/css",i.appendChild(n),n.styleSheet&&!n.sheet?n.styleSheet.cssText=t:n.appendChild(document.createTextNode(t))},e.cssjs=t}(this);

// ---------------------------------------------------------------------------------------------------------------------

    var runme = true;
    var getRemoteCss = false;

    var fontMonospace = "Courier New";
    var sizeMonospace = "13";
    var fontSansSerif = "Arial";
    var fontSerif = "Georgia";

    var manualFonts = [                     // Add manual fonts here for sites that use cross-origin domains for their
                                            // CSS or webmasters that don't provide a proper fallback font in their stack
        "Skin-market-sans|SANS-SERIF",      // ebay.com/itm/...
        "Market Sans|SANS-SERIF",           // ebay.com/sch/...
        "Google Sans|SANS-SERIF",           // developers.google.com/youtube/iframe_api_reference
        "FS Industrie|SANS-SERIF",          // leaguename.baseball.cbssports.com
        "FS Industrie Nw|SANS-SERIF",       // leaguename.baseball.cbssports.com
        "Barlow|SANS-SERIF",                // taxact.com
        "Open Sans|SANS-SERIF",             // taxact.com
        "Open Sans Condensed|SANS-SERIF",   // newegg.com
        "FontinRegular|SANS-SERIF",         // pathofexile.com
        "FontinSmallCaps|SANS-SERIF",       // poedb.tw/us/Claws#ModifiersCalc
        "ABC Ginto Normal|SANS-SERIF",      // discord.com
        "Whitney|SANS-SERIF",               // discord.com
        "Atlas Grotesk|SANS-SERIF",         // dropbox.com
        "Atlas Grotesk Web|SANS-SERIF",     // dropbox.com
        "Sharp Grotesk|SANS-SERIF",         // dropbox.com
        "Roboto|SANS-SERIF",                // unicode-table.com
        "Noto Sans|SANS-SERIF",             // blizzard.com
        "GeneralFont|SANS-SERIF",           // filterblade.xyz
        "Motiva Sans|SANS-SERIF",           // store.steampowered.com
        "Poppins|SANS-SERIF",               // fantasypros.com
    ];
    var regexIconFonts =
        new RegExp("(" +
            "icons?|" +             //
            "etmodules|" +          // Divi Builder for WordPress
            "etbuilder|" +          // Divi Builder for WordPress
            "cloudapp|" +           // Divi Builder for WordPress
            "font ?awesome|" +      // Filter for idiot webmasters who use a font stack of "Font Awesome, sans-serif"
            "icomoon|" +            // leaguename.baseball.cbssports.com
            "katfont|" +            // kickasstorrents.to
            "pcgamer" +             // pcgamer.com
        ")", "i");
    var regexMonospaceFonts =
        new RegExp("(" +
            "mono|" +               // developers.google.com/youtube/iframe_api_reference uses only "Roboto Mono"
            "consolas|" +           //
            "courier" +             //
        ")", "i");
    var regexSansSerifFonts =
        new RegExp("(" +
            "sans|" +               // daringfireball.net/projects/markdown/syntax uses only "Gill Sans MT", ebay.com/itm/255556173733 uses only "Skin-market-sans"
            "arial|" +              //
            "athletics|" +          // venmo.com
            "barlow|" +             // taxact.com
            "belwe|" +              // hearthstone.blizzard.com
            "grotesk|" +            // synonym for sans-serif
            "grotesque|" +          // synonym for sans-serif
            "helvetica|" +          //
            "impact|" +             // rantingly.com
            "inter|" +              // sunbank.com
            "montserrat|" +         // soffe.com
            "oswald|" +             // mainportal66.com
            "poppins|" +            // maingear.com
            "^roboto$|" +           // my.vultr.com
            "^segoe ui$|" +         //
            "tahoma|" +             //
            "trebuchet|" +          //
            "urwdin|" +             // kucoin.com
            "verdana" +             //
        ")", "i");
    var regexSerifFonts =
        new RegExp("(" +
            "serif|" +
            "georgia|" +
            "times" +
        ")", "i");

    if (runme) {
        setTimeout(function() {
            if (debug && !href.match(/(youtube|twitter)/i)) console.log("PRE-PROCESSING document.styleSheets for HREF", href, document.styleSheets);

            var manualFontFaceCssStr = printManualFonts(manualFonts);

            var manualDefaultCssStr = "";
            manualDefaultCssStr += "html, body { font-family: " + getBodyTagFontFamily() + " !important; }\n";
            manualDefaultCssStr += "pre, code, kbd, samp, pre *, code *, textarea { font-family: " + fontMonospace + ", monospace !important; font-size: " + sizeMonospace + "px !important; letter-spacing: normal !important; }\n";

            var combinedCssStr = "";
            combinedCssStr =
                "/* === $manualFontFaceCssStr === */\n" +
                manualFontFaceCssStr +
                "/* === buildFontFaceCssStr() === */\n" +
                buildFontFaceCssStr() + "\n" +
                "/* === buildSiteCssStr() === */\n" +
                buildSiteCssStr() + "\n" +
                "/* === $manualDefaultCssStr === */\n" +
                manualDefaultCssStr;
            combinedCssStr = combinedCssStr.trim();

            if (debug && !href.match(/(youtube|twitter)/i)) console.log("combinedCssStr for HREF", href, "\n", combinedCssStr);

                                            // Running both of these together works fine
                                            // Running order does not seem to matter
            addStylesTag(combinedCssStr);   // Used by itself without addStylesSheet() breaks google.com because they overwrite our rules in document.styleSheets
            addStylesSheet(combinedCssStr); // Used by itself without addStylesTag() works fine
                                            // addStylesSheet() is also known as a "constructed stylesheet" in Developer Tools
                                            // addStylesSheet() always takes precendence in the cascade over addStylesTag()
                                            // Running addStylesSheet() twice in this script breaks everything, probably the fault of the function

            if (debug && !href.match(/(youtube|twitter)/i)) console.log("POST-PROCESSING document.styleSheets for HREF", href, document.styleSheets);
        }, 100);
    }

// ---------------------------------------------------------------------------------------------------------------------

    function printManualFonts(arr) {
        let str = "";

        for (let i = 0; i < arr.length; i++) {
            let fonts = arr[i].split("|");

            //for (let n = 0; n < fonts.length; n++) {
                //console.log("[" + n + "]: " + fonts[n]);
                // [0]: Inconsolata
                // [1]: MONSPACE
                // [0]: Skin-market-sans
                // [1]: SANS-SERIF

                if (fonts[1].match(/^MONOSPACE$/)) {
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: normal; src: local("' + fontMonospace + '"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: normal; src: local("' + fontMonospace + '"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: normal; src: local("' + fontMonospace + '"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: normal; src: local("' + fontMonospace + '"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: normal; src: local("' + fontMonospace + '"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: normal; src: local("' + fontMonospace + ' Bold"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: normal; src: local("' + fontMonospace + ' Bold"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: normal; src: local("' + fontMonospace + ' Bold"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: normal; src: local("' + fontMonospace + ' Bold"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: normal; src: local("' + fontMonospace + ' Bold"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: italic; src: local("' + fontMonospace + ' Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: italic; src: local("' + fontMonospace + ' Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: italic; src: local("' + fontMonospace + ' Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: italic; src: local("' + fontMonospace + ' Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: italic; src: local("' + fontMonospace + ' Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: italic; src: local("' + fontMonospace + ' Bold Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: italic; src: local("' + fontMonospace + ' Bold Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: italic; src: local("' + fontMonospace + ' Bold Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: italic; src: local("' + fontMonospace + ' Bold Italic"); size-adjust: 81.25%; }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: italic; src: local("' + fontMonospace + ' Bold Italic"); size-adjust: 81.25%; }\n';
                }
                else if (fonts[1].match(/^SANS-SERIF$/)) {
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: normal; src: local("' + fontSansSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: normal; src: local("' + fontSansSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: normal; src: local("' + fontSansSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: normal; src: local("' + fontSansSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: normal; src: local("' + fontSansSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: normal; src: local("' + fontSansSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: normal; src: local("' + fontSansSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: normal; src: local("' + fontSansSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: normal; src: local("' + fontSansSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: normal; src: local("' + fontSansSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: italic; src: local("' + fontSansSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: italic; src: local("' + fontSansSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: italic; src: local("' + fontSansSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: italic; src: local("' + fontSansSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: italic; src: local("' + fontSansSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: italic; src: local("' + fontSansSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: italic; src: local("' + fontSansSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: italic; src: local("' + fontSansSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: italic; src: local("' + fontSansSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: italic; src: local("' + fontSansSerif + ' Bold Italic"); }\n';
                }
                else if (fonts[1].match(/^SERIF$/)) {
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: normal; src: local("' + fontSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: normal; src: local("' + fontSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: normal; src: local("' + fontSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: normal; src: local("' + fontSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: normal; src: local("' + fontSerif + '"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: normal; src: local("' + fontSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: normal; src: local("' + fontSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: normal; src: local("' + fontSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: normal; src: local("' + fontSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: normal; src: local("' + fontSerif + ' Bold"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 100; font-style: italic; src: local("' + fontSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 200; font-style: italic; src: local("' + fontSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 300; font-style: italic; src: local("' + fontSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 400; font-style: italic; src: local("' + fontSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 500; font-style: italic; src: local("' + fontSerif + ' Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 550; font-style: italic; src: local("' + fontSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 600; font-style: italic; src: local("' + fontSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 700; font-style: italic; src: local("' + fontSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 800; font-style: italic; src: local("' + fontSerif + ' Bold Italic"); }\n';
                    str += '@font-face { font-display: swap; font-family: ' + fonts[0] + '; font-weight: 900; font-style: italic; src: local("' + fontSerif + ' Bold Italic"); }\n';
                }
            //}
        }
        return str;
    }

// ---------------------------------------------------------------------------------------------------------------------

    // buildSiteCssStr - Parse the site stylesheet files and replace their font-family with ours
    //
    // @return string
    //  ":root {
    //       --font-family-sans-serif: Arial, sans-serif !important;
    //       --font-family-monospace: Courier New, monospace !important;
    //   }
    //   html { font-family: Arial, sans-serif !important; }
    //   body { font-family: Arial, sans-serif !important; }
    //   .tooltip { font-family: Arial, sans-serif !important; }
    //   .popover { font-family: Arial, sans-serif !important; }
    //   code, kbd, pre, samp { font-family: Courier New, monospace !important; font-size: 13px !important; letter-spacing: normal !important; }
    //   .text-monospace { font-family: Courier New, monospace !important; font-size: 13px !important; letter-spacing: normal !important; }"

    function buildSiteCssStr() {
        let allSheets = document.styleSheets;

        let sheetTextLocal = "";
        let sheetTextRemote = "";

        let importHrefs = [];
        let crossDomainHrefs = [];
        let remoteSheetHrefs = [];

        // Build sheetTextLocal string, get @import and cross-domain hrefs

        for (let i = 0; i < allSheets.length; i++) {
            try { // Get all @import hrefs
                for (let n = 0; n < allSheets[i].cssRules.length; n++) {
                    if (allSheets[i].cssRules[n].cssText.match(/^@import/i)) {
                        importHrefs.push(allSheets[i].cssRules[n].href);
                    }
                    else if (allSheets[i].cssRules[n].selectorText) { // selectorText = aside
                        sheetTextLocal += allSheets[i].cssRules[n].cssText + " "; // cssText = aside { font: 16px "Times New Roman", serif; }
                    }
                }
            }
            catch (error) { // Get all cross-domain hrefs
                //if (debug && !href.match(/(youtube|twitter)/i)) console.log("Cannot read HREF: SHEET[" + i + "]: getSiteStylesStr(): " + allSheets[i].href);

                crossDomainHrefs.push(allSheets[i].href);
            }
        }
        remoteSheetHrefs = [...importHrefs, ...crossDomainHrefs];

        //console.log("importHrefs", importHrefs);
        //console.log("crossDomainHrefs", crossDomainHrefs);
        //console.log("remoteSheetHrefs", remoteSheetHrefs);
        //console.log("sheetTextLocal", sheetTextLocal);

        // Maybe get remote stylesheets

        if (getRemoteCss) {
            if (remoteSheetHrefs.length) {
                for (let i = 0; i < remoteSheetHrefs.length; i++) {
                    let xhr = new XMLHttpRequest();

                    xhr.open("GET", remoteSheetHrefs[i], false); // Set true to enable async

                    try {
                        xhr.send();
                    }
                    catch (error) {
                        //console.log("Cannot read remote sheet string", remoteSheetHrefs[i]);
                    }
                    if (xhr.status == 200) {
                        sheetTextRemote += xhr.responseText;
                    }
                }
            }
        }
        //console.log("sheetTextRemote", sheetTextRemote);

        // Build customCss variable

        let sheetTextAll = sheetTextLocal + sheetTextRemote;

        let selectorText = "";
        let rulesArray = [];
        let directiveText = "";
        let valueText = "";

        let rootSelectorMonospace = "";
        let rootSelectorSansSerif = "";
        let rootSelectorSerif = "";

        let selectorMonospace = "";
        let selectorSansSerif = "";
        let selectorSerif = "";

        if (sheetTextAll) {
            let cssJsObjectParsed = css.parse(sheetTextAll, {silent: "silent"});
            let rules = cssJsObjectParsed.stylesheet.rules; // [ { "type": "rule", "selectors": [ "body" ],

            for (let i = 0; i < rules.length; i++) {
                let selectorsArr = rules[i].selectors; // [ "div.editWaiverForm", "div.editBudgetForm" ]
                let declarationsArr = rules[i].declarations; // [ { "property": "display", "value": "none" } ]
                let selectorText = "";

                if (selectorsArr && declarationsArr) {
                    for (let n = 0; n < selectorsArr.length; n++) {
                            selectorText += selectorsArr[n] + ", ";
                    }
                    selectorText = selectorText.replace(/, $/, ""); // "div.editWaiverForm, div.editBudgetForm"
                }
                if (selectorText && declarationsArr) {
                    if (!selectorText.match(/^(\*|@)/)) {
                        for (let x = 0; x < declarationsArr.length; x++) {
                            directiveText = declarationsArr[x].property; // font-weight || font-family
                            valueText = declarationsArr[x].value; // "FS Industrie","Helvetica","Arial",sans-serif

                            if (selectorText.match(/^:root$/i)) {
                                if (valueText.match(regexMonospaceFonts)) {
                                    rootSelectorMonospace += "    " + directiveText + ": " + fontMonospace + ", monospace !important;\n";
                                }
                                else if (valueText.match(regexSansSerifFonts)) {
                                    rootSelectorSansSerif += "    " + directiveText + ": " + fontSansSerif + ", sans-serif !important;\n";
                                }
                                else if (valueText.match(regexSerifFonts)) {
                                    rootSelectorSerif += "    " + directiveText + ": " + fontSerif + ", sans-serif !important;\n";
                                }
                            }
                            else if (directiveText.match(/^(font|font-family)$/i)) {
                                if (valueText.match(regexMonospaceFonts) && !valueText.match(regexIconFonts)) {
                                    selectorMonospace += selectorText + " { font-family: " + fontMonospace + ", monospace !important; font-size: " + sizeMonospace + "px !important; letter-spacing: normal !important; }\n";
                                }
                                else if (valueText.match(regexSansSerifFonts) && !valueText.match(regexIconFonts)) {
                                    selectorSansSerif += selectorText + " { font-family: " + fontSansSerif + ", sans-serif !important; }\n";
                                }
                                else if (valueText.match(regexSerifFonts) && !valueText.match(regexIconFonts)) {
                                    selectorSerif += selectorText + " { font-family: " + fontSerif + ", sans-serif !important; }\n";
                                }
                            }
                        }
                    }
                }
            }
        }
        let rootCss = "";
        let otherCss = "";
        let customCss = "";

        if (rootSelectorSansSerif || rootSelectorSerif || rootSelectorMonospace) {
            rootCss = ":root {\n" + rootSelectorSansSerif + rootSelectorSerif + rootSelectorMonospace + "}\n";
        }
        if (selectorSansSerif || selectorSerif || selectorMonospace) {
            otherCss = selectorSansSerif + selectorSerif + selectorMonospace;
        }
        customCss = rootCss + otherCss;
        customCss = customCss.trim();

        return customCss;
    }

// ---------------------------------------------------------------------------------------------------------------------

    // getBodyTagFontFamily - Gets the real body tag font-family
    //
    // @return string "Arial" || "Times New Roman"

    function getBodyTagFontFamily() {
        let str = "";
        let bodyTag = document.querySelector("body");
        let bodyTagStyles = window.getComputedStyle(bodyTag);
        let bodyFontFamily = bodyTagStyles.fontFamily;

        if (bodyFontFamily.match(regexMonospaceFonts)) {
            str = fontMonospace;
        }
        else if (bodyFontFamily.match(regexSansSerifFonts)) {
            str = fontSansSerif;
        }
        else if (bodyFontFamily.match(regexSerifFonts)) {
            str = fontSerif;

            // We need to double-check if we find serif for the body tag font-family

            for (let i = 0; i < document.styleSheets.length; i++) {
                let sheet = document.styleSheets[i];

                try {
                    let ruleSet = sheet.rules || sheet.cssRules;

                    for (let n = 0; n < ruleSet.length; n++) {
                        let rule = ruleSet[n];

                        if (!rule.selectorText) {
                            continue;
                        }
                        if (rule.selectorText.match(/\bbody\b/i) && rule.style.fontFamily !== "") {
                            if (rule.style.fontFamily.match(regexSansSerifFonts)) {
                                if (debug && !href.match(/(youtube|twitter)/i)) console.log("CORRECTION, THE BODY TAG FONT IS ACTUALLY SANS-SERIF:", rule.style.fontFamily);

                                str = fontSansSerif;

                                break;
                            }
                        }
                    }
                }
                catch (error) {
                    //if (debug && !href.match(/(youtube|twitter)/i)) console.log("Cannot read HREF: SHEET[" + i + "]: getBodyTagFontFamily(): " + sheet.href);
                }
            }
        }
        return str;
    }

// ---------------------------------------------------------------------------------------------------------------------

// CURRENT WORKING

    // getFontsViaDocumentStyleSheets - Get all fonts used by the page via document.styleSheets
    //
    // @return array
    //  [
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|400|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|700|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|600|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|400|italic|SANS-SERIF-FONT",
    //      "Georgia, Cambria, \"Times New Roman\", Times, serif|400|normal|SERIF-FONT",
    //      "ui-monospace, \"Cascadia Mono\", \"Segoe UI Mono\", \"Liberation Mono\", Menlo, Monaco, Consolas, monospace|400|normal|MONOSPACE-FONT"
    //  ]

    function getFontsViaDocumentStyleSheets() {
        let allSheets = document.styleSheets;
        let str = "";
        let arr = [];
        let monoSelectorsCssStr = "";

        for (let i = 0; i < allSheets.length; i++) {
            try {
                let sheetCssRules = allSheets[i].cssRules; // object CSSRuleList { "0": {...}, "1": {...}, "2": {...} }

                for (let n = 0; n < sheetCssRules.length; n++) {
                    let rule = sheetCssRules[n]; // object CSSStyleRule | CSSFontFaceRule { "cssText": "html { height: 100%; }", "selectorText": "html", "style": { "0": ..., "1": ..., "2": ... }  }
                    if (rule.selectorText) {
                        let styles = rule.style; // object CSSStyleDeclaration { "0": "--supported", ... }

                        if (rule.selectorText === ":root") {
                            for (let z = 0; z < styles.length; z++) {
                                let rootProperty = styles[z]; // "--supported"
                                let rootValue = styles.getPropertyValue(rootProperty); // "#2A8436"

                                if (rootValue &&  !rootValue.match(/(initial|inherit|unset|var ?\(|^a$|^monospace|^sans-serif|^serif|[=&])/i)) {
                                    if (rootValue.match(regexIconFonts)) { // Filter for icon font stacks that include serif/sans-serif
                                        //console.log(">>> FOUND ICON FONT ON :ROOT PROPERTY:", rootProperty, "WITH VALUE", rootValue);

                                        let strCheck = rootValue + "|400|normal|ICON-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(rootValue + "|400|normal|ICON-FONT");
                                        }
                                    }
                                    else if (rootValue.match(regexMonospaceFonts) && !rootValue.match(regexSansSerifFonts) && !rootValue.match(regexSerifFonts) && !rootValue.match(regexIconFonts)) { // Find all monospace fonts
                                        //console.log(">>> FOUND MONOSPACE FONT ON :ROOT PROPERTY:", rootProperty, "WITH VALUE", rootValue);

                                        let strCheck = rootValue + "|400|normal|MONOSPACE-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(rootValue + "|100|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|200|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|300|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|400|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|500|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|550|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|600|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|700|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|800|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|900|normal|MONOSPACE-FONT");
                                            arr.push(rootValue + "|100|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|200|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|300|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|400|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|500|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|550|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|600|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|700|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|800|italic|MONOSPACE-FONT");
                                            arr.push(rootValue + "|900|italic|MONOSPACE-FONT");
                                        }
                                    }
                                    else if (rootValue.match(regexSansSerifFonts) && !rootValue.match(regexMonospaceFonts) && !rootValue.match(regexIconFonts)) { // Find all sans-serif fonts
                                        //console.log(">>> FOUND SANS-SERIF FONT ON :ROOT PROPERTY:", rootProperty, "WITH VALUE", rootValue);

                                        let strCheck = rootValue + "|400|normal|SANS-SERIF-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(rootValue + "|100|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|200|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|300|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|400|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|500|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|550|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|600|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|700|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|800|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|900|normal|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|100|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|200|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|300|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|400|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|500|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|550|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|600|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|700|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|800|italic|SANS-SERIF-FONT");
                                            arr.push(rootValue + "|900|italic|SANS-SERIF-FONT");
                                        }
                                    }
                                    else if (rootValue.match(regexSerifFonts) && !rootValue.match(regexMonospaceFonts) && !rootValue.match(regexIconFonts)) { // Find all serif fonts
                                        //console.log(">>> FOUND SERIF FONT ON :ROOT PROPERTY:", rootProperty, "WITH VALUE", rootValue);

                                        let strCheck = rootValue + "|400|normal|SANS-SERIF-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(rootValue + "|100|normal|SERIF-FONT");
                                            arr.push(rootValue + "|200|normal|SERIF-FONT");
                                            arr.push(rootValue + "|300|normal|SERIF-FONT");
                                            arr.push(rootValue + "|400|normal|SERIF-FONT");
                                            arr.push(rootValue + "|500|normal|SERIF-FONT");
                                            arr.push(rootValue + "|550|normal|SERIF-FONT");
                                            arr.push(rootValue + "|600|normal|SERIF-FONT");
                                            arr.push(rootValue + "|700|normal|SERIF-FONT");
                                            arr.push(rootValue + "|800|normal|SERIF-FONT");
                                            arr.push(rootValue + "|900|normal|SERIF-FONT");
                                            arr.push(rootValue + "|100|italic|SERIF-FONT");
                                            arr.push(rootValue + "|200|italic|SERIF-FONT");
                                            arr.push(rootValue + "|300|italic|SERIF-FONT");
                                            arr.push(rootValue + "|400|italic|SERIF-FONT");
                                            arr.push(rootValue + "|500|italic|SERIF-FONT");
                                            arr.push(rootValue + "|550|italic|SERIF-FONT");
                                            arr.push(rootValue + "|600|italic|SERIF-FONT");
                                            arr.push(rootValue + "|700|italic|SERIF-FONT");
                                            arr.push(rootValue + "|800|italic|SERIF-FONT");
                                            arr.push(rootValue + "|900|italic|SERIF-FONT");
                                        }
                                    }
                                    else { // Else we found no "monospace, serif, sans-serif" font-family
                                        //console.log(">>> FOUND NO FONT-FAMILY IN :ROOT AT PROPERTY", rootProperty, "WITH VALUE", rootValue);
                                    }
                                }
                            }
                        }
                        else {
                            for (let z = 0; z < styles.length; z++) {
                                let stdProperty = styles[z]; // "font-weight"
                                let stdValue = styles.getPropertyValue(stdProperty); // "700"

                                if (stdValue && stdProperty.match(/^font-family$/i) && !stdValue.match(/(initial|inherit|unset|var ?\(|^a$|^monospace|^sans-serif|^serif|[=&])/i)) {
                                    if (stdValue.match(regexIconFonts)) { // Filter for icon font stacks that include serif/sans-serif
                                        let strCheck = stdValue + "|400|normal|ICON-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(stdValue + "|400|normal|ICON-FONT");
                                        }
                                        //console.log(">>> FOUND ICON FONT ON STANDARD SELECTOR:", stdProperty, "WITH VALUE", stdValue);
                                    }
                                    else if (stdValue.match(regexMonospaceFonts) && !stdValue.match(regexSansSerifFonts) && !stdValue.match(regexSerifFonts) && !stdValue.match(regexIconFonts)) { // Find all monospace fonts
                                        let strCheck = stdValue + "|400|normal|MONOSPACE-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(stdValue + "|100|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|200|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|300|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|400|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|500|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|550|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|600|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|700|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|800|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|900|normal|MONOSPACE-FONT");
                                            arr.push(stdValue + "|100|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|200|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|300|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|400|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|500|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|550|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|600|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|700|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|800|italic|MONOSPACE-FONT");
                                            arr.push(stdValue + "|900|italic|MONOSPACE-FONT");
                                        }
                                        rule.style.fontFamily = fontMonospace;
                                        rule.style.fontSize = sizeMonospace + "px";
                                        rule.style.letterSpacing = "normal";

                                        monoSelectorsCssStr += rule.selectorText + ", ";

                                        //console.log(">>> FOUND MONOSPACE FONT ON STANDARD SELECTOR:", stdProperty, "WITH VALUE", stdValue);
                                    }
                                    else if (stdValue.match(regexSansSerifFonts) && !stdValue.match(regexMonospaceFonts) && !stdValue.match(regexIconFonts)) { // Find all sans-serif fonts
                                        let strCheck = stdValue + "|400|normal|SANS-SERIF-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(stdValue + "|100|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|200|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|300|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|400|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|500|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|550|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|600|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|700|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|800|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|900|normal|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|100|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|200|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|300|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|400|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|500|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|550|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|600|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|700|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|800|italic|SANS-SERIF-FONT");
                                            arr.push(stdValue + "|900|italic|SANS-SERIF-FONT");
                                        }
                                        //console.log(">>> FOUND SANS-SERIF FONT ON STANDARD SELECTOR:", stdProperty, "WITH VALUE", stdValue);
                                    }
                                    else if (stdValue.match(regexSerifFonts) && !stdValue.match(regexMonospaceFonts) && !stdValue.match(regexIconFonts)) { // Find all serif fonts
                                        let strCheck = stdValue + "|400|normal|SERIF-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(stdValue + "|100|normal|SERIF-FONT");
                                            arr.push(stdValue + "|200|normal|SERIF-FONT");
                                            arr.push(stdValue + "|300|normal|SERIF-FONT");
                                            arr.push(stdValue + "|400|normal|SERIF-FONT");
                                            arr.push(stdValue + "|500|normal|SERIF-FONT");
                                            arr.push(stdValue + "|550|normal|SERIF-FONT");
                                            arr.push(stdValue + "|600|normal|SERIF-FONT");
                                            arr.push(stdValue + "|700|normal|SERIF-FONT");
                                            arr.push(stdValue + "|800|normal|SERIF-FONT");
                                            arr.push(stdValue + "|900|normal|SERIF-FONT");
                                            arr.push(stdValue + "|100|italic|SERIF-FONT");
                                            arr.push(stdValue + "|200|italic|SERIF-FONT");
                                            arr.push(stdValue + "|300|italic|SERIF-FONT");
                                            arr.push(stdValue + "|400|italic|SERIF-FONT");
                                            arr.push(stdValue + "|500|italic|SERIF-FONT");
                                            arr.push(stdValue + "|550|italic|SERIF-FONT");
                                            arr.push(stdValue + "|600|italic|SERIF-FONT");
                                            arr.push(stdValue + "|700|italic|SERIF-FONT");
                                            arr.push(stdValue + "|800|italic|SERIF-FONT");
                                            arr.push(stdValue + "|900|italic|SERIF-FONT");
                                        }
                                        //console.log(">>> FOUND SERIF FONT ON STANDARD SELECTOR:", stdProperty, "WITH VALUE", stdValue);
                                    }
                                    else { // Else we found no "monospace, serif, sans-serif" font-family or a contradictory font stack, e.g. "Arial, monospace"
                                        let strCheck = stdValue + "|400|normal|UNKNOWN-FONT";

                                        if (arr.indexOf(strCheck) === -1) {
                                            arr.push(stdValue + "|400|normal|UNKNOWN-FONT");
                                        }
                                        console.log(">>> FOUND UNKNOWN OR CONTRADICTORY FONT-FAMILY WITH SELECTORTEXT", rule.selectorText, "WITH VALUE", stdValue);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        // Do nothing, there is no rule.selectorText
                    }
                }
            }
            catch (error) {
                //console.log("Cannot read HREF: SHEET[" + i + "]: getFontsViaDocumentStyleSheets(): " + allSheets[i].href);
            }
        }
        monoSelectorsCssStr = monoSelectorsCssStr.replace(/, $/, "");
        monoSelectorsCssStr = monoSelectorsCssStr + " { font-family: " + fontMonospace + "; font-size: " + sizeMonospace + "px !important; letter-spacing: normal !important; }";

        if (!monoSelectorsCssStr.match(/^ {/)) {
            addStylesTag(monoSelectorsCssStr);

            if (debug && !href.match(/(youtube|twitter)/i)) console.log("monoSelectorsCssStr for HREF", href, "\n", monoSelectorsCssStr);
        }
        return arr;
    }

// ---------------------------------------------------------------------------------------------------------------------

// PREVIOUS WORKING

    // getFontsViaGetComputedStyle - Get all fonts used by the page via getComputedStyle
    //
    // @link https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
    //
    // @return array
    //  [
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|400|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|700|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|600|normal|SANS-SERIF-FONT",
    //      "-apple-system, BlinkMacSystemFont, \"Segoe UI Adjusted\", \"Segoe UI\", \"Liberation Sans\", sans-serif|400|italic|SANS-SERIF-FONT",
    //      "Georgia, Cambria, \"Times New Roman\", Times, serif|400|normal|SERIF-FONT",
    //      "ui-monospace, \"Cascadia Mono\", \"Segoe UI Mono\", \"Liberation Mono\", Menlo, Monaco, Consolas, monospace|400|normal|MONOSPACE-FONT"
    //  ]

    function getFontsViaGetComputedStyle() {
        let elementBody = document.getElementsByTagName("body");      // object HTMLCollection(1)
        let elementBodyAll = document.body.getElementsByTagName("*"); // object HTMLCollection(42)
        let elements = []                                             // array(43)
            .concat(Array.from(elementBody))
            .concat(Array.from(elementBodyAll));

        let str = "";
        let arr = [];

        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];                    // object HTMLBodyElement, "div.header"
            let elementStyle = getComputedStyle(element); // object CSSStyleDeclaration(332)

            str = elementStyle.fontFamily + "|" + elementStyle.fontWeight + "|" + elementStyle.fontStyle;

            if (elementStyle.fontFamily.match(regexIconFonts)) { // Filter for icon font stacks that include serif/sans-serif
                str += "|ICON-FONT";

                if (arr.indexOf(str) === -1) {
                    arr.push(str);
                }
                //console.log(">>> FOUND ICON FONT: " + elementStyle.fontFamily + " on ", element);
            }
            else if (elementStyle.fontFamily.match(regexMonospaceFonts)) { // Find all monospace fonts
                str += "|MONOSPACE-FONT";

                if (!str.match(/^(monospace|"courier)/i) && arr.indexOf(str) === -1) {
                    arr.push(str);
                }
                if (elementStyle.fontSize !== sizeMonospace + "px") {
                    element.style.setProperty("font-size", sizeMonospace + "px", "important"); // Append (not replace) style attribute contents
                    //element.setAttribute("style", "font-size: 13px !important;"); // Replace (not append) style attribute contents
                }
                if (elementStyle.letterSpacing !== "normal") {
                    element.style.setProperty("letter-spacing", "normal", "important");
                }
                //console.log(">>> FOUND MONOSPACE FONT: " + elementStyle.fontFamily + " on ", element);
            }
            else if (elementStyle.fontFamily.match(regexSansSerifFonts)) { // Find all sans-serif fonts
                str += "|SANS-SERIF-FONT";

                if (!str.match(/^(sans-serif|arial)/i) && arr.indexOf(str) === -1) {
                    arr.push(str);
                }
                //console.log(">>> FOUND SANS-SERIF FONT: " + elementStyle.fontFamily + " on ", element);
            }
            else if (elementStyle.fontFamily.match(regexSerifFonts)) { // Find all serif fonts
                str += "|SERIF-FONT";

                if (!str.match(/^(serif|"times)/i) && arr.indexOf(str) === -1) {
                    arr.push(str);
                }
                //console.log(">>> FOUND SERIF FONT: " + elementStyle.fontFamily + " on ", element);
            }
            else { // Else we found no "monospace, serif, sans-serif" font-family for this element
                str += "|UNKNOWN-FONT";

                if (arr.indexOf(str) === -1) {
                    arr.push(str);
                }
                console.log(">>> FOUND UNKNOWN FONT: It is either an icon font or a webmaster used a font stack without any basic fallbacks. " +
                            "You may want to add this font to the plugin. The element font-family string is:", elementStyle.fontFamily);
            }
        }
        return arr;
    }

// ---------------------------------------------------------------------------------------------------------------------

    // buildFontFaceCssStr - Build CSS string for the page
    //
    // @return string
    // "@font-face { font-display: swap; font-family: -apple-system; font-weight: 400; font-style: normal; src: local("Arial"); }
    //  @font-face { font-display: swap; font-family: -apple-system; font-weight: 700; font-style: normal; src: local("Arial Bold"); }
    //  @font-face { font-display: swap; font-family: -apple-system; font-weight: 600; font-style: normal; src: local("Arial Bold"); }
    //  @font-face { font-display: swap; font-family: -apple-system; font-weight: 400; font-style: italic; src: local("Arial Italic"); }
    //  @font-face { font-display: swap; font-family: Georgia; font-weight: 400; font-style: normal; src: local("Times New Roman"); }
    //  @font-face { font-display: swap; font-family: ui-monospace; font-weight: 400; font-style: normal; src: local("Courier New");"

    function buildFontFaceCssStr() {
        //let fontsArr = getFontsViaGetComputedStyle(); // Works better, but huge performance degredation
        let fontsArr = getFontsViaDocumentStyleSheets(); // Works good...

        let arr = [];
        let deleteArray = [];

        for (let i = 0; i < fontsArr.length; i++) {
            let items = fontsArr[i].split("|");

            for (let n = 0; n < items.length; n++) {
                //console.log("[" + n + "]: " + items[n]);
                // [0]: Courier, monospace
                // [1]: 400
                // [2]: normal
                // [3]: MONOSPACE-FONT

                if (items[n] === "MONOSPACE-FONT" && !items[0].match(/courier new/i)) {

                    let fontName = items[0].split(",");
                    let fontWeight = items[1] >= 550 ? " Bold" : "";
                    let fontStyle = items[2] === "italic" ? " Italic" : "";

                    arr.push(
                        "@font-face { font-display: swap; font-family: " + fontName[0].trim() + "; " +
                        "font-weight: " + items[1] + "; " +
                        "font-style: " + items[2] + "; " +
                        'src: local("' + fontMonospace + fontWeight + fontStyle + '"); ' +
                        "size-adjust: 81.25%; }"
                    );
                    deleteArray.push(fontName[0].trim());

                    //console.log(">>> FOUND MONOSPACE FONT:", fontsArr[i]);
                }
                else if (items[n] === "SANS-SERIF-FONT") {
                    let fontName = items[0].split(",");
                    let fontWeight = items[1] >= 550 ? " Bold" : "";
                    let fontStyle = items[2] === "italic" ? " Italic" : "";

                    arr.push(
                        "@font-face { font-display: swap; font-family: " + fontName[0].trim() + "; " +
                        "font-weight: " + items[1] + "; " +
                        "font-style: " + items[2] + "; " +
                        'src: local("' + fontSansSerif + fontWeight + fontStyle + '"); }'
                    );
                    deleteArray.push(fontName[0].trim());

                    //console.log(">>> FOUND SANS-SERIF FONT:", fontsArr[i]);
                }
                else if (items[n] === "SERIF-FONT") {
                    let fontName = items[0].split(",");
                    let fontWeight = items[1] >= 550 ? " Bold" : "";
                    let fontStyle = items[2] === "italic" ? " Italic" : "";

                    arr.push(
                        "@font-face { font-display: swap; font-family: " + fontName[0].trim() + "; " +
                        "font-weight: " + items[1] + "; " +
                        "font-style: " + items[2] + "; " +
                        'src: local("' + fontSerif + fontWeight + fontStyle + '"); }' // To use sans-serif fonts everywhere, change "Times New Roman" to "Arial" here
                    );
                    deleteArray.push(fontName[0].trim());

                    //console.log("FOUND SERIF:", fontsArr[i]);
                }
                else if (items[n] === "UNKNOWN-FONT") {
                    //console.log(">>> FOUND UNKNOWN FONT:", fontsArr[i]);
                }
            }
        }
        // Remove duplicates from arrays
        //
        // @link https://stackoverflow.com/a/14438954
        arr = [...new Set(arr)];
        deleteArray = [...new Set(deleteArray)];

        // Build final string
        let str = "";

        for (let i = 0; i < arr.length; i++) {
            str += arr[i] + "\n";
        }
        str = str.trim();

        deleteAtFontFaceRule(deleteArray);

        return str;
    }

// ---------------------------------------------------------------------------------------------------------------------

    // deleteAtFontFaceRule - Delete @font-face rules from document.styleSheets
    //
    // @param fontName string|array

    function deleteAtFontFaceRule(fontName) {
        if (!Array.isArray(fontName)) {
            fontName = [fontName];
        }
        for (let i = 0; i < document.styleSheets.length; i++) {
            let sheet = document.styleSheets[i];

            try {
                let ruleSet = sheet.rules || sheet.cssRules;

                for (let n = 0; n < ruleSet.length; n++) {
                    let rule = ruleSet[n];

                    for (let x = 0; x < fontName.length; x++) {
                        let font = fontName[x];
                        let regex = new RegExp("\\b" + font + "\\b", "i");

                        if (rule.cssText.match(/^@font-face\b/i) && rule.cssText.match(regex)) {
                            //if (debug && !href.match(/(youtube|twitter)/i)) console.log("Deleting CSS @font-face rule", rule);

                            sheet.deleteRule(n--);
                        }
                    }
                }
            }
            catch (e) {
                //if (debug && !href.match(/(youtube|twitter)/i)) console.log("Cannot read HREF: SHEET[" + i + "]: deleteAtFontFaceRule(): " + sheet.href);
            }
        }
    }

// ---------------------------------------------------------------------------------------------------------------------

    // Adds one document.styleSheets object to the page
    //
    // 0.04 ms
    // document.styleSheets goes from 7 to 8 [8], 7 to 8 [8]
    // github monospace test: 50/50

    function addStylesSheet(str) {
        let stylesheet = new CSSStyleSheet();

        stylesheet.replaceSync(str);
        document.adoptedStyleSheets = [stylesheet];
    }

    // Adds num style tags and document.styleSheets objects to the page
    //
    // 0.12 ms
    // document.styleSheets goes from 7 to 8 [7], 8 to 8 [7]
    // github monospace test: 50/50

    function addStylesTag(str) {
        let styleElement = document.createElement("style");

        styleElement.textContent = str;
        document.head.appendChild(styleElement);
    }

// ---------------------------------------------------------------------------------------------------------------------

    // JavaScript code profiler
    //
    // @link https://stackoverflow.com/a/17943511

//    let iterations = 1;
//
//    console.time("Function 1");
//    for (let i = 0; i < iterations; i++) {
//        addStylesTag(str);
//    }
//    console.timeEnd("Function 1");
//
//    console.time("Function 2");
//    for (let i = 0; i < iterations; i++) {
//        addStylesSheet(str);
//    }
//    console.timeEnd("Function 2");

// ---------------------------------------------------------------------------------------------------------------------

    if (debug && !href.match(/(youtube|twitter)/i)) console.log("=== Force My Browser Fonts Stop ===");

// ---------------------------------------------------------------------------------------------------------------------
