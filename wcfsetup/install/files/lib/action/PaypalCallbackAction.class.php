<?php
namespace wcf\action;
use wcf\action\AbstractAction;
use wcf\data\object\type\ObjectTypeCache;
use wcf\system\exception\SystemException;
use wcf\system\payment\type\IPaymentType;
use wcf\util\HTTPRequest;

/**
 * Handles Paypal callbacks.
 *
 * @author	Marcel Werk
 * @copyright	2001-2014 WoltLab GmbH
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package	com.woltlab.wcf
 * @subpackage	action
 * @category	Community Framework
 */
class PaypalCallbackAction extends AbstractAction {
	/**
	 * @see \wcf\action\IAction::execute()
	 */
	public function execute() {
		parent::execute();
		
		// check response
		$processor = null;
		try {
			// post back to paypal to validate 
			$content = '';
			try {
				$request = new HTTPRequest('http://www.paypal.com', array(), array_merge(array('cmd' => '_notify-validate'), $_POST));
				$request->execute();
				$reply = $request->getReply();
				$content = $reply['body'];
			}
			catch (SystemException $e) {
				throw new SystemException('connection to paypal.com failed');
			}
		
			if (strstr($content, "VERIFIED") === false) {
				throw new SystemException('request not validated');
			}
			
			// Check that receiver_email is your Primary PayPal email
			if (strtolower($_POST['business']) != strtolower(PAYPAL_EMAIL_ADDRESS) && (strtolower($_POST['receiver_email']) != strtolower(PAYPAL_EMAIL_ADDRESS))) {
				throw new SystemException('invalid business or receiver_email');
			}
			
			// get token
			if (!isset($_POST['custom'])) {
				throw new SystemException('invalid custom item');
			}
			$tokenParts = explode(':', $_POST['custom'], 2);
			if (count($tokenParts) != 2) {
				throw new SystemException('invalid custom item');
			}
			// get payment type object type
			$objectType = ObjectTypeCache::getInstance()->getObjectType(intval($tokenParts[0]));
			if ($objectType === null || !($objectType->getProcessor() instanceof IPaymentType)) {
				throw new SystemException('invalid payment type id');
			}
			$processor = $objectType->getProcessor();
			
			// get status
			$status = '';
			if ($_POST['txn_type'] == 'web_accept' || $_POST['txn_type'] == 'subscr_payment') {
				if ($_POST['payment_status'] == 'Completed') {
					$status = 'completed';
				}  
			}
			if ($_POST['payment_status'] == 'Refunded' || $_POST['payment_status'] == 'Reversed') {
				$status = 'reversed';
			}
			if ($_POST['payment_status'] == 'Canceled_Reversal') {
				$status = 'canceled_reversal';
			}
			
			if ($status) {
				$processor->processTransaction(ObjectTypeCache::getInstance()->getObjectTypeIDByName('com.woltlab.wcf.payment.method', 'com.woltlab.wcf.payment.method.paypal'), $tokenParts[1], $_POST['mc_gross'], $_POST['mc_currency'], $_POST['txn_id'], $status, $_POST);
			}
		}
		catch (SystemException $e) {
			@header('HTTP/1.1 500 Internal Server Error');
			echo $e->getMessage();
			exit;
		}
	}
}
