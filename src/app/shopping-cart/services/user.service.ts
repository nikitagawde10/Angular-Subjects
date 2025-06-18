// ========== USER SERVICE ==========
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../shopping-cart.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject<User | null>(null);

  public user$ = this.userSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  setUser(user: User): void {
    this.userSubject.next(user);
    this.saveUserToStorage(user);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  logout(): void {
    this.userSubject.next(null);
    this.clearUserFromStorage();
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getMembershipLevel(): string | null {
    return this.userSubject.value?.membershipLevel || null;
  }

  calculateMembershipDiscount(
    totalPrice: number,
    membershipLevel?: string
  ): number {
    if (!membershipLevel) return 0;

    switch (membershipLevel) {
      case 'bronze':
        return totalPrice * 0.05; // 5%
      case 'silver':
        return totalPrice * 0.1; // 10%
      case 'gold':
        return totalPrice * 0.15; // 15%
      default:
        return 0;
    }
  }

  calculateShipping(totalPrice: number, membershipLevel?: string): number {
    if (totalPrice >= 200 || membershipLevel === 'gold') return 0; // Free shipping
    if (totalPrice >= 100 || membershipLevel === 'silver') return 5.99;
    if (membershipLevel === 'bronze') return 7.99;
    return 9.99;
  }

  private saveUserToStorage(user: User): void {
    // Simulate saving to localStorage or API
    console.log('User saved:', user);
  }

  private loadUserFromStorage(): void {
    // Simulate loading from localStorage or API
    // In real app, you would restore the user state here
  }

  private clearUserFromStorage(): void {
    // Simulate clearing from localStorage or API
    console.log('User cleared from storage');
  }
}
