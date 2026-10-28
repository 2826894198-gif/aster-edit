<?php
// This executable intentionally does not echo or interpolate the password.
define('WP_INSTALLING', true);
$_SERVER['HTTP_HOST'] = '127.0.0.1:8088';
$_SERVER['REQUEST_URI'] = '/';
require '/var/www/html/wp-load.php';
if (wp_get_environment_type() !== 'local') throw new RuntimeException('Local only.');
if (is_blog_installed()) exit(0);
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
$password = trim(file_get_contents('/run/secrets/admin_password'));
if (strlen($password) < 8) throw new RuntimeException('Missing local admin secret.');
wp_install('Aster Commerce — LOCAL TEST', 'asteredit', 'admin@aster.test', false, '', $password);
update_option('home', 'http://127.0.0.1:8088');
update_option('siteurl', 'http://127.0.0.1:8088');
echo "Local WordPress installed; admin credential retained in restricted secret file.\n";
