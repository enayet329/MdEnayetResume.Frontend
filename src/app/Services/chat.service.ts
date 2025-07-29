import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatRequest } from '../Models/chat-request.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://1gqbf72l-7057.inc1.devtunnels.ms/api/Chat';

  constructor(private http: HttpClient) {}

  streamChat(request: ChatRequest): Observable<string[]> {
    return this.http.post<string[]>(this.apiUrl, request);
  }
}
