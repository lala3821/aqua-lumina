/**
 * ローカルサーバー (3456) 向けの一時公開URLを発行します。
 * 事前に別ターミナルで npm start を実行してください。
 */
const localtunnel = require('localtunnel');

const PORT = Number(process.env.PORT) || 3456;

(async () => {
  try {
    const tunnel = await localtunnel({ port: PORT });

    console.log('');
    console.log('=== AQUA LUMINA アクセスURL ===');
    console.log('');
    console.log('  ローカル:     http://localhost:' + PORT);
    console.log('  公開URL:      ' + tunnel.url);
    console.log('');
    console.log('  ※ 公開URLはターミナルを閉じると無効になります');
    console.log('  ※ スマホは同じWi-Fiなら http://<PCのIP>:' + PORT + ' でも可');
    console.log('');

    tunnel.on('close', () => {
      console.log('トンネルを終了しました。');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      tunnel.close();
    });
  } catch (err) {
    console.error('公開URLの作成に失敗しました。先に npm start を実行してください。');
    console.error(err.message);
    process.exit(1);
  }
})();
