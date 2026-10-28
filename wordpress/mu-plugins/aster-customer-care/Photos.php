<?php
/** Review images stay in the existing blocked private-upload directory. */
defined('ABSPATH') || exit;
final class Aster_Customer_Review_Photos {
    const SOURCE='aster-purchase-review-v1';
    public static function register_hooks() {
        add_action('rest_api_init',[self::class,'register']);
        add_filter('rest_pre_serve_request',[self::class,'serve'],PHP_INT_MAX,3);
        add_filter('wp_get_attachment_url',[self::class,'attachment_url'],10,2);
        add_action('delete_attachment',[self::class,'cleanup']);
    }
    public static function validate($photos,bool $consent) {
        if (!is_array($photos) || !array_is_list($photos) || count($photos)>6) return new WP_Error('aster_photos','Choose up to six JPEG, PNG or WebP photos.',['status'=>400]);
        if ($photos && !$consent) return new WP_Error('aster_photo_consent','Confirm permission to publish these photos.',['status'=>400]);
        $out=[];
        foreach ($photos as $data) {
            if (!is_string($data) || strlen($data)>2800000 || !preg_match('~^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$~D',$data,$m)) return new WP_Error('aster_photo','Choose JPEG, PNG or WebP photos up to 2 MB each.',['status'=>400]);
            $bytes=base64_decode($m[2],true);$info=$bytes ? @getimagesizefromstring($bytes) : false;
            if (!$info || strlen($bytes)>2097152 || !in_array($info['mime'] ?? '', ['image/jpeg','image/png','image/webp'],true) || $info[0]<1 || $info[1]<1 || $info[0]>10000 || $info[1]>10000 || $info[0]*$info[1]>16000000) return new WP_Error('aster_photo','This photo cannot be processed. Use a smaller JPEG, PNG or WebP.',['status'=>400]);
            $out[]=['bytes'=>$bytes,'width'=>$info[0],'height'=>$info[1]];
        }
        return $out;
    }

