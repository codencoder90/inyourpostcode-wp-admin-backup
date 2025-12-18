<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Conditional;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;

/**
 * Handles integration with WooCommerce Multilingual
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class WPML implements Registerable, Standard_Service, Conditional {

	/**
	 * The plugin instance
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Copnstructor
	 *
	 * @param Plugin $plugin The plugin instance
	 * @return void
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	public function is_required() {
		return class_exists( 'SitePress' );
	}

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		// These actions are fired when groups and options are updated
		add_action( 'wc_product_options_after_group_update', [ $this, 'register_group_strings' ] );
		add_action( 'wc_product_options_after_option_update', [ $this, 'register_option_strings' ] );

		// Every string echoed to the screen passes through this filter
		add_filter( 'wc_product_options_get_output_string', [ $this, 'translate_string' ], 10, 4 );

		// Filter the admin language switcher items
		add_filter( 'wpml_admin_language_switcher_active_languages', [ $this, 'filter_admin_language_switcher_items' ] );
	}

	/**
	 * Create a WPML package for a group
	 *
	 * @param Group_Model $group The group model
	 * @return array The WPML package for the group
	 */
	public function get_group_package( $group ) {
		return [
			'kind'      => $this->plugin->get_name(),
			'name'      => sanitize_title( "group_{$group->id}" ),
			'title'     => sprintf( 'Option group: %s', $group->name ),
			'edit_link' => sprintf(
				admin_url( 'admin.php?post_type=products&page=wpo_options#edit/%d' ),
				$group->id
			),
		];
	}

	/**
	 * Generate an array with all the string parameters used by WPML
	 *
	 * This is necessary to both register a string with WPML and retrieve its translation
	 * and is unique to each plugin using the WPML integration.
	 *
	 * @param object   $reference_object The object the string is referring to: either a Group or Option model object.
	 * @param string   $context          The context of the string, which designates the use of the string in the plugin.
	 * @param int|null $index            The index of the choice if context is `choice_label`.
	 * @return array                   An array of arguments identifying the string in WPML.
	 */
	public function get_string_args( $reference_object, $context = 'group_name', $index = null ) {
		$group = $reference_object;
		$type  = 'LINE';             // The string type can be 'LINE', 'AREA' or 'VISUAL'

		if ( $reference_object instanceof Option_Model ) {
			$group = Group_Model::find( $reference_object->group_id );
		}

		switch ( $context ) {
			case 'option_name':
				$string_name = sanitize_title( "option_{$reference_object->id}_name" );
				// translators: %s is the group name, %s is the option name
				$string_title = sprintf( __( 'Group %1$s, option %2$s, name', 'woocommerce-product-options' ), $group->name, $reference_object->name );
				break;

			case 'option_description':
				$string_name = sanitize_title( "option_{$reference_object->id}_description" );
				// translators: %s is the group name, %s is the option name
				$string_title = sprintf( __( 'Group %1$s, option %2$s, description', 'woocommerce-product-options' ), $group->name, $reference_object->name );
				$type         = 'AREA';
				break;

			case 'option_content':
				$string_name = sanitize_title( "option_{$reference_object->id}_content" );
				// translators: %s is the group name, %s is the option name
				$string_title = sprintf( __( 'Group %1$s, option %2$s, content', 'woocommerce-product-options' ), $group->name, $reference_object->name );
				$type         = $reference_object->type === 'wysiwyg' ? 'VISUAL' : 'AREA';
				break;

			case 'choice_label':
				$index       = $index ?? 0;
				$string_name = sanitize_title( "option_{$reference_object->id}_label_{$index}" );
				// translators: %s is the group name, %s is the option name, %d is the choice index
				$string_title = sprintf( __( 'Group %1$s, option %2$s, label %3$d', 'woocommerce-product-options' ), $group->name, $reference_object->name, $index + 1 );
				break;

			case 'group_name':
			default:
				$string_name  = sanitize_title( "group_{$group->id}_name" );
				$string_title = 'Option group %s: Group name';
		}

		return [
			'name'    => $string_name,
			'package' => $this->get_group_package( $group ),
			'title'   => $string_title,
			'type'    => $type,
		];
	}

	/**
	 * Fires the `wpml_register_string` action after creating all the parameters to register a string.
	 *
	 * @param string   $string_value     The string value
	 * @param object   $reference_object Either a Group_Model or an Option_Model object
	 * @param string   $context          The context of the string
	 * @param int|null $index            The index of the choice if context is `choice_label`
	 * @return void
	 */
	public function register_string( $string_value, $reference_object, $context = 'group_name', $index = null ) {
		if ( empty( $string_value ) ) {
			return;
		}

		$string_args = $this->get_string_args( $reference_object, $context, $index );

		do_action( 'wpml_register_string', $string_value, $string_args['name'], $string_args['package'], $string_args['title'], $string_args['type'] );
	}

	/**
	 * Register group-related strings to WPML every time a group is updated.
	 *
	 * @param Group_Model $group The group model
	 * @return void
	 */
	public function register_group_strings( $group ) {
		// register the string for the group name
		if ( ! $group instanceof Group_Model || empty( $group->id ) ) {
			return;
		}

		$this->register_string( $group->name, $group );
	}

	/**
	 * Register option-related strings to WPML every time an option is updated.
	 *
	 * @param Option_Model $option The option model
	 * @return void
	 */
	public function register_option_strings( $option ) {
		if ( ! $option instanceof Option_Model || empty( $option->id ) || empty( $option->group_id ) ) {
			return;
		}

		// register the option name
		$this->register_string( $option->name, $option, 'option_name' );

		// register the string for the option description
		if ( $option->description ) {
			$this->register_string( $option->description, $option, 'option_description' );
		}

		if ( isset( $option->settings['html'] ) && $option->settings['html'] ) {
			$this->register_string( $option->settings['html'], $option, 'option_content' );
		}

		if ( empty( $option->choices ) ) {
			return;
		}

		// register the string for each choice label
		foreach ( $option->choices as $index => $choice ) {
			$this->register_string( $choice['label'], $option, 'choice_label', $index );
		}
	}

	/**
	 * Translate a frontend string
	 *
	 * This function registers the string with WPML and then translates it.
	 *
	 * @param string   $string_value     The frontend string
	 * @param object   $reference_object Either a Group_Model or an Option_Model object
	 * @param string   $context          The context of the string
	 * @param int|null $index            The index of the choice if context is `choice_label`
	 * @return string                    The translated string
	 */
	public function translate_string( $string_value, $reference_object, $context, $index = null ) {
		if ( $string_value === '' ) {
			return $string_value;
		}

		$string_args = $this->get_string_args( $reference_object, $context, $index );

		$string_name = $string_args['name'];
		$package     = $string_args['package'];

		return apply_filters( 'wpml_translate_string', $string_value, $string_name, $package );
	}

	/**
	 * Filter the admin language switcher items
	 *
	 * This function forces the language switcher items to only show the "All languages" option on the product options page.
	 * This is because the product option editor can handle all the translations at once.
	 *
	 * @param array $language_links The language links
	 * @return array
	 */
	public function filter_admin_language_switcher_items( $language_links ) {
		global $current_screen, $pagenow;

		if ( $pagenow === 'edit.php' && $current_screen->base === 'product_page_wpo_options' ) {
			$language_links = array_filter(
				$language_links,
				function ( $key ) {
					return $key === 'all';
				},
				ARRAY_FILTER_USE_KEY
			);
		}

		return $language_links;
	}
}
