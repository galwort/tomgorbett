import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeddingTagsService {
  private url = 'https://fa-tom.azurewebsites.net/api/wedding_tags';
  tags = [
    'Bride',
    'Groom',
    "Bride's Parents",
    "Groom's Parents",
    "Bride's Family",
    "Groom's Family",
    'Bridesmaids',
    'Groomsmen',
    'Cat',
    'Getting Ready',
    'Church',
    'Vows',
    'Reception',
    'Dancing',
    'Speeches',
    'Food',
  ];
  constructor(private http: HttpClient) {}
  getTags(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(this.url);
  }
  toggle(tag: string, filename: string): Observable<any> {
    return this.http.post<any>(this.url, { tag, filename });
  }
}
