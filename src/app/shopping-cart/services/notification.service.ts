// ========== NOTIFICATION SERVICE ==========
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { NotificationMessage } from '../shopping-cart.utils';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(
    null
  );
  private cartValueAlertSubject = new BehaviorSubject<string>('');
  private cartExpiryWarningSubject = new BehaviorSubject<string>('');

  public notification$ = this.notificationSubject.asObservable();
  public cartValueAlert$ = this.cartValueAlertSubject.asObservable();
  public cartExpiryWarning$ = this.cartExpiryWarningSubject.asObservable();

  showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000
  ): void {
    const notification: NotificationMessage = {
      message,
      type,
      timestamp: new Date(),
    };

    this.notificationSubject.next(notification);

    // Clear notification after specified duration
    setTimeout(() => {
      this.notificationSubject.next(null);
    }, duration);
  }

  showSuccess(message: string, duration?: number): void {
    this.showNotification(message, 'success', duration);
  }

  showError(message: string, duration?: number): void {
    this.showNotification(message, 'error', duration);
  }

  showWarning(message: string, duration?: number): void {
    this.showNotification(message, 'warning', duration);
  }

  showInfo(message: string, duration?: number): void {
    this.showNotification(message, 'info', duration);
  }

  updateCartValueAlert(totalPrice: number): void {
    let message = '';

    if (totalPrice >= 200) {
      message = 'You qualify for premium free shipping!';
    } else if (totalPrice >= 100) {
      message = `Add $${(200 - totalPrice).toFixed(
        2
      )} more for premium shipping!`;
    } else if (totalPrice >= 50) {
      message = 'You qualify for a 10% discount coupon!';
    }

    this.cartValueAlertSubject.next(message);
  }

  updateCartExpiryWarning(oldestItemDate: Date | null): void {
    if (!oldestItemDate) {
      this.cartExpiryWarningSubject.next('');
      return;
    }

    const minutesSinceAdded =
      (Date.now() - oldestItemDate.getTime()) / (1000 * 60);
    let message = '';

    if (minutesSinceAdded > 30) {
      const minutesLeft = Math.round(60 - minutesSinceAdded);
      if (minutesLeft > 0) {
        message = `Your cart items will expire in ${minutesLeft} minutes`;
      } else {
        message = 'Your cart items have expired';
      }
    }

    this.cartExpiryWarningSubject.next(message);
  }

  clearAllAlerts(): void {
    this.cartValueAlertSubject.next('');
    this.cartExpiryWarningSubject.next('');
    this.notificationSubject.next(null);
  }

  // Auto-expiry warning timer
  startCartExpiryTimer(
    getOldestItemDate: () => Date | null
  ): Observable<string> {
    return timer(0, 60000).pipe(
      // Check every minute
      map(() => {
        const oldestDate = getOldestItemDate();
        this.updateCartExpiryWarning(oldestDate);
        return this.cartExpiryWarningSubject.value;
      }),
      filter((message) => message !== '')
    );
  }
}
