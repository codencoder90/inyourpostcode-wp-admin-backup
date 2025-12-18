<?php
namespace Barn2\Plugin\WC_Product_Options\Schema;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Schema\Blueprint;

/**
 * Defines the groups database table schema.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Groups extends Base_Schema {

	public $table_name = 'wpo_groups';

	/**
	 * {@inheritdoc}
	 */
	public function create() {
		$this->db->schema()->create(
			$this->table_name,
			function ( Blueprint $table ) {
				$table->increments( 'id' );
				$table->string( 'name' );
				$table->boolean( 'display_name' );
				$table->string( 'visibility' );
				$table->integer( 'menu_order' );
				$table->json( 'products' );
				$table->json( 'exclude_products' );
				$table->json( 'categories' );
				$table->json( 'exclude_categories' );
				$table->index( 'id' );
			}
		);
	}

}
