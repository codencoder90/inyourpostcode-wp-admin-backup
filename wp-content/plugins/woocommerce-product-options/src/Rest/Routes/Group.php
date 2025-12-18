<?php

namespace Barn2\Plugin\WC_Product_Options\Rest\Routes;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\Collection;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Formula;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Base_Route;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Route;
use Barn2\Plugin\WC_Product_Options\Admin\Version_Updater;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;
use WC_Product_Query;
use Transliterator;

use function Barn2\Plugin\WC_Product_Options\wpo;

/**
 * REST controller for the group route.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Group extends Base_Route implements Route {

	protected $rest_base = 'groups';

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
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// EXPORT ALL OR SELECTED GROUPS
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/export',
			[
				'args' => [
					'id' => [
						'type'        => 'array',
						'required'    => true,
						'description' => __( 'An array of group IDs.', 'woocommerce-product-options' ),
					],
				],
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'export' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// VISIBILITY
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/visibility',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_visibility' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// CRUD
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				// CREATE
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create' ],
					'permission_callback' => [ $this, 'permission_callback' ],
					'args'                => $this->get_group_schema(),
				],

				// READ
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get' ],
					'permission_callback' => [ $this, 'permission_callback' ],
					'args'                => [
						'id' => [
							'type'        => 'integer',
							'required'    => true,
							'description' => __( 'The unique identifier for the group.', 'woocommerce-product-options' ),
						],
					],
				],

				// UPDATE
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'permission_callback' ],
					'args'                => $this->get_group_schema(),
				],

				// DELETE
				[
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => [ $this, 'delete' ],
					'permission_callback' => [ $this, 'permission_callback' ],
					'args'                => [
						'id' => [
							'type'        => 'integer',
							'required'    => true,
							'description' => __( 'The unique identifier for the group.', 'woocommerce-product-options' ),
						],
					],
				],
			]
		);

		// IMPORT
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/import',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'import' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
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
						'description' => __( 'An array of group_id => menu_order data.', 'woocommerce-product-options' ),
					],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'reorder' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// DUPLICATE
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/duplicate',
			[
				'args' => $this->get_group_schema(),
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'duplicate' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// TOGGLE
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/toggle',
			[
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'toggle' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// GET A LIST OF PRODUCTS
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/products',
			[
				'args' => [
					'include' => [
						'type'        => 'array',
						'required'    => false,
						'description' => __( 'An array of product IDs.', 'woocommerce-product-options' ),
					],
					'search'  => [
						'type'        => 'string',
						'required'    => false,
						'description' => __( 'A search to filter products by name or SKU.', 'woocommerce-product-options' ),
					],
				],
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_products' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);

		// GET A LIST OF CATEGORIES BY ID
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/categories',
			[
				'args' => [
					'include' => [
						'type'        => 'array',
						'required'    => true,
						'description' => __( 'An array of category IDs.', 'woocommerce-product-options' ),
					],
				],
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_categories' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);
	}

	/**
	 * Retrieve all groups.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_all( $request ) {
		$group_collection = Group_Model::orderBy( 'menu_order', 'asc' )->get();

		if ( ! $group_collection instanceof Collection ) {
			return new WP_Error( 'wpo-rest-group-get-all', __( 'No groups', 'woocommerce-product-options' ) );
		}

		foreach ( $group_collection->all() as &$group ) {
			$group->options            = Option_Model::orderBy( 'menu_order', 'asc' )->where( 'group_id', $group->getID() )->get();
			$group->visibility_objects = $this->get_visibility_objects( $group );
		}

		return new WP_REST_Response( $group_collection, 200 );
	}

	/**
	 * Export all or a selection of the groups.
	 *
	 * The export process expands product and category IDs to include additional information
	 * that can be used to remap products and categories during the import process.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function export( $request ) {
		$ids = $request->get_param( 'id' );

		if ( empty( $ids ) ) {
			$group_collection = Group_Model::orderBy( 'menu_order', 'asc' )->get();
		} else {
			$group_collection = Group_Model::whereIn( 'id', $ids )->orderBy( 'menu_order', 'asc' )->get();
		}

		if ( ! $group_collection instanceof Collection ) {
			return new WP_Error( 'wpo-rest-group-get-all', __( 'No groups', 'woocommerce-product-options' ) );
		}

		$groups     = [];
		$products   = [];
		$categories = [];
		$images     = [];

		foreach ( $group_collection->all() as $group ) {
			$group_array = $group->toArray();

			// process products IDs so that they can be matched during import
			$products = $products + $this->process_product_array( $group->products ) + $this->process_product_array( $group->exclude_products );

			// process category IDs so that they can be matched during import
			$categories = $categories + $this->process_category_array( $group->categories ) + $this->process_category_array( $group->exclude_categories );

			$options = Option_Model::orderBy( 'menu_order', 'asc' )->where( 'group_id', $group->getID() )->get();
			$options = $options->toArray();

			foreach ( $options as $key => $option ) {
				if ( $option['type'] === 'product' ) {
					if ( $option['settings']['product_selection'] === 'dynamic' ) {
						$categories = $categories + $this->process_category_array( $option['settings']['dynamic_products']['categories'], 'category_id' );
					} else {
						$products   = $products + $this->process_product_array( $option['settings']['manual_products'], 'product_id' );
						$variations = array_reduce(
							$option['settings']['manual_products'],
							function ( $carry, $item ) {
								if ( ! isset( $item['variations'] ) ) {
									return $carry;
								}

								return array_merge( $carry, array_column( $item['variations'] ?: [], 'id' ) );
							},
							[]
						);
						$products   = $products + $this->process_product_array( $variations );
					}
				} elseif ( $option['type'] === 'images' ) {
					$images = $images + $this->process_image_array( array_column( $option['choices'], 'media' ) );
				}

				$options[ $key ] = $option;
			}

			$group_array['options'] = $options;
			$groups[]               = $group_array;
		}

		$db_version = get_option( 'woocommerce_product_options_version' );
		$data       = [
			'wpoVersion' => $db_version ?: wpo()->get_version(),
			'date'       => gmdate( 'Y-m-d H:i:s' ),
			'groupCount' => count( $groups ),
			'groups'     => $groups,
			'maps'       => [
				'products'   => $products,
				'categories' => $categories,
				'images'     => $images,
			],
		];

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Process an array of product IDs to include additional information.
	 *
	 * @param array $product_ids
	 * @param string|bool $column The column where product IDs are stored or false to return the full product array.
	 * @return array
	 */
	private function process_product_array( $product_ids, $column = false ) {
		$products = [];

		if ( $column ) {
			$product_ids = array_column( $product_ids, $column );
		}

		$product_ids = array_values( array_unique( $product_ids ) );

		foreach ( $product_ids as $product_id ) {
			$product = wc_get_product( $product_id );

			if ( ! $product ) {
				continue;
			}

			$products[ $product_id ] = [
				'product_id' => $product_id,
				'sku'        => $product->get_sku(),  // 'sku' is used in the import process to match products
				'name'       => $product->get_name(), // 'name' is used in the import process to match products
				'type'       => $product->get_type(), // 'type' is used in the import process to match products
			];
		}

		return $products;
	}

	/**
	 * Process an array of category IDs to include additional information.
	 *
	 * @param array $category_ids
	 * @param string|bool $column The column where category IDs are stored or false to return the full category array.
	 * @return array
	 */
	private function process_category_array( $category_ids, $column = false ) {
		$categories = [];

		if ( $column ) {
			$category_ids = array_column( $category_ids, $column );
		}

		$category_ids = array_values( array_unique( $category_ids ) );

		foreach ( $category_ids as $category_id ) {
			$category = get_term( $category_id, 'product_cat' );

			if ( ! $category ) {
				continue;
			}

			$categories[ $category_id ] = [
				'category_id' => $category_id,
				'slug'        => $category->slug, // 'slug' is used in the import process to match categories
				'name'        => $category->name, // 'name' is used in the import process to match categories
			];
		}

		return $categories;
	}

	/**
	 * Process an array of image IDs to include additional information.
	 *
	 * @param array $image_ids
	 * @return array
	 */
	private function process_image_array( $image_ids ) {
		$images    = [];
		$image_ids = array_values( array_unique( $image_ids ) );

		foreach ( $image_ids as $image_id ) {
			$image      = wp_get_attachment_image_src( $image_id, 'full' );
			$image_url  = $image[0] ?? '';
			$parsed_url = wp_parse_url( $image_url );

			if ( ! isset( $parsed_url['path'] ) || ! isset( $parsed_url['host'] ) ) {
				continue;
			}

			$metadata = wp_get_attachment_metadata( $image_id );

			$images[ $image_id ] = [
				'image_id'  => $image_id,
				'image_url' => $image_url,
				'file'      => wp_basename( $metadata['file'] ),
				'width'     => $metadata['width'] ?? 0,
				'height'    => $metadata['height'] ?? 0,
				'filesize'  => $metadata['filesize'] ?? '',
				'metahash'  => md5( wp_json_encode( $metadata['image_meta'] ) ),
			];
		}

		return $images;
	}

	/**
	 * Retrieve a group by ID.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get( $request ) {
		$id = $request->get_param( 'id' );

		$group = Group_Model::where( 'id', $id )->get();

		if ( ! is_object( $group ) ) {
			return new WP_Error( 'wpo-rest-group-get', __( 'No group', 'woocommerce-product-options' ) );
		}

		return new WP_REST_Response( $group, 200 );
	}

	/**
	 * Create a group
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function create( $request ) {
		$data    = $request->get_params();
		$options = $request->get_param( 'options' );

		$option_errors  = [];
		$option_updates = [];

		unset( $data['id'] );

		$data['menu_order'] = Group_Model::max( 'menu_order' ) + 1;

		$group = Group_Model::create( $data );

		if ( ! $group instanceof Group_Model || empty( $group->getID() ) ) {
			return new WP_Error( 'wpo-rest-group-create', __( 'Something went wrong while creating the group', 'woocommerce-product-options' ) );
		}

		do_action( 'wc_product_options_after_group_update', $group );

		if ( ! empty( $options ) && is_array( $options ) ) {
			// check for deleted options
			$this->delete_missing_options( $group->getID(), $options );

			foreach ( $options as $option_data ) {
				unset( $option_data['id'] );

				$option_data['group_id']   = $group->getID();
				$option_data['menu_order'] = Option_Model::where( 'group_id', $group->getID() )->max( 'menu_order' ) + 1;

				$option = Option_Model::create( $option_data );

				if ( ! $option || ! $option instanceof Option_Model || ! $option->getID() ) {
					$option_errors[] = new WP_Error( 'wpo-rest-group-create-option', __( 'Something went wrong: could not create an option.', 'woocommerce-product-options' ) );
				} else {
					$option_updates[ $option->getID() ] = $option;
					do_action( 'wc_product_options_after_option_update', $option );
				}
			}
		}

		return new WP_REST_Response(
			[
				'group_id' => $group->getID(),
				'options'  => [
					'errors'  => $option_errors,
					'updates' => $option_updates,
				],
			],
			200
		);
	}

	/**
	 * Duplicate a group
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate( $request ) {
		$data    = $request->get_params();
		$options = Option_Model::orderBy( 'menu_order', 'asc' )->where( 'group_id', $data['id'] )->get();

		if ( $options instanceof Collection ) {
			$data['options'] = $options->toArray();
		}

		$results = $this->run_group_addition( $data );

		if ( $results === false ) {
			return new WP_Error( 'wpo-rest-group-duplicate', __( 'Something went wrong while duplicating the group', 'woocommerce-product-options' ) );
		}

		$group          = $results['group'];
		$option_errors  = $results['option_errors'];
		$option_updates = $results['option_updates'];

		return new WP_REST_Response(
			[
				'group_id' => $group->getID(),
				'options'  => [
					'errors'  => $option_errors,
					'updates' => $option_updates,
				],
			],
			200
		);
	}

	/**
	 * Process the import of groups from a JSON file.
	 *
	 * The JSON file is read on the client side and passed as part of the request body.
	 *
	 * The process runs in two steps:
	 * 1. If preflight is set to true, the method reads the groups from the body,
	 *    checks for any conflicts with existing groups and sets flags and actions
	 *    of each group being imported before returning them to the client.
	 * 2. If preflight is not set, the actual import step reads the preflight data
	 *    as edited by the user on the client side and imports the groups that are marked for import.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function import( $request ) {
		$data      = json_decode( $request->get_body(), true );
		$preflight = $data['preflight'] ?? false;

		if ( $preflight ) {
			$result = $this->import_preflight( $data );
		} else {
			$result = $this->import_groups( $data );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Preflight import of groups.
	 *
	 * This method performs a preliminary processing of the groups being imported
	 * providing the user with information about potential conflicts and changes.
	 *
	 * @param array $data The data read from an exported JSON file.
	 * @return WP_REST_Response
	 */
	public function import_preflight( $data ) {
		$groups = $data['groups'];
		$maps   = $data['maps'];

		$group_imports = [];

		foreach ( $groups as $group ) {
			$group_import            = [];
			$group_import['id']      = $group['id'];
			$group_import['success'] = true;
			$group_import['action']  = 'import';

			$p  = $group['products'];
			$ep = $group['exclude_products'];
			$c  = $group['categories'];
			$ec = $group['exclude_categories'];

			// remap product and category IDs
			$group['products']           = array_values( $this->remap_imported_products( $p, $maps['products'] ?? [] ) );
			$group['exclude_products']   = array_values( $this->remap_imported_products( $ep, $maps['products'] ?? [] ) );
			$group['categories']         = $this->remap_imported_categories( $c, $maps['categories'] ?? [] );
			$group['exclude_categories'] = $this->remap_imported_categories( $ec, $maps['categories'] ?? [] );

			$group_import['selectionChanges'] = $p !== $group['products']
				|| $ep !== $group['exclude_products']
				|| $c !== $group['categories']
				|| $ec !== $group['exclude_categories'];

			if ( empty( array_merge( $group['products'], $group['categories'] ) ) ) {
				$group_import['changedVisibility'] = $group['visibility'] !== ( str_starts_with( $group['visibility'], 'disabled-' ) ? 'disabled-global' : 'global' );
				$group_import['selectionChanges']  = false;
				$group['visibility']               = str_starts_with( $group['visibility'], 'disabled-' ) ? 'disabled-global' : 'global';
			}

			$conflict              = $this->find_duplicate_group( $group );
			$group['options']      = $this->process_options_data( $group['options'], $maps );
			$group_import['group'] = $group;

			if ( $conflict ) {
				$group_import['conflict'] = $conflict['id'];
				$group_import['success']  = false;
				$group_import['action']   = 'skip';
			}

			$group_imports[] = $group_import;
		}

		return $group_imports;
	}

	/**
	 * Import groups into the database, based on the preflight data.
	 *
	 * @param array $data The data coming from the import preflight.
	 * @return WP_REST_Response
	 */
	public function import_groups( $data ) {
		$group_imports = [];

		foreach ( $data['groups'] as $group_data ) {
			$group     = $group_data['group'];
			$action    = $group_data['action'] ?? 'skip';
			$overwrite = $action === 'overwrite';
			$import    = $action === 'import';
			$duplicate = $action === 'duplicate';
			$conflict  = $group_data['conflict'] ?? false;

			$group_import            = [];
			$group_import['id']      = $group_data['id'];
			$group_import['success'] = true;

			if ( $conflict ) {
				$group_import['conflict'] = $conflict;
				$group_import['success']  = false;
			}

			if ( ( ( ( ! $conflict && $import ) || $duplicate ) || $overwrite ) ) {
				$addition_info            = $this->run_group_addition( $group );
				$group_import['imported'] = true;

				if ( $addition_info === false ) {
					$group_import['imported'] = false;
				} elseif ( $conflict && $overwrite ) {
					$old_group = Group_Model::find( $conflict );

					if ( $old_group instanceof Group_Model ) {
						$old_group->delete();
						Option_Model::where( 'group_id', $old_group->getID() )->delete();
					}
				}

				if ( ! empty( $addition_info['option_errors'] ) ) {
					$group_import['option_errors'] = $addition_info['option_errors'];
				}
			}

			$group_imports[] = $group_import;
		}

		return new WP_REST_Response( $group_imports, 200 );
	}

	/**
	 * Remap the imported products to the correct product IDs.
	 *
	 * @param array $product_ids An array of products with product_id, sku, name and type.
	 * @param array $product_map An array of product info to remap to.
	 * @return array
	 */
	private function remap_imported_products( $product_ids, $product_map = [] ) {
		$remapped_products = [];

		if ( is_null( $product_ids ) ) {
			return $remapped_products;
		}

		foreach ( $product_ids as $product_id ) {
			$source_product = $product_map[ $product_id ] ?? null;

			if ( ! $source_product ) {
				continue;
			}

			// if sku, name and type all match, we found the correct product ID
			$query = new WC_Product_Query();

			if ( ! empty( $source_product['sku'] ) ) {
				$query->set( 'sku', $source_product['sku'] );
			}

			$query->set( 'title', $source_product['name'] );
			$query->set( 'type', $source_product['type'] );
			$products = $query->get_products();

			if ( ! empty( $products ) ) {
				$remapped_products[ $product_id ] = $products[0]->get_id();
			}
		}

		return $remapped_products;
	}

	/**
	 * Remap the imported categories to the correct category IDs.
	 *
	 * @param array $categories An array of categories with category_id, slug and name.
	 * @return array
	 */
	private function remap_imported_categories( $category_ids, $category_map = [] ) {
		$remapped_categories = [];

		if ( is_null( $category_ids ) ) {
			return $remapped_categories;
		}

		foreach ( $category_ids as $category_id ) {
			$source_category = $category_map[ $category_id ] ?? null;

			if ( ! $source_category ) {
				continue;
			}

			// if both name and slug match, we found the correct category ID
			$matched_category = get_term_by( 'slug', $source_category['slug'], 'product_cat' );

			if ( $matched_category && $matched_category->name === $source_category['name'] ) {
				$remapped_categories[] = $matched_category->term_id;
			}
		}

		return array_values( array_unique( $remapped_categories ) );
	}

	/**
	 * Try to remap the imported image IDs to the correct image IDs.
	 *
	 * The remapping is based on the image URL. If the database contains an image attachment
	 * with the same basename, we check if file size, dimensions and mime type all match.
	 * If they do, we assume that the image is the same and remap the ID.
	 * If they don't, we try to download the image from the URL and re-upload it to the media library.
	 * If the image can't be downloaded or uploaded, we skip the image and return false
	 * so that the error can be reported to the user.
	 *
	 * @param array $image_metadata The metadata of the image to remap:
	 *                              original ID, url, file, file size, dimensions and mime type.
	 *
	 * @return int|bool The remapped image ID if successful, false otherwise.
	 */
	private function remap_imported_image( $media ) {
		$basename = wp_basename( $media['file'] );

		$existing_image = get_posts(
			[
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'name'           => $basename,
			]
		);

		if ( ! empty( $existing_image ) ) {
			$existing_image = $existing_image[0];
			$existing_meta  = wp_get_attachment_metadata( $existing_image->ID );
			// if metadata matches, we assume the image is the same
			if (
				$basename === basename( $existing_meta['file'] ) &&
				$media['width'] === $existing_meta['width'] &&
				$media['height'] === $existing_meta['height'] &&
				$media['filesize'] === $existing_meta['filesize'] &&
				$media['metahash'] === md5( wp_json_encode( $existing_meta['image_meta'] ) )
			) {
				return $existing_image->ID;
			}
		}

		return $media;
	}

	/**
	 * Download an image from its original location and upload it to the media library.
	 *
	 * @param string $media The array with the media information.
	 */
	private function import_source_image_data( $media ) {
		$url  = $media['image_url'];
		$name = $media['file'];

		// download the image
		$response = wp_remote_get( $url );

		if ( is_wp_error( $response ) ) {
			return 0;
		}

		$upload = wp_upload_bits( $name, null, wp_remote_retrieve_body( $response ) );

		if ( $upload['error'] ) {
			return false;
		}

		$attachment = [
			'post_title'     => $name,
			'post_content'   => '',
			'post_status'    => 'inherit',
			'post_mime_type' => wp_check_filetype( $upload['file'] )['type'],
		];

		$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );

		if ( is_wp_error( $attachment_id ) ) {
			return false;
		}

		if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
			include( \ABSPATH . 'wp-admin/includes/image.php' );
		}

		$attachment_data = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
		wp_update_attachment_metadata( $attachment_id, $attachment_data );

		return $attachment_id;
	}

	/**
	 * Find a group with the same name and options.
	 *
	 * @param array $group
	 * @return int|bool The ID of the group if found, false otherwise.
	 */
	private function find_duplicate_group( $group ) {
		// get a list of all the choices from the options
		$choices = array_reduce(
			$group['options'],
			function ( $result, $option ) {
				return array_merge( $result, array_column( $option['choices'] ?? [], 'id' ) );
			},
			[]
		);

		if ( empty( $choices ) ) {
			return false;
		}

		$existing_option = false;
		$choice_length   = count( $choices );

		while ( $choice_length > 0 && ! $existing_option ) {
			$first_choice = array_shift( $choices );

			if ( $first_choice ) {
				$existing_option = Option_Model::whereJsonContains( 'choices', [ [ 'id' => $first_choice ] ] )->first();
			}

			$choice_length = count( $choices );
		}

		if ( ! $existing_option ) {
			return false;
		}

		$candidate_group  = Group_Model::find( $existing_option->group_id )->toArray();
		$existing_options = Option_Model::where( 'group_id', $candidate_group['id'] )->get()->toArray() ?? [];

		// remove id, group_id and menu_order from each option
		// then compare the options and see how many are the same

		$imported_options = $group['options'];

		// normalize options to remove id, group_id and menu_order
		$matching_options = array_filter(
			array_map(
				function ( $option, $key ) use ( $imported_options ) {
					$imported_option = $imported_options[ $key ];

					if ( empty( $imported_option ) ) {
						return false;
					}

					return $this->compare_options( $option, $imported_option );
				},
				$existing_options,
				array_keys( $existing_options )
			)
		);

		if ( count( $matching_options ) === count( $existing_options ) && count( $matching_options ) === count( $imported_options ) ) {
			return $candidate_group;
		}

		return false;
	}

	public function compare_options( $option_1, $option_2 ) {
		unset( $option_1['id'], $option_1['group_id'], $option_1['menu_order'] );
		unset( $option_2['id'], $option_2['group_id'], $option_2['menu_order'] );

		$option_1 = array_map(
			function ( $prop ) {
				return empty( $prop ) ? null : $prop;
			},
			$option_1,
		);
		$option_2 = array_map(
			function ( $prop ) {
				return empty( $prop ) ? null : $prop;
			},
			$option_2,
		);

		$match = wp_json_encode( $option_1 ) === wp_json_encode( $option_2 );

		return $match;
	}

	/**
	 * Update a group
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( $request ) {
		$id      = $request->get_param( 'id' );
		$options = $request->get_param( 'options' );
		$data    = $request->get_params();

		$option_errors   = [];
		$option_warnings = [];
		$option_updates  = [];

		$group = Group_Model::find( $id );

		if ( ! $group || ! $group instanceof Group_Model ) {
			return new WP_Error( 'wpo-rest-group-update', __( 'Something went wrong: could not update the selected group', 'woocommerce-product-options' ) );
		}

		$group->update( $data );
		do_action( 'wc_product_options_after_group_update', $group );

		// check for deleted options
		$this->delete_missing_options( $group->getID(), $options );

		if ( ! empty( $options ) && is_array( $options ) ) {
			foreach ( $options as $option_data ) {
				do_action( 'wc_product_options_before_option_update', $option_data );

				if ( empty( $option_data['conditional_logic'] ) ) {
					$option_data['conditional_logic'] = '{}';
				}

				if ( $option_data['id'] === 0 ) {
					unset( $option_data['id'] );
					$option_data['menu_order'] = Option_Model::where( 'group_id', $group->getID() )->max( 'menu_order' ) + 1;

					$option = Option_Model::create( $option_data );
				} else {
					$option = Option_Model::find( $option_data['id'] );
				}

				if ( ! $option || ! $option instanceof Option_Model ) {
					$option_errors[] = new WP_Error( 'wpo-rest-group-update-option', __( 'Something went wrong: could not update an option.', 'woocommerce-product-options' ) );
					continue;
				}

				$option_updates[ $option->getID() ] = $option->update( $option_data );
				do_action( 'wc_product_options_after_option_update', $option );
			}
		}

		// detect changed option types used in formulas
		$warning_messages = $this->validate_formula_options( $group );
		$this->update_formula_options( $group );

		if ( ! empty( $warning_messages ) ) {
			$option_warnings = array_merge( $option_warnings, $warning_messages );
		}

		return new WP_REST_Response(
			[
				'group_id' => $group->getID(),
				'options'  => [
					'errors'   => $option_errors,
					'updates'  => $option_updates,
					'warnings' => $option_warnings,
				],
			],
			200
		);
	}

	/**
	 * Set the group as enabled or disabled.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function toggle( $request ) {
		$group_id   = $request->get_param( 'group' );
		$visibility = $request->get_param( 'visibility' );

		$group = Group_Model::find( $group_id );
		$data  = [
			'visibility' => $visibility,
		];

		if ( ! $group || ! $group instanceof Group_Model ) {
			return new WP_Error( 'wpo-rest-group-update', __( 'Something went wrong: could not update the selected group', 'woocommerce-product-options' ) );
		}

		$group->update( $data );

		/**
		 * Action: fired after the activation status of a discount
		 * has been toggled.
		 *
		 * @param Discount $discount
		 * @param bool $enabled
		 */
		do_action( 'wpo_group_status_toggled', $group, strpos( $visibility, 'disabled-' ) === false );

		return new WP_REST_Response( $group, 200 );
	}

	/**
	 * Delete a group
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete( $request ) {
		$id = $request->get_param( 'id' );

		$group = Group_Model::find( $id );

		if ( ! $group || ! $group instanceof Group_Model ) {
			return new WP_Error( 'wpo-rest-group-delete', __( 'Something went wrong: could not find the group', 'woocommerce-product-options' ) );
		}

		$group->delete();

		Option_Model::where( 'group_id', $group->getID() )->delete();

		return new WP_REST_Response( true, 200 );
	}

	/**
	 * Reorder the groups
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function reorder( $request ) {
		$reorder_map = $request->get_param( 'reorder' );

		foreach ( $reorder_map as $index => $group_id ) {
			$group = Group_Model::find( $group_id );

			if ( ! $group || ! $group instanceof Group_Model ) {
				return new WP_Error( 'wpo-rest-group-delete', __( 'Something went wrong with reodering.', 'woocommerce-product-options' ) );
			}

			$group->update( [ 'menu_order' => $index ] );
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
	 * Check if there are price formulas that need validity checks.
	 *
	 * @param Group_Model $group
	 * @return array|null Array of warning messages or null if no warnings.
	 */
	private function validate_formula_options( $group ) {
		if ( ! is_a( $group, Group_Model::class ) ) {
			return;
		}

		$options = Option_Model::where( 'group_id', $group->getID() )->get();

		$formula_options = $options->filter(
			function ( $option ) {
				return $option->type === 'price_formula';
			}
		);

		if ( count( $formula_options ) < 1 ) {
			return null;
		}

		$warning_messages = [];

		// check if the price formula is valid and get the variables
		foreach ( $formula_options as $formula_option ) {
			$price_formula = new Formula( $formula_option );

			if ( ! $price_formula->check_validity() ) {
				continue;
			}

			// we don't need to check product properties (price, weight, etc.) or custom variables
			$variables = array_filter(
				$price_formula->get_variables(),
				function ( $variable ) {
					return ! in_array( $variable['type'], [ 'product', 'custom_variable' ], true );
				}
			);

			foreach ( $variables as $variable ) {
				// find the option among $options that has the same name as $variable['name']
				$variable_name = explode( '.', $variable['var'] )[0] ?? '';
				$option_id     = str_replace( 'var', '', $variable_name );
				$option        = Option_Model::where( 'id', $option_id )->first();

				// TODO:
				// Consider removing the following if clause, as the
				// new way of saving formula variables should prevent
				// this from happening
				if ( ! $option ) {
					// $option no longer exists
					/* translators: 1: option name, 2: formula name */
					$warning_messages[] = sprintf( __( 'The option "%1$s" no longer exists. Please update the formula "%2$s".', 'woocommerce-product-options' ), $variable['name'], $formula_option->name );
					$price_formula->set_valid( false );
					continue;
				}
			}
		}

		return $warning_messages;
	}

	/**
	 * Check if there are price formulas that need validity checks.
	 *
	 * @param Group_Model $group The group to update the formula options for.
	 * @return array|null        Array of warning messages or null if no warnings.
	 */
	private function update_formula_options( $group ) {
		if ( ! is_a( $group, Group_Model::class ) ) {
			return;
		}

		$options = Option_Model::where( 'group_id', $group->getID() )->get();

		$formula_options = $options->filter(
			function ( $option ) {
				return $option->type === 'price_formula';
			}
		);

		if ( count( $formula_options ) < 1 ) {
			return null;
		}

		$warning_messages = [];

		// check if the price formula is valid and get the variables
		foreach ( $formula_options as $formula_option ) {
			$price_formula = new Formula( $formula_option );

			if ( ! $price_formula->check_validity() ) {
				continue;
			}

			// check variables exists as number options.
			$variables = $price_formula->get_variables();

			foreach ( $variables as $variable ) {
				// find the option among $options that has the same name as $variable['name']
				$new_option = $options->first(
					function ( $option ) use ( $variable ) {
						return $option->name === ( explode( '.', $variable['name'] )[0] ?? '' );
					}
				);

				// option no longer exists
				if ( $new_option ) {
					$price_formula->update_variable_id( $new_option->id, $variable['id'] );
				}
			}

			$price_formula->save();
		}

		return $warning_messages;
	}

	/**
	 * Determine which options were deleted by their lack of presence in the request.
	 *
	 * @param int $group_id
	 * @param array $options
	 */
	private function delete_missing_options( $group_id, $options ): void {
		$current_options = Option_Model::where( 'group_id', $group_id )->pluck( 'id' );
		$updated_options = new Collection( $options );
		$deleted_options = $current_options->diff( $updated_options->pluck( 'id' ) );

		if ( $deleted_options->isNotEmpty() ) {
			foreach ( $deleted_options as $option_id ) {
				Option_Model::find( $option_id )->delete();
			}
		}
	}

	/**
	 * Perform the addition of a group
	 *
	 * @param array $data The data of the group to be added.
	 * @return Group_Model|false
	 */
	private function run_group_addition( $data ) {
		unset( $data['id'] );
		$data_version = $data['version'];
		unset( $data['version'] );

		$option_errors  = [];
		$option_updates = [];

		$options = $data['options'];
		unset( $data['options'] );

		$group = Group_Model::create( $data );

		if ( ! $group instanceof Group_Model || empty( $group->getID() ) ) {
			return false;
		}

		if ( ! empty( $options ) && is_array( $options ) ) {
			$translated_option_ids = [];

			foreach ( $options as $option_data ) {
				$old_option_id = $option_data['id'];
				unset( $option_data['id'] );

				$option_data['group_id']   = $group->getID();
				$option_data['menu_order'] = Option_Model::where( 'group_id', $group->getID() )->max( 'menu_order' ) + 1;
				$option_data['settings']   = $option_data['settings'] ?? [];

				foreach ( $option_data['choices'] as $index => $choice ) {
					if ( isset( $choice['media'] ) && is_array( $choice['media'] ) ) {
						$option_data['choices'][ $index ]['media'] = $this->import_source_image_data( $choice['media'] );
					}
				}

				$option_data = array_filter(
					$option_data,
					function ( $value ) {
						return ! is_null( $value );
					}
				);

				$option = Option_Model::create( $option_data );

				if ( ! $option || ! $option instanceof Option_Model || ! $option->getID() ) {
					$option_errors[] = new WP_Error( 'wpo-rest-group-create-option', __( 'Something went wrong: could not create an option.', 'woocommerce-product-options' ) );
				} else {
					$translated_option_ids[ $old_option_id ] = $option->getID();
					$option_updates[ $option->getID() ]      = $option;
				}
			}

			// now that we have all the IDs of the new options, we can update formulas and conditional logic
			foreach ( $options as $option_data ) {
				$conditional_logic = false;
				$old_option_id     = $option_data['id'];
				$option            = Option_Model::find( $translated_option_ids[ $old_option_id ] );

				if ( ! $option || ! $option instanceof Option_Model ) {
					continue;
				}

				if ( $option->type === 'price_formula' ) {
					Version_Updater::convert_formula( $option );
				}

				if ( ! empty( $option_data['conditional_logic'] ) && $option_data['conditional_logic'] !== '{}' ) {
					$conditional_logic = $option_data['conditional_logic'];
					$conditions        = $conditional_logic['conditions'];

					foreach ( $conditions as $index => $condition ) {
						$conditions[ $index ]['id']       = $condition['id'] . '-' . $translated_option_ids[ $condition['optionID'] ];
						$conditions[ $index ]['optionID'] = $translated_option_ids[ $condition['optionID'] ];
					}

					$conditional_logic['conditions'] = $conditions;
				} else {
					$option_data['conditional_logic'] = '{}';
				}

				if ( $conditional_logic ) {
					if ( $option && $option instanceof Option_Model ) {
						$option->update( [ 'conditional_logic' => $conditional_logic ] );
					}
				}
			}

			// ...and the formula options
			$this->update_formula_options( $group );
		}

		return [
			'group'          => $group,
			'option_errors'  => $option_errors,
			'option_updates' => $option_updates,
		];
	}

	/**
	 * Process the options data for import.
	 *
	 * @param array $options The array of options to process.
	 * @param array $maps    The maps of categories, products and images being remapped.
	 * @return array
	 */
	public function process_options_data( $options, $maps ) {
		if ( empty( $maps ) || empty( $options ) || ! is_array( $options ) ) {
			return $options;
		}

		foreach ( $options as $index => $option ) {
			if ( $option['type'] === 'product' ) {
				if ( $option['settings']['product_selection'] === 'dynamic' ) {
					$category_ids = $this->remap_imported_categories( array_column( $option['settings']['dynamic_products']['categories'], 'category_id' ), $maps['categories'] ?? [] );
					$categories   = array_map(
						function ( $category_id ) {
							$term = get_term( $category_id, 'product_cat' );
							return [
								'category_id'   => $category_id,
								'category_name' => $term->name,
								'category_slug' => $term->slug,
							];
						},
						$category_ids,
					);
					$options[ $index ]['settings']['dynamic_products']['categories'] = $categories;
				} else {
					$manual_products = $option['settings']['manual_products'];
					$product_ids     = $this->remap_imported_products( array_column( $manual_products, 'product_id' ), $maps['products'] ?? [] );
					$variations      = array_reduce(
						$option['settings']['manual_products'] ?: [],
						function ( $variations, $product ) {
							return array_merge( $variations, $product['variations'] ?: [] );
						},
						[]
					);

					if ( ! empty( $variations ) ) {
						$variation_ids = array_values( array_unique( array_column( $variations, 'id' ) ) );
						$variation_ids = $this->remap_imported_products( $variation_ids, $maps['products'] ?? [] );
					}

					foreach ( $manual_products as $product_index => $product_data ) {
						if ( ! isset( $product_ids[ $product_data['product_id'] ] ) ) {
							$manual_products[ $product_index ] = null;
							continue;
						}

						$product_id = $product_ids[ $product_data['product_id'] ];
						$product    = wc_get_product( $product_id );

						if ( $product ) {
							$product_data = array_merge(
								$product_data,
								[
									'label'        => $product->get_name(),
									'product_id'   => $product_ids[ $product_data['product_id'] ],
									'product_name' => $product->get_name(),
									'type'         => $product->get_type(),
								]
							);
						}

						if ( $product_data['variations'] ) {
							$product_data['variations'] = array_map(
								function ( $variation ) use ( $variation_ids ) {
									$variation_product = wc_get_product( $variation_ids[ $variation['id'] ] ?? 0 );

									if ( ! $variation_product ) {
										return $variation;
									}

									$variation_attributes = $variation_product->get_attributes();
									$attributes           = array_map(
										function ( $value, $attribute ) use ( $variation_product ) {
											$taxonomy = get_taxonomy( $attribute );

											if ( $taxonomy ) {
												$label = get_taxonomy_labels( $taxonomy )->singular_name ?? '';
											} else {
												$label = wc_attribute_label( $attribute, $variation_product );
											}

											$attribute_term = get_term_by( 'slug', $value, $attribute );
											return [
												'id'     => wc_attribute_taxonomy_id_by_name( $attribute ),
												'name'   => $label,
												'slug'   => $attribute,
												'option' => $attribute_term->name ?? $value,
											];
										},
										$variation_attributes,
										array_keys( $variation_attributes )
									);

									$variation = [
										'id'         => $variation_product->get_id(),
										'name'       => $variation_product->get_name(),
										'attributes' => array_values( array_filter( $attributes ) ),
									];

									return $variation;
								},
								$product_data['variations']
							);
						}

						$manual_products[ $product_index ] = $product_data;
					}

					$options[ $index ]['settings']['manual_products'] = array_values( array_filter( $manual_products ) );
				}
			}

			if ( ! is_null( $options[ $index ]['choices'] ) ) {
				$options[ $index ]['choices'] = array_map(
					function ( $choice ) use ( $maps ) {
						if ( ! isset( $choice['media'] ) ) {
							return $choice;
						}

						$media = $maps['images'][ $choice['media'] ] ?? null;

						if ( is_null( $media ) ) {
							return $choice;
						}

						$new_media_id = $this->remap_imported_image( $media );

						if ( ! $new_media_id ) {
							$choice['media'] = 0;

							return $choice;
						}

						$choice['media'] = $new_media_id;

						return $choice;
					},
					$option['choices'] ?? []
				);
			}
		}

		return $options;
	}

	// GET VISIBILITY OBJECTS
	public function get_visibility( $request ) {
		$group_collection = Group_Model::orderBy( 'menu_order', 'asc' )->get();

		if ( ! $group_collection instanceof Collection ) {
			return new WP_Error( 'wpo-rest-group-get-all', __( 'No groups', 'woocommerce-product-options' ) );
		}

		foreach ( $group_collection->all() as &$group ) {
			$group->visibility = $this->get_visibility_objects( $group );
		}

		return new WP_REST_Response( $this->get_visibility_objects( $group_collection ), 200 );
	}

	public function get_visibility_objects( $group ) {
		$products   = array_merge( $group->products ?? [], $group->exclude_products ?? [] );
		$categories = array_merge( $group->categories ?? [], $group->exclude_categories ?? [] );

		$products = array_map(
			function ( $product_id ) {
				$product = wc_get_product( $product_id );
				if ( ! $product instanceof \WC_Product ) {
					return null;
				}
				return [
					'id'   => $product->get_id(),
					'name' => $product->get_name(),
					'slug' => $product->get_slug(),
					'href' => $product->get_permalink(),
				];
			},
			array_values( array_unique( $products ) )
		);

		$products = array_values( array_filter( $products ) );

		/**
		 * Filter the list of term IDs so that other plugins can add or remove terms.
		 *
		 * This filter is used by the WPML integration to add translations of the terms.
		 *
		 * @param array $term_ids The list of all term IDs.
		 * @param array $terms        The list of term objects.
		 */
		$term_ids = apply_filters( 'wc_product_options_group_categories', $categories );

		$categories = array_map(
			function ( $term_id ) {
				return [
					'term_id' => $term_id,
					'name'    => ( get_term( $term_id, 'product_cat' )->name ?? '' ),
					'href'    => get_term_link( $term_id, 'product_cat' ),
				];
			},
			array_values( array_unique( $term_ids ) )
		);

		return [
			'products'   => $products,
			'categories' => $categories,
		];
	}

	/**
	 * Get a formatted list of products.
	 *
	 * The list also include every possible translation of the products.
	 *
	 * @todo This method is necessary to handle a bug in WPML
	 *       (see: https://wpml.org/forums/topic/woocommerce-rest-api-include-parameter-used-with-langall-returns-incorrect-results)
	 *       Once the bug is fixed, we can remove this method altogether
	 *       and restore the script invoking this REST API endpoint
	 *       to use the /wc/v3/products one instead.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_products( $request ) {
		$include = $request->get_param( 'include' );
		$search  = $request->get_param( 'search' );

		if ( empty( $include ) && empty( $search ) ) {
			return new WP_Error( 'wpo-rest-product-get-all', __( 'Missing parameters. Please provide either "include" or "search" parameter.', 'woocommerce-product-options' ) );
		}

		if ( ! empty( $search ) ) {
			return $this->search_for_products( $request );
		}

		/**
		 * Filter the list of product IDs so that other plugins can add or remove products.
		 *
		 * @param array $product_ids The list of all product IDs.
		 */
		$product_ids = apply_filters( 'wc_product_options_group_products', $include );

		$products = array_map(
			function ( $product_id ) {
				return wc_get_product( $product_id );
			},
			array_values( array_unique( $product_ids ) )
		);

		if ( ! $products ) {
			return new WP_Error( 'wpo-rest-product-get-all', __( 'No products', 'woocommerce-product-options' ) );
		}

		$products = array_map(
			function ( $product ) {
				return [
					'id'   => $product->get_id(),
					'slug' => $product->get_slug(),
					'name' => $product->get_name(),
					'href' => $product->get_permalink(),
				];
			},
			array_values( array_filter( $products ) )
		);

		return new WP_REST_Response( $products, 200 );
	}

	/**
	 * Add a wildcard search to the posts where clause.
	 *
	 * @param string $where The current where clause.
	 * @param WP_Query $wp_query The current WP_Query object.
	 * @return string The modified where clause.
	 */
	public function add_wildcard_search_where( $where, $wp_query ) {
		if ( isset( $wp_query->query_vars['wpo_search'] ) ) {
			global $wpdb;
			$pattern = esc_sql( $wp_query->query_vars['wpo_search'] );
			$where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", $pattern );
		}

		return $where;
	}

	/**
	 * Search for products based on a search term.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function search_for_products( $request ) {
		$search   = '%' . preg_replace( '/\s+/', '%', $request->get_param( 'search' ) ) . '%';
		$per_page = $request->get_param( 'per_page' );

		if ( ! $search ) {
			return new WP_Error( 'wpo-rest-product-search', __( 'No search term provided', 'woocommerce-product-options' ) );
		}

		add_filter( 'posts_where', [ $this, 'add_wildcard_search_where' ], 10, 2 );

		$query = new WC_Product_Query();
		$query->set( 'wpo_search', $search );
		$query->set( 'per_page', $per_page ?? 50 );
		$products = $query->get_products();

		remove_filter( 'posts_where', [ $this, 'add_wildcard_search_where' ], 10 );

		return new WP_REST_Response(
			array_map(
				function ( $product ) {
					return [
						'id'   => $product->get_id(),
						'slug' => $product->get_slug(),
						'name' => $product->get_name(),
						'href' => $product->get_permalink(),
					];
				},
				array_values( array_filter( $products ) )
			),
			200
		);
	}

	/**
	 * Get a formatted list of product categories.
	 *
	 * The list also include every possible translation of the categories.
	 *
	 * @todo This method is necessary to handle a bug in WPML
	 *       (see: https://wpml.org/forums/topic/woocommerce-rest-api-include-parameter-used-with-langall-returns-incorrect-results)
	 *       Once the bug is fixed, we can remove this method altogether
	 *       and restore the script invoking this REST API endpoint
	 *       to use the /wc/v3/products/categories one instead.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_categories( $request ) {
		$include = $request->get_param( 'include' );

		/**
		 * Filter the list of term IDs so that other plugins can add or remove terms.
		 *
		 * @param array $term_ids The list of all term IDs.
		 */
		$term_ids = apply_filters( 'wc_product_options_group_categories', $include );

		$terms = array_map(
			function ( $term_id ) {
				return get_term( $term_id, 'product_cat' );
			},
			array_values( array_unique( $term_ids ) )
		);

		if ( ! $terms ) {
			return new WP_Error( 'wpo-rest-group-categories', __( 'No categories', 'woocommerce-product-options' ) );
		}

		$terms = array_map(
			function ( $term ) {
				return [
					'id'   => $term->term_id,
					'slug' => $term->slug,
					'name' => $term->name,
					'href' => get_term_link( $term->term_id, 'product_cat' ),
				];
			},
			$terms
		);

		return new WP_REST_Response( $terms, 200 );
	}

	/**
	 * Retrieves the schema for the update and create endpoints.
	 *
	 * @return []
	 */
	private function get_group_schema() {
		return [
			'id'                 => [
				'type'        => 'integer',
				'required'    => true,
				'description' => __( 'The unique identifier for the group.', 'woocommerce-product-options' ),
			],
			'menu_order'         => [
				'type'        => 'int',
				'required'    => true,
				'description' => __( 'The menu order for the group.', 'woocommerce-product-options' ),
			],
			'name'               => [
				'type'        => 'string',
				'required'    => false,
				'description' => __( 'The name for the group.', 'woocommerce-product-options' ),
			],
			'display_name'       => [
				'type'        => 'boolean',
				'required'    => false,
				'description' => __( 'Indicates whether the group name should be displayed.', 'woocommerce-product-options' ),
			],
			'visibility'         => [
				'type'        => 'string',
				'required'    => false,
				'description' => __( 'The visiblity status for the group.', 'woocommerce-product-options' ),
			],
			'products'           => [
				'type'        => 'array',
				'items'       => [
					'type' => 'integer',
				],
				'required'    => false,
				'description' => __( 'The products for the group.', 'woocommerce-product-options' ),
			],
			'exclude_products'   => [
				'type'        => 'array',
				'items'       => [
					'type' => 'integer',
				],
				'required'    => false,
				'description' => __( 'The products to exclude for for the group.', 'woocommerce-product-options' ),
			],
			'categories'         => [
				'type'        => 'array',
				'items'       => [
					'type' => 'integer',
				],
				'required'    => false,
				'description' => __( 'The categories for the group.', 'woocommerce-product-options' ),
			],
			'exclude_categories' => [
				'type'        => 'array',
				'items'       => [
					'type' => 'integer',
				],
				'required'    => false,
				'description' => __( 'The categories to exclude for the group.', 'woocommerce-product-options' ),
			],
			'options'            => [
				'type'        => 'array',
				'required'    => false,
				'description' => __( 'The options for the group.', 'woocommerce-product-options' ),
				'items'       => [
					'type'       => 'object',
					'properties' => [
						'id'           => [
							'type'        => 'integer',
							'required'    => false,
							'description' => __( 'The unique identifier for the option.', 'woocommerce-product-options' ),
						],
						'group_id'     => [
							'type'        => 'integer',
							'required'    => false,
							'description' => __( 'The Group ID to which the option belongs.', 'woocommerce-product-options' ),
						],
						'menu_order'   => [
							'type'        => 'int',
							'required'    => false,
							'description' => __( 'The menu order for the option.', 'woocommerce-product-options' ),
						],
						'name'         => [
							'type'        => 'string',
							'required'    => false,
							'description' => __( 'The name for the option.', 'woocommerce-product-options' ),
						],
						'description'  => [
							'type'        => 'string',
							'required'    => false,
							'description' => __( 'The visiblity status for the option.', 'woocommerce-product-options' ),
						],
						'type'         => [
							'type'        => 'string',
							'required'    => false,
							'description' => __( 'The field type for the option.', 'woocommerce-product-options' ),
						],
						'choices'      => [
							'type'        => [ 'array', 'null' ],
							'required'    => false,
							'description' => __( 'The choices for the option.', 'woocommerce-product-options' ),
						],
						'required'     => [
							'type'        => 'boolean',
							'required'    => false,
							'description' => __( 'Indicates whether the option is required.', 'woocommerce-product-options' ),
						],
						'display_name' => [
							'type'        => 'boolean',
							'required'    => false,
							'description' => __( 'Indicates whether the option name should be displayed.', 'woocommerce-product-options' ),
						],
						'settings'     => [
							'type'        => [ 'object', 'null' ],
							'required'    => false,
							'description' => __( 'Any specific extra settings for the option.', 'woocommerce-product-options' ),
							'properties'  => [
								'datepicker' => [
									'type'        => 'object',
									'required'    => false,
									'description' => __( 'Settings for the datepicker', 'woocommerce-product-options' ),
									'properties'  => [
										'choice_type'      => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The choice type for the option.', 'woocommerce-product-options' ),
										],
										'selected_attribute' => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The selected attribute for the option.', 'woocommerce-product-options' ),
										],
										'date_format'      => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The date format for the option.', 'woocommerce-product-options' ),
										],
										'min_date'         => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The minimum date for the option.', 'woocommerce-product-options' ),
										],
										'max_date'         => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The maximum date for the option.', 'woocommerce-product-options' ),
										],
										'disable_days'     => [
											'type'        => 'array',
											'required'    => false,
											'description' => __( 'The days to disable for the option.', 'woocommerce-product-options' ),
											'items'       => [
												'type' => 'integer',
											],
										],
										'disable_dates'    => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The dates to disable for the option.', 'woocommerce-product-options' ),
										],
										'disable_past_dates' => [
											'type'        => [ 'boolean', 'null' ],
											'required'    => false,
											'description' => __( 'Indicates whether past dates should be disabled for the option.', 'woocommerce-product-options' ),
										],
										'disable_future_dates' => [
											'type'        => [ 'boolean', 'null' ],
											'required'    => false,
											'description' => __( 'Indicates whether future dates should be disabled for the option.', 'woocommerce-product-options' ),
										],
										'enable_time'      => [
											'type'        => [ 'boolean', 'null' ],
											'required'    => false,
											'description' => __( 'Indicates whether the time should be enabled for the option.', 'woocommerce-product-options' ),
										],
										'min_time'         => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The minimum time for the option.', 'woocommerce-product-options' ),
										],
										'max_time'         => [
											'type'        => 'string',
											'required'    => false,
											'description' => __( 'The maximum time for the option.', 'woocommerce-product-options' ),
										],
										'minute_increment' => [
											'type'        => 'integer',
											'required'    => false,
											'minimum'     => 1,
											'maximum'     => 60,
											'description' => __( 'The minute increment for the option.', 'woocommerce-product-options' ),
										],
										'hour_increment'   => [
											'type'        => 'integer',
											'required'    => false,
											'minimum'     => 1,
											'maximum'     => 24,
											'description' => __( 'The hour increment for the option.', 'woocommerce-product-options' ),
										],
									],
								],
							],
						],
					],
				],
			],
		];
	}
}
