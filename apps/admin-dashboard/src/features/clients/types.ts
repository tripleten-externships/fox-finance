export type Status = 'ACTIVE' | 'INACTIVE'; // Added export here

export interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  status: Status; // Now 'Status' is used here!
  createdAt: string | Date;
  updatedAt: string | Date;
}