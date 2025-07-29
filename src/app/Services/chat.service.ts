import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatRequest } from '../Models/chat-request.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://localhost:7057/api/Chat';

  constructor(private http: HttpClient) {}

  streamChat(request: ChatRequest): Observable<string[]> {
    return this.http.post<string[]>(this.apiUrl, request);
  }
}
