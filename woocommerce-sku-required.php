<?php
/**
 * Plugin Name: WooCommerce SKU Required
 * Description: Make the WooCommerce SKU field required.
 * Version:     1.0.1
 * Author:      Jory Hogeveen
 * Author URI:  https://www.keraweb.nl
 * Text Domain: woocommerce-sku-required
 * License:     GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
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
	const VERSION = '1.0';

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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
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

		wp_enqueue_script( 'woocommerce-sku-required', $url .'js/script.js', array( 'jquery' ), self::VERSION, true );

		$l10n = array(
			'__required' => __( 'SKU field is required', 'woocommerce-sku-required' ),
		);
		wp_localize_script( 'woocommerce-sku-required', 'wooSkuRequired', $l10n );
	}
}
