/**
 * User entity
 */
export interface IUser {
  id?: string;
  email: string;
  password?: string;
  validated: boolean;
}
