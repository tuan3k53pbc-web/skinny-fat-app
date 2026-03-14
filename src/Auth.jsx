import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Đăng ký thành công. Nếu Supabase yêu cầu xác nhận email thì hãy kiểm tra email.");
    }
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập Skinny Fat Planner</h1>
        <p className="text-sm text-slate-500 mb-6">Tạo tài khoản một lần, sau đó dữ liệu sẽ lưu trên cloud.</p>

        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 mb-4"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={signIn}
            disabled={loading}
            className="flex-1 rounded-2xl bg-slate-950 text-white py-3 font-semibold"
          >
            Đăng nhập
          </button>

          <button
            onClick={signUp}
            disabled={loading}
            className="flex-1 rounded-2xl border border-slate-300 py-3 font-semibold text-slate-700"
          >
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}