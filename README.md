# Force My Browser Fonts
A Chrome extension that forces websites to substitute the fonts you choose for serif, sans-serif and monospace, while trying not to break icon fonts.

*Force My Browser Fonts* is currently the best way to force Chromium-based browsers to substitute the fonts you choose for serif, sans-serif and monospace without breaking icon fonts.

My hope is that someone will edit/fork this repo and make it better because (1) I don't know how to write javascript and (2) I don't know how to write Chromium extensions.

If you know of a more comprehensive script/extension, please let me know and I'll add a note to the top of this repo and archive it.

The work here was done purely out of desperation to ***Force My Browser Fonts***.

# Why?
Because anti-aliased fonts are hard to read or look "dirty" to many people, and most fonts look awful with font smoothing disabled.

Please don't get me started on the disastrous state of modern web design trends... e.g. mobile-first, icon-based-fonts, subpixel-font-rendering...

# Development Gotchas
- Webmasters that don't use a base fallback font -- *for the love of sweet baby jesus, give me strength*
- Icon fonts declared in pseudo-selectors `:before` or `:after`
- Unknown icon font names
- Styles loaded cross-domain
- Styles injected after the page has loaded
- Unfortunately *Stylish*/*Stylus* userStyles are not an option for this task because they lack conditional logic

# The List
Here is a list of further reading on this topic, along with other similar extensions and userScripts

### Further Reading
1. [Force chrome to use my preferred font over the author's](https://superuser.com/q/1209191)
2. [Force cleartype fonts in Google Chrome](https://superuser.com/q/239161)
3. [Is it possible to override a web page's font-settings in Google Chrome for Windows](https://superuser.com/q/925242)
4. [Enforcing customized fonts?](https://community.brave.com/t/enforcing-customized-fonts/464585)
5. [Apply different styles based on a condition?](https://github.com/stylish-userstyles/stylish/issues/311)

### Extensions
1. [change all UI fonts](https://chromewebstore.google.com/detail/change-all-ui-fonts/loiejdbcheeiipmakhghinclmpafiiel)
2. [Force Custom Fonts](https://chromewebstore.google.com/detail/force-custom-fonts/hckjchjpkmbihoocajjpjajkggbccgee)
3. [Change Webpage Fonts](https://chromewebstore.google.com/detail/change-webpage-fonts/afelmehoohjbjfpjbadonkcondbilglp)
4. [Fonts Changer](https://chromewebstore.google.com/detail/fonts-changer/phkenomnahhgjnmpignadbeandfanbil)
5. [FontStyler](https://github.com/mira-ta/fontstyler-extension)
6. [Improved Font Changer for Google Chrome](https://github.com/omgmog/chrome-conditional-font-changer)
7. [Font Changer](https://github.com/SomeNormalRando/Font_Changer)

### userScripts
1. [Font Substitution](https://greasyfork.org/en/scripts/462060-font-substitution/code)
2. [Font Substitution v3](https://greasyfork.org/en/scripts/12007-font-substitution-v3/code)
3. [Clean Font Families](https://greasyfork.org/en/scripts/2372-clean-font-families/code)
4. [Global Font](https://greasyfork.org/en/scripts/419363-%E5%85%A8%E5%B1%80%E5%BE%AE%E8%BD%AF%E9%9B%85%E9%BB%91/code)

### Miscellaneous
1. [Stylish](https://chromewebstore.google.com/detail/stylish-custom-themes-for/fjnbnpbmkenffdnngjfgmeleoegfcffe)
2. [Stylus](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne)
3. [xStyle](https://chromewebstore.google.com/detail/xstyle/hncgkmhphmncjohllpoleelnibpmccpj)
