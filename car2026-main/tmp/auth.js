"use strict";
import { get, post } from "@/utils/request";
export const authApi = {
  /** 登录（错误提示由页面自行处理，故 silent）。后端返回 access_token，统一映射为前端 token */
  login(payload) {
    return post("/auth/login", payload, { silent: true }).then((d) => ({
      token: d.accessToken ?? d.access_token ?? "",
      user: d.user
    }));
  },
  register(payload) {
    return post("/auth/register", payload, { silent: true }).then((d) => ({
      id: d.id,
      username: d.username,
      nickname: d.nickname ?? d.username,
      role: d.role ?? "user",
      email: d.email,
      status: d.isActive === false ? "disabled" : "active",
      createdAt: d.createdAt ?? ""
    }));
  },
  me() {
    return get("/users/me", void 0, { silent: true }).then((d) => ({
      id: d.id,
      username: d.username,
      nickname: d.nickname ?? d.username,
      role: d.role ?? "user",
      email: d.email,
      status: d.isActive === false ? "disabled" : "active",
      createdAt: d.createdAt ?? ""
    }));
  },
  logout() {
    return post("/auth/logout", void 0, { silent: true });
  }
};
