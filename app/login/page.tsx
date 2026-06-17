"use client";

import { FormEvent, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

export default function LoginPage() {
  const [email, setEmail] = useState("writer@example.local");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("ai-novel-session", "self-use");
    localStorage.setItem("ai-novel-email", email);
    setSignedIn(true);
  }

  const aside = (
    <div className="grid gap-5 p-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
        <h2 className="mt-2 text-base font-semibold text-slate-950">本地会话</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          MVP 阶段使用浏览器本地标记；接入正式鉴权后，这里可以替换为账户与权限信息。
        </p>
      </section>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">当前邮箱</p>
        <p className="mt-2 break-all text-sm text-slate-500">{email}</p>
      </div>
    </div>
  );

  return (
    <AppShell active="login" aside={aside} asideLabel="会话信息" contentClassName="flex items-start justify-center">
      <div className="w-full max-w-md">
        <Surface className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">自用登录</h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                建立本地会话后，可以进入写作台继续管理作品。
              </p>
            </div>
          </div>

          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="管理员密码（MVP 可留空）"
            />
            <Button type="submit">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              进入写作台
            </Button>
          </form>

          {signedIn ? (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              已建立本地会话，可以返回作品库继续写作。
            </p>
          ) : null}
        </Surface>
      </div>
    </AppShell>
  );
}
