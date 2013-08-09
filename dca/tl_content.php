<?php

/**
 * Contao Open Source CMS
 *
 * Copyright (c) 2005-2013 Leo Feyer
 *
 * @package   zad_aplayer
 * @author    Antonello Dessì
 * @license   LGPL
 * @copyright Antonello Dessì 2011-2013
 */


/**
 * Table tl_content
 */

// Configuration
$GLOBALS['TL_DCA']['tl_content']['config']['onload_callback'][] =
  array('tl_content_zad_aplayer', 'config');

// Palettes
$GLOBALS['TL_DCA']['tl_content']['palettes']['zad_aplayer'] =
  '{type_legend},type,headline;{player_legend},playerSRC,playerSize,autoplay;{poster_legend:hide},posterSRC;{zad_aplayer_captions_legend:hide},zad_aplayer_capfile;{protected_legend:hide},protected;{expert_legend:hide},guests,cssID,space;{invisible_legend:hide},invisible,start,stop';

// Fields
$GLOBALS['TL_DCA']['tl_content']['fields']['zad_aplayer_capfile'] = array(
	'label'                   => &$GLOBALS['TL_LANG']['tl_content']['zad_aplayer_capfile'],
	'exclude'                 => true,
	'inputType'               => 'fileTree',
	'eval'                    => array('fieldType'=>'radio', 'filesOnly'=>true, 'extensions'=>'srt,xml'),
  'sql'                     => "varchar(255) NOT NULL default ''"
);

/**
 * Class tl_content_zad_aplayer
 *
 * Provide miscellaneous methods that are used by the data configuration array.
 * @copyright Antonello Dessì 2011-2013
 * @author    Antonello Dessì
 * @package   zad_aplayer
 */
class tl_content_zad_aplayer extends Backend {

	/**
	 * Dynamic fields configuration for the module
	 * @param \DataContainer
	 */
	public function config($dc) {
		if ($_POST || (Input::get('act') != 'edit' && Input::get('act') != 'show')) {
      // not in edit mode
			return;
		}
		$content = ContentModel::findByPk($dc->id);
		if ($content === null) {
      // record not found
			return;
		}
    if ($content->type == 'zad_aplayer') {
      // module field configuration
      $GLOBALS['TL_DCA']['tl_content']['fields']['playerSRC']['label'] = &$GLOBALS['TL_LANG']['tl_content']['zad_aplayer_playerSRC'];
			$GLOBALS['TL_DCA']['tl_content']['fields']['playerSRC']['eval'] = array('mandatory'=>true, 'fieldType'=>'radio', 'filesOnly'=>true, 'extensions'=>'flv,mp3');
    }
  }

}

