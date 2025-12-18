<?php

namespace Barn2\Plugin\WC_Product_Options\Fields\Traits;

use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;

trait Cart_Item_Data {

	/**
	 * Retrieves the cart item data for the selected value(s) of the field.
	 *
	 * @param mixed       $value
	 * @param WC_Product $product
	 * @param int $quantity
	 * @param array $options
	 * @return array
	 */
	public function get_cart_item_data( $value, $product, $quantity, $options ): ?array {
		if ( $this->type === 'product' ) {
			// Product fields do not hold any value in the cart
			// because each product is added as a separate item.
			return null;
		}

		if ( (string) $value === '' ) {
			return null;
		}

		$choice = $this->get_choice_for_value( $value );

		if ( ! $choice ) {
			return null;
		}

		if ( Conditional_Logic_Util::is_field_hidden( $this, $options ) ) {
			return null;
		}

		$item_data = [
			'name'        => $this->option->name,
			'type'        => $this->option->type,
			'option_id'   => $this->option->id,
			'group_id'    => $this->option->group_id,
			'value'       => $value,
			'choice_data' => [
				[
					'label' => $this->has_user_value && $this->type !== 'customer_price' ? $value : $choice['label']
				]
			]
		];

		if ( $this->type === 'customer_price' ) {
			// Handle pricing for customer price input (Has no 'pricing' set).
			$item_data['choice_data'][0]['pricing'] = [
				'type'   => 'flat_fee',
				'amount' => (float) $value,
			];
		} elseif ( $choice['pricing'] ) {
			// Add the price and price type to the item data.
			$item_data['choice_data'][0]['pricing']['type']   = $choice['price_type'];
			$item_data['choice_data'][0]['pricing']['amount'] = (float) Price_Util::get_user_choice_pricing( $choice );

			// Add character count to item data.
			if ( $choice['price_type'] === 'char_count' ) {
				$item_data['choice_data'][0]['pricing']['char_count'] = strlen( $value );
			}
		}

		// Convert the date to the correct format for the cart item data.
		if ( $this->type === 'datepicker' ) {
			$item_data['choice_data'][0]['label'] = ucwords( wp_date( $this->get_combined_date_format(), strtotime( $value ), new \DateTimeZone( 'UTC' ) ) );
		}

		return $item_data;
	}
}
