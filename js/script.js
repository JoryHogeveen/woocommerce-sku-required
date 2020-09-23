/**
 * @author Jory Hogeveen
 * @version 2.0.1
 */

if ( 'undefined' === typeof wooSkuRequired ) {
	wooSkuRequired = {
		_debug: false,
		ajax_url: '/wp-admin/admin-ajax.php',
		load_variations_nonce: '',
		product_id: 0,
		__required: 'SKU field is required',
	};
}

jQuery( function( $ ) {
	wooSkuRequired.$form         = $( 'form#post' );
	wooSkuRequired.errors        = [];
	wooSkuRequired.$error_target = null;
	wooSkuRequired.variations    = {};

	// Save product.
	wooSkuRequired.$form.on( 'submit', function( e ) {
		// Drafts are allowed.
		if ( 'save' === document.activeElement.getAttribute( 'name' ) ) {
			return true;
		}

		wooSkuRequired.disableSubmit();

		wooSkuRequired.$error_target = wooSkuRequired.$form;

		if ( true === wooSkuRequired.validate_sku() ) {
			wooSkuRequired.enableSubmit();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();

		wooSkuRequired.enableSubmit();
		return false;
	} );

	// Save variations.
	$( 'button.save-variation-changes' ).on( 'click', function( e ) {
		wooSkuRequired.disableSubmit();

		// Only validate loaded variations.
		wooSkuRequired.variations = {};
		wooSkuRequired.$form.find( 'input[id^=variable_sku]' ).each( function() {
			var $this = $( this ),
				id = $this.parents( '.woocommerce_variation' ).find( 'input[name^=variable_post_id]' ).val();
			wooSkuRequired.variations[ id ] = $this.val();
		} );

		wooSkuRequired.$error_target = $( '#variable_product_options_inner .toolbar-top' );

		if ( true === wooSkuRequired.validate_sku() ) {
			wooSkuRequired.enableSubmit();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();

		wooSkuRequired.enableSubmit();
		return false;
	} );

	// Reload variations.
	$( '#woocommerce-product-data' ).on( 'woocommerce_variations_saved', function () {
		wooSkuRequired.load_variations();
	} );

	wooSkuRequired.disableSubmit = function() {
		$( '#submitpost input, button.save-variation-changes' ).each( function() {
			var $this = $( this ),
				$spinner = $this.parent().find( '.spinner' );

			$this.prop( 'disabled', true );
			if ( ! $spinner.length ) {
				$this.before( '<span class="spinner"></span>' );
				$spinner = $this.parent().find( '.spinner' );
			}
			$spinner.addClass( 'is-active' );
		} );
	}

	wooSkuRequired.enableSubmit = function() {
		$( '#submitpost input, button.save-variation-changes' ).each( function() {
			var $this = $( this ),
				$spinner = $this.parent().find( '.spinner' );

			$this.prop( 'disabled', false );
			if ( ! $spinner.length ) {
				$this.before( '<span class="spinner"></span>' );
				$spinner = $this.parent().find( '.spinner' );
			}
			$spinner.removeClass( 'is-active' );
		} );
	}

	/**
	 * @param {object} e Event.
	 * @param {object} $submit Submit button jQuery element.
	 * @param {object} $spinner Spinner jQuery element.
	 * @returns {boolean}
	 */
	wooSkuRequired.handleSubmit = function ( e, $submit, $spinner ) {
		$spinner.addClass( 'is-active' );
		$submit.addClass( 'disabled' );
		if ( true === wooSkuRequired.validate_sku() ) {
			$spinner.removeClass( 'is-active' );
			$submit.removeClass( 'disabled' );
			return true;
		}
		$spinner.removeClass( 'is-active' );
		$submit.removeClass( 'disabled' );
		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	/**
	 * @return {boolean}
	 */
	wooSkuRequired.is_required = function () {
		var $disable_sku  = wooSkuRequired.$form.find( 'input#sku_optional' );

		if ( ! $disable_sku.length ) {
			return true;
		}

		if ( 'hidden' === $disable_sku.attr( 'type' ) ) {
			return ! Boolean( $disable_sku.val() );
		}

		return ! $disable_sku.is(':checked');
	}

	/**
	 * @return {boolean}
	 */
	wooSkuRequired.validate_sku = function() {
		var main_sku     = wooSkuRequired.$form.find( 'input#_sku' ).val(),
			product_type = wooSkuRequired.$form.find( '#product-type' ).val();

		if ( ! wooSkuRequired.is_required() ) {
			wooSkuRequired.debug( 'SKU not required' );
			return true;
		}

		wooSkuRequired.clear_errors();

		if ( main_sku ) {
			wooSkuRequired.debug( 'Main SKU found: ' + main_sku );
			return true;
		}

		if ( 'variable' === product_type ) {
			// Variable product.
			$.each( wooSkuRequired.variations, function ( id, sku ) {
				if ( ! sku.length ) {
					wooSkuRequired.errors.push( {
						id: 'sku_' + id,
						message: '#' + id + ': ' + wooSkuRequired.__required
					} );
				}
			} );

			wooSkuRequired.debug( wooSkuRequired.variations );

		} else {
			// Simple product.
			wooSkuRequired.errors.push( {
				id: 'sku_0',
				message: wooSkuRequired.__required
			} );
		}

		wooSkuRequired.debug( wooSkuRequired.errors );

		if ( wooSkuRequired.errors.length ) {
			wooSkuRequired.show_errors();
			return false;
		}
		return true;
	}

	/**
	 * @return void
	 */
	wooSkuRequired.clear_errors = function() {
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
			wooSkuRequired.$error_target.before( error.message );

			$( '#' + error.id + ' .notice-dismiss' ).on( 'click', function() {
				wooSkuRequired.remove_error( error.id );
			} );
		} );

		// Scroll to errors.
		document.getElementById( wooSkuRequired.errors[0].id ).scrollIntoView( { behavior: 'smooth', block: 'center' } );
	}

	/**
	 * Load variation SKU.
	 */
	wooSkuRequired.load_variations = function() {
		wooSkuRequired.disableSubmit();
		$.ajax({
			//async: false,
			url: wooSkuRequired.ajax_url,
			data: {
				action:     'load_variations_sku',
				_nonce:     wooSkuRequired.load_variations_nonce,
				product_id: wooSkuRequired.product_id
			},
			type: 'POST',
			success: function( response ) {
				if ( response.hasOwnProperty( 'data' ) && response.hasOwnProperty( 'success' ) ) {
					if ( response.success ) {
						wooSkuRequired.variations = response.data;
					}
				}
				wooSkuRequired.debug( wooSkuRequired.variations );
				wooSkuRequired.enableSubmit();
			}
		});
	}

	/**
	 * @param {mixed} value
	 */
	wooSkuRequired.debug = function ( value ) {
		if ( wooSkuRequired._debug ) {
			console.log( value );
		}
	}

	wooSkuRequired.load_variations();

} );
