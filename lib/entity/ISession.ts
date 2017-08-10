/**
 * Session entity
 */
export interface ISession {
  id?: string;
  expires: Date;
  lastModified: Date;
  userId: string;
}
