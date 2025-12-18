<?php

$tabs = array(
	'general' => array(
		'title'			=> 'General',
		'id' 			=> 'general',
		'option_key' 	=> 'xoo-el-gl-options',
		'args' 			=> array(
			'priority' => 10
		)
	),

	'style' => array(
		'title'			=> 'Style',
		'id' 			=> 'style',
		'option_key' 	=> 'xoo-el-sy-options',
		'args' 			=> array(
			'priority' => 20
		)
	),

	'advanced' => array(
		'title'			=> 'Advanced',
		'id' 			=> 'advanced',
		'option_key' 	=> 'xoo-el-av-options',
		'args' 			=> array(
			'priority' => 40
		)
	),
);

return apply_filters( 'xoo_el_admin_settings_tabs', $tabs );