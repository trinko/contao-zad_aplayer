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
 * Namespace
 */
namespace zad_aplayer;


/**
 * Class ContentZadAplayer
 *
 * @copyright  Antonello Dessì 2011-2013
 * @author     Antonello Dessì
 * @package    Devtools
 */
class ContentZadAplayer extends \ContentElement {

	/**
	 * Template
	 * @var string
	 */
	protected $strTemplate = 'ce_zad_aplayer';


	/**
	 * Extend the parent method
	 * @return string
	 */
	public function generate() {
		if (TL_MODE == 'BE') {
			$objTemplate = new \BackendTemplate('be_wildcard');
			$objTemplate->title = $this->headline;
			$objTemplate->id = $this->id;
			return $objTemplate->parse();
		}
    return parent::generate();
	}

	/**
	 * Generate the module
	 */
	protected function compile() {
	  // add scripts
    $GLOBALS['TL_JAVASCRIPT'][] = 'system/modules/zad_aplayer/vendor/flowplayer/flowplayer-3.2.12.min.js';
    $GLOBALS['TL_JAVASCRIPT'][] = 'system/modules/zad_aplayer/assets/flowplayer.accessible_controls.min.js';
	  // add CSS styles
    $GLOBALS['TL_CSS'][] = 'system/modules/zad_aplayer/assets/zad_aplayer.css';
    // get media file
    $is_audio = false;
    $media = null;
		$media_list = deserialize($this->playerSRC);
    if (($media_file = \FilesModel::findByPk($media_list[0])) !== null) {
      $media = \Environment::get('base') . $media_file->path;
      $is_audio = ($media_file->extension == 'mp3');
    }
    // set the size
    $width = '';
    $height = '';
		if ($this->playerSize != '') {
			$size_list = deserialize($this->playerSize);
			if (is_array($size_list) && $size_list[0] > 0 && $size_list[1] > 0) {
				$width = $size_list[0];
				$height = $size_list[1];
			}
		}
    // preview image
		$preview = false;
    $image = null;
    if ($this->posterSRC != '') {
			if (($image_file = \FilesModel::findByPk($this->posterSRC)) !== null) {
				$image = $image_file->path;
        $preview = true;
			}
		}
    // captions
		$captions = false;
    $capfile = null;
    if ($this->zad_aplayer_capfile != '') {
			if (($captions_file = \FilesModel::findByPk($this->zad_aplayer_capfile)) !== null) {
				$capfile = $captions_file->path;
        $captions = true;
			}
		}
    // set plugin options
    $opts =
      'captionsEnabled: ' . ($captions ? 'true' : 'false') . ', ' .
      'fullscreenEnabled: ' . ('true') . ', ' .
      'playLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_play']) . '\', ' .
      'pauseLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_pause']) . '\', ' .
      'volumeLabel: [ \'' . implode("','", $GLOBALS['TL_LANG']['zad_aplayer']['hlp_volume']) . '\' ], ' .
      'captionsOnLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_cc_on']) . '\', ' .
      'captionsOffLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_cc_off']) . '\', ' .
      'fullScreenLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_full_screen']) . '\', ' .
      'normalScreenLabel: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_normal_screen']) . '\', ' .
      'sliderHelp: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_slider_tips']) . '\', ' .
      'volumeHelp: \'' . addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_volume_tips']) . '\'';
    // set template vars
		$this->Template->media = $media;
		$this->Template->is_audio = $is_audio;
		$this->Template->width = $width;
		$this->Template->height = $height;
    $this->Template->captions = $captions;
    $this->Template->capfile = $capfile;
		$this->Template->preview = ($preview && (!$this->autoplay || $is_audio));
		$this->Template->preview_img = $image;
		$this->Template->preview_alt = addslashes($GLOBALS['TL_LANG']['zad_aplayer']['hlp_preview']);
    $this->Template->err_javascript = addslashes($GLOBALS['TL_LANG']['zad_aplayer']['err_javascript']);
    $this->Template->err_download = addslashes($GLOBALS['TL_LANG']['zad_aplayer']['err_download']);
    $this->Template->err_flash = addslashes($GLOBALS['TL_LANG']['zad_aplayer']['err_flash']);
    $this->Template->err_flash_download = addslashes($GLOBALS['TL_LANG']['zad_aplayer']['err_flash_download']);
    $this->Template->options = $opts;
	}

}
