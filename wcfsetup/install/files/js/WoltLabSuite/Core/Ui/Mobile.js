/**
 * Modifies the interface to provide a better usability for mobile devices.
 * 
 * @author	Alexander Ebert
 * @copyright	2001-2016 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @module	WoltLabSuite/Core/Ui/Mobile
 */
define(
	[        'Core', 'Environment', 'EventHandler', 'Language', 'List', 'Dom/ChangeListener', 'Ui/CloseOverlay', 'Ui/Screen', './Page/Menu/Main', './Page/Menu/User'],
	function(Core,    Environment,   EventHandler,   Language,   List,   DomChangeListener,    UiCloseOverlay,    UiScreen,    UiPageMenuMain,     UiPageMenuUser)
{
	"use strict";
	
	var _buttonGroupNavigations = elByClass('buttonGroupNavigation');
	var _enabled = false;
	var _knownMessages = new List();
	var _main = null;
	var _messages = elByClass('message');
	var _options = {};
	var _pageMenuMain = null;
	var _pageMenuUser = null;
	
	/**
	 * @exports	WoltLabSuite/Core/Ui/Mobile
	 */
	return {
		/**
		 * Initializes the mobile UI.
		 * 
		 * @param       {Object=}       options         initialization options
		 */
		setup: function(options) {
			_options = Core.extend({
				enableMobileMenu: true
			}, options);
			
			_main = elById('main');
			
			if (Environment.touch()) {
				document.documentElement.classList.add('touch');
			}
			
			if (Environment.platform() !== 'desktop') {
				document.documentElement.classList.add('mobile');
			}
			
			UiScreen.on('screen-md-down', {
				match: this.enable.bind(this),
				unmatch: this.disable.bind(this),
				setup: this._init.bind(this)
			});
		},
		
		/**
		 * Enables the mobile UI.
		 */
		enable: function() {
			_enabled = true;
			
			if (_options.enableMobileMenu) {
				_pageMenuMain.enable();
				_pageMenuUser.enable();
			}
		},
		
		/**
		 * Disables the mobile UI.
		 */
		disable: function() {
			_enabled = false;
			
			if (_options.enableMobileMenu) {
				_pageMenuMain.disable();
				_pageMenuUser.disable();
			}
		},
		
		_init: function() {
			_enabled = true;
			
			this._initSearchBar();
			this._initButtonGroupNavigation();
			this._initMessages();
			this._initMobileMenu();
			
			UiCloseOverlay.add('WoltLabSuite/Core/Ui/Mobile', this._closeAllMenus.bind(this));
			DomChangeListener.add('WoltLabSuite/Core/Ui/Mobile', this._initButtonGroupNavigation.bind(this));
		},
		
		_initSearchBar: function() {
			var _searchBar = elById('pageHeaderSearch');
			var _searchInput = elById('pageHeaderSearchInput');
			
			EventHandler.add('com.woltlab.wcf.MainMenuMobile', 'more', function(data) {
				if (data.identifier === 'com.woltlab.wcf.search') {
					_searchBar.style.setProperty('top', elById('pageHeader').offsetHeight + 'px', '');
					_searchBar.classList.add('open');
					_searchInput.focus();
					
					data.handler.close(true);
				}
			});
			
			_main.addEventListener(WCF_CLICK_EVENT, function() { _searchBar.classList.remove('open'); });
		},
		
		_initButtonGroupNavigation: function() {
			for (var i = 0, length = _buttonGroupNavigations.length; i < length; i++) {
				var navigation = _buttonGroupNavigations[i];
				
				if (navigation.classList.contains('jsMobileButtonGroupNavigation')) continue;
				else navigation.classList.add('jsMobileButtonGroupNavigation');
				
				navigation.parentNode.classList.add('hasMobileNavigation');
				
				var button = elCreate('a');
				button.className = 'dropdownLabel';
				
				var span = elCreate('span');
				span.className = 'icon icon24 fa-ellipsis-v';
				button.appendChild(span);
				
				var list = elBySel('.buttonList', navigation);
				list.addEventListener(WCF_CLICK_EVENT, function(event) {
					event.stopPropagation();
				});
				
				(function(navigation, button) {
					button.addEventListener(WCF_CLICK_EVENT, function(event) {
						event.preventDefault();
						event.stopPropagation();
						
						navigation.classList.toggle('open');
					});
				})(navigation, button);
				
				navigation.insertBefore(button, navigation.firstChild);
			}
		},
		
		_initMessages: function() {
			Array.prototype.forEach.call(_messages, function(message) {
				if (_knownMessages.has(message)) {
					return;
				}
				
				var navigation = elBySel('.jsMobileNavigation', message);
				var quickOptions = elBySel('.messageQuickOptions', message); 
				
				if (quickOptions) {
					quickOptions.addEventListener(WCF_CLICK_EVENT, function (event) {
						if (_enabled) {
							event.preventDefault();
							event.stopPropagation();
							
							navigation.classList.toggle('open');
						}
					});
					
					navigation.addEventListener(WCF_CLICK_EVENT, function(event) {
						event.stopPropagation();
					});
				}
				
				_knownMessages.add(message);
			});
		},
		
		_initMobileMenu: function() {
			if (_options.enableMobileMenu) {
				_pageMenuMain = new UiPageMenuMain();
				_pageMenuUser = new UiPageMenuUser();
			}
			
			elBySelAll('.boxMenu', null, function(boxMenu) {
				boxMenu.addEventListener(WCF_CLICK_EVENT, function(event) {
					event.stopPropagation();
					
					if (event.target === boxMenu) {
						event.preventDefault();
						
						boxMenu.classList.add('open');
					}
				});
			});
		},
		
		_closeAllMenus: function() {
			elBySelAll('.jsMobileButtonGroupNavigation.open, .jsMobileNavigation.open, .boxMenu.open', null, function (menu) {
				menu.classList.remove('open');
			});
		}
	};
});
