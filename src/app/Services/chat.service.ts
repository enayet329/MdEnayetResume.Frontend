import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatRequest } from '../Models/chat-request.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://enayethossainresumeai.somee.com/api/Chat';

  constructor() {}

  streamChat(request: ChatRequest): Observable<string> {
    return new Observable<string>(observer => {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        function read() {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            observer.next(chunk);
            read();
          }).catch(err => observer.error(err));
        }
        read();
      }).catch(err => observer.error(err));
    });
  }
}