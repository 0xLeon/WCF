<?php
namespace wcf\system\html\input\filter;
use wcf\system\event\EventHandler;

/**
 * HTML input filter using HTMLPurifier.
 * 
 * @author      Alexander Ebert
 * @copyright   2001-2016 WoltLab GmbH
 * @license     GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package     WoltLabSuite\Core\System\Html\Input\Filter
 * @since       3.0
 */
class MessageHtmlInputFilter implements IHtmlInputFilter {
	/**
	 * @var	\HTMLPurifier
	 */
	protected static $purifier;
	
	/**
	 * Applies HTMLPurifier's filter on provided HTML.
	 * 
	 * @param       string  $html   unsafe HTML
	 * @return      string  sanitized HTML
	 */
	public function apply($html) {
		return $this->getPurifier()->purify($html);
	}
	
	/**
	 * @return	\HTMLPurifier
	 */
	protected function getPurifier() {
		if (self::$purifier === null) {
			$config = \HTMLPurifier_Config::createDefault();
			$this->setAttributeDefinitions($config);
			self::$purifier = new \HTMLPurifier($config);
		}
		
		return self::$purifier;
	}
	
	/**
	 * Sets required configuration data for HTML filter.
	 * 
	 * @param       \HTMLPurifier_Config    $config         HTMLPurifier configuration
	 */
	protected function setAttributeDefinitions(\HTMLPurifier_Config $config) {
		$definition = $config->getHTMLDefinition(true);
		
		// code
		$definition->addAttribute('pre', 'data-file', 'Text');
		$definition->addAttribute('pre', 'data-line', 'Number');
		$definition->addAttribute('pre', 'data-highlighter', 'Text');
		
		// color
		$definition->addElement('woltlab-color', 'Inline', 'Inline', '', ['class' => 'Text']);
		
		// size
		$definition->addElement('woltlab-size', 'Inline', 'Inline', '', ['class' => 'Text']);
		
		// font
		$definition->addElement('woltlab-font', 'Inline', 'Inline', '', ['class' => 'Text']);
		
		// media
		$definition->addAttribute('img', 'data-media-id', 'Number');
		$definition->addAttribute('img', 'data-media-size', new \HTMLPurifier_AttrDef_Enum(['small', 'medium', 'large', 'original']));
		
		// quote
		$definition->addElement('woltlab-quote', 'Block', 'Flow', '', [
			'data-author' => 'Text',
			'data-link' => 'URI'
		]);
		
		// spoiler
		$definition->addElement('woltlab-spoiler', 'Block', 'Flow', '', [
			'data-label' => 'Text'
		]);
		
		// generic metacode
		$definition->addElement('woltlab-metacode', 'Inline', 'Inline', '', [
			'data-attributes' => 'Text',
			'data-name' => 'Text'
		]);
		
		// metacode markers
		$definition->addElement('woltlab-metacode-marker', 'Inline', 'Empty', '', [
			'data-attributes' => 'Text',
			'data-name' => 'Text',
			'data-source' => 'Text',
			'data-uuid' => 'Text'
		]);
		
		// add data-attachment-id="" for <img>
		$definition->addAttribute('img', 'data-attachment-id', 'Number');
		$definition->addAttribute('img', 'srcset', 'Text');
		
		$parameters = [
			'config' => $config,
			'definition' => $definition
		];
		EventHandler::getInstance()->fireAction($this, 'setAttributeDefinitions', $parameters);
	}
}
