<?php
/**
 * Plugin Name:       WooCommerce SKU Required
 * Description:       Make the WooCommerce SKU field required.
 * Version:           2.0.1
 * Author:            Jory Hogeveen
 * Author URI:        https://www.keraweb.nl
 * Text Domain:       woocommerce-sku-required
 * GitHub Plugin URI: JoryHogeveen/woocommerce-sku-required
 * License:           GNU General Public License v3.0
 * License URI:       http://www.gnu.org/licenses/gpl-3.0.html
 */

if ( ! defined ( 'ABSPATH' ) ) {
	die;
}

WooCommerce_SKU_Required::get_instance();

class WooCommerce_SKU_Required
{
	/**
	 * @var float
	 */
	const VERSION = '2.0.1';

	/**
	 * @var string
	 */
	public $meta_optional = 'sku_optional';

	/**
	 * @var string
	 */
	public $capability = 'manage_woocommerce';

	/**
	 * @var WooCommerce_SKU_Required
	 */
	private static $_instance = null;

	/**
	 * @return WooCommerce_SKU_Required
	 */
	public static function get_instance() {
		if ( ! self::$_instance ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	/**
	 * WooCommerce_SKU_Required constructor.
	 */
	protected function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * WP initialized.
	 */
	public function init() {
		if ( ! wc_product_sku_enabled() ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		add_action( 'woocommerce_product_options_sku', array( $this, 'action_woocommerce_product_options_sku' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'action_woocommerce_process_product_meta' ) );

		add_action( 'wp_ajax_load_variations_sku', array( $this, 'ajax_load_variations_sku' ) );
	}

	/**
	 * Render inline script.
	 */
	public static function enqueue_assets() {
		if ( ! is_admin() ) {
			return;
		}
		$screen = get_current_screen();
		if ( 'product' !== $screen->id ) {
			return;
		}
		$url = plugin_dir_url( __FILE__ );

		wp_enqueue_script( 'woocommerce-sku-required', $url . 'js/script.js', array( 'jquery' ), self::VERSION, true );

		$l10n = array(
			'_debug'                => WP_DEBUG,
			'ajax_url'              => admin_url( 'admin-ajax.php' ),
			'load_variations_nonce' => wp_create_nonce( 'load-variations-sku' ),
			'product_id'            => wc_get_product()->get_id(),
			'__required'            => __( 'SKU field is required', 'woocommerce-sku-required' ),
		);
		wp_localize_script( 'woocommerce-sku-required', 'wooSkuRequired', $l10n );
	}

	/**
	 * @return string
	 */
	public function ajax_load_variations_sku() {

		check_ajax_referer( 'load-variations-sku', '_nonce' );

		if ( ! current_user_can( 'edit_products' ) || empty( $_POST['product_id'] ) ) {
			wp_send_json_error();
			wp_die( -1 );
		}

		$product_id = absint( $_POST['product_id'] );
		$variations = wc_get_products(
			array(
				'status'  => array( 'private', 'publish' ),
				'type'    => 'variation',
				'parent'  => $product_id,
				'limit'   => -1,
				'orderby' => array(
					'menu_order' => 'ASC',
					'ID'         => 'DESC',
				),
				'return'  => 'objects',
			)
		);

		$return = array();

		foreach ( $variations as $variation ) {
			$variation = wc_get_product( $variation );
			// Pass `raw` as context to prevent loading parent SKU.
			$return[ $variation->get_id() ] = $variation->get_sku( 'raw' );
		}

		wp_send_json_success( $return );
	}

	/**
	 * Add SKU fields.
	 */
	public function action_woocommerce_product_options_sku() {
		$product = wc_get_product();
		$key     = $this->meta_optional;

		if ( current_user_can( $this->capability ) ) {
			woocommerce_wp_checkbox(
				array(
					'id'            => $key,
					'value'         => get_post_meta( $product->get_id(), $key, true ) ? 'yes' : 'no',
					'label'         => __( 'Optional SKU?', 'woocommerce-sku-required' ),
					'description'   => __( 'SKU is optional for this product (and variations)', 'woocommerce-sku-required' ),
				)
			);
		} else {
			echo '<input type="hidden" name="' . $key . '" id="' . $key . '" value="' . (bool) $product->get_meta( $key ) . '" disabled="disabled" />';
		}
	}

	/**
	 * @param int $post_id
	 */
	public function action_woocommerce_process_product_meta( $post_id ) {
		if ( ! current_user_can( $this->capability ) ) {
			return;
		}
		$product = wc_get_product( $post_id );

		$value = ( ! empty( $_POST[ $this->meta_optional ] ) && 'yes' === $_POST[ $this->meta_optional ] );

		update_post_meta( $product->get_id(), $this->meta_optional, (bool) $value );
	}
}
