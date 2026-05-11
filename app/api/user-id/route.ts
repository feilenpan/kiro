/**
 * 用户匿名 ID 管理
 *
 * GET /api/user-id
 *   - 客户端首次访问时调用
 *   - 生成一个随机 UUID 作为匿名用户标识
 *   - 客户端存入 localStorage，后续对话携带
 *
 * 设计原则：
 *   - 无需登录，零门槛
 *   - 服务端不存储 ID 本身（只存记忆内容）
 *   - 换设备/清除浏览器数据后记忆丢失（可接受的代价）
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const userId = randomUUID();
  return NextResponse.json({ userId });
}