    private static $serving=null;
    public static function owns($id,$review=0) {
        return get_post_type($id)==='attachment' && get_post_meta($id,'_aster_review_media',true)===self::SOURCE && (!$review || (int)get_post_meta($id,'_aster_review_comment_id',true)===(int)$review);
    }
    public static function url($id,$size='full',$private=false) {
        $args=array('size'=>$size==='thumb'?'thumb':'full');
        if($private){$args['expires']=time()+1800;$args['signature']=hash_hmac('sha256',$id.'|'.$args['size'].'|'.$args['expires'],wp_salt('auth'));}
        return add_query_arg($args,rest_url('aster/v1/review-photo/'.(int)$id));
    }
    public static function visible_sql($alias='c') {
        return self::stored_sql($alias,false);
    }
    public static function stored_sql($alias='c',$include_hidden=true) {
        global $wpdb;
        $excluded=$include_hidden?"'_aster_review_removed'":"'_aster_review_hidden','_aster_review_removed'";
        return "EXISTS (SELECT 1 FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} media ON media.ID=pm.post_id AND media.post_type='attachment' WHERE pm.meta_key='_aster_review_comment_id' AND CAST(pm.meta_value AS UNSIGNED)=$alias.comment_ID AND EXISTS (SELECT 1 FROM {$wpdb->postmeta} src WHERE src.post_id=media.ID AND src.meta_key='_aster_review_media' AND src.meta_value='aster-purchase-review-v1') AND NOT EXISTS (SELECT 1 FROM {$wpdb->postmeta} h WHERE h.post_id=media.ID AND h.meta_key IN ($excluded) AND h.meta_value='1'))";
    }
    public static function listing($review,$private=false) {
        $result=array();
        foreach((array)get_comment_meta($review,'_aster_review_photos',true) as $id){
            $id=(int)$id;if(!self::owns($id,$review) || get_post_meta($id,'_aster_review_removed',true)==='1')continue;
            $hidden=get_post_meta($id,'_aster_review_hidden',true)==='1';if($hidden && !$private)continue;
            $meta=wp_get_attachment_metadata($id);
            $result[]=array('id'=>$id,'hidden'=>$hidden,'url'=>self::url($id,'thumb',$private),'full_url'=>self::url($id,'full',$private),'width'=>(int)($meta['width']??1600),'height'=>(int)($meta['height']??1600));
        }
        return $result;
    }
    private static function directory() {
        $upload=wp_upload_dir();if($upload['error'])throw new RuntimeException('Review photo storage unavailable');
        $dir=$upload['basedir'].'/aster-private/reviews';
        if(!wp_mkdir_p($dir))throw new RuntimeException('Review photo storage unavailable');
        if(!is_file($dir.'/.htaccess'))file_put_contents($dir.'/.htaccess',"Require all denied\nDeny from all\n");
        return $dir;
    }
    public static function save($photos,$review,$product) {
        $ids=array();$dir=self::directory();
        foreach($photos as $photo){
            $source=@imagecreatefromstring($photo['bytes']);if(!$source)throw new RuntimeException('Review image could not be decoded');
            $scale=min(1,1600/max($photo['width'],$photo['height']));$w=max(1,(int)round($photo['width']*$scale));$h=max(1,(int)round($photo['height']*$scale));
            $canvas=imagecreatetruecolor($w,$h);imagefill($canvas,0,0,imagecolorallocate($canvas,255,255,255));imagecopyresampled($canvas,$source,0,0,0,0,$w,$h,$photo['width'],$photo['height']);imagedestroy($source);
            $name=bin2hex(random_bytes(20));$full=$dir.'/'.$name.'.jpg';$thumb=$dir.'/'.$name.'-thumb.jpg';
            $small=imagecreatetruecolor(max(1,(int)round($w*min(1,480/max($w,$h)))),max(1,(int)round($h*min(1,480/max($w,$h)))));
            imagecopyresampled($small,$canvas,0,0,0,0,imagesx($small),imagesy($small),$w,$h);
            $ok=imagejpeg($canvas,$full,82) && imagejpeg($small,$thumb,82);imagedestroy($canvas);imagedestroy($small);
            if(!$ok){@unlink($full);@unlink($thumb);throw new RuntimeException('Review photo save failed');}
            chmod($full,0640);chmod($thumb,0640);
            $id=wp_insert_attachment(array('post_mime_type'=>'image/jpeg','post_title'=>'Customer review photo','post_status'=>'inherit','post_author'=>0),$full,$product,true);
            if(is_wp_error($id)||!$id){@unlink($full);@unlink($thumb);throw new RuntimeException('Review photo record failed');}
            $ids[]=(int)$id;update_post_meta($id,'_aster_review_media',self::SOURCE);update_post_meta($id,'_aster_review_comment_id',$review);update_post_meta($id,'_aster_review_thumb_file',$thumb);update_comment_meta($review,'_aster_review_photos',$ids);
            wp_update_attachment_metadata($id,array('width'=>$w,'height'=>$h,'file'=>'aster-private/reviews/'.$name.'.jpg','sizes'=>array()));
        }
        return $ids;
    }
    public static function file($r) {
        $id=(int)$r['id'];if(!self::owns($id)||get_post_meta($id,'_aster_review_removed',true)==='1')return false;
        $size=$r['size']==='thumb'?'thumb':'full';$expires=(string)($r['expires']??'');$signature=(string)($r['signature']??'');
        $private=ctype_digit($expires) && (int)$expires>=time() && (int)$expires<=time()+1800 && hash_equals(hash_hmac('sha256',$id.'|'.$size.'|'.$expires,wp_salt('auth')),$signature);
        $parent=get_comment((int)get_post_meta($id,'_aster_review_comment_id',true));
        if(!$parent || get_comment_meta($parent->comment_ID,'_aster_review_source',true)!==self::SOURCE || !in_array($id,array_map('intval',(array)get_comment_meta($parent->comment_ID,'_aster_review_photos',true)),true))return false;
        if(!$private && ($parent->comment_approved!=='1' || get_post_meta($id,'_aster_review_hidden',true)==='1' || get_comment_meta($parent->comment_ID,'_aster_review_photo_pending',true)))return false;
        $file=$size==='thumb'?get_post_meta($id,'_aster_review_thumb_file',true):get_attached_file($id);
        $upload=wp_upload_dir();$base=realpath($upload['basedir'].'/aster-private/reviews');$real=is_string($file)?realpath($file):false;
        return $base && $real && strpos($real,$base.DIRECTORY_SEPARATOR)===0 && is_file($real) ? $real : false;
    }
    public static function photo($r) {
        self::$serving=self::file($r);
        if(!self::$serving)return new WP_Error('review_photo_unavailable','This review photo is unavailable.',array('status'=>404));
        return new WP_REST_Response(null,200,array('Content-Type'=>'image/jpeg','Content-Length'=>(string)filesize(self::$serving),'Cache-Control'=>'private, no-store, max-age=0','X-Content-Type-Options'=>'nosniff','Content-Disposition'=>'inline'));
    }
    public static function serve($served,$result,$request) {
        if(self::$serving && preg_match('#^/aster/v1/review-photo/[0-9]+$#',$request->get_route()) && $result->get_status()===200){readfile(self::$serving);self::$serving=null;return true;}return $served;
    }
    public static function cleanup($id) {
        if(!self::owns($id))return;
        $file=get_post_meta($id,'_aster_review_thumb_file',true);$upload=wp_upload_dir();$base=realpath($upload['basedir'].'/aster-private/reviews');$real=is_string($file)?realpath($file):false;
        if($base&&$real&&strpos($real,$base.DIRECTORY_SEPARATOR)===0)@unlink($real);
    }
    public static function attachment_url($url,$id){return self::owns($id)?self::url($id,'full',current_user_can('manage_woocommerce')):$url;}
    public static function register(){register_rest_route('aster/v1','/review-photo/(?P<id>\d+)',array('methods'=>'GET','callback'=>array(__CLASS__,'photo'),'permission_callback'=>'__return_true'));}
}
