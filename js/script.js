/**
 * @author Jory Hogeveen
 * @version 1.0.1
 */

if ( 'undefined' === typeof wooSkuRequired ) {
	wooSkuRequired = {
		__required: 'SKU field is required',
	};
}

jQuery( function( $ ) {
	wooSkuRequired.form   = $( 'form#post' );
	wooSkuRequired.errors = [];

	wooSkuRequired.form.on( 'submit', function( e ) {
		if ( true === wooSkuRequired.validate_sku() ) {
			return true;
		}
		e.preventDefault();
		return false;
	} );

	/**
	 * @return {boolean}
	 */
	wooSkuRequired.validate_sku = function() {
		var $main_sku     = wooSkuRequired.form.find( 'input#_sku' ),
			$variable_sku = wooSkuRequired.form.find( 'input[id^=variable_sku]' ),
			product_type  = wooSkuRequired.form.find( '#product-type' ).val();

		wooSkuRequired.clear_errors();

		if ( $variable_sku.length || 'variable' === product_type ) {
			// Variable product.
			if ( ! $main_sku.val().length ) {
				// No main SKU, variable SKU required.
				$.each( $variable_sku, function ( index, element ) {
					var $element = $( element );
					if ( ! $element.val().length ) {
						var id = $element.parents( '.woocommerce_variation' ).find( 'input[name^=variable_post_id]' ).val();
						wooSkuRequired.errors.push( {
							id: 'sku_' + id,
							message: '#' + id + ': ' + wooSkuRequired.__required
						} );
					}
				} );
			}
		} else {
			// Simple product.
			if ( ! $main_sku.val().length ) {
				wooSkuRequired.errors.push( {
					id: 'sku_0',
					message: wooSkuRequired.__required
				} );
			}
		}

		if ( wooSkuRequired.errors.length ) {
			wooSkuRequired.show_errors();
			return false;
		}
		return true;
	}

	/**
	 * @param {object} error
	 * @return void
	 */
	wooSkuRequired.clear_errors = function( error ) {
		$.each ( wooSkuRequired.errors, function( index, error ) {
			wooSkuRequired.remove_error( error.id );
		} );
		wooSkuRequired.errors = [];
	}

	/**
	 * @param {string} error_id
	 * @return void
	 */
	wooSkuRequired.remove_error = function( error_id ) {
		$( '#' + error_id ).slideUp( 'fast', function() { $(this).remove(); } );
	}

	/**
	 * @return void
	 */
	wooSkuRequired.show_errors = function() {
		$.each ( wooSkuRequired.errors, function( index, error ) {
			error.message += '<button type="button" class="notice-dismiss"></button>';
			error.message = '<div id="' + error.id + '" class="notice error is-dismissible"><p>' + error.message + '</p></div>';
			wooSkuRequired.form.before( error.message );

			$( '#' + error.id + ' .notice-dismiss' ).on( 'click', function() {
				wooSkuRequired.remove_error( error.id );
			} );
		} );
	}

} );
