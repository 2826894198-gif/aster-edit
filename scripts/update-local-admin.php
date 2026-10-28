<?php
// Explicitly requested local account rename/password rotation; preserve the administrator ID.
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local CLI only.');
$target = 'asteredit';
$user = get_user_by('id', 1);
if (!$user || !in_array('administrator', $user->roles, true) || $user->user_email !== 'admin@aster.test' || !in_array($user->user_login, ['demo_local_admin', $target], true)) throw new RuntimeException('Unexpected administrator; no change made.');
$existing = get_user_by('login', $target);
if ($existing && $existing->ID !== $user->ID) throw new RuntimeException('Requested username is already in use.');
$password = trim(file_get_contents('/run/secrets/admin_password'));
if (strlen($password) < 8) throw new RuntimeException('Local password file is missing.');
global $wpdb;
clean_user_cache($user);
// WordPress user APIs deliberately do not rename user_login; exact validated ID only.
if ($wpdb->update($wpdb->users, ['user_login' => $target, 'user_nicename' => $target, 'display_name' => $target], ['ID' => $user->ID]) === false) throw new RuntimeException('Could not rename administrator.');
clean_user_cache($user->ID);
wp_set_password($password, $user->ID);
WP_Session_Tokens::get_instance($user->ID)->destroy_all();
$updated = get_user_by('id', $user->ID);
if ($updated->user_login !== $target || !wp_check_password($password, $updated->user_pass, $updated->ID)) throw new RuntimeException('Credential verification failed.');
WP_CLI::success('Local administrator renamed to asteredit; ID preserved; password verified; previous sessions revoked. No secret printed.');
