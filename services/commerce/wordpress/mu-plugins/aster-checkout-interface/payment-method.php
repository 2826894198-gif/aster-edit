<?php
/** Native Woo payment-method 3.5.0; the official gateway still renders fields. */
defined('ABSPATH') || exit;
[$label, $description, $heading, $body, $icon] = aster_checkout_interface_method($gateway->id);
?>
<li class="wc_payment_method payment_method_<?php echo esc_attr($gateway->id); ?>">
    <input id="payment_method_<?php echo esc_attr($gateway->id); ?>" type="radio" class="input-radio" name="payment_method" value="<?php echo esc_attr($gateway->id); ?>" <?php checked($gateway->chosen, true); ?> data-order_button_text="<?php echo esc_attr($gateway->order_button_text); ?>">
    <label for="payment_method_<?php echo esc_attr($gateway->id); ?>">
        <?php if ($icon): ?><img class="aster-method-icon" src="<?php echo esc_url(aster_checkout_interface_asset('icons/' . $icon)); ?>" width="26" height="26" alt=""><?php endif; ?>
        <span class="aster-method-copy"><strong><?php echo $label ? esc_html($label) : wp_kses_post($gateway->get_title()); ?></strong><?php if ($description): ?><small><?php echo esc_html($description); ?></small><?php endif; ?></span>
        <?php if (!$icon) echo wp_kses_post($gateway->get_icon()); ?>
    </label>
    <?php if ($gateway->has_fields() || $gateway->get_description()): ?>
        <div class="payment_box payment_method_<?php echo esc_attr($gateway->id); ?>" <?php if (!$gateway->chosen): ?>style="display:none;"<?php endif; ?>>
            <?php if ($heading): ?><div class="aster-provider-heading"><img src="<?php echo esc_url(aster_checkout_interface_asset('icons/' . $icon)); ?>" width="28" height="28" alt=""><div><h4><?php echo esc_html($heading); ?></h4><p><?php echo esc_html($body); ?></p></div></div><?php endif; ?>
            <?php $gateway->payment_fields(); ?>
        </div>
    <?php endif; ?>
</li>
