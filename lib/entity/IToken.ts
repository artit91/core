/**
 * Token entity
 */
export interface IToken {
  id?: string;
  expires: Date;
  lastModified: Date;
  userId: string;
  category: string;
}
