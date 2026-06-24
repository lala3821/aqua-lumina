/**
 * お問い合わせの受信設定
 *
 * contactEmail … スマホなど、届けたい受信アドレス（ここだけ書き換え）
 * contactFormEndpoint … 有効化後に FormSubmit から届く /f/xxxx URL（任意）
 *
 * OGP（SNSシェア）… 公開URLがある場合は環境変数 SITE_URL を設定
 * 例: SITE_URL=https://example.com npm start
 */
window.SITE_CONFIG = {
  contactEmail: 'yogenyo134@tapi.re',

  /** 有効化メールに載る URL を貼るとより安定（例: 'https://formsubmit.co/f/xxxxxxxx'） */
  contactFormEndpoint: '',
};
