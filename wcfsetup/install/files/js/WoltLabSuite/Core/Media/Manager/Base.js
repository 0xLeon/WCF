/**
 * Provides the media manager dialog.
 * 
 * @author	Matthias Schmidt
 * @copyright	2001-2016 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @module	WoltLabSuite/Core/Media/Manager/Base
 */
define(
	[
		'Core',                     'Dictionary',               'Dom/ChangeListener',              'Dom/Traverse',
		'Dom/Util',                 'EventHandler',             'Language',                        'List',
		'Permission',               'Ui/Dialog',                'Ui/Notification',                 'WoltLabSuite/Core/Controller/Clipboard',
		'WoltLabSuite/Core/Media/Editor', 'WoltLabSuite/Core/Media/Upload', 'WoltLabSuite/Core/Media/Manager/Search', 'StringUtil'
	],
	function(
		Core,                        Dictionary,                 DomChangeListener,                 DomTraverse,
		DomUtil,                     EventHandler,               Language,                          List,
		Permission,                  UiDialog,                   UiNotification,                    Clipboard,
		MediaEditor,                 MediaUpload,                MediaManagerSearch,                StringUtil
	)
{
	"use strict";
	
	/**
	 * @constructor
	 */
	function MediaManagerBase(options) {
		this._options = Core.extend({
			dialogTitle: Language.get('wcf.media.manager'),
			fileTypeFilters: {},
			minSearchLength: 3
		}, options);
		
		this._media = new Dictionary();
		this._mediaData = new Dictionary();
		this._mediaCache = null;
		this._mediaManagerMediaList = null;
		this._search = null;
		
		if (Permission.get('admin.content.cms.canManageMedia')) {
			this._mediaEditor = new MediaEditor(this);
		}
		
		DomChangeListener.add('WoltLabSuite/Core/Media/Manager', this._addButtonEventListeners.bind(this));
	}
	MediaManagerBase.prototype = {
		/**
		 * Adds click event listeners to media buttons.
		 */
		_addButtonEventListeners: function() {
			if (!this._mediaManagerMediaList) return;
			
			var listItems = DomTraverse.childrenByTag(this._mediaManagerMediaList, 'LI');
			for (var i = 0, length = listItems.length; i < length; i++) {
				var listItem = listItems[i];
				
				if (Permission.get('admin.content.cms.canManageMedia')) {
					var editIcon = elByClass('jsMediaEditButton', listItem)[0];
					if (editIcon) {
						editIcon.classList.remove('jsMediaEditButton');
						editIcon.addEventListener(WCF_CLICK_EVENT, this._editMedia.bind(this));
					}
				}
			}
		},
		
		/**
		 * Handles clicks on the media manager button.
		 * 
		 * @param	{object}	event	event object
		 */
		_click: function(event) {
			event.preventDefault();
			
			UiDialog.open(this);
		},
		
		/**
		 * Reacts to executed clipboard actions.
		 * 
		 * @param	{object<string, *>}	actionData	data of the executed clipboard action
		 */
		_clipboardAction: function(actionData) {
			// only consider events if the action has been executed
			if (actionData.data.actionName === 'com.woltlab.wcf.media.delete' && actionData.responseData !== null) {
				var mediaIds = actionData.responseData.objectIDs;
				for (var i = 0, length = mediaIds.length; i < length; i++) {
					this.removeMedia(~~mediaIds[i], true);
				}
				
				UiNotification.show();
			}
		},
		
		/**
		 * Is called if the media manager dialog is closed.
		 */
		_dialogClose: function() {
			// only show media clipboard if editor is open
			Clipboard.hideEditor('com.woltlab.wcf.media');
		},
		
		/**
		 * Initializes the dialog when first loaded.
		 *
		 * @param	{string}	content		dialog content
		 * @param	{object}	data		AJAX request's response data
		 */
		_dialogInit: function(content, data) {
			// store media data locally
			var media = data.returnValues.media || { };
			for (var mediaId in media) {
				if (objOwns(media, mediaId)) {
					this._mediaData.set(~~mediaId, media[mediaId]);
				}
			}
			
			this._mediaManagerMediaList = elById('mediaManagerMediaList');
			
			// store list items locally
			var listItems = DomTraverse.childrenByTag(this._mediaManagerMediaList, 'LI');
			for (var i = 0, length = listItems.length; i < length; i++) {
				var listItem = listItems[i];
				
				this._media.set(~~elData(listItem, 'object-id'), listItem);
			}
			
			if (Permission.get('admin.content.cms.canManageMedia')) {
				new MediaUpload('mediaManagerMediaUploadButton', 'mediaManagerMediaList', {
					mediaManager: this
				});
				
				Clipboard.setup({
					hasMarkedItems: data.returnValues.hasMarkedItems ? true : false,
					pageClassName: 'menuManagerDialog-' + this.getMode()
				});
				
				EventHandler.add('com.woltlab.wcf.clipboard', 'com.woltlab.wcf.media', this._clipboardAction.bind(this));
				
				var deleteAction = new WCF.Action.Delete('wcf\\data\\media\\MediaAction', '.mediaFile');
				deleteAction._didTriggerEffect = function(element) {
					this.removeMedia(elData(element[0], 'object-id'), true);
				}.bind(this);
			}
			
			this._search = new MediaManagerSearch(this);
			
			if (!listItems.length) {
				this._search.hideSearch();
			}
			
			this._dialogShow();
		},
		
		/**
		 * Returns all data to setup the media manager dialog.
		 * 
		 * @return	{object}	dialog setup data
		 */
		_dialogSetup: function() {
			return {
				id: 'mediaManager',
				options: {
					onClose: this._dialogClose.bind(this),
					onShow: this._dialogShow.bind(this),
					title: this._options.dialogTitle
				},
				source: {
					after: this._dialogInit.bind(this),
					data: {
						actionName: 'getManagementDialog',
						className: 'wcf\\data\\media\\MediaAction',
						parameters: {
							mode: this.getMode(),
							fileTypeFilters: this._options.fileTypeFilters
						}
					}
				}
			};
		},
		
		/**
		 * Is called if the media manager dialog is shown.
		 */
		_dialogShow: function() {
			if (!this._mediaManagerMediaList) return;
			
			// only show media clipboard if editor is open
			Clipboard.showEditor('com.woltlab.wcf.media');
		},
		
		/**
		 * Opens the media editor for a media file.
		 * 
		 * @param	{Event}		event		event object for clicks on edit icons
		 */
		_editMedia: function(event) {
			if (!Permission.get('admin.content.cms.canManageMedia')) {
				throw new Error("You are not allowed to edit media files.");
			}
			
			UiDialog.close('mediaManager');
			
			this._mediaEditor.edit(this._mediaData.get(~~elData(event.currentTarget, 'object-id')));
		},
		
		/**
		 * Re-opens the manager dialog after closing the editor dialog.
		 */
		_editorClose: function() {
			UiDialog.open(this);
		},
		
		/**
		 * Re-opens the manager dialog and updates the media data after
		 * successfully editing a media file.
		 * 
		 * @param	{object}	media		updated media file data
		 */
		_editorSuccess: function(media) {
			UiDialog.open(this);
			
			this._mediaData.set(~~media.mediaID, media);
			
			var listItem = this._media.get(~~media.mediaID);
			var p = elByClass('mediaTitle', listItem)[0];
			if (media.isMultilingual) {
				p.textContent = media.title[LANGUAGE_ID] || media.filename;
			}
			else {
				p.textContent = media.title[media.languageID] || media.filename;
			}
		},
		
		/**
		 * Sets the displayed media (after a search).
		 * 
		 * @param	{Dictionary}	media		media to be set as active
		 */
		_setMedia: function(media) {
			if (Core.isPlainObject(media)) {
				this._media = Dictionary.fromObject(media);
			}
			else {
				this._media = media;
			}
			
			var info = DomTraverse.nextByClass(this._mediaManagerMediaList, 'info');
			
			if (this._media.size) {
				if (info) {
					elHide(info);
				}
			}
			else {
				if (info === null) {
					info = elCreate('p');
					info.className = 'info';
					info.textContent = Language.get('wcf.media.search.noResults');
				}
				
				elShow(info);
				DomUtil.insertAfter(info, this._mediaManagerMediaList);
			}
			
			var mediaListItems = DomTraverse.childrenByTag(this._mediaManagerMediaList, 'LI');
			for (var i = 0, length = mediaListItems.length; i < length; i++) {
				var listItem = mediaListItems[i];
				
				if (!this._media.has(elData(listItem, 'object-id'))) {
					elHide(listItem);
				}
				else {
					elShow(listItem);
				}
			}
			
			DomChangeListener.trigger();
			
			Clipboard.reload();
		},
		
		/**
		 * Adds a media file to the manager.
		 * 
		 * @param	{object}	media		data of the media file
		 * @param	{Element}	listItem	list item representing the file
		 */
		addMedia: function(media, listItem) {
			if (!media.languageID) media.isMultilingual = 1;
			
			this._mediaData.set(~~media.mediaID, media);
			this._media.set(~~media.mediaID, listItem);
			
			if (this._media.size === 1) {
				this._search.showSearch();
			}
		},
		
		/**
		 * Returns the mode of the media manager.
		 *
		 * @return	{string}
		 */
		getMode: function() {
			return '';
		},
		
		/**
		 * Returns the media manager option with the given name.
		 * 
		 * @param	{string}	name		option name
		 * @return	{mixed}		option value or null
		 */
		getOption: function(name) {
			if (this._options[name]) {
				return this._options[name];
			}
			
			return null;
		},
		
		/**
		 * Removes a media file.
		 *
		 * @param	{int}			mediaId		id of the removed media file
		 * @param	{boolean|undefined}	checkCache	media file will also be removed from the local cache if true
	 	 */
		removeMedia: function(mediaId, checkCache) {
			if (this._media.has(mediaId)) {
				// remove list item
				try {
					elRemove(this._media.get(mediaId));
				}
				catch (e) {
					// ignore errors if item has already been removed like by WCF.Action.Delete
				}
				
				this._media.delete(mediaId);
				this._mediaData.delete(mediaId);
			}
			
			if (checkCache && this._mediaCache && this._mediaCache.has(mediaId)) {
				this._mediaCache.delete(mediaId);
			}
		},
		
		/**
		 * Changes the displayed media to the previously displayed media.
		 */
		resetMedia: function() {
			if (this._mediaCache !== null) {
				this._setMedia(this._mediaCache);
				
				this._mediaCache = null;
				
				this._search.resetSearch();
			}
		},
		
		/**
		 * Sets the media files currently displayed.
		 * 
		 * @param	{object}	media		media data
		 * @param	{string}	template	
		 */
		setMedia: function(media, template) {
			if (!this._mediaCache) {
				this._mediaCache = this._media;
			}
			
			var hasMedia = false;
			for (var mediaId in media) {
				if (objOwns(media, mediaId)) {
					hasMedia = true;
				}
			}
			
			var newListItems = [];
			if (hasMedia) {
				var ul = elCreate('ul');
				ul.innerHTML = template;
				
				var listItems = DomTraverse.childrenByTag(ul, 'LI');
				for (var i = 0, length = listItems.length; i < length; i++) {
					var listItem = listItems[i];
					if (!this._mediaData.has(~~elData(listItem, 'object-id'))) {
						this._mediaData.set(elData(listItem, 'object-id'), listItem);
						
						this._mediaManagerMediaList.appendChild(listItem);
					}
				}
			}
			
			this._setMedia(media);
		},
		
		/**
		 * Sets up a new media element.
		 * 
		 * @param	{object}	media		data of the media file
		 * @param	{HTMLElement}	mediaElement	element representing the media file
		 */
		setupMediaElement: function(media, mediaElement) {
			var mediaInformation = DomTraverse.childByClass(mediaElement, 'mediaInformation');
			
			var buttonGroupNavigation = elCreate('nav');
			buttonGroupNavigation.className = 'jsMobileNavigation buttonGroupNavigation';
			mediaInformation.parentNode.appendChild(buttonGroupNavigation);
			
			var buttons = elCreate('ul');
			buttons.className = 'buttonList iconList';
			buttonGroupNavigation.appendChild(buttons);
			
			var listItem = elCreate('li');
			listItem.className = 'mediaCheckbox';
			buttons.appendChild(listItem);
			
			var a = elCreate('a');
			listItem.appendChild(a);
			
			var label = elCreate('label');
			a.appendChild(label);
			
			var checkbox = elCreate('input');
			checkbox.className = 'jsClipboardItem';
			elAttr(checkbox, 'type', 'checkbox');
			elData(checkbox, 'object-id', media.mediaID);
			label.appendChild(checkbox);
			
			if (Permission.get('admin.content.cms.canManageMedia')) {
				listItem = elCreate('li');
				listItem.className = 'jsMediaEditButton';
				elData(listItem, 'object-id', media.mediaID);
				buttons.appendChild(listItem);
				
				listItem.innerHTML = '<a><span class="icon icon16 fa-pencil jsTooltip" title="' + Language.get('wcf.global.button.edit') + '"></span> <span class="invisible">' + Language.get('wcf.global.button.edit') + '</span></a>';
				
				listItem = elCreate('li');
				listItem.className = 'jsDeleteButton';
				elData(listItem, 'object-id', media.mediaID);
				
				// use temporary title to not unescape html in filename
				var uuid = Core.getUuid();
				elData(listItem, 'confirm-message-html', StringUtil.unescapeHTML(Language.get('wcf.media.delete.confirmMessage', {
					title: uuid
				})).replace(uuid, StringUtil.escapeHTML(media.filename)));
				buttons.appendChild(listItem);
				
				listItem.innerHTML = '<a><span class="icon icon16 fa-times jsTooltip" title="' + Language.get('wcf.global.button.delete') + '"></span> <span class="invisible">' + Language.get('wcf.global.button.delete') + '</span></a>';
			}
		}
	};
	
	return MediaManagerBase;
});
