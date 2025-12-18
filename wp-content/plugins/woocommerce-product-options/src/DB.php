<?php

namespace Barn2\Plugin\WC_Product_Options;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Sematico\FluentQuery\DatabaseCapsule;

/**
 * Handles the registering of the front-end scripts and stylesheets.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class DB implements Standard_Service {

	/**
	 * Database Capsule
	 *
	 * @var DatabaseCapsule
	 */
	private $db;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->db = new DatabaseCapsule();
		$this->db->boot();
	}

	/**
	 * Get the database capsule.
	 *
	 * @return DatabaseCapsule
	 */
	public function get_db() {
		return $this->db;
	}

	/**
	 * Get the schema.
	 *
	 * @return \FluentQuery\Schema
	 */
	public function schema() {
		return $this->db->schema();
	}

	/**
	 * Get the query builder.
	 *
	 * @return \FluentQuery\Query
	 */
	public function query() {
		return $this->db->query();
	}

	/**
	 * Get the query builder.
	 *
	 * @return \FluentQuery\Query
	 */
	public function table( $table ) {
		return $this->db->table( $table );
	}
}
