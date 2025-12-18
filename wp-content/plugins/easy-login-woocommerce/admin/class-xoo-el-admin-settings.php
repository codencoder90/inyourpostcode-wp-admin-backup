<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Xoo_El_Admin_Settings{

	protected static $_instance = null;

	public static function get_instance(){
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	public function __construct(){
		$this->hooks();	
	}


	public function hooks(){

		if( current_user_can( 'manage_options' ) ){
			add_action( 'init', array( $this, 'generate_settings' ), 0 );
			add_action( 'admin_menu', array( $this, 'add_menu_pages' ) );
		}

		add_filter( 'plugin_action_links_' . XOO_EL_PLUGIN_BASENAME, array( $this, 'plugin_action_links' ) );
		add_filter( 'xoo_aff_add_fields', array( $this,'add_new_fields' ), 10, 2 );
		add_action( 'xoo_aff_field_selector', array( $this, 'customFields_addon_notice' ) );
		add_action('admin_enqueue_scripts',array($this,'enqueue_scripts'));
		add_action( 'admin_footer', array( $this, 'inline_css' ) );

		add_action( 'wp_loaded', array( $this, 'register_addon_tab' ), 20 );

		add_action( 'wp_loaded', array( $this, 'register_shortcode_tab' ) );

		add_action('xoo_tab_page_start', array( $this, 'tab_html' ), 20, 2 );

		if( xoo_el_helper()->admin->is_settings_page() ){

			remove_action( 'xoo_tab_page_start', array(  xoo_el_helper()->admin, 'info_tab_data' ), 10, 2 );
			add_action( 'xoo_tab_page_end', array(  $this, 'troubleshoot_info' ), 10, 2 );

			if( get_option('xoo-el-settings-init') === false ){
				add_action( 'xoo_tab_page_end', array( $this, 'popup_begin' ), 10, 2 );
				add_filter('admin_body_class', array( $this, 'admin_body_class') );
				add_action( 'xoo_tab_page_start', array( $this, 'init_done_notice' ), 10, 2 );
			}

			add_filter( 'tiny_mce_before_init', array( $this, 'shortcode_generator_rtl_fix' ), 100 );		

		}

		if( get_option('xoo-el-settings-init') === false ){
			add_action( 'xoo_admin_settings_easy-login-woocommerce_saved', array( $this, 'popup_initialised' ) );
		}		
		

		add_action( 'xoo_aff_admin_page_display_start', array( $this, 'documentation_link' ), 20 );
		
	}

	public function shortcode_generator_rtl_fix($settings){
		
		if( is_rtl() ){
			$settings['directionality'] = 'ltr';
		}
		$settings['height'] = 200;
   		return $settings;
	}


	public function admin_body_class( $classes ){
		$classes .= ' xoo-el-adpopup-active';
		return $classes;
	}

	public function popup_begin( $tab_id, $tab_data ){

		if( $tab_id !== 'general' ) return;

		?>
		<div class="xoo-el-admin-popup">
			<div class="xoo-el-adpop">

				<div>
					<span class="xoo-el-adpopup-head">Popup Style</span>
					<?php echo xoo_el_helper()->admin->get_setting_html_pop( 'style', 'sy_popup', 'sy-popup-style' ); ?>
				</div>


				

				<div class="xoo-el-adpop-bottom">
					<div class="xoo-eladpop-menu">
						<?php $this->menu_html(); ?>
					</div>
					<div class="xoo-el-adpop-autoopen">
						<span class="xoo-el-adpopup-head">Auto open popup</span>
						<?php echo xoo_el_helper()->admin->get_setting_html_pop( 'general', 'gl_ao', 'ao-enable' ); ?>
						<span>You can toggle it later from the settings</span>
					</div>
				</div>

				<!-- <div>
					<span class="xoo-el-adpopup-head">Choose Form Layout</span>
					<?php //echo xoo_el_helper()->admin->get_setting_html_pop( 'general', 'gl_main', 'm-form-pattern' ); ?>
				</div> -->


				<button type="button" class="xoo-el-adpopup-go button-primary button">Let's Go!</button>
			</div>
			<div class="xoo-el-adpop-opac"></div>
		</div>

		

		<?php
	}

	public function init_done_notice( $tab_id, $tab_data ){
		if( !class_exists('woocommerce') || $tab_id !== 'general' ) return;

		?>
			<div class="xoo-el-init-done" >
				<span>The WooCommerce My Account page form has been automatically replaced with the inline form. You can change this in the settings under the General tab → WooCommerce.</span>
				<span class="dashicons dashicons-no-alt"></span>
			</div>
		<?php
	}


	public function popup_initialised( $formData ){

		update_option( 'xoo-el-settings-init', 'yes' );

		//Add links to menu
		if( isset( $formData['xoo-el-add-to-menu'] ) && $formData['xoo-el-add-to-menu'] !== 'none' ){

			$menu_name = sanitize_text_field( $formData['xoo-el-add-to-menu'] );
			$menu = wp_get_nav_menu_object($menu_name);

			if( $menu ) {
			
				$menu_id = $menu->term_id;
				
				// Add the menu item
				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title' 	=> 'Login',
					'menu-item-classes' => 'xoo-el-login-tgr',
					'menu-item-status' => 'publish',
				) );

				if( class_exists('woocommerce') ){

					wp_update_nav_menu_item( $menu_id, 0, array(
						'menu-item-title' 	=> 'My Account',
						'menu-item-classes' => 'xoo-el-myaccount-menu',
						'menu-item-status' 	=> 'publish',
						'menu-item-url' 	=> wc_get_page_permalink( 'myaccount' )
					) );
				}


				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title' 	=> 'Logout',
					'menu-item-classes' => 'xoo-el-logout-menu',
					'menu-item-status'	 => 'publish',
				) );

			}
		}

		
	}



	public function menu_html(){

		$menus 	= wp_get_nav_menus();

		if( empty( $menus ) ) return;

		$menuOptions 	= array();

		foreach ($menus as $menuObj ) {
			$menuOptions[ $menuObj->slug ] = $menuObj->name;
		}

		$menuOptions['none'] = 'Do not add';
		
		?>
		<span class="xoo-el-adpopup-head">Add Popup Link to Menu</span>
		<select name="xoo-el-add-to-menu">
			<?php foreach ( $menuOptions as $slug => $name ): ?>
				<option value="<?php echo $slug ?>"><?php echo $name ?></option>
			<?php endforeach; ?>
		</select>
		<span>You can add or remove this later from your menu page</span>
		<?php
		
	}


	public function documentation_link($slug){

		if( $slug !== 'xoo-el-fields' ) return;
		?>
		<a href="https://docs.xootix.com/easy-login-for-woocommerce/fields" style="font-size: 17px; margin-left: auto; margin-right: 20px; margin-bottom: 10px;" target="__blank">Documentation</a>
		<?php

	}


	public function troubleshoot_info( $tab_id, $tab_data ){
		if( $tab_id !== 'info' ) return;
		?>
		<div>
			
			<h3>How to translate or change text?</h3>
			<ol>
				<li>Form fields texts can be changed from <a href="<?php echo admin_url('admin.php?page=xoo-el-fields') ?>" target="__blank">Fields page</a></li>
				<li>Some texts can be changed from the settings.</li>
			</ol>
			<h4>Translation</h4>
			<ul>
				<li>You can use plugin <a href="https://wordpress.org/plugins/loco-translate/" target="__blank">Loco Translate</a> to translate all plugin texts.</li>
				<li>Plugin is also compatible with multilingual plugins such as WPML and Polylang</li>
			</ul>
		</div>

		<div class="xoo-el-trob">
			<h3>Troubleshoot</h3>
			<ul class="xoo-el-li-info">
				<li>
					<span>Login/Register/Lost-Password Form keeps spinning or stuck and nothing happens</span>
					<p>Probably some other plugin is interferring with the plugin's functionality. Please temporarily deactivate all other plugins, switch to basic theme and test again. If still doesn't work, please open a support ticket <a href="https://xootix.com/contact" target="__blank">here</a></p>
				</li>

				<li>
					<span>Not receiving emails</span>
					<p>Plugin does not control emails. If you're not receiving emails on either register or resetting password, this means your website's email functionality is not working. Start by setting up this excellent <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="__blank">SMTP Plugin</a> for better email deliverability </p>
				</li>

				<li>
					<span>Something else</span>
					<p>If something else isn't working as expected. please open a support ticket <a href="https://xootix.com/contact" target="__blank">here</a></p>
				</li>
			</ul>
		</div>
		<?php
	}

	public function register_addon_tab(){
		xoo_el_helper()->admin->register_tab( 'Add-ons', 'addon', '', 'no', array(
			'priority' => 100
		) );
		xoo_el_helper()->admin->tabs['info']['priority'] = 50;
	}

	public function register_shortcode_tab(){
		xoo_el_helper()->admin->register_tab( 'Shortcodes', 'shortcodes', '', 'no', array(
			'priority' => 30
		) );
	}

	public function tab_html( $tab_id, $tab_data ){

		if( !xoo_el_helper()->admin->is_settings_page() ) return;

		if( $tab_id === 'shortcodes' ){
			xoo_el_helper()->get_template( '/admin/templates/shortcode-generator.php', array(), XOO_EL_PATH );
		}

		if( $tab_id === 'addon' ){
			xoo_el_helper()->get_template( '/admin/views/settings/add-ons.php', array(), XOO_EL_PATH );
		}

		if( $tab_id === 'info' ){
			echo xoo_el_helper()->get_outdated_section().'<br>';
		}
	}

	public function customFields_addon_notice( $aff ){
		if( defined( 'XOO_ELCF_VERSION' ) || $aff->plugin_slug !== 'easy-login-woocommerce' ) return;
		?>
		<a class="xoo-el-field-addon-notice" href="https://xootix.com/easy-login-for-woocommerce#sp-addons" target="__blank"><span class="dashicons dashicons-admin-links"></span> Adding custom fields is a separate add-on.</a>
		<?php
	}


	public function add_new_fields( $allow, $aff ){
		if( $aff->plugin_slug === 'easy-login-woocommerce' ) return false;
		return $allow;
	}
	

	public function generate_settings(){
		xoo_el_helper()->admin->auto_generate_settings();
	}



	/**
	 * Show action links on the plugin screen.
	 *
	 * @param	mixed $links Plugin Action links
	 * @return	array
	 */
	public function plugin_action_links( $links ) {
		$action_links = array(
			'settings' 	=> '<a href="' . admin_url( 'admin.php?page=easy-login-woocommerce-settings' ) . '">Settings</a>',
			'support' 	=> '<a href="https://xootix.com/contact" target="__blank">Support</a>',
			'upgrade' 	=> '<a href="https://xootix.com/plugins/easy-login-for-woocommerce" target="__blank">Upgrade</a>',
		);

		return array_merge( $action_links, $links );
	}



	public function enqueue_scripts($hook) {

		//Enqueue Styles only on plugin settings page
		if($hook != 'login-signup-popup_page_xoo-el-fields' && !xoo_el_helper()->admin->is_settings_page() ){
			return;
		}
		
		wp_enqueue_style( 'xoo-el-admin-style', XOO_EL_URL . '/admin/assets/css/xoo-el-admin-style.css', array(), XOO_EL_VERSION, 'all' );
		wp_enqueue_script( 'xoo-el-admin-js', XOO_EL_URL . '/admin/assets/js/xoo-el-admin-js.js', array( 'jquery' ), XOO_EL_VERSION, false );
		wp_localize_script('xoo-el-admin-js','xoo_el_admin_localize',array(
			'adminurl'  		=> admin_url().'admin-ajax.php',
			'hasWoocommerce' 	=> class_exists('woocommerce')
		));


	}


	public function add_menu_pages(){

		$args = array(
			'menu_title' 	=> 'Login/Signup Popup',
			'icon' 			=> 'dashicons-unlock',
			'has_submenu' 	=> true
		);

		xoo_el_helper()->admin->register_menu_page( $args );

		add_submenu_page(
			'easy-login-woocommerce-settings',
			'Fields',
			'Fields',
    		'manage_options',
    		'xoo-el-fields',
    		array( $this, 'admin_fields_page' )
    	);
	}


	//Fields page callback
	public function admin_fields_page(){
		xoo_el()->aff->admin->display_page();
	}


	//Inline CSS
	public function inline_css(){
		if( isset( $_GET['xoo_el_nav'] ) ){
			?>
			<style type="text/css">
				li#xoo_el_actions_link .accordion-section-title {
				    background-color: #87d7ff;
				}
			</style>
			<?php
		}
	}



}

function xoo_el_admin_settings(){
	return Xoo_El_Admin_Settings::get_instance();
}
xoo_el_admin_settings();

?>