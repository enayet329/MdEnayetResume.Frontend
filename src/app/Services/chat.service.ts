import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://enayethossainresumeai.somee.com/api/Chat';

  constructor() {}

  streamChat(request: any): Observable<string> {
    return new Observable<string>(observer => {
      const controller = new AbortController();
      fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30-second timeout
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function read() {
          reader.read().then(({ done, value }) => {
            if (done) {
              if (buffer) {
                observer.next(buffer);
              }
              observer.complete();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const words = buffer.split(/(?<=\s|\n)/); // Split on whitespace or newline
            if (words.length > 1) {
              buffer = words.pop() || '';
              observer.next(words.join(''));
            }
            read();
          }).catch(err => {
            observer.error(err);
            reader.cancel().catch(() => {});
          });
        }
        read();
      }).catch(err => observer.error(err));
      return () => controller.abort();
    });
  }
}