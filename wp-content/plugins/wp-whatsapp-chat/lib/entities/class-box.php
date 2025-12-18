<?php
namespace QuadLayers\QLWAPP\Entities;

use QuadLayers\WP_Orm\Entity\SingleEntity;

class Box extends SingleEntity {
	public $enable              = 'yes';
	public $auto_open           = 'no';
	public $auto_delay_open     = 1000;
	public $lazy_load           = 'no';
	public $allow_outside_close = 'no';
	public $header              = '<h3 style="
									font-size: 26px;
									font-weight: bold;
									margin: 0 0 0.25em 0;
								">Hello!</h3>
								<p style="
									font-size: 14px;
								">Click one of our contacts below to chat on WhatsApp</p>';
	public $footer              = '<p style="text-align: start;">Need help? Our team is just a message away</p>';
	public $response;
	public $consentMessage;
	public $consentEnabled = 0;

	public function __construct() {
		$this->response       = esc_html__( 'Write a response', 'wp-whatsapp-chat' );
		$this->consentMessage = esc_html__( 'I accept cookies and privacy policy.', 'wp-whatsapp-chat' );
	}
}
