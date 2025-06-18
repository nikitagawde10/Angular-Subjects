import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubjectService, TodoItem } from './behavior-subject.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-behavior-subject',
  templateUrl: './behavior-subject.component.html',
  styleUrls: ['./behavior-subject.component.css'],
  imports: [CommonModule, FormsModule],
})
export class BehaviorSubjectComponent implements OnInit {
  items$!: Observable<TodoItem[]>;
  // local copy for two-way binding in the template:
  itemList: TodoItem[] = [];
  newTitle = '';

  constructor(private bs: BehaviorSubjectService) {}

  ngOnInit() {
    this.items$ = this.bs.items$;
    this.items$.subscribe((items) => {
      // update local array whenever the subject emits
      this.itemList = items;
    });
  }

  addItem() {
    if (!this.newTitle.trim()) return;
    this.bs.addItem(this.newTitle.trim());
    this.newTitle = '';
  }

  updateItem(id: number, title: string) {
    this.bs.updateItem(id, title);
  }

  removeItem(id: number) {
    this.bs.removeItem(id);
  }
}
