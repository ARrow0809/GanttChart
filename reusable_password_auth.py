from flask import Flask, request

app = Flask(__name__)

# パスワードを一つだけ用意します
CORRECT_PASSWORD = "gantt"

@app.route("/", methods=["GET", "POST"])
def gantt_chart_page():
    # フォームからパスワードが送信された場合 (POSTリクエスト)
    if request.method == "POST":
        entered_password = request.form.get("password")
        
        # パスワードが正しいかチェックするだけ
        if entered_password == CORRECT_PASSWORD:
            # 正しければ、コンテンツを表示
            return """
                <h1>ガントチャート</h1>
                <p>ようこそ！認証に成功しました。</p>
                <p><a href="/">トップページに戻る（再度パスワードが必要です）</a></p>
            """
        else:
            # パスワードが間違っていた場合のエラーメッセージ
            error_message = "<h2>パスワードが違います。</h2>"
            return error_message + LOGIN_FORM

    # まだパスワードが入力されていない場合（最初のアクセス時）
    # パスワード入力フォームを表示
    return "<h1>ガントチャート アクセス認証</h1>" + LOGIN_FORM

# (共通部品) パスワード入力フォームのHTML
LOGIN_FORM = """
    <form method="post">
        <label>このガントチャートツールにアクセスするにはパスワードが必要です</label><br><br>
        <input type="password" name="password" placeholder="パスワードを入力してください">
        <button type="submit">ログイン</button>
    </form>
"""

if __name__ == "__main__":
    app.run(debug=True)