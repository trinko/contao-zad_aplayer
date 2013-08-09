<?php

/**
 * Contao Open Source CMS
 *
 * Copyright (c) 2005-2013 Leo Feyer
 *
 * @package Zad_aplayer
 * @link    https://contao.org
 * @license http://www.gnu.org/licenses/lgpl-3.0.html LGPL
 */


/**
 * Register the namespaces
 */
ClassLoader::addNamespaces(array
(
	'zad_aplayer',
));


/**
 * Register the classes
 */
ClassLoader::addClasses(array
(
	// Elements
	'zad_aplayer\ContentZadAplayer' => 'system/modules/zad_aplayer/elements/ContentZadAplayer.php',
));


/**
 * Register the templates
 */
TemplateLoader::addFiles(array
(
	'ce_zad_aplayer'   => 'system/modules/zad_aplayer/templates',
));
