if ( 'undefined' === typeof wooSkuRequired ) {
	wooSkuRequired = {
		__required: 'SKU field is required',
	};
}

jQuery( function( $ ) {
	var $form  = $( 'form#post' ),
		errors = [];

	$form.on( 'submit', function( e ) {
		if ( true === wooSkuRequired.validate_sku() ) {
			return true;
		}
		e.preventDefault();
		return false;
	} );

	wooSkuRequired.validate_sku = function() {
		var $main_sku     = $form.find( 'input#_sku' ),
			$variable_sku = $form.find( 'input[id^=variable_sku]' ),
			product_type  = $form.find( '#product-type' ).val(),
			valid = false;

		wooSkuRequired.clear_errors();

		if ( $variable_sku.length || 'variable' === product_type ) {
			// Variable product.
			$.each( $variable_sku, function( index, element ) {
				var $element = $( element );
				if ( ! $element.val().length ) {
					var id = $element.parents( '.woocommerce_variation' ).find( 'input[name^=variable_post_id]' ).val();
					errors.push( {
						id: 'sku_' + id,
						message: '#' + id + ': ' + wooSkuRequired.__required
					} );
				}
			} );
		} else {
			// Simple product.
			if ( ! $main_sku.val().length ) {
				errors.push( {
					id: 'sku_0',
					message: wooSkuRequired.__required
				} );
			}
		}

		if ( ! errors.length ) {
			valid = true;
		} else {
			wooSkuRequired.show_errors();
		}

		return valid;
	}

	wooSkuRequired.clear_errors = function( error ) {
		$.each ( errors, function( index, error ) {
			wooSkuRequired.remove_error( error.id );
		} );
		errors = [];
	}

	wooSkuRequired.remove_error = function( error_id ) {
		$( '#' + error_id ).slideUp( 'fast', function() { $(this).remove(); } );
	}

	wooSkuRequired.show_errors = function() {
		$.each ( errors, function( index, error ) {
			error.message += '<button type="button" class="notice-dismiss"></button>';
			error.message = '<div id="' + error.id + '" class="notice error is-dismissible"><p>' + error.message + '</p></div>';
			$form.before( error.message );

			$( '#' + error.id + ' .notice-dismiss' ).on( 'click', function() {
				wooSkuRequired.remove_error( error.id );
			} );
		} );
	}

} );
