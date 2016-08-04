<?php
namespace wcf\data\user\profile\visitor;
use wcf\data\DatabaseObject;
use wcf\system\WCF;

/**
 * Represents a user profile visitor.
 * 
 * @author	Marcel Werk
 * @copyright	2001-2016 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package	WoltLabSuite\Core\Data\User\Profile\Visitor
 *
 * @property-read	integer		$visitorID
 * @property-read	integer|null	$ownerID
 * @property-read	integer|null	$userID
 * @property-read	integer		$time
 */
class UserProfileVisitor extends DatabaseObject {
	/**
	 * Returns a profile visitor object or `null` if it does not exist.
	 * 
	 * @param	integer		$ownerID
	 * @param	integer		$userID
	 * @return	UserProfileVisitor|null
	 */
	public static function getObject($ownerID, $userID) {
		$sql = "SELECT	*
			FROM	".static::getDatabaseTableName()."
			WHERE	ownerID = ?
				AND userID = ?";
		$statement = WCF::getDB()->prepareStatement($sql);
		$statement->execute([$ownerID, $userID]);
		if ($row = $statement->fetchArray()) {
			return new UserProfileVisitor(null, $row);
		}
		
		return null;
	}
}
