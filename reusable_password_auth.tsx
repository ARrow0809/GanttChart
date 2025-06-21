import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './src/components/ui/card.jsx';
import { Input } from './src/components/ui/input.jsx';
import { Button } from './src/components/ui/button.jsx';
import { Lock } from 'lucide-react';

// パスワード認証コンポーネント
interface PasswordAuthProps {
  onAuthenticated: () => void;
}

const PASSWORD = 'gantt'; // パスワードを設定

const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthenticated }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // ログイン処理
  const handleLogin = () => {
    if (input === PASSWORD) {
      // パスワードが正しい場合、認証状態を設定
      localStorage.setItem('gantt_authed', '1');
      setError(null);
      setShowSuccess(true);
      // 成功メッセージを表示した後、少し遅延してから認証完了処理を行う
      setTimeout(() => {
        onAuthenticated();
      }, 1500); // 1.5秒後に画面遷移
    } else {
      setError('パスワードが違います');
    }
  };

  // キー入力のハンドリング
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" /> ガントチャート アクセス認証
          </CardTitle>
          <CardDescription className="text-center">
            このガントチャートツールにアクセスするにはパスワードが必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            ) : null}
            {showSuccess ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm animate-pulse">
                ページにご訪問いただきありがとうございます。ログインしています...
              </div>
            ) : null}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワードを入力してください"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
                disabled={showSuccess}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={showSuccess}
            >
              {showSuccess ? "ログイン中..." : "ログイン"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordAuth;