<?php
namespace wcf\data\user\ignore;
use wcf\data\DatabaseObject;
use wcf\system\WCF;

/**
 * Represents an ignored user.
 * 
 * @author	Alexander Ebert
 * @copyright	2001-2016 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package	WoltLabSuite\Core\Data\User\Ignore
 *
 * @property-read	integer		$ignoreID
 * @property-read	integer		$userID
 * @property-read	integer		$ignoreUserID
 * @property-read	integer		$time
 */
class UserIgnore extends DatabaseObject {
	/**
	 * Returns a UserIgnore object for given ignored user id.
	 * 
	 * @param	integer		$ignoreUserID
	 * @return	\wcf\data\user\ignore\UserIgnore
	 */
	public static function getIgnore($ignoreUserID) {
		$sql = "SELECT	*
			FROM	wcf".WCF_N."_user_ignore
			WHERE	userID = ?
				AND ignoreUserID = ?";
		$statement = WCF::getDB()->prepareStatement($sql);
		$statement->execute([
			WCF::getUser()->userID,
			$ignoreUserID
		]);
		
		$row = $statement->fetchArray();
		if (!$row) $row = [];
		
		return new UserIgnore(null, $row);
	}
}
