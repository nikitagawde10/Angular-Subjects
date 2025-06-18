// Service: behavior-subject.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TodoItem {
  id: number;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class BehaviorSubjectService {
  private itemsSubject = new BehaviorSubject<TodoItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  private idCounter = 1;

  addItem(title: string): void {
    const current = this.itemsSubject.value;
    const newItem: TodoItem = { id: this.idCounter++, title };
    this.itemsSubject.next([...current, newItem]);
  }

  updateItem(id: number, newTitle: string): void {
    const updated = this.itemsSubject.value.map((item) =>
      item.id === id ? { ...item, title: newTitle } : item
    );
    this.itemsSubject.next(updated);
  }

  removeItem(id: number): void {
    const filtered = this.itemsSubject.value.filter((item) => item.id !== id);
    this.itemsSubject.next(filtered);
  }
}
