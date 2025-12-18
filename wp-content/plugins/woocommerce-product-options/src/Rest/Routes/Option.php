<?php

namespace Barn2\Plugin\WC_Product_Options\Rest\Routes;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\Collection;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Base_Route;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Route;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST controller for the option route.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Option extends Base_Route implements Route {

	protected $rest_base = 'options';

	/**
	 * The model.
	 *
	 * @var Abstract_Model
	 */
	protected $model;

	/**
	 * Register the REST routes.
	 */
	public function register_routes() {

		// GET ALL
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/all',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_all' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// GET ALL BY GROUP ID
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/all/(?P<id>\d+)',
			[
				'args' => [
					'id' => [
						'type'        => 'integer',
						'required'    => true,
						'description' => __( 'The unique identifier for the parent group.', 'woocommerce-product-options' )
					],
				],
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_all_by_group' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// GET
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'args' => [
					'id' => [
						'type'        => 'integer',
						'required'    => true,
						'description' => __( 'The unique identifier for the option.', 'woocommerce-product-options' )
					],
				],
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// CREATE.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'args' => $this->get_option_schema(),
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// UPDATE
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'args' => $this->get_option_schema(),
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// DELETE
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'args' => [
					'id' => [
						'type'        => 'integer',
						'required'    => true,
						'description' => __( 'The unique identifier for the option.', 'woocommerce-product-options' )
					],
				],
				[
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => [ $this, 'delete' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);

		// REORDER
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/reorder',
			[
				'args' => [
					'reorder' => [
						'type'        => 'array',
						'required'    => true,
						'description' => __( 'An array of option_id => menu_order data.', 'woocommerce-product-options' )
					],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'reorder' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);
	}

	/**
	 * Retrieve all options.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_all( $request ) {
		$group_collection = Option_Model::orderBy( 'menu_order', 'asc' )->get();

		if ( ! $group_collection instanceof Collection ) {
			return new WP_Error( 'wpo-rest-group-get-all', __( 'No options', 'woocommerce-product-options' ) );
		}

		return new WP_REST_Response( $group_collection, 200 );
	}

	/**
	 * Retrieve all options.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_all_by_group( $request ) {
		$id = $request->get_param( 'id' );

		$group_collection = Option_Model::where( 'group_id', $id )->orderBy( 'menu_order', 'asc' )->get();

		if ( ! $group_collection instanceof Collection ) {
			return new WP_Error( 'wpo-rest-group-get-all', __( 'No options', 'woocommerce-product-options' ) );
		}

		return new WP_REST_Response( $group_collection, 200 );
	}

	/**
	 * Retrieve a option by ID.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get( $request ) {
		$id = $request->get_param( 'id' );

		$option = Option_Model::where( 'id', $id )->get();

		if ( ! is_object( $option ) ) {
			return new WP_Error( 'wpo-rest-option-get', __( 'No option', 'woocommerce-product-options' ) );
		}

		return new WP_REST_Response( $option, 200 );
	}

	/**
	 * Create a option
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function create( $request ) {
		$data = $request->get_params();

		unset( $data['id'] );

		$data['menu_order'] = Option_Model::where( 'group_id', $data['group_id'] )->max( 'menu_order' ) + 1;

		do_action( 'wc_product_options_before_option_update', $data );

		$option = Option_Model::create( $data );

		if ( ! $option instanceof Option_Model || empty( $option->getID() ) ) {
			return new WP_Error( 'wpo-rest-option-create', __( 'Something went wrong while creating the option', 'woocommerce-product-options' ) );
		}

		do_action( 'wc_product_options_after_option_update', $option );

		return new WP_REST_Response( $option->getID(), 200 );
	}

	/**
	 * Update a option
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( $request ) {
		$id   = $request->get_param( 'id' );
		$data = $request->get_params();

		do_action( 'wc_product_options_before_option_update', $data );

		$option = Option_Model::find( $id );

		if ( ! $option || ! $option instanceof Option_Model ) {
			return new WP_Error( 'wpo-rest-option-update', __( 'Something went wrong: could not update the selected option', 'woocommerce-product-options' ) );
		}

		$option->update( $data );
		do_action( 'wc_product_options_after_option_update', $option );

		return new WP_REST_Response( $option->getID(), 200 );
	}

	/**
	 * Delete a option
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete( $request ) {
		$id = $request->get_param( 'id' );

		$option = Option_Model::find( $id );

		if ( ! $option || ! $option instanceof Option_Model ) {
			return new WP_Error( 'wpo-rest-option-delete', __( 'Something went wrong: could not find the option', 'woocommerce-product-options' ) );
		}

		$option->delete();

		return new WP_REST_Response( true, 200 );
	}

	/**
	 * Reorder the options
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function reorder( $request ) {
		$reorder_map = $request->get_param( 'reorder' );

		foreach ( $reorder_map as $index => $option_id ) {
			$option = Option_Model::find( $option_id );

			if ( ! $option || ! $option instanceof Option_Model ) {
				return new WP_Error( 'wpo-rest-option-delete', __( 'Something went wrong with reodering.', 'woocommerce-product-options' ) );
			}

			$option->update( [ 'menu_order' => $index ] );
		}

		return new WP_REST_Response( $reorder_map, 200 );
	}

	/**
	 * Permission callback to access the routes.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return current_user_can( 'manage_woocommerce' );
	}


	/**
	 * Retrieves the option schema for the update and create endpoints.
	 *
	 * @return []
	 */
	private function get_option_schema() {
		return [
			'id'           => [
				'type'        => 'integer',
				'required'    => true,
				'description' => __( 'The unique identifier for the option.', 'woocommerce-product-options' )
			],
			'group_id'     => [
				'type'        => 'integer',
				'required'    => true,
				'description' => __( 'The Group ID to which the option belongs.', 'woocommerce-product-options' )
			],
			'menu_order'   => [
				'type'        => 'int',
				'required'    => true,
				'description' => __( 'The menu order for the option.', 'woocommerce-product-options' )
			],
			'name'         => [
				'type'        => 'string',
				'required'    => true,
				'description' => __( 'The name for the option.', 'woocommerce-product-options' )
			],
			'description'  => [
				'type'        => 'string',
				'required'    => false,
				'description' => __( 'The visiblity status for the option.', 'woocommerce-product-options' )
			],
			'type'         => [
				'type'        => 'string',
				'required'    => false,
				'description' => __( 'The field type for the option.', 'woocommerce-product-options' )
			],
			'choices'      => [
				'type'        => 'object',
				'required'    => false,
				'description' => __( 'The choices for the option.', 'woocommerce-product-options' )
			],
			'required'     => [
				'type'        => 'boolean',
				'required'    => false,
				'description' => __( 'Indicates whether the option is required.', 'woocommerce-product-options' )
			],
			'display_name' => [
				'type'        => 'boolean',
				'required'    => false,
				'description' => __( 'Indicates whether the option name should be displayed.', 'woocommerce-product-options' )
			],
		];
	}
}
