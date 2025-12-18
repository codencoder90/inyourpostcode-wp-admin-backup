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
class Options extends Base_Schema {

	public $table_name = 'wpo_options';

	/**
	 * {@inheritdoc}
	 */
	public function create() {
		$this->db->schema()->create(
			$this->table_name,
			function ( Blueprint $table ) {
				$table->increments( 'id' );
				$table->integer( 'group_id' );
				$table->integer( 'menu_order' );
				$table->string( 'name' );
				$table->string( 'description' );
				$table->boolean( 'display_name' );
				$table->boolean( 'required' );
				$table->string( 'type' );
				$table->json( 'choices' );
				$table->json( 'settings' );
				$table->json( 'conditional_logic' );
				$table->index( 'id' );
			}
		);
	}

}
