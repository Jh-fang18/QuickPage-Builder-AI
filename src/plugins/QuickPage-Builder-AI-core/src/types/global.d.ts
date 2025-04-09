/**
 * 用户基本信息类型定义
 */
type UserInfo = {
  userId: string // 用户唯一标识符
  userName: string // 用户显示名称
  roles: string[] // 用户角色数组
}

/**
 * 认证信息接口定义
 */
export interface AuthInfo {
  token: string // JWT认证令牌
  expires: number // 令牌过期时间戳(秒)
  userInfo: UserInfo // 关联的用户信息
}
