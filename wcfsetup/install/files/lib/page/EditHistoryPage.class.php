<?php
namespace wcf\page;
use wcf\data\edit\history\entry\EditHistoryEntry;
use wcf\data\edit\history\entry\EditHistoryEntryList;
use wcf\data\object\type\ObjectTypeCache;
use wcf\system\exception\IllegalLinkException;
use wcf\system\WCF;
use wcf\util\Diff;
use wcf\util\StringUtil;

/**
 * Compares two templates.
 * 
 * @author	Tim Duesterhus
 * @copyright	2001-2014 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package	com.woltlab.wcf
 * @subpackage	page
 * @category	Community Framework
 */
class EditHistoryPage extends AbstractPage {
	/**
	 * DatabaseObjectList object
	 * @var \wcf\data\DatabaseObjectList
	 */
	public $objectList = null;

	/**
	 * left / old version id
	 * @var	integer
	 */
	public $oldID = 0;
	
	/**
	 * left / old version
	 * @var	\wcf\data\edit\history\entry\EditHistoryEntry
	 */
	public $old = null;
	
	/**
	 * right / new version id
	 * @var	integer
	 */
	public $newID = 0;
	
	/**
	 * right / new version
	 * @var	\wcf\data\edit\history\entry\EditHistoryEntry
	 */
	public $new = null;
	
	/**
	 * differences between both versions
	 * @var	\wcf\util\Diff
	 */
	public $diff = null;
	
	/**
	 * object type id of the requested object
	 * @var	integer
	 */
	public $objectTypeID = 0;
	
	/**
	 * object type of the requested object
	 * @var	\wcf\data\object\type\ObjectType
	 */
	public $objectType = null;
	
	/**
	 * id of the requested object
	 * @var	integer
	 */
	public $objectID = 0;
	
	/**
	 * requested object
	 * @var	\wcf\system\edit\IHistorySavingObject
	 */
	public $object = null;
	
	/**
	 * @see	\wcf\page\IPage::readParameters()
	 */
	public function readParameters() {
		parent::readParameters();
		
		if (isset($_REQUEST['oldID']) && isset($_REQUEST['newID'])) {
			$this->oldID = intval($_REQUEST['oldID']);
			$this->old = new EditHistoryEntry($this->oldID);
			if (!$this->old->entryID) throw new IllegalLinkException();
			
			if ($_REQUEST['newID'] !== 'current') {
				$this->newID = intval($_REQUEST['newID']);
				$this->new = new EditHistoryEntry($this->newID);
				if (!$this->new->entryID) throw new IllegalLinkException();
			}
			
			// if new version isn't 'current' check whether they are comparable
			if ($this->new) {
				// different objectTypes cannot be compared
				if ($this->old->objectTypeID != $this->new->objectTypeID) throw new IllegalLinkException();
				// different items cannot be compared
				if ($this->old->objectID != $this->new->objectID) throw new IllegalLinkException();
			}
			
			$this->objectID = $this->old->objectID;
			$this->objectTypeID = $this->old->objectTypeID;
		}
		else if (isset($_REQUEST['objectID']) && isset($_REQUEST['objectTypeID'])) {
			$this->objectID = intval($_REQUEST['objectID']);
			$this->objectTypeID = intval($_REQUEST['objectTypeID']);
		}
		else {
			throw new IllegalLinkException();
		}
		
		$this->objectType = ObjectTypeCache::getInstance()->getObjectType($this->objectTypeID);
		if (!$this->objectType) throw new IllegalLinkException();
		$processor = $this->objectType->getProcessor();
		$this->object = $processor->getObjectByID($this->objectID);
		$processor->checkPermissions($this->object);
		$this->activeMenuItem = $processor->getActivePageMenuItem();
		$this->object->addBreadcrumbs();
		
		if (isset($_REQUEST['newID']) && !$this->new) {
			$this->new = $this->object;
			$this->newID = 'current';
		}
	}
	
	/**
	* @see	\wcf\page\IPage::readData()
	*/
	public function readData() {
		parent::readData();
		
		$this->objectList = new EditHistoryEntryList();
		$this->objectList->sqlOrderBy = "time DESC";
		$this->objectList->getConditionBuilder()->add('objectTypeID = ?', array($this->objectTypeID));
		$this->objectList->getConditionBuilder()->add('objectID = ?', array($this->objectID));
		$this->objectList->readObjects();
		
		// valid IDs were given, calculate diff
		if ($this->old) {
			$a = explode("\n", StringUtil::unifyNewlines($this->old->getMessage()));
			$b = explode("\n", StringUtil::unifyNewlines($this->new->getMessage()));
			$this->diff = new Diff($a, $b);
		}
	}
	
	/**
	* @see	\wcf\page\IPage::assignVariables()
	*/
	public function assignVariables() {
		parent::assignVariables();
		
		WCF::getTPL()->assign(array(
			'oldID' => $this->oldID,
			'old' => $this->old,
			'newID' => $this->newID,
			'new' => $this->new,
			'object' => $this->object,
			'diff' => $this->diff,
			'objects' => $this->objectList
		));
	}
}
